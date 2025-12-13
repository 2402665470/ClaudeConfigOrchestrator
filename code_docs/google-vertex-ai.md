<!-- Source: https://code.claude.com/docs/zh-CN/google-vertex-ai -->

Title: Claude Code on Google Vertex AI - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/google-vertex-ai

Markdown Content:
Claude Code on Google Vertex AI - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/google-vertex-ai#content-area)

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

Claude Code on Google Vertex AI

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
*   [前置条件](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E5%89%8D%E7%BD%AE%E6%9D%A1%E4%BB%B6)
*   [区域配置](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E5%8C%BA%E5%9F%9F%E9%85%8D%E7%BD%AE)
*   [设置](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E8%AE%BE%E7%BD%AE)
*   [1. 启用 Vertex AI API](https://code.claude.com/docs/zh-CN/google-vertex-ai#1-%E5%90%AF%E7%94%A8-vertex-ai-api)
*   [2. 请求模型访问权限](https://code.claude.com/docs/zh-CN/google-vertex-ai#2-%E8%AF%B7%E6%B1%82%E6%A8%A1%E5%9E%8B%E8%AE%BF%E9%97%AE%E6%9D%83%E9%99%90)
*   [3. 配置 GCP 凭证](https://code.claude.com/docs/zh-CN/google-vertex-ai#3-%E9%85%8D%E7%BD%AE-gcp-%E5%87%AD%E8%AF%81)
*   [4. 配置 Claude Code](https://code.claude.com/docs/zh-CN/google-vertex-ai#4-%E9%85%8D%E7%BD%AE-claude-code)
*   [5. 模型配置](https://code.claude.com/docs/zh-CN/google-vertex-ai#5-%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)
*   [IAM 配置](https://code.claude.com/docs/zh-CN/google-vertex-ai#iam-%E9%85%8D%E7%BD%AE)
*   [100 万令牌上下文窗口](https://code.claude.com/docs/zh-CN/google-vertex-ai#100-%E4%B8%87%E4%BB%A4%E7%89%8C%E4%B8%8A%E4%B8%8B%E6%96%87%E7%AA%97%E5%8F%A3)
*   [故障排除](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
*   [其他资源](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)

部署

Claude Code on Google Vertex AI
===============================

复制页面

了解如何通过 Google Vertex AI 配置 Claude Code，包括设置、IAM 配置和故障排除。

复制页面

[​](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E5%89%8D%E7%BD%AE%E6%9D%A1%E4%BB%B6)

前置条件
---------------------------------------------------------------------------------------------------

在使用 Vertex AI 配置 Claude Code 之前，请确保您拥有：
*   启用了计费的 Google Cloud Platform (GCP) 账户
*   启用了 Vertex AI API 的 GCP 项目
*   访问所需 Claude 模型的权限（例如 Claude Sonnet 4.5）
*   已安装并配置的 Google Cloud SDK (`gcloud`)
*   在所需 GCP 区域中分配的配额

[​](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E5%8C%BA%E5%9F%9F%E9%85%8D%E7%BD%AE)

区域配置
---------------------------------------------------------------------------------------------------

Claude Code 可以与 Vertex AI [全局](https://cloud.google.com/blog/products/ai-machine-learning/global-endpoint-for-claude-models-generally-available-on-vertex-ai)和区域端点一起使用。

Vertex AI 可能不支持所有区域上的 Claude Code 默认模型。您可能需要切换到[支持的区域或模型](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations#genai-partner-models)。

Vertex AI 可能不支持全局端点上的 Claude Code 默认模型。您可能需要切换到区域端点或[支持的模型](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-partner-models#supported_models)。

[​](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E8%AE%BE%E7%BD%AE)

设置
-------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/google-vertex-ai#1-%E5%90%AF%E7%94%A8-vertex-ai-api)

1. 启用 Vertex AI API

在您的 GCP 项目中启用 Vertex AI API：

复制

询问AI

```
# 设置您的项目 ID
gcloud config set project YOUR-PROJECT-ID

# 启用 Vertex AI API
gcloud services enable aiplatform.googleapis.com
```

### [​](https://code.claude.com/docs/zh-CN/google-vertex-ai#2-%E8%AF%B7%E6%B1%82%E6%A8%A1%E5%9E%8B%E8%AE%BF%E9%97%AE%E6%9D%83%E9%99%90)

2. 请求模型访问权限

请求访问 Vertex AI 中的 Claude 模型：
1.   导航到 [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
2.   搜索”Claude”模型
3.   请求访问所需的 Claude 模型（例如 Claude Sonnet 4.5）
4.   等待批准（可能需要 24-48 小时）

### [​](https://code.claude.com/docs/zh-CN/google-vertex-ai#3-%E9%85%8D%E7%BD%AE-gcp-%E5%87%AD%E8%AF%81)

3. 配置 GCP 凭证

Claude Code 使用标准的 Google Cloud 身份验证。有关更多信息，请参阅 [Google Cloud 身份验证文档](https://cloud.google.com/docs/authentication)。

进行身份验证时，Claude Code 将自动使用来自 `ANTHROPIC_VERTEX_PROJECT_ID` 环境变量的项目 ID。要覆盖此设置，请设置以下环境变量之一：`GCLOUD_PROJECT`、`GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_APPLICATION_CREDENTIALS`。

### [​](https://code.claude.com/docs/zh-CN/google-vertex-ai#4-%E9%85%8D%E7%BD%AE-claude-code)

4. 配置 Claude Code

设置以下环境变量：

复制

询问AI

```
# 启用 Vertex AI 集成
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=global
export ANTHROPIC_VERTEX_PROJECT_ID=YOUR-PROJECT-ID

# 可选：如果需要，禁用提示缓存
export DISABLE_PROMPT_CACHING=1

# 当 CLOUD_ML_REGION=global 时，覆盖不支持的模型的区域
export VERTEX_REGION_CLAUDE_3_5_HAIKU=us-east5

# 可选：覆盖其他特定模型的区域
export VERTEX_REGION_CLAUDE_3_5_SONNET=us-east5
export VERTEX_REGION_CLAUDE_3_7_SONNET=us-east5
export VERTEX_REGION_CLAUDE_4_0_OPUS=europe-west1
export VERTEX_REGION_CLAUDE_4_0_SONNET=us-east5
export VERTEX_REGION_CLAUDE_4_1_OPUS=europe-west1
```

当您指定 `cache_control` 临时标志时，[提示缓存](https://docs.claude.com/zh-CN/docs/build-with-claude/prompt-caching)会自动支持。要禁用它，请设置 `DISABLE_PROMPT_CACHING=1`。如需提高速率限制，请联系 Google Cloud 支持。

使用 Vertex AI 时，`/login` 和 `/logout` 命令被禁用，因为身份验证通过 Google Cloud 凭证处理。

### [​](https://code.claude.com/docs/zh-CN/google-vertex-ai#5-%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)

5. 模型配置

Claude Code 为 Vertex AI 使用这些默认模型：

| 模型类型 | 默认值 |
| --- | --- |
| 主要模型 | `claude-sonnet-4-5@20250929` |
| 小型/快速模型 | `claude-haiku-4-5@20251001` |

对于 Vertex AI 用户，Claude Code 不会自动从 Haiku 3.5 升级到 Haiku 4.5。要手动切换到较新的 Haiku 模型，请将 `ANTHROPIC_DEFAULT_HAIKU_MODEL` 环境变量设置为完整模型名称（例如 `claude-haiku-4-5@20251001`）。

要自定义模型：

复制

询问AI

```
export ANTHROPIC_MODEL='claude-opus-4-1@20250805'
export ANTHROPIC_SMALL_FAST_MODEL='claude-haiku-4-5@20251001'
```

[​](https://code.claude.com/docs/zh-CN/google-vertex-ai#iam-%E9%85%8D%E7%BD%AE)

IAM 配置
---------------------------------------------------------------------------------------

分配所需的 IAM 权限：`roles/aiplatform.user` 角色包括所需的权限：
*   `aiplatform.endpoints.predict` - 模型调用和令牌计数所需

对于更严格的权限，请创建仅包含上述权限的自定义角色。有关详细信息，请参阅 [Vertex IAM 文档](https://cloud.google.com/vertex-ai/docs/general/access-control)。

我们建议为 Claude Code 创建一个专用的 GCP 项目，以简化成本跟踪和访问控制。

[​](https://code.claude.com/docs/zh-CN/google-vertex-ai#100-%E4%B8%87%E4%BB%A4%E7%89%8C%E4%B8%8A%E4%B8%8B%E6%96%87%E7%AA%97%E5%8F%A3)

100 万令牌上下文窗口
---------------------------------------------------------------------------------------------------------------------------------------------------

Claude Sonnet 4 和 Sonnet 4.5 在 Vertex AI 上支持 [100 万令牌上下文窗口](https://docs.claude.com/zh-CN/docs/build-with-claude/context-windows#1m-token-context-window)。

100 万令牌上下文窗口目前处于测试版。要使用扩展上下文窗口，请在您的 Vertex AI 请求中包含 `context-1m-2025-08-07` 测试版标头。

[​](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)

故障排除
---------------------------------------------------------------------------------------------------

如果遇到配额问题：
*   通过 [Cloud Console](https://cloud.google.com/docs/quotas/view-manage) 检查当前配额或请求增加配额

如果遇到”模型未找到”404 错误：
*   确认模型在 [Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) 中已启用
*   验证您有权访问指定的区域
*   如果使用 `CLOUD_ML_REGION=global`，请检查您的模型是否在 [Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) 中的”支持的功能”下支持全局端点。对于不支持全局端点的模型，请执行以下任一操作： 
    *   通过 `ANTHROPIC_MODEL` 或 `ANTHROPIC_SMALL_FAST_MODEL` 指定支持的模型，或
    *   使用 `VERTEX_REGION_<MODEL_NAME>` 环境变量设置区域端点

如果遇到 429 错误：
*   对于区域端点，请确保主要模型和小型/快速模型在您选择的区域中受支持
*   考虑切换到 `CLOUD_ML_REGION=global` 以获得更好的可用性

[​](https://code.claude.com/docs/zh-CN/google-vertex-ai#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)

其他资源
---------------------------------------------------------------------------------------------------

*   [Vertex AI 文档](https://cloud.google.com/vertex-ai/docs)
*   [Vertex AI 定价](https://cloud.google.com/vertex-ai/pricing)
*   [Vertex AI 配额和限制](https://cloud.google.com/vertex-ai/docs/quotas)

[Amazon Bedrock](https://code.claude.com/docs/zh-CN/amazon-bedrock)[网络配置](https://code.claude.com/docs/zh-CN/network-config)

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
