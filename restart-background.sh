#!/bin/bash

echo "===================="
echo "重启 Claude Config Distributor (后台模式)"
echo "===================="

# 项目目录
PROJECT_DIR="/d/MyProject/claude"
LOG_FILE="$PROJECT_DIR/logs/restart.log"

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

# 进入项目目录
cd "$PROJECT_DIR"

echo "当前目录: $(pwd)" | tee "$LOG_FILE"
echo "重启时间: $(date)" | tee -a "$LOG_FILE"

# 查找并关闭相关进程
echo "正在关闭相关进程..." | tee -a "$LOG_FILE"

# Windows 环境下使用 taskkill
if command -v taskkill >/dev/null 2>&1; then
    # 关闭占用端口 5173 的进程
    for pid in $(netstat -ano | findstr :5173 | awk '{print $5}' | sort -u); do
        if [ "$pid" != "" ] && [ "$pid" != "0" ]; then
            echo "  关闭 PID: $pid" | tee -a "$LOG_FILE"
            taskkill //F //PID "$pid" 2>&1 | tee -a "$LOG_FILE"
        fi
    done

    # 关闭 node 和 electron 进程
    taskkill //F //IM node.exe 2>&1 | tee -a "$LOG_FILE"
    taskkill //F //IM electron.exe 2>&1 | tee -a "$LOG_FILE"
else
    # Linux/Mac 环境
    pkill -f "node.*vite" 2>/dev/null || true
    pkill -f "electron" 2>/dev/null || true
fi

# 等待进程关闭
echo "等待进程关闭..." | tee -a "$LOG_FILE"
sleep 2

# 清理缓存
if [ -d "node_modules/.cache" ]; then
    echo "清理缓存..." | tee -a "$LOG_FILE"
    rm -rf node_modules/.cache
fi

# 在后台启动开发服务器
echo "在后台启动开发服务器..." | tee -a "$LOG_FILE"
nohup npm run dev > "$PROJECT_DIR/logs/dev.log" 2>&1 &
DEV_PID=$!

echo "开发服务器已启动，PID: $DEV_PID" | tee -a "$LOG_FILE"
echo "日志文件: $PROJECT_DIR/logs/dev.log" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "应用已重启！请查看日志文件了解运行状态。" | tee -a "$LOG_FILE"