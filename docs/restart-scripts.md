# 应用重启脚本说明

项目提供了三个重启脚本，可以根据需要选择使用：

## 1. restart-dev.bat (推荐)
**Windows 批处理文件**

使用方法：
```bash
双击运行 restart-dev.bat
```

功能：
- 关闭所有 node.exe 进程
- 关闭占用 5173 端口的进程
- 清理 node_modules/.cache 缓存
- 在后台启动开发服务器
- 显示详细的操作日志

优点：
- 操作详细，可以看到每个步骤
- 自动清理缓存
- 提示信息丰富

## 2. restart-dev.ps1 (高级用户)
**PowerShell 脚本**

使用方法：
```bash
右键 -> 以 PowerShell 运行
# 或在 PowerShell 中执行
.\restart-dev.ps1
```

功能：
- 更准确的进程查找和关闭
- 彩色输出，易于阅读
- 详细的错误处理
- 智能缓存清理

优点：
- 输出更美观（彩色）
- 错误处理更完善
- 可以知道具体关闭了哪些进程

## 3. quick-restart.bat (快速重启)
**简单批处理文件**

使用方法：
```bash
双击运行 quick-restart.bat
```

功能：
- 快速关闭所有进程
- 立即重启应用

优点：
- 速度最快
- 操作简单
- 适合频繁重启时使用

## 使用建议

1. **首次重启或遇到问题时**：使用 `restart-dev.bat`
2. **需要快速重启时**：使用 `quick-restart.bat`
3. **喜欢 PowerShell 环境**：使用 `restart-dev.ps1`

## 常见问题

### Q: 为什么需要重启脚本？
A: 开发模式下，代码更改后有时需要完全重启才能生效，特别是：
- 主进程代码更改
- Preload 脚本更改
- IPC 通信相关更改

### Q: 脚本报错怎么办？
A:
1. 确保在正确的目录运行（项目根目录）
2. 检查是否有权限问题
3. 手动关闭相关进程后再运行脚本

### Q: 脚本运行后应用没有启动？
A:
1. 检查是否有其他应用占用了 5173 端口
2. 运行 `npm install` 确保依赖完整
3. 手动执行 `npm run dev` 查看具体错误

### Q: PowerShell 提示执行策略错误？
A: 以管理员身份运行 PowerShell，执行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 快捷键提示

在开发过程中，可以使用以下快捷键：
- **Ctrl+C**：在命令行中停止当前进程
- **F12**：在 Electron 中打开/关闭开发者工具
- **Ctrl+R**：在开发者工具中刷新页面
- **Ctrl+Shift+I**：打开开发者工具（如果未打开）