#!/bin/bash
# Smart Network Tool 配置脚本

# 服务配置
SERVICE_NAME="smart-network-tool"
SERVICE_DESCRIPTION="Smart Network Tool - 网卡流量监测与DownOnly流量消耗"
SERVICE_USER="root"
SERVICE_WORKING_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_VENV_DIR="${SERVICE_WORKING_DIR}/venv"
SERVICE_PYTHON_CMD="${SERVICE_VENV_DIR}/bin/python"
SERVICE_APP_FILE="${SERVICE_WORKING_DIR}/app.py"
SERVICE_PORT="8080"

# 显示当前配置
echo "========================================"
echo "Smart Network Tool 当前配置"
echo "========================================"
echo "服务名称: $SERVICE_NAME"
echo "服务描述: $SERVICE_DESCRIPTION"
echo "运行用户: $SERVICE_USER"
echo "工作目录: $SERVICE_WORKING_DIR"
echo "虚拟环境: $SERVICE_VENV_DIR"
echo "Python命令: $SERVICE_PYTHON_CMD"
echo "应用文件: $SERVICE_APP_FILE"
echo "服务端口: $SERVICE_PORT"
echo "========================================"

# 修改服务名称
read -p "是否要修改服务名称? (y/n, 默认: n): " MODIFY_SERVICE_NAME
if [[ $MODIFY_SERVICE_NAME =~ ^[Yy]$ ]]; then
    read -p "请输入新的服务名称: " NEW_SERVICE_NAME
    if [ -n "$NEW_SERVICE_NAME" ]; then
        SERVICE_NAME="$NEW_SERVICE_NAME"
        echo "服务名称已更改为: $SERVICE_NAME"
    fi
fi

# 修改服务端口
read -p "是否要修改服务端口? (y/n, 默认: n): " MODIFY_SERVICE_PORT
if [[ $MODIFY_SERVICE_PORT =~ ^[Yy]$ ]]; then
    read -p "请输入新的服务端口 (1-65535, 默认: 8080): " NEW_SERVICE_PORT
    if [ -n "$NEW_SERVICE_PORT" ] && [[ $NEW_SERVICE_PORT =~ ^[0-9]+$ ]] && [ $NEW_SERVICE_PORT -ge 1 ] && [ $NEW_SERVICE_PORT -le 65535 ]; then
        SERVICE_PORT="$NEW_SERVICE_PORT"
        echo "服务端口已更改为: $SERVICE_PORT"
    else
        echo "端口无效，保持默认: $SERVICE_PORT"
    fi
fi

# 应用配置
read -p "是否要应用这些配置? (y/n, 默认: n): " APPLY_CONFIG
if [[ $APPLY_CONFIG =~ ^[Yy]$ ]]; then
    # 更新install.sh文件
    echo "正在更新配置文件..."
    
    # 创建备份
    cp install.sh install.sh.backup
    
    # 替换install.sh中的配置
    sed -i "s/SERVICE_NAME=\"smart-network-tool\"/SERVICE_NAME=\"$SERVICE_NAME\"/g" install.sh
    sed -i "s/8080/$SERVICE_PORT/g" install.sh
    
    # 更新启动脚本
    sed -i "s/PORT=\${1:-8080}/PORT=\${1:-$SERVICE_PORT}/g" start.sh
    sed -i "s/PORT=\${1:-8080}/PORT=\${1:-$SERVICE_PORT}/g" start_daemon.sh
    
    echo "配置已更新！"
    echo ""
    echo "重新运行安装命令以应用新配置:"
    echo "sudo ./install.sh"
else
    echo "配置未应用"
fi

echo ""
echo "配置完成后，服务管理命令如下："
echo "启动服务: systemctl start $SERVICE_NAME"
echo "停止服务: systemctl stop $SERVICE_NAME"
echo "重启服务: systemctl restart $SERVICE_NAME"
echo "查看状态: systemctl status $SERVICE_NAME"
echo "启用开机自启: systemctl enable $SERVICE_NAME"
echo "禁用开机自启: systemctl disable $SERVICE_NAME"
echo "查看日志: journalctl -u $SERVICE_NAME -f"