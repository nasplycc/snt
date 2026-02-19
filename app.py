#!/usr/bin/env python3
"""
Smart Network Tool - 智能网络工具 - 修复版
整合网卡流量监测 + 流量黑洞服务功能
"""

import sys
import os
import threading
import json
from flask import Flask, render_template, jsonify, request
from datetime import datetime
from datetime import timedelta

# ===== 关键修复：将当前目录加入 Python 路径 =====
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 创建Flask应用
app = Flask(__name__)

# 确保静态文件目录存在
os.makedirs('static', exist_ok=True)
os.makedirs('static/js', exist_ok=True)
os.makedirs('static/css', exist_ok=True)
os.makedirs('templates', exist_ok=True)
os.makedirs('data', exist_ok=True)

# 导入并注册路由
try:
    from routes import register_routes
    register_routes(app)
    print("路由注册成功")
except ImportError as e:
    print(f"路由导入失败: {e}")
    # 创建简单的路由作为备用
    @app.route('/api/monitor/interfaces')
    def get_interfaces():
        return jsonify(['eth0', 'wlan0', 'lo'])

    @app.route('/api/monitor/stats/<interface>')
    def get_stats(interface):
        return jsonify({
            "interface": interface,
            "total_sent": 1024.5,
            "total_recv": 2048.3,
            "sent_rate": 10.2,
            "recv_rate": 15.8
        })

    @app.route('/api/monitor/history/<interface>')
    def get_history(interface):
        return jsonify({
            "timestamp": ["10:00:00", "10:00:02", "10:00:04"],
            "sent": [12.3, 11.8, 13.2],
            "recv": [18.5, 17.9, 19.2]
        })

    @app.route('/api/downonly/status')
    def get_downonly_status():
        return jsonify({
            "is_running": False,
            "status": "stopped",
            "speed_mbps": 0.0,
            "today_bytes": 1024 * 1024 * 100,
            "today_quota_gb": 150,
            "uptime_seconds": 0
        })

    @app.route('/api/downonly/toggle', methods=['POST'])
    def toggle_downonly():
        return jsonify({
            "is_running": False,
            "status": "stopped"
        })

    @app.route('/api/downonly/history')
    def get_downonly_history():
        month = request.args.get('month', 2, type=int)
        days = list(range(1, 29))
        data = [{"day": d, "bytes": d * 1024 * 1024 * 100} for d in days]
        return jsonify({"days": data})

    @app.route('/api/downonly/logs')
    def get_downonly_logs():
        from datetime import datetime
        logs = []
        for i in range(20):
            time = datetime.now().strftime("%H:%M:%S")
            logs.append({"time": time, "msg": f"模拟日志条目 {i+1}"})
        
        return jsonify({
            "max_entries": 500,
            "entries": logs
        })

    @app.route('/api/downonly/config', methods=['GET', 'POST'])
    def get_or_update_config():
        if request.method == 'POST':
            return jsonify({"ok": True})
        return jsonify({
            "speed_limit_mbps": 10,
            "daily_quota_min_gb": 150,
            "daily_quota_max_gb": 200,
            "schedule_start": "00:00",
            "schedule_end": "23:59",
            "sleep_min_minutes": 10,
            "sleep_max_minutes": 20,
            "urls": [
                "http://updates-http.cdn-apple.com/2019WinterFCS/fullrestores/041-39257/32129B6C-292C-11E9-9E72-4511412B0A59/iPhone_4.7_12.1.4_16D57_Restore.ipsw",
                "http://speedtest.tele2.net/10GB.zip",
                "http://speedtest.tele2.net/100MB.zip"
            ]
        })

@app.route('/')
def index():
    """首页"""
    try:
        # 使用新的配置服务
        from services.config_service import get_config
        config = get_config()
        interfaces = ['enp2s0', 'enp3s0', 'NodeBabyLink']  # 使用修复后的接口列表
        
        print(f"首页渲染，配置: {config}")
        print(f"网卡列表: {interfaces}")
        
        return render_template('index.html', 
                              interfaces=interfaces,
                              config=config,
                              now=datetime.now())
    except Exception as e:
        print(f"渲染首页错误: {e}")
        # 使用默认配置
        default_config = {
            "downonly": {
                "speed_limit_mbps": 10,
                "daily_quota_min_gb": 150,
                "daily_quota_max_gb": 200,
                "schedule_start": "00:00",
                "schedule_end": "23:59",
                "sleep_min_minutes": 10,
                "sleep_max_minutes": 20,
                "urls": [
                    "http://updates-http.cdn-apple.com/2019WinterFCS/fullrestores/041-39257/32129B6C-292C-11E9-9E72-4511412B0A59/iPhone_4.7_12.1.4_16D57_Restore.ipsw",
                    "http://speedtest.tele2.net/10GB.zip",
                    "http://speedtest.tele2.net/100MB.zip"
                ]
            },
            "monitor": {
                "real_time_refresh": 1,
                "chart_refresh": 10,
                "history_hours": 24
            }
        }
        return render_template('index.html', 
                              interfaces=['enp2s0', 'enp3s0', 'NodeBabyLink'],
                              config=default_config,
                              now=datetime.now())

@app.route('/test')
def test():
    """测试页面"""
    return render_template('test.html')

# 初始化应用
def init_app():
    """初始化应用"""
    print("Smart Network Tool 初始化中...")
    
    try:
        # 启动后台服务
        from services.downonly_service import downonly_service
        print("DownOnly服务已初始化")
        
        # 启动配置服务
        from services.config_service import config_service
        print("配置服务已初始化")
        
        print("Smart Network Tool 初始化完成")
    except Exception as e:
        print(f"初始化错误: {e}")

if __name__ == '__main__':
    init_app()
    
    # 获取端口参数
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except:
            pass
    
    print(f"Smart Network Tool 已启动 → http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)