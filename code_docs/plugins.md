<!-- Source: https://code.claude.com/docs/zh-CN/plugins -->

Title: 插件 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/plugins

Markdown Content:
插件 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/plugins#content-area)

[Claude Code Docs home page![Image 1: light logo](https://mintcdn.com/claude-code/o69F7a6qoW9vboof/logo/light.svg?fit=max&auto=format&n=o69F7a6qoW9vboof&q=85&s=536eade682636e84231afce2577f9509)![Image 2: dark logo](https://mintcdn.com/claude-code/o69F7a6qoW9vboof/logo/dark.svg?fit=max&auto=format&n=o69F7a6qoW9vboof&q=85&s=0766b3221061e80143e9f300733e640b)](https://code.claude.com/docs)

![Image 3: CN](https://d3gk2c5xim1je2.cloudfront.net/flags/CN.svg)

简体中文

搜索...

Ctrl K

*   [Claude Developer Platform](https://platform.claude.com/)
*   [Claude Code on the Web](https://claude.ai/code)
*   [Claude Code on the Web](https://claude.ai/code)

搜索...

Navigation

使用 Claude Code 构建

插件

[快速开始](https://code.claude.com/docs/zh-CN/overview)[使用 Claude Code 构建](https://code.claude.com/docs/zh-CN/sub-agents)[Claude Agent SDK](https://code.claude.com/docs/zh-CN/sdk/migration-guide)[部署](https://code.claude.com/docs/zh-CN/third-party-integrations)[管理](https://code.claude.com/docs/zh-CN/setup)[配置](https://code.claude.com/docs/zh-CN/settings)[参考](https://code.claude.com/docs/zh-CN/cli-reference)[资源](https://code.claude.com/docs/zh-CN/legal-and-compliance)

##### 使用 Claude Code 构建

*   [子代理](https://code.claude.com/docs/zh-CN/sub-agents)
*   [插件](https://code.claude.com/docs/zh-CN/plugins)
*   [Agent Skills](https://code.claude.com/docs/zh-CN/skills)
*   [输出样式](https://code.claude.com/docs/zh-CN/output-styles)
*   [Claude Code 钩子入门](https://code.claude.com/docs/zh-CN/hooks-guide)
*   [无头模式](https://code.claude.com/docs/zh-CN/headless)
*   [GitHub Actions](https://code.claude.com/docs/zh-CN/github-actions)
*   [GitLab CI/CD](https://code.claude.com/docs/zh-CN/gitlab-ci-cd)
*   [Model Context Protocol (MCP)](https://code.claude.com/docs/zh-CN/mcp)
*   [故障排除](https://code.claude.com/docs/zh-CN/troubleshooting)

在此页面
*   [快速入门](https://code.claude.com/docs/zh-CN/plugins#%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)
*   [前置条件](https://code.claude.com/docs/zh-CN/plugins#%E5%89%8D%E7%BD%AE%E6%9D%A1%E4%BB%B6)
*   [创建您的第一个插件](https://code.claude.com/docs/zh-CN/plugins#%E5%88%9B%E5%BB%BA%E6%82%A8%E7%9A%84%E7%AC%AC%E4%B8%80%E4%B8%AA%E6%8F%92%E4%BB%B6)
*   [插件结构概览](https://code.claude.com/docs/zh-CN/plugins#%E6%8F%92%E4%BB%B6%E7%BB%93%E6%9E%84%E6%A6%82%E8%A7%88)
*   [安装和管理插件](https://code.claude.com/docs/zh-CN/plugins#%E5%AE%89%E8%A3%85%E5%92%8C%E7%AE%A1%E7%90%86%E6%8F%92%E4%BB%B6)
*   [前置条件](https://code.claude.com/docs/zh-CN/plugins#%E5%89%8D%E7%BD%AE%E6%9D%A1%E4%BB%B6-2)
*   [添加市场](https://code.claude.com/docs/zh-CN/plugins#%E6%B7%BB%E5%8A%A0%E5%B8%82%E5%9C%BA)
*   [安装插件](https://code.claude.com/docs/zh-CN/plugins#%E5%AE%89%E8%A3%85%E6%8F%92%E4%BB%B6)
*   [通过交互式菜单（推荐用于发现）](https://code.claude.com/docs/zh-CN/plugins#%E9%80%9A%E8%BF%87%E4%BA%A4%E4%BA%92%E5%BC%8F%E8%8F%9C%E5%8D%95%EF%BC%88%E6%8E%A8%E8%8D%90%E7%94%A8%E4%BA%8E%E5%8F%91%E7%8E%B0%EF%BC%89)
*   [通过直接命令（用于快速安装）](https://code.claude.com/docs/zh-CN/plugins#%E9%80%9A%E8%BF%87%E7%9B%B4%E6%8E%A5%E5%91%BD%E4%BB%A4%EF%BC%88%E7%94%A8%E4%BA%8E%E5%BF%AB%E9%80%9F%E5%AE%89%E8%A3%85%EF%BC%89)
*   [验证安装](https://code.claude.com/docs/zh-CN/plugins#%E9%AA%8C%E8%AF%81%E5%AE%89%E8%A3%85)
*   [设置团队插件工作流](https://code.claude.com/docs/zh-CN/plugins#%E8%AE%BE%E7%BD%AE%E5%9B%A2%E9%98%9F%E6%8F%92%E4%BB%B6%E5%B7%A5%E4%BD%9C%E6%B5%81)
*   [开发更复杂的插件](https://code.claude.com/docs/zh-CN/plugins#%E5%BC%80%E5%8F%91%E6%9B%B4%E5%A4%8D%E6%9D%82%E7%9A%84%E6%8F%92%E4%BB%B6)
*   [向您的插件添加技能](https://code.claude.com/docs/zh-CN/plugins#%E5%90%91%E6%82%A8%E7%9A%84%E6%8F%92%E4%BB%B6%E6%B7%BB%E5%8A%A0%E6%8A%80%E8%83%BD)
*   [组织复杂的插件](https://code.claude.com/docs/zh-CN/plugins#%E7%BB%84%E7%BB%87%E5%A4%8D%E6%9D%82%E7%9A%84%E6%8F%92%E4%BB%B6)
*   [在本地测试您的插件](https://code.claude.com/docs/zh-CN/plugins#%E5%9C%A8%E6%9C%AC%E5%9C%B0%E6%B5%8B%E8%AF%95%E6%82%A8%E7%9A%84%E6%8F%92%E4%BB%B6)
*   [调试插件问题](https://code.claude.com/docs/zh-CN/plugins#%E8%B0%83%E8%AF%95%E6%8F%92%E4%BB%B6%E9%97%AE%E9%A2%98)
*   [共享您的插件](https://code.claude.com/docs/zh-CN/plugins#%E5%85%B1%E4%BA%AB%E6%82%A8%E7%9A%84%E6%8F%92%E4%BB%B6)
*   [后续步骤](https://code.claude.com/docs/zh-CN/plugins#%E5%90%8E%E7%BB%AD%E6%AD%A5%E9%AA%A4)
*   [对于插件用户](https://code.claude.com/docs/zh-CN/plugins#%E5%AF%B9%E4%BA%8E%E6%8F%92%E4%BB%B6%E7%94%A8%E6%88%B7)
*   [对于插件开发者](https://code.claude.com/docs/zh-CN/plugins#%E5%AF%B9%E4%BA%8E%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91%E8%80%85)
*   [对于团队主管和管理员](https://code.claude.com/docs/zh-CN/plugins#%E5%AF%B9%E4%BA%8E%E5%9B%A2%E9%98%9F%E4%B8%BB%E7%AE%A1%E5%92%8C%E7%AE%A1%E7%90%86%E5%91%98)
*   [另请参阅](https://code.claude.com/docs/zh-CN/plugins#%E5%8F%A6%E8%AF%B7%E5%8F%82%E9%98%85)

使用 Claude Code 构建

插件
==

复制页面

通过插件系统使用自定义命令、代理、钩子、技能和 MCP 服务器扩展 Claude Code。

复制页面

有关完整的技术规范和架构，请参阅[插件参考](https://code.claude.com/docs/zh-CN/plugins-reference)。有关市场管理，请参阅[插件市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces)。

插件让您能够使用可在项目和团队中共享的自定义功能来扩展 Claude Code。从[市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces)安装插件以添加预构建的命令、代理、钩子、技能和 MCP 服务器，或创建您自己的插件来自动化您的工作流。
[​](https://code.claude.com/docs/zh-CN/plugins#%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)

快速入门
------------------------------------------------------------------------------------------

让我们创建一个简单的问候插件，帮助您熟悉插件系统。我们将构建一个有效的插件，添加一个自定义命令，在本地测试它，并理解核心概念。
### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%89%8D%E7%BD%AE%E6%9D%A1%E4%BB%B6)

前置条件

*   在您的机器上安装了 Claude Code
*   对命令行工具的基本熟悉

### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%88%9B%E5%BB%BA%E6%82%A8%E7%9A%84%E7%AC%AC%E4%B8%80%E4%B8%AA%E6%8F%92%E4%BB%B6)

创建您的第一个插件

1

创建市场结构

复制

询问AI

```
mkdir test-marketplace
cd test-marketplace
```

2

创建插件目录

复制

询问AI

```
mkdir my-first-plugin
cd my-first-plugin
```

3

创建插件清单

创建 .claude-plugin/plugin.json

复制

询问AI

```
mkdir .claude-plugin
cat > .claude-plugin/plugin.json << 'EOF'
{
"name": "my-first-plugin",
"description": "A simple greeting plugin to learn the basics",
"version": "1.0.0",
"author": {
"name": "Your Name"
}
}
EOF
```

4

添加自定义命令

创建 commands/hello.md

复制

询问AI

```
mkdir commands
cat > commands/hello.md << 'EOF'
---
description: Greet the user with a personalized message
---

# Hello Command

Greet the user warmly and ask how you can help them today. Make the greeting personal and encouraging.
EOF
```

5

创建市场清单

创建 marketplace.json

复制

询问AI

```
cd ..
mkdir .claude-plugin
cat > .claude-plugin/marketplace.json << 'EOF'
{
"name": "test-marketplace",
"owner": {
"name": "Test User"
},
"plugins": [
{
  "name": "my-first-plugin",
  "source": "./my-first-plugin",
  "description": "My first test plugin"
}
]
}
EOF
```

6

安装并测试您的插件

从父目录启动 Claude Code

复制

询问AI

```
cd ..
claude
```

添加测试市场

复制

询问AI

```
/plugin marketplace add ./test-marketplace
```

安装您的插件

复制

询问AI

```
/plugin install my-first-plugin@test-marketplace
```

选择”立即安装”。然后您需要重新启动 Claude Code 以使用新插件。

尝试您的新命令

复制

询问AI

```
/hello
```

您将看到 Claude 使用您的问候命令！检查 `/help` 以查看您的新命令列表。

您已成功创建并测试了包含以下关键组件的插件：
*   **插件清单** (`.claude-plugin/plugin.json`) - 描述您的插件元数据
*   **命令目录** (`commands/`) - 包含您的自定义斜杠命令
*   **测试市场** - 允许您在本地测试您的插件

### [​](https://code.claude.com/docs/zh-CN/plugins#%E6%8F%92%E4%BB%B6%E7%BB%93%E6%9E%84%E6%A6%82%E8%A7%88)

插件结构概览

您的插件遵循以下基本结构：

复制

询问AI

```
my-first-plugin/
├── .claude-plugin/
│   └── plugin.json          # 插件元数据
├── commands/                 # 自定义斜杠命令（可选）
│   └── hello.md
├── agents/                   # 自定义代理（可选）
│   └── helper.md
├── skills/                   # 代理技能（可选）
│   └── my-skill/
│       └── SKILL.md
└── hooks/                    # 事件处理程序（可选）
    └── hooks.json
```

**您可以添加的其他组件：**
*   **命令**：在 `commands/` 目录中创建 markdown 文件
*   **代理**：在 `agents/` 目录中创建代理定义
*   **技能**：在 `skills/` 目录中创建 `SKILL.md` 文件
*   **钩子**：为事件处理创建 `hooks/hooks.json`
*   **MCP 服务器**：为外部工具集成创建 `.mcp.json`

**后续步骤**：准备好添加更多功能了吗？跳转到[开发更复杂的插件](https://code.claude.com/docs/zh-CN/plugins#develop-more-complex-plugins)以添加代理、钩子和 MCP 服务器。有关所有插件组件的完整技术规范，请参阅[插件参考](https://code.claude.com/docs/zh-CN/plugins-reference)。

* * *

[​](https://code.claude.com/docs/zh-CN/plugins#%E5%AE%89%E8%A3%85%E5%92%8C%E7%AE%A1%E7%90%86%E6%8F%92%E4%BB%B6)

安装和管理插件
------------------------------------------------------------------------------------------------------------------------

了解如何发现、安装和管理插件以扩展您的 Claude Code 功能。
### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%89%8D%E7%BD%AE%E6%9D%A1%E4%BB%B6-2)

前置条件

*   Claude Code 已安装并运行
*   对命令行界面的基本熟悉

### [​](https://code.claude.com/docs/zh-CN/plugins#%E6%B7%BB%E5%8A%A0%E5%B8%82%E5%9C%BA)

添加市场

市场是可用插件的目录。添加它们以发现和安装插件：

添加市场

复制

询问AI

```
/plugin marketplace add your-org/claude-plugins
```

浏览可用插件

复制

询问AI

```
/plugin
```

有关详细的市场管理，包括 Git 存储库、本地开发和团队分发，请参阅[插件市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces)。
### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%AE%89%E8%A3%85%E6%8F%92%E4%BB%B6)

安装插件

#### [​](https://code.claude.com/docs/zh-CN/plugins#%E9%80%9A%E8%BF%87%E4%BA%A4%E4%BA%92%E5%BC%8F%E8%8F%9C%E5%8D%95%EF%BC%88%E6%8E%A8%E8%8D%90%E7%94%A8%E4%BA%8E%E5%8F%91%E7%8E%B0%EF%BC%89)

通过交互式菜单（推荐用于发现）

打开插件管理界面

复制

询问AI

```
/plugin
```

选择”浏览插件”以查看可用选项及其描述、功能和安装选项。
#### [​](https://code.claude.com/docs/zh-CN/plugins#%E9%80%9A%E8%BF%87%E7%9B%B4%E6%8E%A5%E5%91%BD%E4%BB%A4%EF%BC%88%E7%94%A8%E4%BA%8E%E5%BF%AB%E9%80%9F%E5%AE%89%E8%A3%85%EF%BC%89)

通过直接命令（用于快速安装）

安装特定插件

复制

询问AI

```
/plugin install formatter@your-org
```

启用已禁用的插件

复制

询问AI

```
/plugin enable plugin-name@marketplace-name
```

禁用而不卸载

复制

询问AI

```
/plugin disable plugin-name@marketplace-name
```

完全删除插件

复制

询问AI

```
/plugin uninstall plugin-name@marketplace-name
```

### [​](https://code.claude.com/docs/zh-CN/plugins#%E9%AA%8C%E8%AF%81%E5%AE%89%E8%A3%85)

验证安装

安装插件后：
1.   **检查可用命令**：运行 `/help` 以查看新命令
2.   **测试插件功能**：尝试插件的命令和功能
3.   **查看插件详情**：使用 `/plugin` → “管理插件”以查看插件提供的内容

[​](https://code.claude.com/docs/zh-CN/plugins#%E8%AE%BE%E7%BD%AE%E5%9B%A2%E9%98%9F%E6%8F%92%E4%BB%B6%E5%B7%A5%E4%BD%9C%E6%B5%81)

设置团队插件工作流
--------------------------------------------------------------------------------------------------------------------------------------------

在存储库级别配置插件以确保整个团队的工具一致。当团队成员信任您的存储库文件夹时，Claude Code 会自动安装指定的市场和插件。**设置团队插件：**
1.   将市场和插件配置添加到您的存储库的 `.claude/settings.json`
2.   团队成员信任存储库文件夹
3.   为所有团队成员自动安装插件

有关完整说明，包括配置示例、市场设置和推出最佳实践，请参阅[配置团队市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces#how-to-configure-team-marketplaces)。

* * *

[​](https://code.claude.com/docs/zh-CN/plugins#%E5%BC%80%E5%8F%91%E6%9B%B4%E5%A4%8D%E6%9D%82%E7%9A%84%E6%8F%92%E4%BB%B6)

开发更复杂的插件
----------------------------------------------------------------------------------------------------------------------------------

一旦您熟悉了基本插件，您可以创建更复杂的扩展。
### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%90%91%E6%82%A8%E7%9A%84%E6%8F%92%E4%BB%B6%E6%B7%BB%E5%8A%A0%E6%8A%80%E8%83%BD)

向您的插件添加技能

插件可以包含[代理技能](https://code.claude.com/docs/zh-CN/skills)以扩展 Claude 的功能。技能是由模型调用的——Claude 根据任务上下文自主使用它们。要向您的插件添加技能，请在您的插件根目录创建一个 `skills/` 目录，并添加包含 `SKILL.md` 文件的技能文件夹。插件技能在安装插件时自动可用。有关完整的技能编写指南，请参阅[代理技能](https://code.claude.com/docs/zh-CN/skills)。
### [​](https://code.claude.com/docs/zh-CN/plugins#%E7%BB%84%E7%BB%87%E5%A4%8D%E6%9D%82%E7%9A%84%E6%8F%92%E4%BB%B6)

组织复杂的插件

对于具有许多组件的插件，按功能组织您的目录结构。有关完整的目录布局和组织模式，请参阅[插件目录结构](https://code.claude.com/docs/zh-CN/plugins-reference#plugin-directory-structure)。
### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%9C%A8%E6%9C%AC%E5%9C%B0%E6%B5%8B%E8%AF%95%E6%82%A8%E7%9A%84%E6%8F%92%E4%BB%B6)

在本地测试您的插件

开发插件时，使用本地市场来迭代测试更改。此工作流基于快速入门模式，适用于任何复杂性的插件。

1

设置您的开发结构

组织您的插件和市场以进行测试：

创建目录结构

复制

询问AI

```
mkdir dev-marketplace
cd dev-marketplace
mkdir my-plugin
```

这将创建：

复制

询问AI

```
dev-marketplace/
├── .claude-plugin/marketplace.json  (您将创建此文件)
└── my-plugin/                        (您正在开发的插件)
    ├── .claude-plugin/plugin.json
    ├── commands/
    ├── agents/
    └── hooks/
```

2

创建市场清单

创建 marketplace.json

复制

询问AI

```
mkdir .claude-plugin
cat > .claude-plugin/marketplace.json << 'EOF'
{
"name": "dev-marketplace",
"owner": {
"name": "Developer"
},
"plugins": [
{
  "name": "my-plugin",
  "source": "./my-plugin",
  "description": "Plugin under development"
}
]
}
EOF
```

3

安装并测试

从父目录启动 Claude Code

复制

询问AI

```
cd ..
claude
```

添加您的开发市场

复制

询问AI

```
/plugin marketplace add ./dev-marketplace
```

安装您的插件

复制

询问AI

```
/plugin install my-plugin@dev-marketplace
```

测试您的插件组件：
*   使用 `/command-name` 尝试您的命令
*   检查代理是否出现在 `/agents` 中
*   验证钩子是否按预期工作

4

迭代您的插件

对您的插件代码进行更改后：

卸载当前版本

复制

询问AI

```
/plugin uninstall my-plugin@dev-marketplace
```

重新安装以测试更改

复制

询问AI

```
/plugin install my-plugin@dev-marketplace
```

在开发和改进插件时重复此周期。

**对于多个插件**：在 `./plugins/plugin-name` 等子目录中组织插件，并相应地更新您的 marketplace.json。请参阅[插件源](https://code.claude.com/docs/zh-CN/plugin-marketplaces#plugin-sources)以了解组织模式。

### [​](https://code.claude.com/docs/zh-CN/plugins#%E8%B0%83%E8%AF%95%E6%8F%92%E4%BB%B6%E9%97%AE%E9%A2%98)

调试插件问题

如果您的插件无法按预期工作：
1.   **检查结构**：确保您的目录位于插件根目录，而不是在 `.claude-plugin/` 内
2.   **单独测试组件**：分别检查每个命令、代理和钩子
3.   **使用验证和调试工具**：请参阅[调试和开发工具](https://code.claude.com/docs/zh-CN/plugins-reference#debugging-and-development-tools)以了解 CLI 命令和故障排除技术

### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%85%B1%E4%BA%AB%E6%82%A8%E7%9A%84%E6%8F%92%E4%BB%B6)

共享您的插件

当您的插件准备好共享时：
1.   **添加文档**：包含一个 README.md，其中包含安装和使用说明
2.   **版本化您的插件**：在您的 `plugin.json` 中使用语义版本控制
3.   **创建或使用市场**：通过插件市场分发以便于安装
4.   **与他人测试**：在更广泛分发之前让团队成员测试插件

有关完整的技术规范、调试技术和分发策略，请参阅[插件参考](https://code.claude.com/docs/zh-CN/plugins-reference)。

* * *

[​](https://code.claude.com/docs/zh-CN/plugins#%E5%90%8E%E7%BB%AD%E6%AD%A5%E9%AA%A4)

后续步骤
------------------------------------------------------------------------------------------

现在您了解了 Claude Code 的插件系统，以下是针对不同目标的建议路径：
### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%AF%B9%E4%BA%8E%E6%8F%92%E4%BB%B6%E7%94%A8%E6%88%B7)

对于插件用户

*   **发现插件**：浏览社区市场以查找有用的工具
*   **团队采用**：为您的项目设置存储库级别的插件
*   **市场管理**：学习管理多个插件源
*   **高级用法**：探索插件组合和工作流

### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%AF%B9%E4%BA%8E%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91%E8%80%85)

对于插件开发者

*   **创建您的第一个市场**：[插件市场指南](https://code.claude.com/docs/zh-CN/plugin-marketplaces)
*   **高级组件**：深入了解特定的插件组件： 
    *   [斜杠命令](https://code.claude.com/docs/zh-CN/slash-commands) - 命令开发详情
    *   [子代理](https://code.claude.com/docs/zh-CN/sub-agents) - 代理配置和功能
    *   [代理技能](https://code.claude.com/docs/zh-CN/skills) - 扩展 Claude 的功能
    *   [钩子](https://code.claude.com/docs/zh-CN/hooks) - 事件处理和自动化
    *   [MCP](https://code.claude.com/docs/zh-CN/mcp) - 外部工具集成

*   **分发策略**：有效地打包和共享您的插件
*   **社区贡献**：考虑为社区插件集合做出贡献

### [​](https://code.claude.com/docs/zh-CN/plugins#%E5%AF%B9%E4%BA%8E%E5%9B%A2%E9%98%9F%E4%B8%BB%E7%AE%A1%E5%92%8C%E7%AE%A1%E7%90%86%E5%91%98)

对于团队主管和管理员

*   **存储库配置**：为团队项目设置自动插件安装
*   **插件治理**：建立插件批准和安全审查的指南
*   **市场维护**：创建和维护组织特定的插件目录
*   **培训和文档**：帮助团队成员有效地采用插件工作流

[​](https://code.claude.com/docs/zh-CN/plugins#%E5%8F%A6%E8%AF%B7%E5%8F%82%E9%98%85)

另请参阅
------------------------------------------------------------------------------------------

*   [插件市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces) - 创建和管理插件目录
*   [斜杠命令](https://code.claude.com/docs/zh-CN/slash-commands) - 理解自定义命令
*   [子代理](https://code.claude.com/docs/zh-CN/sub-agents) - 创建和使用专门的代理
*   [代理技能](https://code.claude.com/docs/zh-CN/skills) - 扩展 Claude 的功能
*   [钩子](https://code.claude.com/docs/zh-CN/hooks) - 使用事件处理程序自动化工作流
*   [MCP](https://code.claude.com/docs/zh-CN/mcp) - 连接到外部工具和服务
*   [设置](https://code.claude.com/docs/zh-CN/settings) - 插件的配置选项

[子代理](https://code.claude.com/docs/zh-CN/sub-agents)[Agent Skills](https://code.claude.com/docs/zh-CN/skills)

Ctrl+I

[Claude Code Docs home page![Image 4: light logo](https://mintcdn.com/claude-code/o69F7a6qoW9vboof/logo/light.svg?fit=max&auto=format&n=o69F7a6qoW9vboof&q=85&s=536eade682636e84231afce2577f9509)![Image 5: dark logo](https://mintcdn.com/claude-code/o69F7a6qoW9vboof/logo/dark.svg?fit=max&auto=format&n=o69F7a6qoW9vboof&q=85&s=0766b3221061e80143e9f300733e640b)](https://code.claude.com/docs)

[x](https://x.com/AnthropicAI)[linkedin](https://www.linkedin.com/company/anthropicresearch)

Company

[Anthropic](https://www.anthropic.com/company)[Careers](https://www.anthropic.com/careers)[Economic Futures](https://www.anthropic.com/economic-futures)[Research](https://www.anthropic.com/research)[News](https://www.anthropic.com/news)[Trust center](https://trust.anthropic.com/)[Transparency](https://www.anthropic.com/transparency)

Help and security

[Availability](https://www.anthropic.com/supported-countries)[Status](https://status.anthropic.com/)[Support center](https://support.claude.com/)

Learn

[Courses](https://www.anthropic.com/learn)[MCP connectors](https://claude.com/partners/mcp)[Customer stories](https://www.claude.com/customers)[Engineering blog](https://www.anthropic.com/engineering)[Events](https://www.anthropic.com/events)[Powered by Claude](https://claude.com/partners/powered-by-claude)[Service partners](https://claude.com/partners/services)[Startups program](https://claude.com/programs/startups)

Terms and policies

[Privacy policy](https://www.anthropic.com/legal/privacy)[Disclosure policy](https://www.anthropic.com/responsible-disclosure-policy)[Usage policy](https://www.anthropic.com/legal/aup)[Commercial terms](https://www.anthropic.com/legal/commercial-terms)[Consumer terms](https://www.anthropic.com/legal/consumer-terms)

助手

AI生成的回答可能包含错误。
