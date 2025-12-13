<!-- Source: https://code.claude.com/docs/zh-CN/sdk/migration-guide -->

Title: 迁移到 Claude Agent SDK

URL Source: https://code.claude.com/docs/zh-CN/sdk/migration-guide

Markdown Content:
迁移到 Claude Agent SDK - Claude Docs

===============

[](https://code.claude.com/docs/zh-CN/home)
*   [开发者指南](https://code.claude.com/docs/zh-CN/intro)
*   [API 参考](https://code.claude.com/docs/zh-CN/api/overview)
*   [MCP](https://modelcontextprotocol.io/)
*   [资源](https://code.claude.com/docs/zh-CN/resources/overview)
*   [发布说明](https://code.claude.com/docs/zh-CN/release-notes/overview)

简体中文[Log in](https://code.claude.com/login?returnTo=%2Fdocs%2Fzh-CN%2Fagent-sdk%2Fmigration-guide)

Search...

⌘K

快速开始

[Claude 简介](https://code.claude.com/docs/zh-CN/intro)[快速入门](https://code.claude.com/docs/zh-CN/get-started)

模型与定价

[模型概览](https://code.claude.com/docs/zh-CN/about-claude/models/overview)[选择模型](https://code.claude.com/docs/zh-CN/about-claude/models/choosing-a-model)[Claude 4.5 新功能](https://code.claude.com/docs/zh-CN/about-claude/models/whats-new-claude-4-5)[迁移到 Claude 4.5](https://code.claude.com/docs/zh-CN/about-claude/models/migrating-to-claude-4)[模型弃用](https://code.claude.com/docs/zh-CN/about-claude/model-deprecations)[定价](https://code.claude.com/docs/zh-CN/about-claude/pricing)

使用 Claude 构建

[功能概览](https://code.claude.com/docs/zh-CN/build-with-claude/overview)[使用 Messages API](https://code.claude.com/docs/zh-CN/build-with-claude/working-with-messages)[上下文窗口](https://code.claude.com/docs/zh-CN/build-with-claude/context-windows)[提示词最佳实践](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/claude-4-best-practices)

能力

[提示词缓存](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-caching)[上下文编辑](https://code.claude.com/docs/zh-CN/build-with-claude/context-editing)[扩展思考](https://code.claude.com/docs/zh-CN/build-with-claude/extended-thinking)[工作量](https://code.claude.com/docs/zh-CN/build-with-claude/effort)[流式消息](https://code.claude.com/docs/zh-CN/build-with-claude/streaming)[批量处理](https://code.claude.com/docs/zh-CN/build-with-claude/batch-processing)[引用](https://code.claude.com/docs/zh-CN/build-with-claude/citations)[多语言支持](https://code.claude.com/docs/zh-CN/build-with-claude/multilingual-support)[Token 计数](https://code.claude.com/docs/zh-CN/build-with-claude/token-counting)[嵌入](https://code.claude.com/docs/zh-CN/build-with-claude/embeddings)[视觉](https://code.claude.com/docs/zh-CN/build-with-claude/vision)[PDF 支持](https://code.claude.com/docs/zh-CN/build-with-claude/pdf-support)[Files API](https://code.claude.com/docs/zh-CN/build-with-claude/files)[搜索结果](https://code.claude.com/docs/zh-CN/build-with-claude/search-results)[结构化输出](https://code.claude.com/docs/zh-CN/build-with-claude/structured-outputs)[Google Sheets 插件](https://code.claude.com/docs/zh-CN/agents-and-tools/claude-for-sheets)

工具

[概览](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/overview)[如何实现工具使用](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/implement-tool-use)[Token 高效的工具使用](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/token-efficient-tool-use)[细粒度工具流式处理](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/fine-grained-tool-streaming)[Bash 工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/bash-tool)[代码执行工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/code-execution-tool)[程序化工具调用](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/programmatic-tool-calling)[计算机使用工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/computer-use-tool)[文本编辑器工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/text-editor-tool)[Web 获取工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/web-fetch-tool)[Web 搜索工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/web-search-tool)[内存工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/memory-tool)[工具搜索工具](https://code.claude.com/docs/zh-CN/agents-and-tools/tool-use/tool-search-tool)

Agent 技能

[概览](https://code.claude.com/docs/zh-CN/agents-and-tools/agent-skills/overview)[快速入门](https://code.claude.com/docs/zh-CN/agents-and-tools/agent-skills/quickstart)[最佳实践](https://code.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices)[在 API 中使用技能](https://code.claude.com/docs/zh-CN/build-with-claude/skills-guide)

Agent SDK

[概览](https://code.claude.com/docs/zh-CN/agent-sdk/overview)[TypeScript SDK](https://code.claude.com/docs/zh-CN/agent-sdk/typescript)[Python SDK](https://code.claude.com/docs/zh-CN/agent-sdk/python)[迁移指南](https://code.claude.com/docs/zh-CN/agent-sdk/migration-guide)

指南

[流式输入](https://code.claude.com/docs/zh-CN/agent-sdk/streaming-vs-single-mode)[处理权限](https://code.claude.com/docs/zh-CN/agent-sdk/permissions)[会话管理](https://code.claude.com/docs/zh-CN/agent-sdk/sessions)[SDK 中的结构化输出](https://code.claude.com/docs/zh-CN/agent-sdk/structured-outputs)[托管 Agent SDK](https://code.claude.com/docs/zh-CN/agent-sdk/hosting)[修改系统提示词](https://code.claude.com/docs/zh-CN/agent-sdk/modifying-system-prompts)[SDK 中的 MCP](https://code.claude.com/docs/zh-CN/agent-sdk/mcp)[自定义工具](https://code.claude.com/docs/zh-CN/agent-sdk/custom-tools)[SDK 中的子 Agent](https://code.claude.com/docs/zh-CN/agent-sdk/subagents)[SDK 中的斜杠命令](https://code.claude.com/docs/zh-CN/agent-sdk/slash-commands)[SDK 中的 Agent 技能](https://code.claude.com/docs/zh-CN/agent-sdk/skills)[跟踪成本和使用情况](https://code.claude.com/docs/zh-CN/agent-sdk/cost-tracking)[待办事项列表](https://code.claude.com/docs/zh-CN/agent-sdk/todo-tracking)[SDK 中的插件](https://code.claude.com/docs/zh-CN/agent-sdk/plugins)

API 中的 MCP

[MCP 连接器](https://code.claude.com/docs/zh-CN/agents-and-tools/mcp-connector)[远程 MCP 服务器](https://code.claude.com/docs/zh-CN/agents-and-tools/remote-mcp-servers)

第三方平台上的 Claude

[Amazon Bedrock](https://code.claude.com/docs/zh-CN/build-with-claude/claude-on-amazon-bedrock)[Microsoft Foundry](https://code.claude.com/docs/zh-CN/build-with-claude/claude-in-microsoft-foundry)[Vertex AI](https://code.claude.com/docs/zh-CN/build-with-claude/claude-on-vertex-ai)

提示词工程

[概览](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/overview)[提示词生成器](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/prompt-generator)[使用提示词模板](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/prompt-templates-and-variables)[提示词改进器](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/prompt-improver)[清晰直接](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/be-clear-and-direct)[使用示例（多轮提示）](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/multishot-prompting)[让 Claude 思考（CoT）](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/chain-of-thought)[使用 XML 标签](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/use-xml-tags)[给 Claude 一个角色（系统提示词）](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/system-prompts)[预填充 Claude 的响应](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/prefill-claudes-response)[链接复杂提示词](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/chain-prompts)[长上下文提示](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/long-context-tips)[扩展思考提示](https://code.claude.com/docs/zh-CN/build-with-claude/prompt-engineering/extended-thinking-tips)

测试与评估

[定义成功标准](https://code.claude.com/docs/zh-CN/test-and-evaluate/define-success)[开发测试用例](https://code.claude.com/docs/zh-CN/test-and-evaluate/develop-tests)[使用评估工具](https://code.claude.com/docs/zh-CN/test-and-evaluate/eval-tool)[降低延迟](https://code.claude.com/docs/zh-CN/test-and-evaluate/strengthen-guardrails/reduce-latency)

加强防护栏

[减少幻觉](https://code.claude.com/docs/zh-CN/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)[提高输出一致性](https://code.claude.com/docs/zh-CN/test-and-evaluate/strengthen-guardrails/increase-consistency)[缓解越狱](https://code.claude.com/docs/zh-CN/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)[流式拒绝](https://code.claude.com/docs/zh-CN/test-and-evaluate/strengthen-guardrails/handle-streaming-refusals)[减少提示词泄露](https://code.claude.com/docs/zh-CN/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak)[保持 Claude 的角色](https://code.claude.com/docs/zh-CN/test-and-evaluate/strengthen-guardrails/keep-claude-in-character)

管理和监控

[Admin API 概览](https://code.claude.com/docs/zh-CN/build-with-claude/administration-api)[使用和成本 API](https://code.claude.com/docs/zh-CN/build-with-claude/usage-cost-api)[Claude Code 分析 API](https://code.claude.com/docs/zh-CN/build-with-claude/claude-code-analytics-api)

[Console](https://code.claude.com/)

[Log in](https://code.claude.com/login)

Agent SDK 迁移指南

Agent SDK

迁移到 Claude Agent SDK
====================

Copy page

将 Claude Code TypeScript 和 Python SDK 迁移到 Claude Agent SDK 的指南

Copy page

概述
--

Claude Code SDK 已重命名为 **Claude Agent SDK**，其文档已重新组织。这一变化反映了该 SDK 在构建超越编码任务的 AI 代理方面的更广泛功能。

变更内容
----

| 方面 | 旧版本 | 新版本 |
| --- | --- | --- |
| **包名称 (TS/JS)** | `@anthropic-ai/claude-code` | `@anthropic-ai/claude-agent-sdk` |
| **Python 包** | `claude-code-sdk` | `claude-agent-sdk` |
| **文档位置** | Claude Code 文档 | API 指南 → Agent SDK 部分 |

**文档变更：** Agent SDK 文档已从 Claude Code 文档移至 API 指南下的专用 [Agent SDK](https://code.claude.com/docs/zh-CN/agent-sdk/overview) 部分。Claude Code 文档现在专注于 CLI 工具和自动化功能。

迁移步骤
----

### 对于 TypeScript/JavaScript 项目

**1. 卸载旧包：**

`npm uninstall @anthropic-ai/claude-code`

**2. 安装新包：**

`npm install @anthropic-ai/claude-agent-sdk`

**3. 更新导入：**

将所有导入从 `@anthropic-ai/claude-code` 更改为 `@anthropic-ai/claude-agent-sdk`：

```
// 之前
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-code";

// 之后
import {
  query,
  tool,
  createSdkMcpServer,
} from "@anthropic-ai/claude-agent-sdk";
```

**4. 更新 package.json 依赖项：**

如果您在 `package.json` 中列出了该包，请更新它：

```
// 之前
{
  "dependencies": {
    "@anthropic-ai/claude-code": "^1.0.0"
  }
}

// 之后
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.0"
  }
}
```

就这样！无需进行其他代码更改。

### 对于 Python 项目

**1. 卸载旧包：**

`pip uninstall claude-code-sdk`

**2. 安装新包：**

`pip install claude-agent-sdk`

**3. 更新导入：**

将所有导入从 `claude_code_sdk` 更改为 `claude_agent_sdk`：

```
# 之前
from claude_code_sdk import query, ClaudeCodeOptions

# 之后
from claude_agent_sdk import query, ClaudeAgentOptions
```

**4. 更新类型名称：**

将 `ClaudeCodeOptions` 更改为 `ClaudeAgentOptions`：

```
# 之前
from claude_agent_sdk import query, ClaudeCodeOptions

options = ClaudeCodeOptions(
    model="claude-sonnet-4-5"
)

# 之后
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    model="claude-sonnet-4-5"
)
```

**5. 查看 [破坏性变更](https://code.claude.com/docs/zh-CN/sdk/migration-guide#breaking-changes)**

进行任何必要的代码更改以完成迁移。

破坏性变更
-----

为了改进隔离和显式配置，Claude Agent SDK v0.1.0 为从 Claude Code SDK 迁移的用户引入了破坏性变更。在迁移前请仔细查看本部分。

### Python：ClaudeCodeOptions 重命名为 ClaudeAgentOptions

**变更内容：** Python SDK 类型 `ClaudeCodeOptions` 已重命名为 `ClaudeAgentOptions`。

**迁移：**

```
# 之前 (v0.0.x)
from claude_agent_sdk import query, ClaudeCodeOptions

options = ClaudeCodeOptions(
    model="claude-sonnet-4-5",
    permission_mode="acceptEdits"
)

# 之后 (v0.1.0)
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    model="claude-sonnet-4-5",
    permission_mode="acceptEdits"
)
```

**为什么变更：** 类型名称现在与"Claude Agent SDK"品牌相匹配，并在 SDK 的命名约定中提供一致性。

### 系统提示不再是默认值

**变更内容：** SDK 不再默认使用 Claude Code 的系统提示。

**迁移：**

TypeScript

```
// 之前 (v0.0.x) - 默认使用 Claude Code 的系统提示
const result = query({ prompt: "Hello" });

// 之后 (v0.1.0) - 默认使用空系统提示
// 要获得旧行为，请显式请求 Claude Code 的预设：
const result = query({
  prompt: "Hello",
  options: {
    systemPrompt: { type: "preset", preset: "claude_code" }
  }
});

// 或使用自定义系统提示：
const result = query({
  prompt: "Hello",
  options: {
    systemPrompt: "You are a helpful coding assistant"
  }
});
```

**为什么变更：** 为 SDK 应用程序提供更好的控制和隔离。您现在可以构建具有自定义行为的代理，而无需继承 Claude Code 的 CLI 焦点指令。

### 设置源不再默认加载

**变更内容：** SDK 不再默认从文件系统设置（CLAUDE.md、settings.json、斜杠命令等）读取。

**迁移：**

TypeScript

```
// 之前 (v0.0.x) - 自动加载所有设置
const result = query({ prompt: "Hello" });
// 会读取：
// - ~/.claude/settings.json (用户)
// - .claude/settings.json (项目)
// - .claude/settings.local.json (本地)
// - CLAUDE.md 文件
// - 自定义斜杠命令

// 之后 (v0.1.0) - 默认不加载设置
// 要获得旧行为：
const result = query({
  prompt: "Hello",
  options: {
    settingSources: ["user", "project", "local"]
  }
});

// 或仅加载特定源：
const result = query({
  prompt: "Hello",
  options: {
    settingSources: ["project"]  // 仅项目设置
  }
});
```

**为什么变更：** 确保 SDK 应用程序具有独立于本地文件系统配置的可预测行为。这对以下情况特别重要：

*   **CI/CD 环境** - 没有本地自定义的一致行为
*   **已部署的应用程序** - 不依赖文件系统设置
*   **测试** - 隔离的测试环境
*   **多租户系统** - 防止用户之间的设置泄露

**向后兼容性：** 如果您的应用程序依赖文件系统设置（自定义斜杠命令、CLAUDE.md 指令等），请将 `settingSources: ['user', 'project', 'local']` 添加到您的选项中。

为什么重命名？
-------

Claude Code SDK 最初是为编码任务设计的，但它已演变成一个强大的框架，用于构建所有类型的 AI 代理。新名称"Claude Agent SDK"更好地反映了其功能：

*   构建业务代理（法律助手、财务顾问、客户支持）
*   创建专门的编码代理（SRE 机器人、安全审查员、代码审查代理）
*   为任何领域开发自定义代理，具有工具使用、MCP 集成等功能

获取帮助
----

如果您在迁移过程中遇到任何问题：

**对于 TypeScript/JavaScript：**

1.   检查所有导入是否已更新为使用 `@anthropic-ai/claude-agent-sdk`
2.   验证您的 package.json 具有新的包名称
3.   运行 `npm install` 以确保依赖项已更新

**对于 Python：**

1.   检查所有导入是否已更新为使用 `claude_agent_sdk`
2.   验证您的 requirements.txt 或 pyproject.toml 具有新的包名称
3.   运行 `pip install claude-agent-sdk` 以确保包已安装

后续步骤
----

*   探索 [Agent SDK 概述](https://code.claude.com/docs/zh-CN/agent-sdk/overview) 以了解可用功能
*   查看 [TypeScript SDK 参考](https://code.claude.com/docs/zh-CN/agent-sdk/typescript) 以获取详细的 API 文档
*   查看 [Python SDK 参考](https://code.claude.com/docs/zh-CN/agent-sdk/python) 以获取 Python 特定文档
*   了解 [自定义工具](https://code.claude.com/docs/zh-CN/agent-sdk/custom-tools) 和 [MCP 集成](https://code.claude.com/docs/zh-CN/agent-sdk/mcp)

*   [对于 TypeScript/JavaScript 项目](https://code.claude.com/docs/zh-CN/sdk/migration-guide#type-script-java-script)
*   [对于 Python 项目](https://code.claude.com/docs/zh-CN/sdk/migration-guide#python)
*   [Python：ClaudeCodeOptions 重命名为 ClaudeAgentOptions](https://code.claude.com/docs/zh-CN/sdk/migration-guide#python-claude-code-options-claude-agent-options)

[](https://code.claude.com/docs)

[](https://x.com/claudeai)[](https://www.linkedin.com/showcase/claude)[](https://instagram.com/claudeai)

### Solutions

*   [AI agents](https://claude.com/solutions/agents)
*   [Code modernization](https://claude.com/solutions/code-modernization)
*   [Coding](https://claude.com/solutions/coding)
*   [Customer support](https://claude.com/solutions/customer-support)
*   [Education](https://claude.com/solutions/education)
*   [Financial services](https://claude.com/solutions/financial-services)
*   [Government](https://claude.com/solutions/government)
*   [Life sciences](https://claude.com/solutions/life-sciences)

### Partners

*   [Amazon Bedrock](https://claude.com/partners/amazon-bedrock)
*   [Google Cloud's Vertex AI](https://claude.com/partners/google-cloud-vertex-ai)

### Learn

*   [Blog](https://claude.com/blog)
*   [Catalog](https://claude.ai/catalog/artifacts)
*   [Courses](https://www.anthropic.com/learn)
*   [Use cases](https://claude.com/resources/use-cases)
*   [Connectors](https://claude.com/partners/mcp)
*   [Customer stories](https://claude.com/customers)
*   [Engineering at Anthropic](https://www.anthropic.com/engineering)
*   [Events](https://www.anthropic.com/events)
*   [Powered by Claude](https://claude.com/partners/powered-by-claude)
*   [Service partners](https://claude.com/partners/services)
*   [Startups program](https://claude.com/programs/startups)

### Company

*   [Anthropic](https://www.anthropic.com/company)
*   [Careers](https://www.anthropic.com/careers)
*   [Economic Futures](https://www.anthropic.com/economic-futures)
*   [Research](https://www.anthropic.com/research)
*   [News](https://www.anthropic.com/news)
*   [Responsible Scaling Policy](https://www.anthropic.com/news/announcing-our-updated-responsible-scaling-policy)
*   [Security and compliance](https://trust.anthropic.com/)
*   [Transparency](https://www.anthropic.com/transparency)

### Learn

*   [Blog](https://claude.com/blog)
*   [Catalog](https://claude.ai/catalog/artifacts)
*   [Courses](https://www.anthropic.com/learn)
*   [Use cases](https://claude.com/resources/use-cases)
*   [Connectors](https://claude.com/partners/mcp)
*   [Customer stories](https://claude.com/customers)
*   [Engineering at Anthropic](https://www.anthropic.com/engineering)
*   [Events](https://www.anthropic.com/events)
*   [Powered by Claude](https://claude.com/partners/powered-by-claude)
*   [Service partners](https://claude.com/partners/services)
*   [Startups program](https://claude.com/programs/startups)

### Help and security

*   [Availability](https://www.anthropic.com/supported-countries)
*   [Status](https://status.anthropic.com/)
*   [Support](https://support.claude.com/)
*   [Discord](https://www.anthropic.com/discord)

### Terms and policies

*   [Privacy policy](https://www.anthropic.com/legal/privacy)
*   [Responsible disclosure policy](https://www.anthropic.com/responsible-disclosure-policy)
*   [Terms of service: Commercial](https://www.anthropic.com/legal/commercial-terms)
*   [Terms of service: Consumer](https://www.anthropic.com/legal/consumer-terms)
*   [Usage policy](https://www.anthropic.com/legal/aup)
