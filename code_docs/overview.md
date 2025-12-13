<!-- Source: https://code.claude.com/docs/zh-CN/overview -->

Title: Claude Code 概述 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/overview

Markdown Content:
Claude Code 概述 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/overview#content-area)

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

快速开始

Claude Code 概述

[快速开始](https://code.claude.com/docs/zh-CN/overview)[使用 Claude Code 构建](https://code.claude.com/docs/zh-CN/sub-agents)[Claude Agent SDK](https://code.claude.com/docs/zh-CN/sdk/migration-guide)[部署](https://code.claude.com/docs/zh-CN/third-party-integrations)[管理](https://code.claude.com/docs/zh-CN/setup)[配置](https://code.claude.com/docs/zh-CN/settings)[参考](https://code.claude.com/docs/zh-CN/cli-reference)[资源](https://code.claude.com/docs/zh-CN/legal-and-compliance)

##### 快速开始

*   [概述](https://code.claude.com/docs/zh-CN/overview)
*   [快速开始](https://code.claude.com/docs/zh-CN/quickstart)
*   [常见工作流程](https://code.claude.com/docs/zh-CN/common-workflows)
*   [Claude Code on the web](https://code.claude.com/docs/zh-CN/claude-code-on-the-web)

在此页面
*   [30 秒快速开始](https://code.claude.com/docs/zh-CN/overview#30-%E7%A7%92%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
*   [Claude Code 为您做什么](https://code.claude.com/docs/zh-CN/overview#claude-code-%E4%B8%BA%E6%82%A8%E5%81%9A%E4%BB%80%E4%B9%88)
*   [为什么开发者喜欢 Claude Code](https://code.claude.com/docs/zh-CN/overview#%E4%B8%BA%E4%BB%80%E4%B9%88%E5%BC%80%E5%8F%91%E8%80%85%E5%96%9C%E6%AC%A2-claude-code)
*   [后续步骤](https://code.claude.com/docs/zh-CN/overview#%E5%90%8E%E7%BB%AD%E6%AD%A5%E9%AA%A4)
*   [其他资源](https://code.claude.com/docs/zh-CN/overview#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)

快速开始

Claude Code 概述
==============

复制页面

了解 Claude Code，Anthropic 的代理编码工具，它位于您的终端中，帮助您比以往任何时候都更快地将想法转化为代码。

复制页面

[​](https://code.claude.com/docs/zh-CN/overview#30-%E7%A7%92%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)

30 秒快速开始
-----------------------------------------------------------------------------------------------------------

前置条件：
*   一个 [Claude.ai](https://claude.ai/)（推荐）或 [Claude 控制台](https://console.anthropic.com/) 账户

**安装 Claude Code：**

*    macOS/Linux 
*    Homebrew 
*    Windows 
*    NPM 

复制

询问AI

```
curl -fsSL https://claude.ai/install.sh | bash
```

**开始使用 Claude Code：**

复制

询问AI

```
cd your-project
claude
```

首次使用时，系统会提示您登录。就这样！[继续快速入门（5 分钟）→](https://code.claude.com/docs/zh-CN/quickstart)

查看[高级设置](https://code.claude.com/docs/zh-CN/setup)了解安装选项，或者如果遇到问题，请查看[故障排除](https://code.claude.com/docs/zh-CN/troubleshooting)。

**新的 VS Code 扩展（测试版）**：更喜欢图形界面？我们新的 [VS Code 扩展](https://code.claude.com/docs/zh-CN/vs-code)提供了一个易于使用的原生 IDE 体验，无需熟悉终端。只需从市场安装，然后直接在您的侧边栏中使用 Claude 开始编码。

[​](https://code.claude.com/docs/zh-CN/overview#claude-code-%E4%B8%BA%E6%82%A8%E5%81%9A%E4%BB%80%E4%B9%88)

Claude Code 为您做什么
-----------------------------------------------------------------------------------------------------------------------------

*   **从描述构建功能**：用纯英文告诉 Claude 您想构建什么。它将制定计划、编写代码并确保其正常工作。
*   **调试和修复问题**：描述一个错误或粘贴一条错误消息。Claude Code 将分析您的代码库、识别问题并实施修复。
*   **导航任何代码库**：询问关于您团队代码库的任何内容，并获得深思熟虑的答案。Claude Code 维护对整个项目结构的认识，可以从网络上查找最新信息，并且通过 [MCP](https://code.claude.com/docs/zh-CN/mcp) 可以从 Google Drive、Figma 和 Slack 等外部数据源提取数据。
*   **自动化繁琐的任务**：修复棘手的 lint 问题、解决合并冲突并编写发布说明。从您的开发机器上用一个命令完成所有这些，或在 CI 中自动完成。

[​](https://code.claude.com/docs/zh-CN/overview#%E4%B8%BA%E4%BB%80%E4%B9%88%E5%BC%80%E5%8F%91%E8%80%85%E5%96%9C%E6%AC%A2-claude-code)

为什么开发者喜欢 Claude Code
-----------------------------------------------------------------------------------------------------------------------------------------------------------

*   **在您的终端中工作**：不是另一个聊天窗口。不是另一个 IDE。Claude Code 在您已经工作的地方与您相遇，使用您已经喜欢的工具。
*   **采取行动**：Claude Code 可以直接编辑文件、运行命令和创建提交。需要更多？[MCP](https://code.claude.com/docs/zh-CN/mcp) 让 Claude 读取您在 Google Drive 中的设计文档、更新您在 Jira 中的工单，或使用_您的_自定义开发者工具。
*   **Unix 哲学**：Claude Code 是可组合和可脚本化的。`tail -f app.log | claude -p "Slack me if you see any anomalies appear in this log stream"`_有效_。您的 CI 可以运行 `claude -p "If there are new text strings, translate them into French and raise a PR for @lang-fr-team to review"`。
*   **企业就绪**：使用 Claude API，或在 AWS 或 GCP 上托管。企业级[安全](https://code.claude.com/docs/zh-CN/security)、[隐私](https://code.claude.com/docs/zh-CN/data-usage)和[合规性](https://trust.anthropic.com/)是内置的。

[​](https://code.claude.com/docs/zh-CN/overview#%E5%90%8E%E7%BB%AD%E6%AD%A5%E9%AA%A4)

后续步骤
-------------------------------------------------------------------------------------------

[快速入门 ---- 通过实际示例查看 Claude Code 的实际应用](https://code.claude.com/docs/zh-CN/quickstart)[常见工作流 ----- 常见工作流的分步指南](https://code.claude.com/docs/zh-CN/common-workflows)[故障排除 ---- Claude Code 常见问题的解决方案](https://code.claude.com/docs/zh-CN/troubleshooting)[IDE 设置 ------ 将 Claude Code 添加到您的 IDE](https://code.claude.com/docs/zh-CN/vs-code)

[​](https://code.claude.com/docs/zh-CN/overview#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)

其他资源
-------------------------------------------------------------------------------------------

[使用 Agent SDK 构建 --------------- 使用 Claude Agent SDK 创建自定义 AI 代理](https://docs.claude.com/en/docs/agent-sdk/overview)[在 AWS 或 GCP 上托管 --------------- 使用 Amazon Bedrock 或 Google Vertex AI 配置 Claude Code](https://code.claude.com/docs/zh-CN/third-party-integrations)[设置 -- 为您的工作流自定义 Claude Code](https://code.claude.com/docs/zh-CN/settings)[命令 -- 了解 CLI 命令和控制](https://code.claude.com/docs/zh-CN/cli-reference)[参考实现 ---- 克隆我们的开发容器参考实现](https://github.com/anthropics/claude-code/tree/main/.devcontainer)[安全 -- 发现 Claude Code 的保障措施和安全使用的最佳实践](https://code.claude.com/docs/zh-CN/security)[隐私和数据使用 ------- 了解 Claude Code 如何处理您的数据](https://code.claude.com/docs/zh-CN/data-usage)

[快速开始](https://code.claude.com/docs/zh-CN/quickstart)

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
