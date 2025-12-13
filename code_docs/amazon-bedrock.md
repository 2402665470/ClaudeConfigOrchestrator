<!-- Source: https://code.claude.com/docs/zh-CN/amazon-bedrock -->

Title: Amazon Bedrock 上的 Claude Code - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/amazon-bedrock

Markdown Content:
前置条件
----

在使用 Bedrock 配置 Claude Code 之前，请确保您拥有：

*   启用了 Bedrock 访问权限的 AWS 账户
*   可以访问 Bedrock 中所需的 Claude 模型（例如 Claude Sonnet 4.5）
*   已安装并配置 AWS CLI（可选 - 仅在您没有其他获取凭证的机制时需要）
*   适当的 IAM 权限

设置
--

### 1. 提交用例详情

Anthropic 模型的首次用户需要在调用模型之前提交用例详情。这在每个账户中只需执行一次。

1.   确保您拥有正确的 IAM 权限（请参阅下面的更多信息）
2.   导航到 [Amazon Bedrock 控制台](https://console.aws.amazon.com/bedrock/)
3.   选择 **Chat/Text playground**
4.   选择任何 Anthropic 模型，您将被提示填写用例表单

### 2. 配置 AWS 凭证

Claude Code 使用默认的 AWS SDK 凭证链。使用以下方法之一设置您的凭证：**选项 A：AWS CLI 配置**

```
aws configure
```

**选项 B：环境变量（访问密钥）**

```
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_SESSION_TOKEN=your-session-token
```

**选项 C：环境变量（SSO 配置文件）**

```
aws sso login --profile=<your-profile-name>

export AWS_PROFILE=your-profile-name
```

**选项 D：Bedrock API 密钥**

```
export AWS_BEARER_TOKEN_BEDROCK=your-bedrock-api-key
```

Bedrock API 密钥提供了一种更简单的身份验证方法，无需完整的 AWS 凭证。[了解有关 Bedrock API 密钥的更多信息](https://aws.amazon.com/blogs/machine-learning/accelerate-ai-development-with-amazon-bedrock-api-keys/)。

#### 高级凭证配置

Claude Code 支持 AWS SSO 和企业身份提供商的自动凭证刷新。将这些设置添加到您的 Claude Code 设置文件中（请参阅 [Settings](https://code.claude.com/docs/zh-CN/settings) 了解文件位置）。当 Claude Code 检测到您的 AWS 凭证已过期（基于本地时间戳或当 Bedrock 返回凭证错误时），它将自动运行您配置的 `awsAuthRefresh` 和/或 `awsCredentialExport` 命令来获取新凭证，然后重试请求。

##### 示例配置

```
{
  "awsAuthRefresh": "aws sso login --profile myprofile",
  "env": {
    "AWS_PROFILE": "myprofile"
  }
}
```

##### 配置设置说明

**`awsAuthRefresh`**：用于修改 `.aws` 目录的命令（例如更新凭证、SSO 缓存或配置文件）。输出显示给用户（但不支持用户输入），适合基于浏览器的身份验证流程，其中 CLI 显示要在浏览器中输入的代码。**`awsCredentialExport`**：仅在您无法修改 `.aws` 且必须直接返回凭证时使用。输出被静默捕获（不显示给用户）。该命令必须以以下格式输出 JSON：

```
{
  "Credentials": {
    "AccessKeyId": "value",
    "SecretAccessKey": "value",
    "SessionToken": "value"
  }
}
```

### 3. 配置 Claude Code

设置以下环境变量以启用 Bedrock：

```
# 启用 Bedrock 集成
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1  # 或您首选的区域

# 可选：覆盖小型/快速模型 (Haiku) 的区域
export ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION=us-west-2
```

为 Claude Code 启用 Bedrock 时，请记住以下几点：

*   `AWS_REGION` 是必需的环境变量。Claude Code 不会从 `.aws` 配置文件中读取此设置。
*   使用 Bedrock 时，`/login` 和 `/logout` 命令被禁用，因为身份验证通过 AWS 凭证处理。
*   您可以使用设置文件来处理环境变量（如 `AWS_PROFILE`），这些变量您不想泄露给其他进程。有关更多信息，请参阅 [Settings](https://code.claude.com/docs/zh-CN/settings)。

### 4. 模型配置

Claude Code 为 Bedrock 使用这些默认模型：

| 模型类型 | 默认值 |
| --- | --- |
| 主模型 | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| 小型/快速模型 | `us.anthropic.claude-haiku-4-5-20251001-v1:0` |

要自定义模型，请使用以下方法之一：

```
# 使用推理配置文件 ID
export ANTHROPIC_MODEL='global.anthropic.claude-sonnet-4-5-20250929-v1:0'
export ANTHROPIC_SMALL_FAST_MODEL='us.anthropic.claude-haiku-4-5-20251001-v1:0'

# 使用应用推理配置文件 ARN
export ANTHROPIC_MODEL='arn:aws:bedrock:us-east-2:your-account-id:application-inference-profile/your-model-id'

# 可选：如果需要，禁用提示缓存
export DISABLE_PROMPT_CACHING=1
```

### 5. 输出令牌配置

在使用 Claude Code 与 Amazon Bedrock 时，我们建议以下令牌设置：

```
# Bedrock 的推荐输出令牌设置
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
export MAX_THINKING_TOKENS=1024
```

**这些值的原因：**

*   **`CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096`**：Bedrock 的燃尽限流逻辑将 4096 令牌的最小值设置为 max_token 惩罚。设置较低的值不会降低成本，但可能会截断长工具使用，导致 Claude Code 代理循环持续失败。Claude Code 通常在没有扩展思考的情况下使用少于 4096 个输出令牌，但对于涉及大量文件创建或 Write 工具使用的任务可能需要这个余量。
*   **`MAX_THINKING_TOKENS=1024`**：这为扩展思考提供了空间，而不会截断工具使用响应，同时仍保持专注的推理链。这种平衡有助于防止对编码任务不总是有帮助的轨迹变化。

IAM 配置
------

创建具有 Claude Code 所需权限的 IAM 策略：

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowModelAndInferenceProfileAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListInferenceProfiles"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:inference-profile/*",
        "arn:aws:bedrock:*:*:application-inference-profile/*",
        "arn:aws:bedrock:*:*:foundation-model/*"
      ]
    },
    {
      "Sid": "AllowMarketplaceSubscription",
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:CalledViaLast": "bedrock.amazonaws.com"
        }
      }
    }
  ]
}
```

对于更严格的权限，您可以将 Resource 限制为特定的推理配置文件 ARN。有关详细信息，请参阅 [Bedrock IAM 文档](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)。

故障排除
----

如果您遇到区域问题：

*   检查模型可用性：`aws bedrock list-inference-profiles --region your-region`
*   切换到支持的区域：`export AWS_REGION=us-east-1`
*   考虑使用推理配置文件进行跨区域访问

如果您收到错误”不支持按需吞吐量”：

*   将模型指定为[推理配置文件](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html) ID

Claude Code 使用 Bedrock [Invoke API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModelWithResponseStream.html)，不支持 Converse API。

其他资源
----

*   [Bedrock 文档](https://docs.aws.amazon.com/bedrock/)
*   [Bedrock 定价](https://aws.amazon.com/bedrock/pricing/)
*   [Bedrock 推理配置文件](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)
*   [Amazon Bedrock 上的 Claude Code：快速设置指南](https://community.aws/content/2tXkZKrZzlrlu0KfH8gST5Dkppq/claude-code-on-amazon-bedrock-quick-setup-guide)
*   [Claude Code 监控实现 (Bedrock)](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/blob/main/assets/docs/MONITORING.md)
