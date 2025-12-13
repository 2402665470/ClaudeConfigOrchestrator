<!-- Source: https://code.claude.com/docs/zh-CN/llm-gateway -->

Title: LLM gateway 配置 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/llm-gateway

Markdown Content:
LLM gateway 提供了 Claude Code 和模型提供商之间的集中代理层，提供以下功能：

*   **集中身份验证** - API 密钥管理的单一入口
*   **使用情况跟踪** - 监控跨团队和项目的使用情况
*   **成本控制** - 实施预算和速率限制
*   **审计日志** - 跟踪所有模型交互以实现合规性
*   **模型路由** - 无需更改代码即可在提供商之间切换

LiteLLM 配置
----------

### 前置条件

*   Claude Code 已更新到最新版本
*   LiteLLM Proxy Server 已部署且可访问
*   可通过您选择的提供商访问 Claude 模型

### 基本 LiteLLM 设置

**配置 Claude Code**：

#### 身份验证方法

##### 静态 API 密钥

使用固定 API 密钥的最简单方法：

```
# 在环境中设置
export ANTHROPIC_AUTH_TOKEN=sk-litellm-static-key

# 或在 Claude Code 设置中
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key"
  }
}
```

此值将作为 `Authorization` 标头发送。

##### 使用辅助程序的动态 API 密钥

用于轮换密钥或按用户身份验证：

1.   创建 API 密钥辅助程序脚本：

```
#!/bin/bash
# ~/bin/get-litellm-key.sh

# 示例：从保险库获取密钥
vault kv get -field=api_key secret/litellm/claude-code

# 示例：生成 JWT 令牌
jwt encode \
  --secret="${JWT_SECRET}" \
  --exp="+1h" \
  '{"user":"'${USER}'","team":"engineering"}'
```

1.   配置 Claude Code 设置以使用辅助程序：

```
{
  "apiKeyHelper": "~/bin/get-litellm-key.sh"
}
```

1.   设置令牌刷新间隔：

```
# 每小时刷新一次（3600000 毫秒）
export CLAUDE_CODE_API_KEY_HELPER_TTL_MS=3600000
```

此值将作为 `Authorization` 和 `X-Api-Key` 标头发送。`apiKeyHelper` 的优先级低于 `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY`。

#### 统一端点（推荐）

使用 LiteLLM 的 [Anthropic 格式端点](https://docs.litellm.ai/docs/anthropic_unified)：

```
export ANTHROPIC_BASE_URL=https://litellm-server:4000
```

**统一端点相对于传递端点的优势：**

*   负载均衡
*   故障转移
*   对成本跟踪和最终用户跟踪的一致支持

#### 特定于提供商的传递端点（替代方案）

##### 通过 LiteLLM 的 Claude API

使用 [传递端点](https://docs.litellm.ai/docs/pass_through/anthropic_completion)：

```
export ANTHROPIC_BASE_URL=https://litellm-server:4000/anthropic
```

##### 通过 LiteLLM 的 Amazon Bedrock

使用 [传递端点](https://docs.litellm.ai/docs/pass_through/bedrock)：

```
export ANTHROPIC_BEDROCK_BASE_URL=https://litellm-server:4000/bedrock
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1
export CLAUDE_CODE_USE_BEDROCK=1
```

##### 通过 LiteLLM 的 Google Vertex AI

使用 [传递端点](https://docs.litellm.ai/docs/pass_through/vertex_ai)：

```
export ANTHROPIC_VERTEX_BASE_URL=https://litellm-server:4000/vertex_ai/v1
export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
export CLAUDE_CODE_SKIP_VERTEX_AUTH=1
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-east5
```

### 模型选择

默认情况下，模型将使用 [模型配置](https://code.claude.com/docs/zh-CN/third-party-integrations#model-configuration) 中指定的模型。如果您在 LiteLLM 中配置了自定义模型名称，请将上述环境变量设置为这些自定义名称。有关更详细的信息，请参阅 [LiteLLM 文档](https://docs.litellm.ai/)。

其他资源
----

*   [LiteLLM 文档](https://docs.litellm.ai/)
*   [Claude Code 设置](https://code.claude.com/docs/zh-CN/settings)
*   [企业网络配置](https://code.claude.com/docs/zh-CN/network-config)
*   [第三方集成概述](https://code.claude.com/docs/zh-CN/third-party-integrations)
