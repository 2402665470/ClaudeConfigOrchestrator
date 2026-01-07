# 🚀 Claude Config Orchestrator 启动指南

## 当前状态

### ✅ 已完成
1. 项目代码已编译
2. Electron 已下载完成
3. Vite 开发服务器配置正确
4. IPC 处理程序已实现

### ❌ 阻塞问题
1. **better-sqlite3 编译失败** - 需要 Visual Studio C++ 构建工具
2. 错误：`Could not find any Visual Studio installation to use`

## 🎯 立即可用的解决方案

### 方案 1：安装 Visual Studio Build Tools（推荐）

#### 步骤 1：安装构建工具
1. 访问：https://visualstudio.microsoft.com/zh-hans/downloads/#build-tools-for-visual-studio-2022
2. 下载 "Visual Studio Build Tools 2022"
3. 运行安装程序，选择：
   - ✅ C++ 生成工具
   - ✅ Windows 10/11 SDK（最新版本）
   - ✅ CMake tools for Visual Studio

#### 步骤 2：重新编译
```bash
# 1. 清理（以管理员身份运行）
rmdir /s /q node_modules
del /f /q package-lock.json

# 2. 重新安装
npm install

# 3. 重新编译原生模块
npm run rebuild

# 4. 启动应用
npm run dev
```

### 方案 2：使用 PowerShell 自动安装（快速）

```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

### 方案 3：使用 yarn 替代 npm

```bash
# 1. 安装 yarn
npm install -g yarn

# 2. 清理
rmdir /s /q node_modules

# 3. 使用 yarn 安装
yarn install

# 4. 重新编译
yarn rebuild

# 5. 启动
yarn dev
```

### 方案 4：临时绕过（快速查看界面）

如果您只是想快速查看应用界面，我可以：

1. **修改数据库初始化代码** - 让它在没有 better-sqlite3 的情况下继续运行
2. **返回模拟数据** - 让界面可以正常显示和操作
3. **所有功能正常但数据不持久化**

### 方案 5：使用预编译版本

修改 `package.json`：
```json
{
  "dependencies": {
    "better-sqlite3": "^7.6.2"  // 这个版本有预编译二进制文件
  }
}
```

然后重新安装：
```bash
npm uninstall better-sqlite3
npm install better-sqlite3@7.6.2
```

## 📋 验证清单

启动成功后，您应该看到：

### 控制台输出
- ✅ "数据库初始化成功"
- ✅ "IPC 处理程序注册完成"
- ✅ Vite 服务器运行在 http://localhost:5173

### 应用界面
- ✅ Electron 窗口打开
- ✅ 主界面加载完成
- ✅ 可以测试市场地址解析功能

### 功能测试
在导入页面输入测试地址：
- `anthropics/skills`
- `https://github.com/anthropics/claude-code`

应该看到解析成功，而不是 "No handler registered" 错误。

## 🔧 故障排除

### 如果仍然看到 "Electron failed to install correctly"
```bash
# 删除 electron 并重新安装
rmdir /s /q node_modules\electron
npm install electron@32.2.0
```

### 如果编译仍然失败
检查是否安装了正确的组件：
1. 打开 "Visual Studio Installer"
2. 修改 "Visual Studio Build Tools"
3. 确保 "C++ 生成工具" 已安装

## 📞 技术细节

- **问题根源**：Windows 下编译原生 Node.js 模块需要特定的工具链
- **解决方案**：安装 Visual Studio C++ 构建工具
- **替代方案**：使用预编译版本或临时绕过数据库功能

## 🎉 选择适合您的方案

- **想要完整功能** → 方案 1 或 2
- **只想快速查看** → 方案 4
- **npm 有问题** → 方案 3
- **最简单快速** → 方案 5

选择一个方案，按照步骤执行，应用就能正常启动了！