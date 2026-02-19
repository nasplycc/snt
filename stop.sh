#!/bin/bash
# Smart Network Tool 停止脚本

echo "正在停止 Smart Network Tool..."

# 停止应用
pkill -f "python3 app.py"

sleep 1

# 检查是否已停止
if pgrep -f "python3 app.py" > /dev/null; then
    echo "停止失败，尝试强制停止..."
    pkill -9 -f "python3 app.py"
else
    echo "已停止"
fi
