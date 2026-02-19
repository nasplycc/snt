#!/bin/bash
# Smart Network Tool 后台启动脚本

cd "$(dirname "$0")"

# 检查依赖
echo "正在检查依赖..."

# 检查 Python3
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3，请先安装"
    exit 1
fi

# 检查 pip
if ! command -v pip3 &> /dev/null; then
    echo "错误: 未找到 pip3，请先安装"
    exit 1
fi

# 安装 Python 依赖
echo "正在安装 Python 依赖..."
pip3 install flask psutil requests -q

# 创建数据目录
mkdir -p data

# 默认端口
PORT=${1:-8080}

# 检查是否已在运行
if pgrep -f "python3 app.py" > /dev/null; then
    echo "Smart Network Tool 已经在运行"
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):${PORT}"
    exit 0
fi

echo "========================================"
echo "Smart Network Tool 后台启动中..."
echo "访问地址: http://$(hostname -I | awk '{print $1}'):${PORT}"
echo "========================================"

# 后台启动应用
nohup python3 app.py ${PORT} > /dev/null 2>&1 &

sleep 2

# 检查是否启动成功
if pgrep -f "python3 app.py" > /dev/null; then
    echo "启动成功!"
else
    echo "启动失败，请检查日志"
fi
