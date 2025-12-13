# Claude Config Manager

Electron + React 桌面端 Claude 插件/配置分发管理系统。

## 快速开始

```bash
npm install
npm run dev      # 同时启动主进程与渲染层开发服务器
npm run build    # 构建生产版本
npm run dist     # 打包安装包
```

## 功能

- 本地插件市场扫描（读取本地目录 + plugin.json）
- 项目管理（添加、浏览、搜索）
- 插件安装（智能合并 claude.json 与文件复制）
- 设置（配置市场目录）

## 技术栈

- Electron 28 + React 18 + TypeScript（strict）
- Vite + Tailwind CSS
- Zustand 状态管理
- IPC 通信：主进程负责所有文件系统操作

## 项目结构

```
src/
  main/          # Electron 主进程
  renderer/      # React 渲染层
  common/        # 共享类型定义
```

## 许可证

MIT