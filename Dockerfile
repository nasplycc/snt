FROM python:3.11-slim

# 设置工作目录
WORKDIR /nasply

# 标签信息
LABEL maintainer="nasply"
LABEL description="Smart Network Tool - 网卡流量监测与流量消耗工具"

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制主应用文件
COPY app.py .
COPY routes/ ./routes/
COPY services/ ./services/
COPY static/ ./static/
COPY templates/ ./templates/

# 创建必要目录
RUN mkdir -p data logs

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["python3", "app.py", "8080"]