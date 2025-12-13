<!-- Source: https://code.claude.com/docs/zh-CN/output-styles -->

Title: 输出样式 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/output-styles

Markdown Content:
输出样式 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/output-styles#content-area)

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

输出样式

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
*   [内置输出样式](https://code.claude.com/docs/zh-CN/output-styles#%E5%86%85%E7%BD%AE%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F)
*   [输出样式如何工作](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F%E5%A6%82%E4%BD%95%E5%B7%A5%E4%BD%9C)
*   [更改输出样式](https://code.claude.com/docs/zh-CN/output-styles#%E6%9B%B4%E6%94%B9%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F)
*   [创建自定义输出样式](https://code.claude.com/docs/zh-CN/output-styles#%E5%88%9B%E5%BB%BA%E8%87%AA%E5%AE%9A%E4%B9%89%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F)
*   [与相关功能的比较](https://code.claude.com/docs/zh-CN/output-styles#%E4%B8%8E%E7%9B%B8%E5%85%B3%E5%8A%9F%E8%83%BD%E7%9A%84%E6%AF%94%E8%BE%83)
*   [输出样式 vs. CLAUDE.md vs. —append-system-prompt](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F-vs-claude-md-vs-%E2%80%94append-system-prompt)
*   [输出样式 vs. 代理](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F-vs-%E4%BB%A3%E7%90%86)
*   [输出样式 vs. 自定义斜杠命令](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F-vs-%E8%87%AA%E5%AE%9A%E4%B9%89%E6%96%9C%E6%9D%A0%E5%91%BD%E4%BB%A4)

使用 Claude Code 构建

输出样式
====

复制页面

将 Claude Code 适配用于软件工程之外的用途

复制页面

输出样式允许你将 Claude Code 用作任何类型的代理，同时保留其核心功能，例如运行本地脚本、读取/写入文件和跟踪待办事项。
[​](https://code.claude.com/docs/zh-CN/output-styles#%E5%86%85%E7%BD%AE%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F)

内置输出样式
--------------------------------------------------------------------------------------------------------------------

Claude Code 的**默认**输出样式是现有的系统提示，旨在帮助你高效完成软件工程任务。还有两种额外的内置输出样式，专注于教你了解代码库和 Claude 的运作方式：
*   **解释性**：在帮助你完成软件工程任务的同时提供教育性的”见解”。帮助你理解实现选择和代码库模式。
*   **学习**：协作式的边做边学模式，Claude 不仅会在编码时分享”见解”，还会要求你自己贡献小的、战略性的代码片段。Claude Code 将在你的代码中添加 `TODO(human)` 标记供你实现。

[​](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F%E5%A6%82%E4%BD%95%E5%B7%A5%E4%BD%9C)

输出样式如何工作
----------------------------------------------------------------------------------------------------------------------------------------

输出样式直接修改 Claude Code 的系统提示。
*   非默认输出样式排除了特定于代码生成和通常内置于 Claude Code 中的高效输出的指令（例如简洁回复和用测试验证代码）。
*   相反，这些输出样式在系统提示中添加了自己的自定义指令。

[​](https://code.claude.com/docs/zh-CN/output-styles#%E6%9B%B4%E6%94%B9%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F)

更改输出样式
--------------------------------------------------------------------------------------------------------------------

你可以：
*   运行 `/output-style` 访问菜单并选择你的输出样式（也可以从 `/config` 菜单访问）
*   运行 `/output-style [style]`，例如 `/output-style explanatory`，直接切换到某个样式

这些更改应用于[本地项目级别](https://code.claude.com/docs/zh-CN/settings) 并保存在 `.claude/settings.local.json` 中。
[​](https://code.claude.com/docs/zh-CN/output-styles#%E5%88%9B%E5%BB%BA%E8%87%AA%E5%AE%9A%E4%B9%89%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F)

创建自定义输出样式
--------------------------------------------------------------------------------------------------------------------------------------------------

要在 Claude 的帮助下设置新的输出样式，运行 `/output-style:new I want an output style that ...`默认情况下，通过 `/output-style:new` 创建的输出样式保存为用户级别 `~/.claude/output-styles` 中的 markdown 文件，可以在项目间使用。它们具有以下结构：

复制

询问AI

```
---
name: My Custom Style
description:
  A brief description of what this style does, to be displayed to the user
---

# Custom Style Instructions

You are an interactive CLI tool that helps users with software engineering
tasks. [Your custom instructions here...]

## Specific Behaviors

[Define how the assistant should behave in this style...]
```

你也可以创建自己的输出样式 Markdown 文件，并将其保存在用户级别 (`~/.claude/output-styles`) 或项目级别 (`.claude/output-styles`)。
[​](https://code.claude.com/docs/zh-CN/output-styles#%E4%B8%8E%E7%9B%B8%E5%85%B3%E5%8A%9F%E8%83%BD%E7%9A%84%E6%AF%94%E8%BE%83)

与相关功能的比较
----------------------------------------------------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F-vs-claude-md-vs-%E2%80%94append-system-prompt)

输出样式 vs. CLAUDE.md vs. —append-system-prompt

输出样式完全”关闭”Claude Code 默认系统提示中特定于软件工程的部分。CLAUDE.md 和 `--append-system-prompt` 都不编辑 Claude Code 的默认系统提示。CLAUDE.md 将内容作为用户消息添加到 Claude Code 默认系统提示_之后_。`--append-system-prompt` 将内容附加到系统提示。
### [​](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F-vs-%E4%BB%A3%E7%90%86)

输出样式 vs. [代理](https://code.claude.com/docs/zh-CN/sub-agents)

输出样式直接影响主代理循环，仅影响系统提示。代理被调用来处理特定任务，可以包括额外的设置，如要使用的模型、可用的工具以及关于何时使用代理的一些上下文。
### [​](https://code.claude.com/docs/zh-CN/output-styles#%E8%BE%93%E5%87%BA%E6%A0%B7%E5%BC%8F-vs-%E8%87%AA%E5%AE%9A%E4%B9%89%E6%96%9C%E6%9D%A0%E5%91%BD%E4%BB%A4)

输出样式 vs. [自定义斜杠命令](https://code.claude.com/docs/zh-CN/slash-commands)

你可以将输出样式视为”存储的系统提示”，将自定义斜杠命令视为”存储的提示”。

[Agent Skills](https://code.claude.com/docs/zh-CN/skills)[Claude Code 钩子入门](https://code.claude.com/docs/zh-CN/hooks-guide)

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
