# 数据库模块编译问题修复指南

## 问题描述
```
Error: The module '...\better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 137. This version of Node.js requires
NODE_MODULE_VERSION 128.
```

## 快速修复

### 方法 1：使用批处理脚本（推荐）
1. **关闭所有相关程序**（包括 VS Code、命令行窗口等）
2. 右键点击 `minimal-fix.bat`，选择"以管理员身份运行"
3. 等待脚本执行完成

### 方法 2：手动修复步骤
```bash
# 1. 关闭所有程序后，以管理员身份打开命令提示符

# 2. 删除 node_modules
rmdir /s /q node_modules

# 3. 删除 package-lock.json
del /f /q package-lock.json

# 4. 清理 npm 缓存
npm cache clean --force

# 5. 安装依赖
npm install --no-optional

# 6. 重新编译原生模块
npx @electron/rebuild --version=32.2.0

# 7. 编译并启动应用
npm run build:main
npm run build:preload
npm run dev
```

### 方法 3：如果上述方法都失败
```bash
# 1. 完全重置项目
git clean -fdx
git reset --hard HEAD

# 2. 手动删除 node_modules
rmdir /s /q node_modules

# 3. 使用 yarn 替代 npm
npm install -g yarn
yarn install

# 4. 重新编译
yarn rebuild
```

## 验证修复成功
启动应用后，查看控制台输出，应该看到：
- ✅ "数据库初始化成功"
- ✅ "IPC 处理程序注册完成"
- ❌ 不应该看到 "No handler registered for 'import:parseMarketplace'"

## 常见问题

### Q: 为什么会出现这个问题？
A: better-sqlite3 是原生模块，需要为特定的 Node.js 版本编译。Electron 使用自己的 Node.js 版本，所以需要重新编译。

### Q: 为什么文件被锁定？
A: 可能是：
- VS Code 或其他编辑器打开了文件
- 之前的 npm 进程还在运行
- Electron 应用仍在后台运行

### Q: 如何彻底关闭所有进程？
```bash
# 以管理员身份运行
taskkill /f /im node.exe
taskkill /f /im electron.exe
taskkill /f /im code.exe
```

## 技术细节
- Electron 版本：v32.2.0
- Node.js 版本：v20.x
- better-sqlite3 版本：v9.2.2（已降级以提高兼容性）