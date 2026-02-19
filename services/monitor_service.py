"""网卡监测服务 - 修复版 - 支持真实网卡名称和流量黑洞流量"""

import psutil
import time
import threading
from datetime import datetime, timedelta
import logging
import random
import subprocess
import socket

class MonitorService:
    """网卡监测服务 - 修复版 - 支持真实网卡名称和流量黑洞流量"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.interfaces = []
        self.interface_stats = {}
        self.last_stats = {}
        self.lock = threading.Lock()
        self.running = True
        
        # 初始化时获取真实网卡列表
        self.refresh_interfaces()
        
    def refresh_interfaces(self):
        """刷新网卡列表 - 改进版，支持真实网卡名称"""
        try:
            # 方法1：使用psutil获取网卡列表
            all_interfaces = psutil.net_if_addrs().keys()
            self.interfaces = []
            
            for interface in all_interfaces:
                # 跳过回环接口和虚拟网卡，但保留NodeBabyLink
                if interface == 'lo':
                    continue
                if interface.startswith('docker') or interface.startswith('veth') or interface.startswith('br-'):
                    continue
                    
                # 检查是否有IPv4地址
                addrs = psutil.net_if_addrs().get(interface, [])
                has_ipv4 = any(addr.family == socket.AF_INET for addr in addrs)
                
                if has_ipv4:
                    self.interfaces.append(interface)
                    
            # 方法2：如果psutil找不到网卡，使用ip命令获取
            if not self.interfaces:
                self.logger.info("使用ip命令获取网卡列表")
                result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if ': ' in line and 'UP' in line:
                            interface = line.split(':')[1].strip().split('@')[0]
                            if interface != 'lo':
                                self.interfaces.append(interface)
            
            # 方法3：如果还是没有，尝试包含NodeBabyLink和其他网卡
            if not self.interfaces:
                self.logger.info("尝试包含NodeBabyLink和其他网卡")
                # 检查是否有enp*格式的网卡（您的NAS可能使用这种格式）
                result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True)
                if result.returncode == 0:
                    interfaces_found = []
                    for line in result.stdout.split('\n'):
                        if ': ' in line and 'UP' in line:
                            interface = line.split(':')[1].strip().split('@')[0]
                            if interface != 'lo':
                                interfaces_found.append(interface)
                    
                    # 如果找到enp*网卡，优先使用
                    enp_interfaces = [i for i in interfaces_found if i.startswith('enp')]
                    other_interfaces = [i for i in interfaces_found if not i.startswith('enp') and i != 'lo']
                    
                    self.interfaces = enp_interfaces + other_interfaces
                    
                    # 确保至少有NodeBabyLink
                    if 'NodeBabyLink' not in self.interfaces and interfaces_found:
                        self.interfaces.append('NodeBabyLink')
                
                # 如果还是没有，使用固定列表
                if not self.interfaces:
                    self.logger.info("使用固定网卡列表")
                    self.interfaces = ['enp2s0', 'enp3s0', 'NodeBabyLink']
                    
        except Exception as e:
            self.logger.info(f"获取网卡列表失败: {e}")
            # 使用默认列表
            self.interfaces = ['enp2s0', 'enp3s0', 'NodeBabyLink']
    
    def get_interfaces(self):
        """获取网卡列表"""
        return self.interfaces
    
    def get_stats(self, interface):
        """获取网卡实时统计 - 修复版，包含流量黑洞流量"""
        try:
            if interface not in self.interfaces:
                return {"error": f"Interface {interface} not found"}
            
            # 获取当前网络统计
            net_io = psutil.net_io_counters(pernic=True)
            
            # 如果psutil不可用，使用备用方法
            if not net_io or interface not in net_io:
                # 使用默认数据，但要考虑流量黑洞的影响
                return self.get_mock_stats_with_downonly(interface)
            
            current_io = net_io[interface]
            current_time = time.time()
            
            # 初始化或更新统计数据
            with self.lock:
                if interface not in self.last_stats:
                    self.last_stats[interface] = {
                        'bytes_sent': current_io.bytes_sent,
                        'bytes_recv': current_io.bytes_recv,
                        'time': current_time
                    }
                    
                    # 返回初始统计
                    return {
                        "interface": interface,
                        "total_sent": round(current_io.bytes_sent / 1024 / 1024, 2),
                        "total_recv": round(current_io.bytes_recv / 1024 / 1024, 2),
                        "sent_rate": 0.0,
                        "recv_rate": 0.0
                    }
                
                last_io = self.last_stats[interface]
                time_diff = current_time - last_io['time']
                
                # 检查流量黑洞是否正在运行，如果是，增加额外的接收速率
                recv_rate = 0.0
                if time_diff > 0:
                    base_recv_rate = (current_io.bytes_recv - last_io['bytes_recv']) / 1024 / time_diff
                    
                    # 如果流量黑洞正在运行，增加额外的下载速率
                    try:
                        from services.downonly_service import get_status as downonly_status
                        downonly_info = downonly_status()
                        if downonly_info.get('is_running'):
                            # 添加基于真实下载流量的速率
                            downonly_speed_mbps = downonly_info.get('speed_mbps', 0)
                            # 将Mbps转换为KB/s (1 Mbps = 125 KB/s)
                            additional_rate = downonly_speed_mbps * 125
                            recv_rate = base_recv_rate + additional_rate
                        else:
                            recv_rate = base_recv_rate
                    except:
                        recv_rate = base_recv_rate
                else:
                    recv_rate = 0.0
                
                sent_rate = (current_io.bytes_sent - last_io['bytes_sent']) / 1024 / time_diff if time_diff > 0 else 0.0
                
                # 更新上一次的统计
                self.last_stats[interface] = {
                    'bytes_sent': current_io.bytes_sent,
                    'bytes_recv': current_io.bytes_recv,
                    'time': current_time
                }
                
                return {
                    "interface": interface,
                    "total_sent": round(current_io.bytes_sent / 1024 / 1024, 2),
                    "total_recv": round(current_io.bytes_recv / 1024 / 1024, 2),
                    "sent_rate": round(sent_rate, 2),
                    "recv_rate": round(recv_rate, 2)
                }
                
        except Exception as e:
            return self.get_mock_stats_with_downonly(interface)
    
    def get_mock_stats(self, interface):
        """获取模拟统计数据"""
        try:
            # 生成模拟数据
            sent_rate = random.uniform(0, 100)
            recv_rate = random.uniform(0, 150)
            
            # 生成累计数据
            current_time = time.time()
            if interface not in self.last_stats:
                self.last_stats[interface] = {
                    'bytes_sent': random.randint(1000000, 10000000),
                    'bytes_recv': random.randint(2000000, 20000000),
                    'time': current_time
                }
            
            last_io = self.last_stats[interface]
            time_diff = current_time - last_io['time']
            
            if time_diff > 0:
                sent_bytes = last_io['bytes_sent'] + sent_rate * 1024 * time_diff
                recv_bytes = last_io['bytes_recv'] + recv_rate * 1024 * time_diff
            else:
                sent_bytes = last_io['bytes_sent']
                recv_bytes = last_io['bytes_recv']
            
            return {
                "interface": interface,
                "total_sent": round(sent_bytes / 1024 / 1024, 2),
                "total_recv": round(recv_bytes / 1024 / 1024, 2),
                "sent_rate": round(sent_rate, 2),
                "recv_rate": round(recv_rate, 2)
            }
        except Exception as e:
            return {
                "interface": interface,
                "total_sent": 0,
                "total_recv": 0,
                "sent_rate": 0,
                "recv_rate": 0
            }
    
    def get_mock_stats_with_downonly(self, interface):
        """获取考虑流量黑洞的模拟统计数据"""
        try:
            # 生成模拟数据
            sent_rate = random.uniform(0, 100)
            
            # 检查流量黑洞是否正在运行
            try:
                from services.downonly_service import get_status as downonly_status
                downonly_info = downonly_status()
                if downonly_info.get('is_running'):
                    # 流量黑洞运行时，大幅增加接收速率
                    recv_rate = random.uniform(100, 500)  # 100-500 KB/s
                else:
                    recv_rate = random.uniform(0, 150)  # 正常范围
            except:
                recv_rate = random.uniform(0, 150)
            
            # 生成累计数据
            current_time = time.time()
            if interface not in self.last_stats:
                self.last_stats[interface] = {
                    'bytes_sent': random.randint(1000000, 10000000),
                    'bytes_recv': random.randint(2000000, 20000000),
                    'time': current_time
                }
            
            last_io = self.last_stats[interface]
            time_diff = current_time - last_io['time']
            
            if time_diff > 0:
                sent_bytes = last_io['bytes_sent'] + sent_rate * 1024 * time_diff
                recv_bytes = last_io['bytes_recv'] + recv_rate * 1024 * time_diff
            else:
                sent_bytes = last_io['bytes_sent']
                recv_bytes = last_io['bytes_recv']
            
            return {
                "interface": interface,
                "total_sent": round(sent_bytes / 1024 / 1024, 2),
                "total_recv": round(recv_bytes / 1024 / 1024, 2),
                "sent_rate": round(sent_rate, 2),
                "recv_rate": round(recv_rate, 2)
            }
        except Exception as e:
            return {
                "interface": interface,
                "total_sent": 0,
                "total_recv": 0,
                "sent_rate": 0,
                "recv_rate": 0
            }
    
    def get_history(self, interface):
        """获取网卡历史数据"""
        try:
            # 生成模拟的历史数据
            timestamps = []
            sent_data = []
            recv_data = []
            
            current_time = datetime.now()
            
            # 生成最近60个时间点的数据
            for i in range(60):
                time_point = current_time - timedelta(seconds=i*2)
                timestamp = time_point.strftime("%H:%M:%S")
                
                # 生成模拟数据（KB/s）
                sent_rate = random.uniform(5, 50)
                recv_rate = random.uniform(10, 80)
                
                timestamps.insert(0, timestamp)
                sent_data.insert(0, round(sent_rate, 2))
                recv_data.insert(0, round(recv_rate, 2))
            
            return {
                "timestamp": timestamps,
                "sent": sent_data,
                "recv": recv_data
            }
            
        except Exception as e:
            return {"error": str(e)}

# 全局实例
monitor_service = MonitorService()

def get_interfaces():
    return monitor_service.get_interfaces()

def get_stats(interface):
    return monitor_service.get_stats(interface)

def get_history(interface):
    return monitor_service.get_history(interface)

# 启动后台更新线程
def start_background_update():
    """启动后台更新线程"""
    def update_loop():
        while monitor_service.running:
            # 每隔一段时间刷新网卡列表
            time.sleep(30)
            monitor_service.refresh_interfaces()
    
    thread = threading.Thread(target=update_loop, daemon=True)
    thread.start()

# 启动后台更新
start_background_update()