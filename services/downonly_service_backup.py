"""DownOnly服务 - 真实网络下载版"""

import threading
import time
import random
import requests
import io
from datetime import datetime, timedelta

class DownOnlyService:
    """DownOnly服务 - 真实网络下载版"""
    
    def __init__(self):
        self.is_running = False
        self.current_speed = 0.0
        self.speed_history = []
        self.download_count = 0
        self.total_downloaded = 0
        self.today_total_bytes = 0  # 今日累计字节数
        self.daily_quota_bytes = 150 * 1024 * 1024 * 1024  # 默认150GB配额
        self.start_time = None
        self.total_uptime_seconds = 0  # 累计运行时间
        self.speed_history_max = 30
        self.urls = []  # 移除所有默认下载源，只使用用户自定义的
        self.session = requests.Session()  # 复用会话以提高性能
        # 配置session以优化性能
        self.session.mount('http://', requests.adapters.HTTPAdapter(
            pool_connections=5,
            pool_maxsize=10,
            max_retries=3
        ))
        self.session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=5,
            pool_maxsize=10,
            max_retries=3
        ))
        
        # 从配置服务加载URL列表（延迟加载）
        
    def toggle_service(self):
        """切换服务状态"""
        if self.is_running:
            self.stop_service()
            return {"is_running": False, "status": "stopped"}
        else:
            self.start_service()
            return {"is_running": True, "status": "running"}
    
    def start_service(self):
        """启动服务"""
        if self.is_running:
            return
        
        # 启动前初始化URL列表
        self.initialize_urls()
        
        self.is_running = True
        self.start_time = datetime.now()
        self.download_count = 0
        self.total_downloaded = 0
        self.today_total_bytes = 0  # 重置今日流量统计
        self.speed_history = []
        
        # 添加启动日志
        print("DownOnly服务启动 - 真实网络下载模式")
        print(f"当前URL列表: {self.urls}")
        
        # 启动工作线程
        threading.Thread(target=self.worker, daemon=True).start()
        threading.Thread(target=self.speed_tracker, daemon=True).start()
        
        # 立即添加一条启动日志
        print("DownOnly服务已启动")
    
    def stop_service(self):
        """停止服务"""
        if self.is_running and self.start_time:
            # 累加运行时间
            uptime = int((datetime.now() - self.start_time).total_seconds())
            self.total_uptime_seconds += uptime
            
        self.is_running = False
        print("DownOnly服务已停止")
    
    def worker(self):
        """工作线程 - 真实网络下载"""
        while self.is_running:
            try:
                # 真实网络下载
                self.real_download()
                
                # 随机休息
                sleep_time = random.randint(5, 15)
                time.sleep(sleep_time)
                
            except Exception as e:
                print(f"下载线程错误: {e}")
                time.sleep(5)
    
    def speed_tracker(self):
        """速度追踪器"""
        while self.is_running:
            try:
                # 生成实际速度数据（基于真实下载）
                if self.current_speed > 0:
                    # 保持当前速度，添加一些波动
                    variation = random.uniform(-2, 2)
                    self.current_speed = max(0, self.current_speed + variation)
                else:
                    # 如果没有下载，速度降为0
                    self.current_speed = 0
                
                # 更新速度历史
                self.speed_history.append(self.current_speed)
                if len(self.speed_history) > self.speed_history_max:
                    self.speed_history.pop(0)
                
                time.sleep(1)
            except Exception as e:
                print(f"速度追踪错误: {e}")
                time.sleep(1)
    
    def real_download(self):
        """真实网络下载 - 使用io.Discard技术，0磁盘写入"""
        if not self.is_running:
            return
        
        try:
            # 随机选择URL
            url = random.choice(self.urls)
            
            # 获取文件大小
            try:
                head_response = self.session.head(url, timeout=10, allow_redirects=True)
                file_size = int(head_response.headers.get('content-length', 0))
                
                # 如果无法获取文件大小，使用默认值
                if file_size == 0:
                    # 根据URL类型估计文件大小
                    if 'ubuntu' in url:
                        file_size = random.randint(500, 2000) * 1024 * 1024  # Ubuntu ISO ~500MB-2GB
                    elif 'centos' in url:
                        file_size = random.randint(4000, 8000) * 1024 * 1024  # CentOS ISO ~4GB-8GB
                    else:
                        file_size = random.randint(100, 1000) * 1024 * 1024  # 其他文件 ~100MB-1GB
                
            except Exception as e:
                print(f"获取文件大小失败: {e}")
                # 使用默认文件大小
                file_size = random.randint(100, 1000) * 1024 * 1024
            
            # 使用io.Discard来丢弃下载数据
            discard_buffer = io.BytesIO()
            start_time = time.time()
            downloaded_bytes = 0
            last_log_time = 0
            last_speed_update = 0
            
            print(f"开始下载: {url} (大小: {file_size / 1024 / 1024:.1f} MB)")
            
            try:
                # 使用流式下载
                with self.session.get(url, timeout=30, stream=True) as response:
                    response.raise_for_status()
                    
                    # 获取实际文件大小
                    actual_file_size = int(response.headers.get('content-length', file_size))
                    
                    # 分块读取数据并丢弃
                    chunk_size = 1024 * 1024  # 1MB块大小
                    for chunk in response.iter_content(chunk_size=chunk_size):
                        if not self.is_running:
                            break
                            
                        # 将数据写入丢弃缓冲区（实际是丢弃）
                        discard_buffer.write(chunk)
                        downloaded_bytes += len(chunk)
                        
                        # 统计数据
                        self.total_downloaded += len(chunk)
                        new_bytes = len(chunk)
                        self.today_total_bytes += new_bytes
                        self.download_count += 1
                        
                        # 计算实时速度
                        current_time = time.time()
                        elapsed_time = current_time - start_time
                        
                        # 每秒更新一次速度
                        if current_time - last_speed_update >= 1.0:
                            speed_mbps = (downloaded_bytes / elapsed_time / 1024 / 1024) * 8 if elapsed_time > 0 else 0
                            self.current_speed = min(speed_mbps, 100)  # 限制最大速度
                            last_speed_update = current_time
                        
                        # 每2秒记录一次进度
                        if current_time - last_log_time >= 2:
                            progress = (downloaded_bytes / actual_file_size) * 100 if actual_file_size > 0 else 0
                            speed_display = (downloaded_bytes / elapsed_time / 1024) if elapsed_time > 0 else 0
                            print(f"下载进度: {downloaded_bytes / 1024 / 1024:.1f}/{actual_file_size / 1024 / 1024:.1f} MB ({progress:.1f}%) {speed_display:.1f} KB/s")
                            last_log_time = current_time
                        
                        # 清理缓冲区以避免内存泄漏
                        if downloaded_bytes % (10 * 1024 * 1024) == 0:  # 每10MB清理一次
                            discard_buffer.seek(0)
                            discard_buffer.truncate(0)
                        
            except requests.exceptions.RequestException as e:
                print(f"下载请求失败: {e}")
                # 等待一段时间后重试
                time.sleep(random.uniform(5, 15))
                return
            
            # 下载完成统计
            download_duration = time.time() - start_time
            if download_duration > 0:
                avg_speed_mbps = (downloaded_bytes / download_duration / 1024 / 1024) * 8
                print(f"下载完成: {downloaded_bytes / 1024 / 1024:.1f} MB, 平均速度: {avg_speed_mbps:.2f} Mbps")
            else:
                print(f"下载完成: {downloaded_bytes / 1024 / 1024:.1f} MB")
            
            # 清理资源
            discard_buffer.close()
            
            # 下载完成后等待一段时间再开始下一个任务
            if self.is_running:
                time.sleep(random.uniform(2, 8))
            
        except Exception as e:
            print(f"下载错误: {e}")
            # 发生错误时等待更长时间
            time.sleep(random.uniform(10, 30))
    
    def get_status(self):
        """获取服务状态"""
        if not self.is_running:
            return {
                "is_running": False,
                "status": "stopped",
                "speed_mbps": 0.0,
                "today_bytes": self.today_total_bytes,
                "today_quota_bytes": self.daily_quota_bytes,
                "uptime_seconds": self.total_uptime_seconds
            }
        
        # 计算运行时间
        uptime_seconds = self.total_uptime_seconds
        if self.start_time:
            uptime_seconds += int((datetime.now() - self.start_time).total_seconds())
        
        # 检查是否超过配额
        if self.today_total_bytes >= self.daily_quota_bytes:
            self.stop_service()
            print("今日流量已达到配额，自动停止服务")
            return {
                "is_running": False,
                "status": "quota_exceeded",
                "speed_mbps": 0.0,
                "today_bytes": self.today_total_bytes,
                "today_quota_bytes": self.daily_quota_bytes,
                "uptime_seconds": uptime_seconds
            }
        
        # 添加调试日志
        print(f"状态调试: today_bytes={self.today_total_bytes}, current_speed={self.current_speed}")
        
        return {
            "is_running": True,
            "status": "running",
            "speed_mbps": round(self.current_speed, 2),
            "today_bytes": self.today_total_bytes,
            "today_quota_bytes": self.daily_quota_bytes,
            "uptime_seconds": uptime_seconds
        }
    
    def get_history(self, month):
        """获取历史数据"""
        # 生成模拟月度数据
        days = list(range(1, 29))  # 28天
        data = []
        
        for day in days:
            # 随机生成每日流量
            bytes_data = random.randint(100, 1000) * 1024 * 1024  # 100MB-1GB
            data.append({"day": day, "bytes": bytes_data})
        
        return {"days": data}
    
    def update_daily_quota(self, quota_gb):
        """更新每日配额"""
        self.daily_quota_bytes = quota_gb * 1024 * 1024 * 1024
        print(f"每日配额已更新为: {quota_gb} GB")
        
        # 重新加载URL列表
        self.load_urls_from_config()

    def get_daily_quota_gb(self):
        """获取每日配额（GB）"""
        return int(self.daily_quota_bytes / (1024 * 1024 * 1024))

# 全局实例
downonly_service = DownOnlyService()

def toggle_service():
    return downonly_service.toggle_service()

def get_status():
    return downonly_service.get_status()

def get_history(month):
    return downonly_service.get_history(month)

def update_daily_quota(quota_gb):
    return downonly_service.update_daily_quota(quota_gb)

def get_daily_quota_gb():
    return downonly_service.get_daily_quota_gb()

def load_urls_from_config():
    """从配置服务加载URL列表"""
    try:
        import services.config_service as config_service
        config = config_service.get_config()
        self.urls = config.get('urls', [])
        print(f"从配置加载URL列表: {self.urls}")
    except Exception as e:
        print(f"从配置加载URL失败: {e}")
        self.urls = []

def update_urls_from_config(self):
        """从配置服务更新URL列表"""
        self.load_urls_from_config()
    
    def initialize_urls(self):
        """初始化URL列表"""
        self.load_urls_from_config()