<!-- Source: https://code.claude.com/docs/zh-CN/sandboxing -->

Title: 沙箱隔离 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/sandboxing

Markdown Content:
沙箱隔离 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/sandboxing#content-area)

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

部署

沙箱隔离

[快速开始](https://code.claude.com/docs/zh-CN/overview)[使用 Claude Code 构建](https://code.claude.com/docs/zh-CN/sub-agents)[Claude Agent SDK](https://code.claude.com/docs/zh-CN/sdk/migration-guide)[部署](https://code.claude.com/docs/zh-CN/third-party-integrations)[管理](https://code.claude.com/docs/zh-CN/setup)[配置](https://code.claude.com/docs/zh-CN/settings)[参考](https://code.claude.com/docs/zh-CN/cli-reference)[资源](https://code.claude.com/docs/zh-CN/legal-and-compliance)

##### 部署

*   [概览](https://code.claude.com/docs/zh-CN/third-party-integrations)
*   [Amazon Bedrock](https://code.claude.com/docs/zh-CN/amazon-bedrock)
*   [Google Vertex AI](https://code.claude.com/docs/zh-CN/google-vertex-ai)
*   [网络配置](https://code.claude.com/docs/zh-CN/network-config)
*   [LLM gateway](https://code.claude.com/docs/zh-CN/llm-gateway)
*   [开发容器](https://code.claude.com/docs/zh-CN/devcontainer)
*   [沙箱隔离](https://code.claude.com/docs/zh-CN/sandboxing)

在此页面
*   [概述](https://code.claude.com/docs/zh-CN/sandboxing#%E6%A6%82%E8%BF%B0)
*   [为什么沙箱隔离很重要](https://code.claude.com/docs/zh-CN/sandboxing#%E4%B8%BA%E4%BB%80%E4%B9%88%E6%B2%99%E7%AE%B1%E9%9A%94%E7%A6%BB%E5%BE%88%E9%87%8D%E8%A6%81)
*   [工作原理](https://code.claude.com/docs/zh-CN/sandboxing#%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86)
*   [文件系统隔离](https://code.claude.com/docs/zh-CN/sandboxing#%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F%E9%9A%94%E7%A6%BB)
*   [网络隔离](https://code.claude.com/docs/zh-CN/sandboxing#%E7%BD%91%E7%BB%9C%E9%9A%94%E7%A6%BB)
*   [操作系统级强制执行](https://code.claude.com/docs/zh-CN/sandboxing#%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F%E7%BA%A7%E5%BC%BA%E5%88%B6%E6%89%A7%E8%A1%8C)
*   [入门指南](https://code.claude.com/docs/zh-CN/sandboxing#%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97)
*   [启用沙箱隔离](https://code.claude.com/docs/zh-CN/sandboxing#%E5%90%AF%E7%94%A8%E6%B2%99%E7%AE%B1%E9%9A%94%E7%A6%BB)
*   [配置沙箱隔离](https://code.claude.com/docs/zh-CN/sandboxing#%E9%85%8D%E7%BD%AE%E6%B2%99%E7%AE%B1%E9%9A%94%E7%A6%BB)
*   [安全优势](https://code.claude.com/docs/zh-CN/sandboxing#%E5%AE%89%E5%85%A8%E4%BC%98%E5%8A%BF)
*   [防止提示注入](https://code.claude.com/docs/zh-CN/sandboxing#%E9%98%B2%E6%AD%A2%E6%8F%90%E7%A4%BA%E6%B3%A8%E5%85%A5)
*   [减少攻击面](https://code.claude.com/docs/zh-CN/sandboxing#%E5%87%8F%E5%B0%91%E6%94%BB%E5%87%BB%E9%9D%A2)
*   [透明操作](https://code.claude.com/docs/zh-CN/sandboxing#%E9%80%8F%E6%98%8E%E6%93%8D%E4%BD%9C)
*   [安全限制](https://code.claude.com/docs/zh-CN/sandboxing#%E5%AE%89%E5%85%A8%E9%99%90%E5%88%B6)
*   [高级用法](https://code.claude.com/docs/zh-CN/sandboxing#%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95)
*   [自定义代理配置](https://code.claude.com/docs/zh-CN/sandboxing#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%BB%A3%E7%90%86%E9%85%8D%E7%BD%AE)
*   [与现有安全工具的集成](https://code.claude.com/docs/zh-CN/sandboxing#%E4%B8%8E%E7%8E%B0%E6%9C%89%E5%AE%89%E5%85%A8%E5%B7%A5%E5%85%B7%E7%9A%84%E9%9B%86%E6%88%90)
*   [最佳实践](https://code.claude.com/docs/zh-CN/sandboxing#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)
*   [开源](https://code.claude.com/docs/zh-CN/sandboxing#%E5%BC%80%E6%BA%90)
*   [限制](https://code.claude.com/docs/zh-CN/sandboxing#%E9%99%90%E5%88%B6)
*   [另请参阅](https://code.claude.com/docs/zh-CN/sandboxing#%E5%8F%A6%E8%AF%B7%E5%8F%82%E9%98%85)

部署

沙箱隔离
====

复制页面

了解 Claude Code 的沙箱化 bash 工具如何提供文件系统和网络隔离，以实现更安全、更自主的代理执行。

复制页面

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E6%A6%82%E8%BF%B0)

概述
-------------------------------------------------------------------------

Claude Code 具有原生沙箱隔离功能，为代理执行提供更安全的环境，同时减少了对持续权限提示的需求。沙箱隔离不是要求对每个 bash 命令进行权限批准，而是预先创建定义的边界，使 Claude Code 能够以降低的风险更自由地工作。沙箱化 bash 工具使用操作系统级原语来强制执行文件系统和网络隔离。
[​](https://code.claude.com/docs/zh-CN/sandboxing#%E4%B8%BA%E4%BB%80%E4%B9%88%E6%B2%99%E7%AE%B1%E9%9A%94%E7%A6%BB%E5%BE%88%E9%87%8D%E8%A6%81)

为什么沙箱隔离很重要
---------------------------------------------------------------------------------------------------------------------------------------------------------

传统的基于权限的安全性需要用户不断批准 bash 命令。虽然这提供了控制，但可能导致：
*   **批准疲劳**：重复点击”批准”可能导致用户对他们批准的内容关注度下降
*   **生产力降低**：持续的中断会减慢开发工作流程
*   **自主性受限**：当等待批准时，Claude Code 无法高效工作

沙箱隔离通过以下方式解决这些挑战：
1.   **定义清晰的边界**：精确指定 Claude Code 可以访问的目录和网络主机
2.   **减少权限提示**：沙箱内的安全命令不需要批准
3.   **维护安全性**：尝试访问沙箱外的资源会触发立即通知
4.   **启用自主性**：Claude Code 可以在定义的限制内更独立地运行

有效的沙箱隔离需要**同时**进行文件系统和网络隔离。没有网络隔离，被破坏的代理可能会泄露敏感文件（如 SSH 密钥）。没有文件系统隔离，被破坏的代理可能会后门系统资源以获得网络访问权限。配置沙箱隔离时，重要的是确保配置的设置不会在这些系统中创建绕过。

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86)

工作原理
---------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F%E9%9A%94%E7%A6%BB)

文件系统隔离

沙箱化 bash 工具将文件系统访问限制在特定目录：
*   **默认写入行为**：对当前工作目录及其子目录的读写访问权限
*   **默认读取行为**：对整个计算机的读取访问权限，除了某些被拒绝的目录
*   **被阻止的访问**：无法在没有明确权限的情况下修改当前工作目录外的文件
*   **可配置**：通过设置定义自定义允许和拒绝的路径

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E7%BD%91%E7%BB%9C%E9%9A%94%E7%A6%BB)

网络隔离

网络访问通过在沙箱外运行的代理服务器进行控制：
*   **域名限制**：只能访问已批准的域名
*   **用户确认**：新的域名请求会触发权限提示
*   **自定义代理支持**：高级用户可以对出站流量实施自定义规则
*   **全面覆盖**：限制适用于所有脚本、程序和由命令生成的子进程

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F%E7%BA%A7%E5%BC%BA%E5%88%B6%E6%89%A7%E8%A1%8C)

操作系统级强制执行

沙箱化 bash 工具利用操作系统安全原语：
*   **Linux**：使用 [bubblewrap](https://github.com/containers/bubblewrap) 进行隔离
*   **macOS**：使用 Seatbelt 进行沙箱强制执行

这些操作系统级限制确保由 Claude Code 命令生成的所有子进程都继承相同的安全边界。
[​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97)

入门指南
---------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%90%AF%E7%94%A8%E6%B2%99%E7%AE%B1%E9%9A%94%E7%A6%BB)

启用沙箱隔离

您可以通过运行 `/sandbox` 斜杠命令来启用沙箱隔离：

复制

询问AI

```
> /sandbox
```

这将使用默认设置激活沙箱化 bash 工具，允许访问您的当前工作目录，同时阻止访问敏感系统位置。
### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E9%85%8D%E7%BD%AE%E6%B2%99%E7%AE%B1%E9%9A%94%E7%A6%BB)

配置沙箱隔离

通过 `settings.json` 文件自定义沙箱行为。有关完整配置参考，请参阅 [设置](https://code.claude.com/docs/zh-CN/settings#sandbox-settings)。

并非所有命令都与沙箱隔离开箱即用兼容。以下一些注意事项可能会帮助您充分利用沙箱：
*   许多 CLI 工具需要访问某些主机。当您使用这些工具时，它们会请求访问某些主机的权限。授予权限将允许它们现在和将来访问这些主机，使它们能够在沙箱内安全执行。
*   `watchman` 与在沙箱中运行不兼容。如果您正在运行 `jest`，请考虑使用 `jest --no-watchman`
*   `docker` 与在沙箱中运行不兼容。请考虑在 `excludedCommands` 中指定 `docker` 以强制其在沙箱外运行。

Claude Code 包含一个有意的逃生舱机制，允许命令在必要时在沙箱外运行。当命令由于沙箱限制（如网络连接问题或不兼容的工具）而失败时，Claude 会被提示分析失败，并可能使用 `dangerouslyDisableSandbox` 参数重试该命令。使用此参数的命令会通过正常的 Claude Code 权限流程进行，需要用户权限才能执行。这允许 Claude Code 处理某些工具或网络操作无法在沙箱约束内运行的边界情况。您可以通过在 [沙箱设置](https://code.claude.com/docs/zh-CN/settings#sandbox-settings) 中设置 `"allowUnsandboxedCommands": false` 来禁用此逃生舱。禁用后，`dangerouslyDisableSandbox` 参数将被完全忽略，所有命令必须运行沙箱化或在 `excludedCommands` 中明确列出。

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%AE%89%E5%85%A8%E4%BC%98%E5%8A%BF)

安全优势
---------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E9%98%B2%E6%AD%A2%E6%8F%90%E7%A4%BA%E6%B3%A8%E5%85%A5)

防止提示注入

即使攻击者成功通过提示注入操纵 Claude Code 的行为，沙箱也确保您的系统保持安全：**文件系统保护：**
*   无法修改关键配置文件，如 `~/.bashrc`
*   无法修改 `/bin/` 中的系统级文件
*   无法读取在您的 [Claude 权限设置](https://code.claude.com/docs/zh-CN/iam#configuring-permissions) 中被拒绝的文件

**网络保护：**
*   无法向攻击者控制的服务器泄露数据
*   无法从未授权的域下载恶意脚本
*   无法向未批准的服务进行意外的 API 调用
*   无法联系任何未明确允许的域

**监控和控制：**
*   所有沙箱外的访问尝试都在操作系统级别被阻止
*   当边界被测试时，您会收到立即通知
*   您可以选择拒绝、允许一次或永久更新您的配置

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%87%8F%E5%B0%91%E6%94%BB%E5%87%BB%E9%9D%A2)

减少攻击面

沙箱隔离限制了以下可能造成的损害：
*   **恶意依赖项**：具有有害代码的 NPM 包或其他依赖项
*   **被破坏的脚本**：具有安全漏洞的构建脚本或工具
*   **社会工程**：欺骗用户运行危险命令的攻击
*   **提示注入**：欺骗 Claude 运行危险命令的攻击

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E9%80%8F%E6%98%8E%E6%93%8D%E4%BD%9C)

透明操作

当 Claude Code 尝试访问沙箱外的网络资源时：
1.   操作在操作系统级别被阻止
2.   您会收到立即通知
3.   您可以选择： 
    *   拒绝请求
    *   允许一次
    *   更新您的沙箱配置以永久允许它

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%AE%89%E5%85%A8%E9%99%90%E5%88%B6)

安全限制
---------------------------------------------------------------------------------------------

*   网络沙箱隔离限制：网络过滤系统通过限制进程允许连接的域来运行。它不会以其他方式检查通过代理的流量，用户负责确保他们只在其策略中允许受信任的域。

用户应该意识到允许广泛域名（如 `github.com`）可能带来的潜在风险，这可能允许数据泄露。此外，在某些情况下，可能可以通过 [域名前置](https://en.wikipedia.org/wiki/Domain_fronting) 绕过网络过滤。

*   通过 Unix 套接字的权限提升：`allowUnixSockets` 配置可能会无意中授予对强大系统服务的访问权限，这可能导致沙箱绕过。例如，如果它用于允许访问 `/var/run/docker.sock`，这将有效地通过利用 docker 套接字授予对主机系统的访问权限。建议用户仔细考虑他们通过沙箱允许的任何 unix 套接字。
*   文件系统权限提升：过于宽泛的文件系统写入权限可能导致权限提升攻击。允许写入包含 `$PATH` 中可执行文件的目录、系统配置目录或用户 shell 配置文件（`.bashrc`、`.zshrc`）可能导致当其他用户或系统进程访问这些文件时在不同安全上下文中执行代码。
*   Linux 沙箱强度：Linux 实现提供强大的文件系统和网络隔离，但包括一个 `enableWeakerNestedSandbox` 模式，使其能够在没有特权命名空间的 Docker 环境中工作。此选项大大削弱了安全性，应仅在其他隔离措施得到强制执行的情况下使用。

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95)

高级用法
---------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%BB%A3%E7%90%86%E9%85%8D%E7%BD%AE)

自定义代理配置

对于需要高级网络安全的组织，您可以实施自定义代理以：
*   解密和检查 HTTPS 流量
*   应用自定义过滤规则
*   记录所有网络请求
*   与现有安全基础设施集成

复制

询问AI

```
{
  "sandbox": {
    "network": {
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    }
  }
}
```

### [​](https://code.claude.com/docs/zh-CN/sandboxing#%E4%B8%8E%E7%8E%B0%E6%9C%89%E5%AE%89%E5%85%A8%E5%B7%A5%E5%85%B7%E7%9A%84%E9%9B%86%E6%88%90)

与现有安全工具的集成

沙箱化 bash 工具与以下工具配合使用：
*   **IAM 策略**：与 [权限设置](https://code.claude.com/docs/zh-CN/iam) 结合以实现深度防御
*   **开发容器**：与 [devcontainers](https://code.claude.com/docs/zh-CN/devcontainer) 一起使用以获得额外隔离
*   **企业策略**：通过 [托管设置](https://code.claude.com/docs/zh-CN/settings#settings-precedence) 强制执行沙箱配置

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)

最佳实践
---------------------------------------------------------------------------------------------

1.   **从限制性开始**：从最小权限开始，根据需要扩展
2.   **监控日志**：查看沙箱违规尝试以了解 Claude Code 的需求
3.   **使用特定于环境的配置**：开发和生产环境的不同沙箱规则
4.   **与权限结合**：将沙箱隔离与 IAM 策略一起使用以实现全面安全
5.   **测试配置**：验证您的沙箱设置不会阻止合法工作流程

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%BC%80%E6%BA%90)

开源
-------------------------------------------------------------------------

沙箱运行时作为开源 npm 包提供，可用于您自己的代理项目。这使更广泛的 AI 代理社区能够构建更安全、更安全的自主系统。这也可以用于沙箱隔离您可能希望运行的其他程序。例如，要沙箱隔离 MCP 服务器，您可以运行：

复制

询问AI

```
npx @anthropic-ai/sandbox-runtime <command-to-sandbox>
```

有关实现详情和源代码，请访问 [GitHub 存储库](https://github.com/anthropic-experimental/sandbox-runtime)。
[​](https://code.claude.com/docs/zh-CN/sandboxing#%E9%99%90%E5%88%B6)

限制
-------------------------------------------------------------------------

*   **性能开销**：最小，但某些文件系统操作可能会稍微变慢
*   **兼容性**：某些需要特定系统访问模式的工具可能需要配置调整，或者甚至可能需要在沙箱外运行
*   **平台支持**：目前支持 Linux 和 macOS；计划支持 Windows

[​](https://code.claude.com/docs/zh-CN/sandboxing#%E5%8F%A6%E8%AF%B7%E5%8F%82%E9%98%85)

另请参阅
---------------------------------------------------------------------------------------------

*   [安全性](https://code.claude.com/docs/zh-CN/security) - 全面的安全功能和最佳实践
*   [IAM](https://code.claude.com/docs/zh-CN/iam) - 权限配置和访问控制
*   [设置](https://code.claude.com/docs/zh-CN/settings) - 完整配置参考
*   [CLI 参考](https://code.claude.com/docs/zh-CN/cli-reference) - 命令行选项，包括 `-sb`

[开发容器](https://code.claude.com/docs/zh-CN/devcontainer)

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
