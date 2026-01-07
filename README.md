# Claude Config Orchestrator

Claude 配置编排平台 - 一个桌面应用程序，用于收集、整理和部署 Claude 的各种能力配置。

## 核心理念

| 传统方式 | 本平台方式 |
|---------|-----------|
| 安装整个插件 | 提取原子能力 |
| 全局安装到 Claude | 配置注入到项目 |
| 依赖 Claude CLI | 直接生成配置文件 |
| 英文界面 | 中文化支持 |

## 主要功能

1. **能力原子化** - 将外部插件拆解为独立能力（Commands、Skills、Hooks、MCP Servers）
2. **私人市场** - 本地维护的能力库，与 Claude 全局环境隔离
3. **中文化** - 所有能力支持自定义中文名称和描述
4. **场景编排** - 将能力组合成场景，一键应用到项目
5. **配置注入** - 直接生成 `.claude/` 配置文件，无需全局安装

## 技术栈

- Electron + React 18 + TypeScript
- Vite + Tailwind CSS
- Ant Design + Zustand

## 开发

```bash
npm install
npm run dev
```

## 文档

- [需求文档](.kiro/specs/claude-config-orchestrator/requirements.md)

## 许可证

MIT
