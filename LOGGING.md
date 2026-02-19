# 智能网络工具日志系统

## 日志功能说明

本项目已集成完整的日志系统，支持同时输出到文件和控制台。

## 日志文件位置

- **主日志文件**: `logs/smart_network_tool.log`
- **文件大小限制**: 每个日志文件最大10MB
- **备份文件**: 保留5个历史日志文件（`.log.1`, `.log.2`, `.log.3`, `.log.4`, `.log.5`）

## 日志级别

- **INFO**: 正常操作信息（启动、配置加载、服务状态等）
- **ERROR**: 错误信息（配置加载失败、服务异常等）

## 使用方法

### 1. 启动应用
```bash
# 调试模式
python3 app.py [端口]

# 完整启动
./start.sh [端口]
```

### 2. 查看实时日志
```bash
# 查看主日志文件
tail -f logs/smart_network_tool.log

# 查看最后100行
tail -n 100 logs/smart_network_tool.log

# 查看所有日志文件
ls -la logs/
```

### 3. 搜索特定内容
```bash
# 搜索关键词
grep "启动" logs/smart_network_tool.log

# 搜索错误
grep "ERROR" logs/smart_network_tool.log

# 搜索下载相关
grep "下载" logs/smart_network_tool.log
```

### 4. 按时间查看
```bash
# 查看今天的日志
grep "$(date '+%Y-%m-%d')" logs/smart_network_tool.log

# 查看最近的错误
grep "$(date '+%Y-%m-%d')" logs/smart_network_tool.log | grep "ERROR"
```

### 5. 日志管理
```bash
# 压缩旧日志（可选）
gzip logs/smart_network_tool.log.*

# 清理日志（谨慎使用）
# rm -f logs/smart_network_tool.log.*
```

## 日志示例

### 启动日志
```
2026-02-19 12:54:58 - Smart Network Tool - INFO - Smart Network Tool 启动中...
2026-02-19 12:54:58 - Smart Network Tool - INFO - 路由注册成功
2026-02-19 12:54:58 - Smart Network Tool - INFO - Smart Network Tool 初始化完成
2026-02-19 12:54:58 - Smart Network Tool - INFO - Smart Network Tool 已启动 → http://0.0.0.0:8080
```

### 下载日志
```
2026-02-19 12:55:01 - services.downonly_service - INFO - DownOnly服务启动 - 真实网络下载模式
2026-02-19 12:55:01 - services.downonly_service - INFO - 开始下载: http://example.com/file.zip (大小: 256.5 MB)
2026-02-19 12:55:15 - services.downonly_service - INFO - 下载完成: 256.5 MB, 平均速度: 45.23 Mbps
```

### 错误日志
```
2026-02-19 12:56:30 - services.config_service - ERROR - 加载配置失败: [Errno 2] No such file or directory
```

## 性能说明

- 日志写入为异步操作，不影响主程序性能
- 日志文件自动轮转，避免单个文件过大
- 内存使用优化，每个日志文件限制10MB
- 日志格式包含时间、模块、级别、消息，便于分析

## 故障排查

1. **应用无法启动**: 检查 `logs/smart_network_tool.log` 中的错误信息
2. **下载异常**: 搜索 "下载" 相关的错误日志
3. **配置问题**: 查看 "配置服务" 相关日志
4. **性能问题**: 检查日志文件大小，必要时清理旧日志

## 注意事项

- 日志文件包含敏感信息，请妥善保管
- 定期清理旧日志以节省磁盘空间
- 在生产环境中可考虑配置日志轮转策略