#!/bin/bash

echo "========================================"
echo "Claude Config Distributor 重启脚本"
echo "========================================"
echo

# 切换到项目目录
cd "$(dirname "$0")"
if [ $? -ne 0 ]; then
    echo "错误: 无法切换到项目目录"
    exit 1
fi

echo "[1/4] 检查并清理端口 5173..."

# 查找占用端口的进程
PID=$(lsof -ti:5173 2>/dev/null)

# 如果找到了进程，就终止它
if [ ! -z "$PID" ]; then
    echo "找到进程 $PID 正在使用端口 5173"
    echo "正在终止进程..."
    kill -9 $PID 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "进程已成功终止"
    else
        echo "无法终止进程"
    fi
else
    echo "端口 5173 未被占用"
fi

echo
echo "[2/4] 清理旧的 node 进程（可选）..."
# pkill -f "node.*vite" 2>/dev/null

echo
echo "[3/4] 等待端口释放..."
sleep 2

echo
echo "[4/4] 启动应用..."
echo
npm run dev

echo
echo "应用已退出"