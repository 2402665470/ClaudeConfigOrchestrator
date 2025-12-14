#!/bin/bash

echo "===================="
echo "重启 Claude Config Distributor"
echo "===================="

# 项目目录
PROJECT_DIR="/d/MyProject/claude"

# 进入项目目录
cd "$PROJECT_DIR"

echo "当前目录: $(pwd)"

# 查找并关闭占用端口 5173 的进程
echo "正在关闭占用端口 5173 的进程..."
PIDS=$(netstat -tulpn 2>/dev/null | grep :5173 | awk '{print $7}' | cut -d'/' -f1)
if [ ! -z "$PIDS" ]; then
    echo "$PIDS" | xargs -r kill -9
fi

# 查找并关闭 node 进程
echo "正在关闭 node 进程..."
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "electron" 2>/dev/null || true

# 等待2秒
sleep 2

# 清理缓存
if [ -d "node_modules/.cache" ]; then
    echo "清理缓存..."
    rm -rf node_modules/.cache
fi

# 启动开发服务器
echo "启动开发服务器..."
npm run dev

echo "应用已重启！"