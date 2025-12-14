#!/bin/bash

PROJECT_DIR="/d/MyProject/claude"
DEV_LOG="$PROJECT_DIR/logs/dev.log"
RESTART_LOG="$PROJECT_DIR/logs/restart.log"

echo "===================="
echo "查看 Claude Config Distributor 日志"
echo "===================="

# 显示重启日志
if [ -f "$RESTART_LOG" ]; then
    echo ""
    echo "=== 重启日志 ==="
    echo "最后 20 行:"
    tail -n 20 "$RESTART_LOG"
fi

# 显示开发服务器日志
if [ -f "$DEV_LOG" ]; then
    echo ""
    echo "=== 开发服务器日志 ==="
    echo "最后 50 行:"
    tail -n 50 "$DEV_LOG"

    echo ""
    echo "=== 错误信息 ==="
    grep -i "error\|failed\|exception" "$DEV_LOG" | tail -n 10
fi

echo ""
echo "提示："
echo "- 使用 'tail -f $DEV_LOG' 实时查看日志"
echo "- 使用 'cat $RESTART_LOG' 查看完整重启日志"