#!/bin/bash
# Smart Network Tool 服务卸载脚本

set -e

SERVICE_NAME="smart-network-tool"
SYSTEMD_DIR="/etc/systemd/system"

# 检查root权限
if [ "$EUID" -ne 0 ]; then
    echo "错误: 需要root权限来卸载systemd服务"
    echo "请使用: sudo $0"
    exit 1
fi

# 停止并禁用服务
echo "正在停止并禁用服务..."
systemctl stop "$SERVICE_NAME" || true
systemctl disable "$SERVICE_NAME" || true

# 删除服务文件
echo "正在删除服务文件..."
rm -f "$SYSTEMD_DIR/$SERVICE_NAME.service"

# 重载systemd
echo "重新加载systemd配置..."
systemctl daemon-reload

echo "✅ 服务卸载完成！"
echo ""
echo "剩余清理（可选）:"
echo "  删除工作目录: rm -rf /vol1/1000/Smart-Network-Tool"
echo "  删除日志文件: rm -rf /var/log/smart_network_tool.log"