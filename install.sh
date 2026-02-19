#!/bin/bash
# Smart Network Tool 安装脚本（适用于飞牛NAS）

set -e

echo "========================================"
echo "Smart Network Tool 安装程序"
echo "========================================"

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 更新源
echo "正在更新软件源..."
apt update

# 安装依赖（添加 python3-venv）
echo "正在安装依赖..."
apt install -y python3 python3-pip python3-venv python3-flask python3-psutil screen

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 创建虚拟环境
VENV_DIR="${SCRIPT_DIR}/venv"
echo "正在创建 Python 虚拟环境..."
python3 -m venv $VENV_DIR

# 激活虚拟环境并安装 Python 包
echo "正在安装 Python 依赖..."
source $VENV_DIR/bin/activate
pip install --upgrade pip -q
pip install requests flask psutil -q

# 创建数据目录
mkdir -p "${SCRIPT_DIR}/data"

# 设置权限
chmod +x "${SCRIPT_DIR}/start.sh"
chmod +x "${SCRIPT_DIR}/start_daemon.sh"
chmod +x "${SCRIPT_DIR}/stop.sh"

# 创建 systemd 服务（如果系统支持）
if command -v systemctl &> /dev/null; then
    echo "创建 systemd 服务..."
    
    # 用户可以选择服务名称
    echo "请选择服务名称："
    echo "1. smart-network-tool (默认)"
    echo "2. snt"
    echo "3. network-tool"
    echo "4. 自定义名称"
    read -p "请选择 [1-4, 默认: 1]: " SERVICE_CHOICE
    
    case $SERVICE_CHOICE in
        1|"")
            SERVICE_NAME="smart-network-tool"
            ;;
        2)
            SERVICE_NAME="snt"
            ;;
        3)
            SERVICE_NAME="network-tool"
            ;;
        4)
            read -p "请输入自定义服务名称: " CUSTOM_NAME
            if [ -n "$CUSTOM_NAME" ]; then
                SERVICE_NAME="$CUSTOM_NAME"
            else
                SERVICE_NAME="smart-network-tool"
            fi
            ;;
        *)
            SERVICE_NAME="smart-network-tool"
            ;;
    esac
    
    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Smart Network Tool
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${SCRIPT_DIR}
ExecStart=${VENV_DIR}/bin/python ${SCRIPT_DIR}/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ${SERVICE_NAME}.service
    
    echo "systemd 服务已创建: ${SERVICE_NAME}.service"
    echo "启动命令: systemctl start ${SERVICE_NAME}"
    echo "停止命令: systemctl stop ${SERVICE_NAME}"
    echo "查看状态: systemctl status ${SERVICE_NAME}"
    echo "启用命令: systemctl enable ${SERVICE_NAME}"
    echo "禁用命令: systemctl disable ${SERVICE_NAME}"
    
else
    # 使用 rc.local 方式（飞牛NAS）
    echo "创建 rc.local 启动脚本..."
    
    cat > /etc/rc.local << EOF
#!/bin/bash
# 等待网络启动完成
sleep 10

# 启动 Smart Network Tool（使用虚拟环境）
cd ${SCRIPT_DIR}
screen -dmS smart-network-tool ${VENV_DIR}/bin/python app.py

exit 0
EOF

    chmod +x /etc/rc.local
    
    echo "rc.local 已配置"
fi

echo "========================================"
echo "安装完成!"
echo "========================================"
echo ""
echo "使用方法:"
echo "  1. 手动启动: ${VENV_DIR}/bin/python app.py [端口]"
echo "  2. 后台启动: ./start_daemon.sh [端口]"
echo "  3. 停止服务: ./stop.sh"
echo ""
echo "默认访问地址: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "开机自启已配置，重启后自动启动"
echo "========================================"
