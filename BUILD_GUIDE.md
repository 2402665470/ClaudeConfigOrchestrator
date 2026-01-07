# Claude Config Orchestrator 构建指南

## 环境要求

- Node.js 18+
- npm 或 yarn
- Windows 10/11

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式启动

在命令行中运行：

```bash
npm run dev
```

或者分步执行：

```bash
# 终端 1: 启动 Vite 开发服务器
npx vite --port 5173

# 终端 2: 启动 Electron (等待 Vite 启动后)
set NODE_ENV=development
npx electron .
```

### 3. 生产构建

```bash
# 构建所有组件
npm run build

# 或分步构建
npm run build:main      # 构建主进程
npm run build:preload   # 构建 preload 脚本
npx vite build          # 构建渲染进程
```

### 4. 运行生产版本

```bash
npx electron .
```

## 目录结构

构建后的目录结构：

```
dist/
├── main/
│   └── main/
│       ├── index.js        # 主进程入口
│       ├── preload.js      # preload 脚本
│       ├── services/       # 服务模块
│       └── utils/          # 工具模块
├── common/
│   └── types.js            # 共享类型
└── renderer/
    ├── index.html          # 渲染进程入口
    └── assets/             # 静态资源
```

## 常见问题

### PowerShell 命令执行缓慢

如果 PowerShell 命令执行缓慢，可以尝试：

1. 使用 CMD 代替 PowerShell
2. 禁用 PowerShell 配置文件：`powershell -NoProfile -Command "..."`
3. 直接在 Windows Terminal 中运行命令

### Electron 无法加载页面

检查以下配置：

1. `package.json` 中的 `main` 字段指向正确的入口文件
2. `src/main/index.ts` 中的 preload 和 renderer 路径正确
3. `vite.config.ts` 中设置了 `base: './'`

## 技术栈

- **框架**: Electron + React 18 + TypeScript
- **构建工具**: Vite
- **UI 库**: Ant Design 6.x
- **状态管理**: Zustand
- **样式**: Tailwind CSS
