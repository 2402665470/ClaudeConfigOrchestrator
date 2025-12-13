<!-- Source: https://code.claude.com/docs/zh-CN/memory -->

Title: 管理 Claude 的内存 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/memory

Markdown Content:
管理 Claude 的内存 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/memory#content-area)

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

配置

管理 Claude 的内存

[快速开始](https://code.claude.com/docs/zh-CN/overview)[使用 Claude Code 构建](https://code.claude.com/docs/zh-CN/sub-agents)[Claude Agent SDK](https://code.claude.com/docs/zh-CN/sdk/migration-guide)[部署](https://code.claude.com/docs/zh-CN/third-party-integrations)[管理](https://code.claude.com/docs/zh-CN/setup)[配置](https://code.claude.com/docs/zh-CN/settings)[参考](https://code.claude.com/docs/zh-CN/cli-reference)[资源](https://code.claude.com/docs/zh-CN/legal-and-compliance)

##### 配置

*   [设置](https://code.claude.com/docs/zh-CN/settings)
*   [Visual Studio Code](https://code.claude.com/docs/zh-CN/vs-code)
*   [JetBrains IDEs](https://code.claude.com/docs/zh-CN/jetbrains)
*   [终端配置](https://code.claude.com/docs/zh-CN/terminal-config)
*   [模型配置](https://code.claude.com/docs/zh-CN/model-config)
*   [内存管理](https://code.claude.com/docs/zh-CN/memory)
*   [状态行配置](https://code.claude.com/docs/zh-CN/statusline)

在此页面
*   [确定内存类型](https://code.claude.com/docs/zh-CN/memory#%E7%A1%AE%E5%AE%9A%E5%86%85%E5%AD%98%E7%B1%BB%E5%9E%8B)
*   [CLAUDE.md 导入](https://code.claude.com/docs/zh-CN/memory#claude-md-%E5%AF%BC%E5%85%A5)
*   [Claude 如何查找内存](https://code.claude.com/docs/zh-CN/memory#claude-%E5%A6%82%E4%BD%95%E6%9F%A5%E6%89%BE%E5%86%85%E5%AD%98)
*   [使用 # 快捷方式快速添加内存](https://code.claude.com/docs/zh-CN/memory#%E4%BD%BF%E7%94%A8-%23-%E5%BF%AB%E6%8D%B7%E6%96%B9%E5%BC%8F%E5%BF%AB%E9%80%9F%E6%B7%BB%E5%8A%A0%E5%86%85%E5%AD%98)
*   [使用 /memory 直接编辑内存](https://code.claude.com/docs/zh-CN/memory#%E4%BD%BF%E7%94%A8-%2Fmemory-%E7%9B%B4%E6%8E%A5%E7%BC%96%E8%BE%91%E5%86%85%E5%AD%98)
*   [设置项目内存](https://code.claude.com/docs/zh-CN/memory#%E8%AE%BE%E7%BD%AE%E9%A1%B9%E7%9B%AE%E5%86%85%E5%AD%98)
*   [组织级内存管理](https://code.claude.com/docs/zh-CN/memory#%E7%BB%84%E7%BB%87%E7%BA%A7%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86)
*   [内存最佳实践](https://code.claude.com/docs/zh-CN/memory#%E5%86%85%E5%AD%98%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)

配置

管理 Claude 的内存
=============

复制页面

了解如何跨会话管理 Claude Code 的内存，包括不同的内存位置和最佳实践。

复制页面

Claude Code 可以跨会话记住您的偏好设置，例如样式指南和工作流中的常见命令。
[​](https://code.claude.com/docs/zh-CN/memory#%E7%A1%AE%E5%AE%9A%E5%86%85%E5%AD%98%E7%B1%BB%E5%9E%8B)

确定内存类型
-------------------------------------------------------------------------------------------------------------

Claude Code 在分层结构中提供四个内存位置，每个位置都有不同的用途：

| 内存类型 | 位置 | 用途 | 用例示例 | 共享对象 |
| --- | --- | --- | --- | --- |
| **企业策略** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md` Linux: `/etc/claude-code/CLAUDE.md` Windows: `C:\ProgramData\ClaudeCode\CLAUDE.md` | 由 IT/DevOps 管理的组织范围内的说明 | 公司编码标准、安全策略、合规要求 | 组织中的所有用户 |
| **项目内存** | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 项目的团队共享说明 | 项目架构、编码标准、常见工作流 | 通过源代码控制的团队成员 |
| **用户内存** | `~/.claude/CLAUDE.md` | 所有项目的个人偏好设置 | 代码样式偏好、个人工具快捷方式 | 仅限您（所有项目） |
| **项目内存（本地）** | `./CLAUDE.local.md` | 个人项目特定偏好设置 | _（已弃用，见下文）_ 您的沙箱 URL、首选测试数据 | 仅限您（当前项目） |

启动 Claude Code 时，所有内存文件都会自动加载到其上下文中。层次结构中较高的文件优先级更高，会首先加载，为更具体的内存提供基础。
[​](https://code.claude.com/docs/zh-CN/memory#claude-md-%E5%AF%BC%E5%85%A5)

CLAUDE.md 导入
-----------------------------------------------------------------------------------------

CLAUDE.md 文件可以使用 `@path/to/import` 语法导入其他文件。以下示例导入 3 个文件：

复制

询问AI

```
See @README for project overview and @package.json for available npm commands for this project.

# Additional Instructions
- git workflow @docs/git-instructions.md
```

允许相对路径和绝对路径。特别是，导入用户主目录中的文件是一种方便的方式，让您的团队成员提供不签入存储库的个人说明。以前 CLAUDE.local.md 用于类似目的，但现在已弃用，改为使用导入，因为它们在多个 git worktrees 中效果更好。

复制

询问AI

```
# Individual Preferences
- @~/.claude/my-project-instructions.md
```

为了避免潜在的冲突，导入不会在 markdown 代码跨度和代码块内进行评估。

复制

询问AI

```
This code span will not be treated as an import: `@anthropic-ai/claude-code`
```

导入的文件可以递归导入其他文件，最大深度为 5 跳。您可以通过运行 `/memory` 命令查看加载了哪些内存文件。
[​](https://code.claude.com/docs/zh-CN/memory#claude-%E5%A6%82%E4%BD%95%E6%9F%A5%E6%89%BE%E5%86%85%E5%AD%98)

Claude 如何查找内存
---------------------------------------------------------------------------------------------------------------------------

Claude Code 递归读取内存：从 cwd 开始，Claude Code 向上递归到（但不包括）根目录 _/_ 并读取它找到的任何 CLAUDE.md 或 CLAUDE.local.md 文件。这在处理大型存储库时特别方便，当您在 _foo/bar/_ 中运行 Claude Code，并在 _foo/CLAUDE.md_ 和 _foo/bar/CLAUDE.md_ 中都有内存时。Claude 还会发现当前工作目录下子树中嵌套的 CLAUDE.md。它们不是在启动时加载，而是仅在 Claude 读取这些子树中的文件时才包含。
[​](https://code.claude.com/docs/zh-CN/memory#%E4%BD%BF%E7%94%A8-#-%E5%BF%AB%E6%8D%B7%E6%96%B9%E5%BC%8F%E5%BF%AB%E9%80%9F%E6%B7%BB%E5%8A%A0%E5%86%85%E5%AD%98)

使用 `#` 快捷方式快速添加内存
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

添加内存的最快方法是以 `#` 字符开始您的输入：

复制

询问AI

```
# Always use descriptive variable names
```

系统会提示您选择要将其存储在哪个内存文件中。
[​](https://code.claude.com/docs/zh-CN/memory#%E4%BD%BF%E7%94%A8-/memory-%E7%9B%B4%E6%8E%A5%E7%BC%96%E8%BE%91%E5%86%85%E5%AD%98)

使用 `/memory` 直接编辑内存
-----------------------------------------------------------------------------------------------------------------------------------------------------

在会话期间使用 `/memory` 斜杠命令在系统编辑器中打开任何内存文件，以进行更广泛的添加或组织。
[​](https://code.claude.com/docs/zh-CN/memory#%E8%AE%BE%E7%BD%AE%E9%A1%B9%E7%9B%AE%E5%86%85%E5%AD%98)

设置项目内存
-------------------------------------------------------------------------------------------------------------

假设您想设置一个 CLAUDE.md 文件来存储重要的项目信息、约定和常用命令。项目内存可以存储在 `./CLAUDE.md` 或 `./.claude/CLAUDE.md` 中。使用以下命令为您的代码库引导 CLAUDE.md：

复制

询问AI

```
> /init
```

提示：
*   包含常用命令（构建、测试、lint）以避免重复搜索
*   记录代码样式偏好和命名约定
*   添加特定于您项目的重要架构模式
*   CLAUDE.md 内存可用于与您的团队共享的说明和您的个人偏好。

[​](https://code.claude.com/docs/zh-CN/memory#%E7%BB%84%E7%BB%87%E7%BA%A7%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86)

组织级内存管理
-----------------------------------------------------------------------------------------------------------------------

企业组织可以部署集中管理的 CLAUDE.md 文件，适用于所有用户。要设置组织级内存管理：
1.   在适合您的操作系统的位置创建企业内存文件：

*   macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
*   Linux/WSL: `/etc/claude-code/CLAUDE.md`
*   Windows: `C:\ProgramData\ClaudeCode\CLAUDE.md`

1.   通过您的配置管理系统（MDM、Group Policy、Ansible 等）部署，以确保在所有开发人员计算机上一致分发。

[​](https://code.claude.com/docs/zh-CN/memory#%E5%86%85%E5%AD%98%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)

内存最佳实践
-------------------------------------------------------------------------------------------------------------

*   **具体明确**：“使用 2 空格缩进”比”正确格式化代码”更好。
*   **使用结构来组织**：将每个单独的内存格式化为项目符号，并在描述性 markdown 标题下对相关内存进行分组。
*   **定期审查**：随着项目的发展更新内存，以确保 Claude 始终使用最新的信息和上下文。

[模型配置](https://code.claude.com/docs/zh-CN/model-config)[状态行配置](https://code.claude.com/docs/zh-CN/statusline)

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
