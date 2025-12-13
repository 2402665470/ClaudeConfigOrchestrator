# 项目脚本速查

```bash
npm run dev      # 同时启动主进程与渲染层开发服务器
npm run build    # 构建生产版本（主进程+渲染层）
npm run lint     # ESLint 检查
npm run typecheck# TypeScript 类型检查
npm run dist     # 构建并打包安装包（electron-builder）
```

## 开发注意

- 所有文件系统操作必须通过 IPC，渲染层禁止直接调用 fs
- 类型定义统一放在 `src/common/types.ts`
- UI 统一使用 Tailwind + 自定义配色（zinc/blue）
- 状态管理使用 Zustand，全局 store 放在 `src/renderer/stores/`