# Smart Network Tool systemd 服务使用指南

## 概述

本项目现在支持 systemd 服务管理，这是比 screen 方式更现代、更可靠的系统服务管理方式。

## 优势对比

### systemd 方式
- ✅ **自动重启**: 服务崩溃后自动重启
- ✅ **状态监控**: 可随时查看服务状态
- ✅ **日志管理**: 集成系统日志，便于排查问题
- ✅ **资源管理**: 更好的进程控制和资源管理
- ✅ **开机自启**: 完整的系统启动支持

### screen 方式（已弃用）
- ❌ 手动管理，需要人工干预
- ❌ 状态查看不便
- ❌ 日志分散
- ❌ 重启机制不完善

## 安装步骤

### 1. 首次安装
```bash
# 进入项目目录
cd /vol1/1000/Smart-Network-Tool

# 安装服务（默认用户为 Jaben）
sudo ./install_systemd.sh

# 或者指定用户名
sudo ./install_systemd.sh your_username
```

### 2. 验证安装
```bash
# 查看服务状态
systemctl status smart-network-tool

# 查看实时日志
journalctl -u smart-network-tool -f
```

## 日常管理

### 服务控制
```bash
# 启动服务
systemctl start smart-network-tool

# 停止服务
systemctl stop smart-network-tool

# 重启服务
systemctl restart smart-network-tool

# 重新加载配置
systemctl reload smart-network-tool  # 如果支持
```

### 开机自启
```bash
# 启用开机自启
systemctl enable smart-network-tool

# 禁用开机自启
systemctl disable smart-network-tool

# 检查是否启用开机自启
systemctl is-enabled smart-network-tool
```

### 日志管理
```bash
# 查看系统日志（包含应用日志）
journalctl -u smart-network-tool -f

# 查看最近的日志
journalctl -u smart-network-tool --since "1 hour ago"

# 查看错误日志
journalctl -u smart-network-tool -p err

# 查看应用专用日志
tail -f logs/smart_network_tool.log
```

## 故障排查

### 1. 服务无法启动
```bash
# 查看详细错误
journalctl -u smart-network-tool -n 50

# 检查服务配置
systemctl cat smart-network-tool
```

### 2. 端口冲突
```bash
# 查看端口占用
netstat -tlnp | grep :8080
lsof -i :8080
```

### 3. 权限问题
```bash
# 检查服务文件权限
ls -la /etc/systemd/system/smart-network-tool.service

# 重新安装服务
sudo ./install_systemd.sh
```

### 4. 资源问题
```bash
# 查看系统资源使用
htop
top

# 查看服务资源使用
systemctl status smart-network-tool
```

## 性能调优

### 1. 调整重启策略
编辑 `/etc/systemd/system/smart-network-tool.service`:
```ini
[Service]
Restart=always
RestartSec=5
StartLimitInterval=30s
StartLimitBurst=3
```

### 2. 环境变量优化
```ini
[Service]
Environment=PYTHONUNBUFFERED=1
Environment=PYTHONPATH=/vol1/1000/Smart-Network-Tool
```

### 3. 资源限制
```ini
[Service]
LimitNOFILE=65536
MemoryMax=512M
```

## 卸载服务

```bash
# 停止并禁用服务
sudo ./uninstall_systemd.sh

# （可选）清理日志
rm -f /var/log/smart_network_tool.log
```

## 迁移从 screen 到 systemd

如果你之前使用 screen 方式，可以按以下步骤迁移：

1. **停止旧的 screen 会话**
```bash
screen -r smart-network-tool  # 进入会话
Ctrl+C  # 停止应用
screen -X -S smart-network-tool quit  # 退出会话
```

2. **安装 systemd 服务**
```bash
sudo ./install_systemd.sh
```

3. **验证迁移**
```bash
systemctl status smart-network-tool
journalctl -u smart-network-tool -f
```

## 注意事项

1. **用户权限**: 确保服务运行用户有足够的权限访问项目目录
2. **端口冲突**: 默认使用8080端口，确保端口未被占用
3. **防火墙**: 如果需要外部访问，确保防火墙允许8080端口
4. **日志轮转**: 系统日志会自动轮转，但建议配置应用日志轮转
5. **资源监控**: 定期检查系统资源使用情况

## 常见问题

### Q: 服务启动失败？
A: 检查日志 `journalctl -u smart-network-tool -f` 查看具体错误

### Q: 如何修改端口？
A: 编辑服务文件中的 `ExecStart` 行，或使用环境变量 `PORT=8090`

### Q: 日志在哪里？
A: 系统日志：`journalctl -u smart-network-tool`，应用日志：`logs/smart_network_tool.log`

### Q: 如何备份服务？
A: 备份 `/etc/systemd/system/smart-network-tool.service` 和整个项目目录

## 相关文件

- 服务配置文件: `/etc/systemd/system/smart-network-tool.service`
- 系统日志: `journalctl -u smart-network-tool`
- 应用日志: `logs/smart_network_tool.log`
- 安装脚本: `install_systemd.sh`
- 卸载脚本: `uninstall_systemd.sh`