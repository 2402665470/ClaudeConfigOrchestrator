<!-- Source: https://code.claude.com/docs/zh-CN/terminal-config -->

Title: 优化您的终端设置 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/terminal-config

Markdown Content:
优化您的终端设置 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/terminal-config#content-area)

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

优化您的终端设置

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
*   [主题和外观](https://code.claude.com/docs/zh-CN/terminal-config#%E4%B8%BB%E9%A2%98%E5%92%8C%E5%A4%96%E8%A7%82)
*   [换行符](https://code.claude.com/docs/zh-CN/terminal-config#%E6%8D%A2%E8%A1%8C%E7%AC%A6)
*   [设置 Shift+Enter（VS Code 或 iTerm2）：](https://code.claude.com/docs/zh-CN/terminal-config#%E8%AE%BE%E7%BD%AE-shift%2Benter%EF%BC%88vs-code-%E6%88%96-iterm2%EF%BC%89%EF%BC%9A)
*   [设置 Option+Enter（VS Code、iTerm2 或 macOS Terminal.app）：](https://code.claude.com/docs/zh-CN/terminal-config#%E8%AE%BE%E7%BD%AE-option%2Benter%EF%BC%88vs-code%E3%80%81iterm2-%E6%88%96-macos-terminal-app%EF%BC%89%EF%BC%9A)
*   [通知设置](https://code.claude.com/docs/zh-CN/terminal-config#%E9%80%9A%E7%9F%A5%E8%AE%BE%E7%BD%AE)
*   [iTerm 2 系统通知](https://code.claude.com/docs/zh-CN/terminal-config#iterm-2-%E7%B3%BB%E7%BB%9F%E9%80%9A%E7%9F%A5)
*   [自定义通知钩子](https://code.claude.com/docs/zh-CN/terminal-config#%E8%87%AA%E5%AE%9A%E4%B9%89%E9%80%9A%E7%9F%A5%E9%92%A9%E5%AD%90)
*   [处理大型输入](https://code.claude.com/docs/zh-CN/terminal-config#%E5%A4%84%E7%90%86%E5%A4%A7%E5%9E%8B%E8%BE%93%E5%85%A5)
*   [Vim 模式](https://code.claude.com/docs/zh-CN/terminal-config#vim-%E6%A8%A1%E5%BC%8F)

配置

优化您的终端设置
========

复制页面

Claude Code 在终端配置正确时效果最佳。请遵循这些指南来优化您的体验。

复制页面

### [​](https://code.claude.com/docs/zh-CN/terminal-config#%E4%B8%BB%E9%A2%98%E5%92%8C%E5%A4%96%E8%A7%82)

主题和外观

Claude 无法控制您终端的主题。这由您的终端应用程序处理。您可以随时通过 `/config` 命令将 Claude Code 的主题与您的终端相匹配。为了进一步自定义 Claude Code 界面本身，您可以配置一个[自定义状态行](https://code.claude.com/docs/zh-CN/statusline)来显示上下文信息，例如当前模型、工作目录或 git 分支在您的终端底部。
### [​](https://code.claude.com/docs/zh-CN/terminal-config#%E6%8D%A2%E8%A1%8C%E7%AC%A6)

换行符

您有几个选项可以在 Claude Code 中输入换行符：
*   **快速转义**：输入 `\` 后跟 Enter 来创建新行
*   **键盘快捷键**：设置键绑定来插入新行

#### [​](https://code.claude.com/docs/zh-CN/terminal-config#%E8%AE%BE%E7%BD%AE-shift+enter%EF%BC%88vs-code-%E6%88%96-iterm2%EF%BC%89%EF%BC%9A)

设置 Shift+Enter（VS Code 或 iTerm2）：

在 Claude Code 中运行 `/terminal-setup` 来自动配置 Shift+Enter。
#### [​](https://code.claude.com/docs/zh-CN/terminal-config#%E8%AE%BE%E7%BD%AE-option+enter%EF%BC%88vs-code%E3%80%81iterm2-%E6%88%96-macos-terminal-app%EF%BC%89%EF%BC%9A)

设置 Option+Enter（VS Code、iTerm2 或 macOS Terminal.app）：

**对于 Mac Terminal.app：**
1.   打开设置 → 配置文件 → 键盘
2.   勾选”使用 Option 作为 Meta 键”

**对于 iTerm2 和 VS Code 终端：**
1.   打开设置 → 配置文件 → 键
2.   在常规下，将左/右 Option 键设置为”Esc+“

### [​](https://code.claude.com/docs/zh-CN/terminal-config#%E9%80%9A%E7%9F%A5%E8%AE%BE%E7%BD%AE)

通知设置

通过正确的通知配置，永远不会错过 Claude 完成任务的时刻：
#### [​](https://code.claude.com/docs/zh-CN/terminal-config#iterm-2-%E7%B3%BB%E7%BB%9F%E9%80%9A%E7%9F%A5)

iTerm 2 系统通知

对于任务完成时的 iTerm 2 警报：
1.   打开 iTerm 2 偏好设置
2.   导航到配置文件 → 终端
3.   启用”静音铃声”和过滤警报 → “发送转义序列生成的警报”
4.   设置您首选的通知延迟

请注意，这些通知特定于 iTerm 2，在默认的 macOS 终端中不可用。
#### [​](https://code.claude.com/docs/zh-CN/terminal-config#%E8%87%AA%E5%AE%9A%E4%B9%89%E9%80%9A%E7%9F%A5%E9%92%A9%E5%AD%90)

自定义通知钩子

对于高级通知处理，您可以创建[通知钩子](https://code.claude.com/docs/zh-CN/hooks#notification)来运行您自己的逻辑。
### [​](https://code.claude.com/docs/zh-CN/terminal-config#%E5%A4%84%E7%90%86%E5%A4%A7%E5%9E%8B%E8%BE%93%E5%85%A5)

处理大型输入

处理大量代码或长指令时：
*   **避免直接粘贴**：Claude Code 可能在处理非常长的粘贴内容时遇到困难
*   **使用基于文件的工作流**：将内容写入文件并要求 Claude 读取它
*   **注意 VS Code 的限制**：VS Code 终端特别容易截断长粘贴

### [​](https://code.claude.com/docs/zh-CN/terminal-config#vim-%E6%A8%A1%E5%BC%8F)

Vim 模式

Claude Code 支持可以通过 `/vim` 启用或通过 `/config` 配置的 Vim 键绑定子集。支持的子集包括：
*   模式切换：`Esc`（到 NORMAL）、`i`/`I`、`a`/`A`、`o`/`O`（到 INSERT）
*   导航：`h`/`j`/`k`/`l`、`w`/`e`/`b`、`0`/`$`/`^`、`gg`/`G`
*   编辑：`x`、`dw`/`de`/`db`/`dd`/`D`、`cw`/`ce`/`cb`/`cc`/`C`、`.`（重复）

[JetBrains IDEs](https://code.claude.com/docs/zh-CN/jetbrains)[模型配置](https://code.claude.com/docs/zh-CN/model-config)

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
