<!-- Source: https://code.claude.com/docs/zh-CN/costs -->

Title: 有效管理成本 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/costs

Markdown Content:
有效管理成本 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/costs#content-area)

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

管理

有效管理成本

[快速开始](https://code.claude.com/docs/zh-CN/overview)[使用 Claude Code 构建](https://code.claude.com/docs/zh-CN/sub-agents)[Claude Agent SDK](https://code.claude.com/docs/zh-CN/sdk/migration-guide)[部署](https://code.claude.com/docs/zh-CN/third-party-integrations)[管理](https://code.claude.com/docs/zh-CN/setup)[配置](https://code.claude.com/docs/zh-CN/settings)[参考](https://code.claude.com/docs/zh-CN/cli-reference)[资源](https://code.claude.com/docs/zh-CN/legal-and-compliance)

##### 管理

*   [高级安装](https://code.claude.com/docs/zh-CN/setup)
*   [身份和访问管理](https://code.claude.com/docs/zh-CN/iam)
*   [安全性](https://code.claude.com/docs/zh-CN/security)
*   [数据使用](https://code.claude.com/docs/zh-CN/data-usage)
*   [监控](https://code.claude.com/docs/zh-CN/monitoring-usage)
*   [成本](https://code.claude.com/docs/zh-CN/costs)
*   [分析](https://code.claude.com/docs/zh-CN/analytics)
*   [插件市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces)

在此页面
*   [跟踪您的成本](https://code.claude.com/docs/zh-CN/costs#%E8%B7%9F%E8%B8%AA%E6%82%A8%E7%9A%84%E6%88%90%E6%9C%AC)
*   [使用 /cost 命令](https://code.claude.com/docs/zh-CN/costs#%E4%BD%BF%E7%94%A8-%2Fcost-%E5%91%BD%E4%BB%A4)
*   [其他跟踪选项](https://code.claude.com/docs/zh-CN/costs#%E5%85%B6%E4%BB%96%E8%B7%9F%E8%B8%AA%E9%80%89%E9%A1%B9)
*   [为团队管理成本](https://code.claude.com/docs/zh-CN/costs#%E4%B8%BA%E5%9B%A2%E9%98%9F%E7%AE%A1%E7%90%86%E6%88%90%E6%9C%AC)
*   [速率限制建议](https://code.claude.com/docs/zh-CN/costs#%E9%80%9F%E7%8E%87%E9%99%90%E5%88%B6%E5%BB%BA%E8%AE%AE)
*   [减少令牌使用量](https://code.claude.com/docs/zh-CN/costs#%E5%87%8F%E5%B0%91%E4%BB%A4%E7%89%8C%E4%BD%BF%E7%94%A8%E9%87%8F)
*   [后台令牌使用](https://code.claude.com/docs/zh-CN/costs#%E5%90%8E%E5%8F%B0%E4%BB%A4%E7%89%8C%E4%BD%BF%E7%94%A8)
*   [跟踪版本更改和更新](https://code.claude.com/docs/zh-CN/costs#%E8%B7%9F%E8%B8%AA%E7%89%88%E6%9C%AC%E6%9B%B4%E6%94%B9%E5%92%8C%E6%9B%B4%E6%96%B0)
*   [当前版本信息](https://code.claude.com/docs/zh-CN/costs#%E5%BD%93%E5%89%8D%E7%89%88%E6%9C%AC%E4%BF%A1%E6%81%AF)
*   [了解 Claude Code 行为的变化](https://code.claude.com/docs/zh-CN/costs#%E4%BA%86%E8%A7%A3-claude-code-%E8%A1%8C%E4%B8%BA%E7%9A%84%E5%8F%98%E5%8C%96)
*   [当成本报告发生变化时](https://code.claude.com/docs/zh-CN/costs#%E5%BD%93%E6%88%90%E6%9C%AC%E6%8A%A5%E5%91%8A%E5%8F%91%E7%94%9F%E5%8F%98%E5%8C%96%E6%97%B6)

管理

有效管理成本
======

复制页面

了解如何在使用 Claude Code 时跟踪和优化令牌使用量和成本。

复制页面

Claude Code 每次交互都会消耗令牌。平均成本为每位开发者每天 6，90 6，90% 的用户每日成本保持在 6，90 12 以下。对于团队使用，Claude Code 按 API 令牌消耗量收费。平均而言，使用 Sonnet 4.5 时 Claude Code 每位开发者每月成本约为 $100-200，但根据用户运行的实例数量以及是否在自动化中使用，存在很大差异。
[​](https://code.claude.com/docs/zh-CN/costs#%E8%B7%9F%E8%B8%AA%E6%82%A8%E7%9A%84%E6%88%90%E6%9C%AC)

跟踪您的成本
------------------------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/costs#%E4%BD%BF%E7%94%A8-/cost-%E5%91%BD%E4%BB%A4)

使用 `/cost` 命令

`/cost` 命令不适用于 Claude Max 和 Pro 订阅用户。

`/cost` 命令为您的当前会话提供详细的令牌使用统计信息：

复制

询问AI

```
Total cost:            $0.55
Total duration (API):  6m 19.7s
Total duration (wall): 6h 33m 10.2s
Total code changes:    0 lines added, 0 lines removed
```

### [​](https://code.claude.com/docs/zh-CN/costs#%E5%85%B6%E4%BB%96%E8%B7%9F%E8%B8%AA%E9%80%89%E9%A1%B9)

其他跟踪选项

在 Claude Console 中检查[历史使用情况](https://support.claude.com/zh-CN/articles/9534590-cost-and-usage-reporting-in-console)（需要管理员或计费角色）并为 Claude Code 工作区设置[工作区支出限制](https://support.claude.com/zh-CN/articles/9796807-creating-and-managing-workspaces)（需要管理员角色）。

当您首次使用 Claude Console 账户验证 Claude Code 时，会自动为您创建一个名为”Claude Code”的工作区。此工作区为您组织中的所有 Claude Code 使用提供集中的成本跟踪和管理。您无法为此工作区创建 API 密钥 - 它专门用于 Claude Code 身份验证和使用。

[​](https://code.claude.com/docs/zh-CN/costs#%E4%B8%BA%E5%9B%A2%E9%98%9F%E7%AE%A1%E7%90%86%E6%88%90%E6%9C%AC)

为团队管理成本
----------------------------------------------------------------------------------------------------------------------

使用 Claude API 时，您可以限制 Claude Code 工作区的总支出。要配置，请[按照这些说明操作](https://support.claude.com/zh-CN/articles/9796807-creating-and-managing-workspaces)。管理员可以通过[按照这些说明操作](https://support.claude.com/zh-CN/articles/9534590-cost-and-usage-reporting-in-console)查看成本和使用情况报告。在 Bedrock 和 Vertex 上，Claude Code 不会从您的云端发送指标。为了获取成本指标，几家大型企业报告使用了 [LiteLLM](https://code.claude.com/docs/zh-CN/third-party-integrations#litellm)，这是一个开源工具，帮助公司[按密钥跟踪支出](https://docs.litellm.ai/docs/proxy/virtual_keys#tracking-spend)。此项目与 Anthropic 无关，我们未审核其安全性。
### [​](https://code.claude.com/docs/zh-CN/costs#%E9%80%9F%E7%8E%87%E9%99%90%E5%88%B6%E5%BB%BA%E8%AE%AE)

速率限制建议

为团队设置 Claude Code 时，请根据您的组织规模考虑以下每用户每分钟令牌数 (TPM) 和每分钟请求数 (RPM) 建议：

| 团队规模 | 每用户 TPM | 每用户 RPM |
| --- | --- | --- |
| 1-5 用户 | 200k-300k | 5-7 |
| 5-20 用户 | 100k-150k | 2.5-3.5 |
| 20-50 用户 | 50k-75k | 1.25-1.75 |
| 50-100 用户 | 25k-35k | 0.62-0.87 |
| 100-500 用户 | 15k-20k | 0.37-0.47 |
| 500+ 用户 | 10k-15k | 0.25-0.35 |

例如，如果您有 200 个用户，您可能为每个用户请求 20k TPM，或总计 400 万 TPM（200*20,000 = 400 万）。每用户 TPM 随着团队规模增长而减少，因为我们预期在较大组织中同时使用 Claude Code 的用户较少。这些速率限制适用于组织级别，而非每个单独用户，这意味着当其他人未积极使用服务时，个别用户可以暂时消耗超过其计算份额。

如果您预期会出现异常高并发使用的场景（例如大型团体的现场培训会话），您可能需要为每个用户分配更高的 TPM。

[​](https://code.claude.com/docs/zh-CN/costs#%E5%87%8F%E5%B0%91%E4%BB%A4%E7%89%8C%E4%BD%BF%E7%94%A8%E9%87%8F)

减少令牌使用量
----------------------------------------------------------------------------------------------------------------------

*   **紧凑对话：**
    *   Claude 默认在上下文超过 95% 容量时使用自动紧凑
    *   切换自动紧凑：运行 `/config` 并导航到”Auto-compact enabled”
    *   当上下文变大时手动使用 `/compact`
    *   添加自定义指令：`/compact Focus on code samples and API usage`
    *   通过添加到 CLAUDE.md 来自定义紧凑：复制  询问AI   ```
# Summary instructions

When you are using compact, please focus on test output and code changes
```   

*   **编写具体查询：** 避免触发不必要扫描的模糊请求
*   **分解复杂任务：** 将大型任务拆分为专注的交互
*   **在任务之间清除历史：** 使用 `/clear` 重置上下文

成本可能因以下因素而显著变化：
*   被分析代码库的大小
*   查询的复杂性
*   被搜索或修改的文件数量
*   对话历史的长度
*   紧凑对话的频率

[​](https://code.claude.com/docs/zh-CN/costs#%E5%90%8E%E5%8F%B0%E4%BB%A4%E7%89%8C%E4%BD%BF%E7%94%A8)

后台令牌使用
------------------------------------------------------------------------------------------------------------

Claude Code 即使在空闲时也会为某些后台功能使用令牌：
*   **对话摘要**：为 `claude --resume` 功能总结先前对话的后台作业
*   **命令处理**：某些命令如 `/cost` 可能生成请求以检查状态

这些后台进程即使没有主动交互也会消耗少量令牌（通常每会话低于 $0.04）。
[​](https://code.claude.com/docs/zh-CN/costs#%E8%B7%9F%E8%B8%AA%E7%89%88%E6%9C%AC%E6%9B%B4%E6%94%B9%E5%92%8C%E6%9B%B4%E6%96%B0)

跟踪版本更改和更新
------------------------------------------------------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/costs#%E5%BD%93%E5%89%8D%E7%89%88%E6%9C%AC%E4%BF%A1%E6%81%AF)

当前版本信息

要检查您当前的 Claude Code 版本和安装详细信息：

复制

询问AI

```
claude doctor
```

此命令显示您的版本、安装类型和系统信息。
### [​](https://code.claude.com/docs/zh-CN/costs#%E4%BA%86%E8%A7%A3-claude-code-%E8%A1%8C%E4%B8%BA%E7%9A%84%E5%8F%98%E5%8C%96)

了解 Claude Code 行为的变化

Claude Code 定期接收可能改变功能工作方式的更新，包括成本报告：
*   **版本跟踪**：使用 `claude doctor` 查看您的当前版本
*   **行为变化**：像 `/cost` 这样的功能可能在不同版本中显示不同的信息
*   **文档访问**：Claude 始终可以访问最新文档，这可以帮助解释当前功能行为

### [​](https://code.claude.com/docs/zh-CN/costs#%E5%BD%93%E6%88%90%E6%9C%AC%E6%8A%A5%E5%91%8A%E5%8F%91%E7%94%9F%E5%8F%98%E5%8C%96%E6%97%B6)

当成本报告发生变化时

如果您注意到成本显示方式的变化（例如 `/cost` 命令显示不同信息）：
1.   **验证您的版本**：运行 `claude doctor` 确认您的当前版本
2.   **查阅文档**：直接询问 Claude 当前功能行为，因为它可以访问最新文档
3.   **联系支持**：对于具体的计费问题，请通过您的 Console 账户联系 Anthropic 支持

对于团队部署，我们建议从小型试点组开始建立使用模式，然后再进行更广泛的推广。

[监控](https://code.claude.com/docs/zh-CN/monitoring-usage)[分析](https://code.claude.com/docs/zh-CN/analytics)

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
