# Smart Network Tool - 智能网络工具

一款整合 **网卡流量监测** 和 **流量消耗** 功能的一体化网络管理工具。

## 功能特性

### 流量监测
- 实时显示网卡总发送/接收流量
- 实时速率监测（KB/s）
- 历史流量曲线图（24小时）
- 支持多网卡切换

### 流量消耗
- **零写入黑洞技术**: 采用内存流式下载，数据直接丢弃到虚拟缓冲区，实现真正的零磁盘写入
- **智能限速控制**: 可配置下载限速（Mbps），避免影响正常网络使用
- **动态流量配额**: 每日自动生成随机流量配额，模拟真实用户行为
- **时段管理**: 支持自定义运行时间段，可设置在夜间等低峰期运行
- **智能间隔**: 自动调整下载间隔，避免网络连接被检测异常
- **实时监控**: 提供详细的下载速度曲线和流量统计
- **历史分析**: 完整的月度流量使用记录和趋势分析
- **运行日志**: 详细的下载过程日志，便于监控和故障排查

## 界面预览
### 流量监测
<img width="1883" height="1476" alt="4" src="https://github.com/user-attachments/assets/d0290af1-c2cf-4a59-897d-2eff1762fb18" />

### 流量黑洞
<img width="1885" height="1616" alt="2" src="https://github.com/user-attachments/assets/c25a214b-cd7c-4b31-8769-5577c60e5f76" />


## 快速开始

### 1. 安装依赖

**飞牛NAS 用户:**
```bash
sudo -i
apt update
apt install -y python3-flask python3-psutil python3-requests screen
```

**其他系统:**
```bash
pip3 install flask psutil requests
```

### 2. 启动应用

**调试模式（快速启动）:**
```bash
python3 app.py [端口]
```
- 直接运行Python脚本，适合快速调试
- 支持端口号参数（默认8080）
- 生产模式运行（debug=False）

**完整启动（推荐）:**
```bash
./start.sh [端口]
```
- 检查并自动安装依赖（Flask/psutil/requests）
- 创建必要的数据目录
- 显示友好的启动信息和访问地址
- 包含环境检查和错误处理

**后台运行（生产环境）:**
```bash
./start_daemon.sh [端口]
```

**停止服务:**
```bash
./stop.sh
```

### 3. 访问界面

打开浏览器访问: `http://你的IP:8080`

## 开机自启

### 推荐方式：systemd 服务管理（推荐）

**安装服务:**
```bash
sudo ./install_systemd.sh [用户名]
```
- 服务会自动开机自启

**管理命令:**
```bash
# 查看服务状态
systemctl status smart-network-tool

# 启动服务
systemctl start smart-network-tool

# 停止服务
systemctl stop smart-network-tool

# 重启服务
systemctl restart smart-network-tool

# 禁用开机自启
systemctl disable smart-network-tool

# 启用开机自启
systemctl enable smart-network-tool

# 查看实时日志
journalctl -u smart-network-tool -f

# 查看应用日志
tail -f logs/smart_network_tool.log
```

**卸载服务:**
```bash
sudo ./uninstall_systemd.sh
```

### 备用方案：screen 方式（已弃用）

1. 安装 screen:
```bash
apt install -y screen
```

2. 创建开机脚本:
```bash
cat > /etc/rc.local << 'EOF'
#!/bin/bash
sleep 10
cd /vol1/1000/Smart-Network-Tool
screen -dmS smart-network-tool python3 app.py
exit 0
EOF
chmod +x /etc/rc.local
```

3. 验证:
```bash
screen -ls  # 查看会话
```

## 文件结构

```
Smart-Network-Tool/
├── app.py              # 主程序
├── templates/
│   └── index.html      # 前端页面
├── data/               # 数据目录
│   ├── config.json     # 配置文件
│   ├── stats.json      # 下载数据统计
│   └── daily_stats.json # 网卡统计
├── start.sh            # 启动脚本
├── start_daemon.sh     # 后台启动脚本
├── stop.sh             # 停止脚本
├── install.sh          # 安装脚本
└── README.md           # 说明文档
```

## API 接口

### 网卡监测
- `GET /api/monitor/interfaces` - 获取网卡列表
- `GET /api/monitor/stats/<interface>` - 获取网卡实时统计
- `GET /api/monitor/history/<interface>` - 获取网卡历史数据

### 流量黑洞服务
- `GET /api/downonly/status` - 获取服务状态
- `POST /api/downonly/toggle` - 启停服务
- `GET /api/downonly/history?month=1` - 获取月度历史
- `GET /api/downonly/logs` - 获取运行日志
- `GET /api/downonly/config` - 获取配置
- `POST /api/downonly/config` - 更新配置

## 配置说明

### 流量消耗配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| speed_limit_mbps | 下载限速 (Mbps) | 5 |
| daily_quota_min_gb | 每日最小配额 (GB) | 150 |
| daily_quota_max_gb | 每日最大配额 (GB) | 200 |
| schedule_start | 运行开始时间 | 00:00 |
| schedule_end | 运行结束时间 | 23:59 |
| sleep_min_minutes | 最小休息 (分钟) | 10 |
| sleep_max_minutes | 最大休息 (分钟) | 20 |
| urls | 下载地址列表 | [...] |

## 注意事项

1. **流量消耗**: 流量黑洞服务会产生真实的下载流量，请注意你的网络套餐
2. **限速设置**: 建议根据你的带宽合理设置限速，避免影响正常上网
3. **运行时段**: 可以设置在夜间运行，避开高峰期
4. **配额设置**: 设置合理的每日配额，避免超额

## 技术栈

- **后端**: Python Flask + psutil
- **前端**: HTML5 + Tailwind CSS + ECharts
- **数据**: JSON 文件存储

## 致谢

- 网卡流量监测基于飞牛NAS社区方案
- 流量黑洞服务功能参考 [EchoPing07/DownOnly](https://github.com/EchoPing07/DownOnly)

## License

MIT License

## 免责声明
- 本工具仅限个人技术学习与带宽测试场景。
- 使用者须确保符合所在地法规及运营商政策，并自行承担因流量异常或服务限制引发的风险。
- 作者不对任何使用后果提供担保或承担责任。
