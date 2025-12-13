<!-- Source: https://code.claude.com/docs/zh-CN/plugins-reference -->

Title: 插件参考 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/plugins-reference

Markdown Content:
本参考提供了 Claude Code 插件系统的完整技术规范，包括组件模式、CLI 命令和开发工具。

插件组件参考
------

本部分记录了插件可以提供的五种类型的组件。

### 命令

插件添加与 Claude Code 命令系统无缝集成的自定义斜杠命令。**位置**：插件根目录中的 `commands/` 目录**文件格式**：带有前置内容的 Markdown 文件 有关插件命令结构、调用模式和功能的完整详细信息，请参阅[插件命令](https://code.claude.com/docs/zh-CN/slash-commands#plugin-commands)。

### 代理

插件可以为 Claude 可以在适当时自动调用的特定任务提供专门的子代理。**位置**：插件根目录中的 `agents/` 目录**文件格式**：描述代理功能的 Markdown 文件**代理结构**：

```
---
description: 此代理专门从事的工作
capabilities: ["task1", "task2", "task3"]
---

# 代理名称

代理角色、专业知识的详细描述，以及 Claude 应何时调用它。

## 功能
- 代理擅长的特定任务
- 另一个专门的功能
- 何时使用此代理与其他代理

## 上下文和示例
提供应使用此代理的示例以及它解决的问题类型。
```

**集成点**：

*   代理出现在 `/agents` 界面中
*   Claude 可以根据任务上下文自动调用代理
*   用户可以手动调用代理
*   插件代理与内置 Claude 代理一起工作

### 技能

插件可以提供扩展 Claude 功能的代理技能。技能由模型调用——Claude 根据任务上下文自主决定何时使用它们。**位置**：插件根目录中的 `skills/` 目录**文件格式**：包含带有前置内容的 `SKILL.md` 文件的目录**技能结构**：

```
skills/
├── pdf-processor/
│   ├── SKILL.md
│   ├── reference.md (可选)
│   └── scripts/ (可选)
└── code-reviewer/
    └── SKILL.md
```

**集成行为**：

*   安装插件时会自动发现插件技能
*   Claude 根据匹配的任务上下文自主调用技能
*   技能可以在 SKILL.md 旁边包含支持文件

有关 SKILL.md 格式和完整的技能创作指南，请参阅：

*   [在 Claude Code 中使用技能](https://code.claude.com/docs/zh-CN/skills)
*   [代理技能概述](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview#skill-structure)

### 钩子

插件可以提供自动响应 Claude Code 事件的事件处理程序。**位置**：插件根目录中的 `hooks/hooks.json`，或在 plugin.json 中内联**格式**：具有事件匹配器和操作的 JSON 配置**钩子配置**：

```
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

**可用事件**：

*   `PreToolUse`：Claude 使用任何工具之前
*   `PostToolUse`：Claude 使用任何工具之后
*   `UserPromptSubmit`：当用户提交提示时
*   `Notification`：当 Claude Code 发送通知时
*   `Stop`：当 Claude 尝试停止时
*   `SubagentStop`：当子代理尝试停止时
*   `SessionStart`：在会话开始时
*   `SessionEnd`：在会话结束时
*   `PreCompact`：在压缩对话历史之前

**钩子类型**：

*   `command`：执行 shell 命令或脚本
*   `validation`：验证文件内容或项目状态
*   `notification`：发送警报或状态更新

### MCP 服务器

插件可以捆绑模型上下文协议 (MCP) 服务器，以将 Claude Code 与外部工具和服务连接。**位置**：插件根目录中的 `.mcp.json`，或在 plugin.json 中内联**格式**：标准 MCP 服务器配置**MCP 服务器配置**：

```
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data"
      }
    },
    "plugin-api-client": {
      "command": "npx",
      "args": ["@company/mcp-server", "--plugin-mode"],
      "cwd": "${CLAUDE_PLUGIN_ROOT}"
    }
  }
}
```

**集成行为**：

*   启用插件时，插件 MCP 服务器会自动启动
*   服务器在 Claude 的工具包中显示为标准 MCP 工具
*   服务器功能与 Claude 的现有工具无缝集成
*   插件服务器可以独立于用户 MCP 服务器进行配置

* * *

插件清单模式
------

`plugin.json` 文件定义了插件的元数据和配置。本部分记录了所有支持的字段和选项。

### 完整模式

```
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json"
}
```

### 必需字段

| 字段 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `name` | string | 唯一标识符（kebab-case，无空格） | `"deployment-tools"` |

### 元数据字段

| 字段 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `version` | string | 语义版本 | `"2.1.0"` |
| `description` | string | 插件目的的简要说明 | `"Deployment automation tools"` |
| `author` | object | 作者信息 | `{"name": "Dev Team", "email": "dev@company.com"}` |
| `homepage` | string | 文档 URL | `"https://docs.example.com"` |
| `repository` | string | 源代码 URL | `"https://github.com/user/plugin"` |
| `license` | string | 许可证标识符 | `"MIT"`、`"Apache-2.0"` |
| `keywords` | array | 发现标签 | `["deployment", "ci-cd"]` |

### 组件路径字段

| 字段 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `commands` | string|array | 其他命令文件/目录 | `"./custom/cmd.md"` 或 `["./cmd1.md"]` |
| `agents` | string|array | 其他代理文件 | `"./custom/agents/"` |
| `hooks` | string|object | 钩子配置路径或内联配置 | `"./hooks.json"` |
| `mcpServers` | string|object | MCP 配置路径或内联配置 | `"./custom-mcp-config.json"` |

### 路径行为规则

**重要**：自定义路径补充默认目录——它们不会替换它们。

*   如果 `commands/` 存在，除了自定义命令路径外，它也会被加载
*   所有路径必须相对于插件根目录，并以 `./` 开头
*   来自自定义路径的命令使用相同的命名和命名空间规则
*   可以将多个路径指定为数组以获得灵活性

**路径示例**：

```
{
  "commands": [
    "./specialized/deploy.md",
    "./utilities/batch-process.md"
  ],
  "agents": [
    "./custom-agents/reviewer.md",
    "./custom-agents/tester.md"
  ]
}
```

### 环境变量

**`${CLAUDE_PLUGIN_ROOT}`**：包含插件目录的绝对路径。在钩子、MCP 服务器和脚本中使用此变量，以确保无论安装位置如何都能获得正确的路径。

```
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/process.sh"
          }
        ]
      }
    ]
  }
}
```

* * *

插件目录结构
------

### 标准插件布局

完整的插件遵循以下结构：

```
enterprise-plugin/
├── .claude-plugin/           # 元数据目录
│   └── plugin.json          # 必需：插件清单
├── commands/                 # 默认命令位置
│   ├── status.md
│   └──  logs.md
├── agents/                   # 默认代理位置
│   ├── security-reviewer.md
│   ├── performance-tester.md
│   └── compliance-checker.md
├── skills/                   # 代理技能
│   ├── code-reviewer/
│   │   └── SKILL.md
│   └── pdf-processor/
│       ├── SKILL.md
│       └── scripts/
├── hooks/                    # 钩子配置
│   ├── hooks.json           # 主钩子配置
│   └── security-hooks.json  # 其他钩子
├── .mcp.json                # MCP 服务器定义
├── scripts/                 # 钩子和实用程序脚本
│   ├── security-scan.sh
│   ├── format-code.py
│   └── deploy.js
├── LICENSE                  # 许可证文件
└── CHANGELOG.md             # 版本历史
```

### 文件位置参考

| 组件 | 默认位置 | 目的 |
| --- | --- | --- |
| **清单** | `.claude-plugin/plugin.json` | 必需的元数据文件 |
| **命令** | `commands/` | 斜杠命令 markdown 文件 |
| **代理** | `agents/` | 子代理 markdown 文件 |
| **技能** | `skills/` | 带有 SKILL.md 文件的代理技能 |
| **钩子** | `hooks/hooks.json` | 钩子配置 |
| **MCP 服务器** | `.mcp.json` | MCP 服务器定义 |

* * *

调试和开发工具
-------

### 调试命令

使用 `claude --debug` 查看插件加载详细信息：

```
claude --debug
```

这显示：

*   正在加载哪些插件
*   插件清单中的任何错误
*   命令、代理和钩子注册
*   MCP 服务器初始化

### 常见问题

| 问题 | 原因 | 解决方案 |
| --- | --- | --- |
| 插件未加载 | 无效的 `plugin.json` | 验证 JSON 语法 |
| 命令未出现 | 目录结构错误 | 确保 `commands/` 在根目录，而不是在 `.claude-plugin/` 中 |
| 钩子未触发 | 脚本不可执行 | 运行 `chmod +x script.sh` |
| MCP 服务器失败 | 缺少 `${CLAUDE_PLUGIN_ROOT}` | 对所有插件路径使用变量 |
| 路径错误 | 使用了绝对路径 | 所有路径必须是相对的，并以 `./` 开头 |

* * *

分发和版本控制参考
---------

### 版本管理

遵循插件发布的语义版本控制：

```
## 另请参阅

- [插件](/zh-CN/plugins) - 教程和实际使用
- [插件市场](/zh-CN/plugin-marketplaces) - 创建和管理市场
- [斜杠命令](/zh-CN/slash-commands) - 命令开发详情
- [子代理](/zh-CN/sub-agents) - 代理配置和功能
- [代理技能](/zh-CN/skills) - 扩展 Claude 的功能
- [钩子](/zh-CN/hooks) - 事件处理和自动化
- [MCP](/zh-CN/mcp) - 外部工具集成
- [设置](/zh-CN/settings) - 插件的配置选项
```
