#!/bin/bash
# Smart Network Tool systemd 服务安装脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/smart-network-tool.service"
SERVICE_NAME="smart-network-tool"
SYSTEMD_DIR="/etc/systemd/system"

echo "正在安装 Smart Network Tool systemd 服务..."

# 检查root权限
if [ "$EUID" -ne 0 ]; then
    echo "错误: 需要root权限来安装systemd服务"
    echo "请使用: sudo $0"
    exit 1
fi

# 复制服务文件
echo "正在复制服务文件..."
cp "$SERVICE_FILE" "$SYSTEMD_DIR/"

# 重载systemd
echo "重新加载systemd配置..."
systemctl daemon-reload

# 启用并启动服务
echo "启用并启动服务..."
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# 检查服务状态
echo "检查服务状态..."
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ 服务安装成功！"
    echo "服务状态: $(systemctl status $SERVICE_NAME | grep 'Active:' | awk '{print $2,$3}')"
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):8080"
    echo ""
    echo "管理命令:"
    echo "  查看状态: systemctl status $SERVICE_NAME"
    echo "  停止服务: systemctl stop $SERVICE_NAME"
    echo "  启动服务: systemctl start $SERVICE_NAME"
    echo "  重启服务: systemctl restart $SERVICE_NAME"
    echo "  禁用服务: systemctl disable $SERVICE_NAME"
    echo "  查看日志: journalctl -u $SERVICE_NAME -f"
    echo "  查看应用日志: tail -f logs/smart_network_tool.log"
else
    echo "❌ 服务启动失败，请检查日志:"
    echo "  journalctl -u $SERVICE_NAME -f"
    exit 1
fi