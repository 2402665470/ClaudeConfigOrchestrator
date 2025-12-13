<!-- Source: https://code.claude.com/docs/zh-CN/checkpointing -->

Title: 检查点 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/checkpointing

Markdown Content:
检查点 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/checkpointing#content-area)

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

参考

检查点

[快速开始](https://code.claude.com/docs/zh-CN/overview)[使用 Claude Code 构建](https://code.claude.com/docs/zh-CN/sub-agents)[Claude Agent SDK](https://code.claude.com/docs/zh-CN/sdk/migration-guide)[部署](https://code.claude.com/docs/zh-CN/third-party-integrations)[管理](https://code.claude.com/docs/zh-CN/setup)[配置](https://code.claude.com/docs/zh-CN/settings)[参考](https://code.claude.com/docs/zh-CN/cli-reference)[资源](https://code.claude.com/docs/zh-CN/legal-and-compliance)

##### 参考

*   [CLI 参考](https://code.claude.com/docs/zh-CN/cli-reference)
*   [交互模式](https://code.claude.com/docs/zh-CN/interactive-mode)
*   [斜杠命令](https://code.claude.com/docs/zh-CN/slash-commands)
*   [检查点](https://code.claude.com/docs/zh-CN/checkpointing)
*   [Hooks 参考](https://code.claude.com/docs/zh-CN/hooks)
*   [插件参考](https://code.claude.com/docs/zh-CN/plugins-reference)

在此页面
*   [检查点如何工作](https://code.claude.com/docs/zh-CN/checkpointing#%E6%A3%80%E6%9F%A5%E7%82%B9%E5%A6%82%E4%BD%95%E5%B7%A5%E4%BD%9C)
*   [自动跟踪](https://code.claude.com/docs/zh-CN/checkpointing#%E8%87%AA%E5%8A%A8%E8%B7%9F%E8%B8%AA)
*   [回退更改](https://code.claude.com/docs/zh-CN/checkpointing#%E5%9B%9E%E9%80%80%E6%9B%B4%E6%94%B9)
*   [常见用例](https://code.claude.com/docs/zh-CN/checkpointing#%E5%B8%B8%E8%A7%81%E7%94%A8%E4%BE%8B)
*   [限制](https://code.claude.com/docs/zh-CN/checkpointing#%E9%99%90%E5%88%B6)
*   [Bash 命令更改未被跟踪](https://code.claude.com/docs/zh-CN/checkpointing#bash-%E5%91%BD%E4%BB%A4%E6%9B%B4%E6%94%B9%E6%9C%AA%E8%A2%AB%E8%B7%9F%E8%B8%AA)
*   [外部更改未被跟踪](https://code.claude.com/docs/zh-CN/checkpointing#%E5%A4%96%E9%83%A8%E6%9B%B4%E6%94%B9%E6%9C%AA%E8%A2%AB%E8%B7%9F%E8%B8%AA)
*   [不是版本控制的替代品](https://code.claude.com/docs/zh-CN/checkpointing#%E4%B8%8D%E6%98%AF%E7%89%88%E6%9C%AC%E6%8E%A7%E5%88%B6%E7%9A%84%E6%9B%BF%E4%BB%A3%E5%93%81)
*   [另请参阅](https://code.claude.com/docs/zh-CN/checkpointing#%E5%8F%A6%E8%AF%B7%E5%8F%82%E9%98%85)

参考

检查点
===

复制页面

自动跟踪和回退 Claude 的编辑，快速恢复不需要的更改。

复制页面

Claude Code 会在您工作时自动跟踪 Claude 的文件编辑，允许您快速撤销更改并回退到之前的状态，以防任何事情出现偏差。
[​](https://code.claude.com/docs/zh-CN/checkpointing#%E6%A3%80%E6%9F%A5%E7%82%B9%E5%A6%82%E4%BD%95%E5%B7%A5%E4%BD%9C)

检查点如何工作
------------------------------------------------------------------------------------------------------------------------------

当您与 Claude 一起工作时，检查点会自动捕获每次编辑前的代码状态。这个安全网让您可以放心地执行雄心勃勃的大规模任务，因为您始终可以返回到之前的代码状态。
### [​](https://code.claude.com/docs/zh-CN/checkpointing#%E8%87%AA%E5%8A%A8%E8%B7%9F%E8%B8%AA)

自动跟踪

Claude Code 跟踪其文件编辑工具所做的所有更改：
*   每个用户提示都会创建一个新的检查点
*   检查点在会话之间持久存在，因此您可以在恢复的对话中访问它们
*   在 30 天后自动清理（可配置）

### [​](https://code.claude.com/docs/zh-CN/checkpointing#%E5%9B%9E%E9%80%80%E6%9B%B4%E6%94%B9)

回退更改

按两次 `Esc`（`Esc` + `Esc`）或使用 `/rewind` 命令打开回退菜单。您可以选择恢复：
*   **仅对话**：回退到用户消息，同时保留代码更改
*   **仅代码**：恢复文件更改，同时保留对话
*   **代码和对话**：将两者都恢复到会话中的先前点

[​](https://code.claude.com/docs/zh-CN/checkpointing#%E5%B8%B8%E8%A7%81%E7%94%A8%E4%BE%8B)

常见用例
------------------------------------------------------------------------------------------------

检查点在以下情况下特别有用：
*   **探索替代方案**：尝试不同的实现方法，而不会丢失起点
*   **从错误中恢复**：快速撤销引入错误或破坏功能的更改
*   **迭代功能**：进行变体实验，同时知道您可以恢复到工作状态

[​](https://code.claude.com/docs/zh-CN/checkpointing#%E9%99%90%E5%88%B6)

限制
----------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/checkpointing#bash-%E5%91%BD%E4%BB%A4%E6%9B%B4%E6%94%B9%E6%9C%AA%E8%A2%AB%E8%B7%9F%E8%B8%AA)

Bash 命令更改未被跟踪

检查点不跟踪由 bash 命令修改的文件。例如，如果 Claude Code 运行：

复制

询问AI

```
rm file.txt
mv old.txt new.txt
cp source.txt dest.txt
```

这些文件修改无法通过回退撤销。只有通过 Claude 的文件编辑工具进行的直接文件编辑才会被跟踪。
### [​](https://code.claude.com/docs/zh-CN/checkpointing#%E5%A4%96%E9%83%A8%E6%9B%B4%E6%94%B9%E6%9C%AA%E8%A2%AB%E8%B7%9F%E8%B8%AA)

外部更改未被跟踪

检查点仅跟踪在当前会话中已编辑的文件。您在 Claude Code 外部对文件所做的手动更改以及来自其他并发会话的编辑通常不会被捕获，除非它们恰好修改了与当前会话相同的文件。
### [​](https://code.claude.com/docs/zh-CN/checkpointing#%E4%B8%8D%E6%98%AF%E7%89%88%E6%9C%AC%E6%8E%A7%E5%88%B6%E7%9A%84%E6%9B%BF%E4%BB%A3%E5%93%81)

不是版本控制的替代品

检查点设计用于快速的会话级恢复。对于永久版本历史和协作：
*   继续使用版本控制（例如 Git）进行提交、分支和长期历史
*   检查点补充但不替代适当的版本控制
*   将检查点视为”本地撤销”，将 Git 视为”永久历史”

[​](https://code.claude.com/docs/zh-CN/checkpointing#%E5%8F%A6%E8%AF%B7%E5%8F%82%E9%98%85)

另请参阅
------------------------------------------------------------------------------------------------

*   [交互模式](https://code.claude.com/docs/zh-CN/interactive-mode) - 键盘快捷键和会话控制
*   [斜杠命令](https://code.claude.com/docs/zh-CN/slash-commands) - 使用 `/rewind` 访问检查点
*   [CLI 参考](https://code.claude.com/docs/zh-CN/cli-reference) - 命令行选项

[斜杠命令](https://code.claude.com/docs/zh-CN/slash-commands)[Hooks 参考](https://code.claude.com/docs/zh-CN/hooks)

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
