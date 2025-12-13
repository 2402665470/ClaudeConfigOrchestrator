<!-- Source: https://code.claude.com/docs/zh-CN/network-config -->

Title: 企业网络配置 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/network-config

Markdown Content:
企业网络配置 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/network-config#content-area)

[Claude Code Docs home page![Image 1: light logo](https://mintcdn.com/claude-code/o69F7a6qoW9vboof/logo/light.svg?fit=max&auto=format&n=o69F7a6qoW9vboof&q=85&s=536eade682636e84231afce2577f9509)![Image 2: dark logo](https://mintcdn.com/claude-code/o69F7a6qoW9vboof/logo/dark.svg?fit=max&auto=format&n=o69F7a6qoW9vboof&q=85&s=0766b3221061e80143e9f300733e640b)](https://code.claude.com/docs)

![Image 3: CN](https://d3gk2c5xim1je2.cloudfront.net/flags/CN.svg)

简体中文

搜索...

⌘K

*   [Claude Developer Platform](https://platform.claude.com/)
*   [Claude Code on the Web](https://claude.ai/code)
*   [Claude Code on the Web](https://claude.ai/code)

搜索...

Navigation

部署

企业网络配置

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
*   [代理配置](https://code.claude.com/docs/zh-CN/network-config#%E4%BB%A3%E7%90%86%E9%85%8D%E7%BD%AE)
*   [环境变量](https://code.claude.com/docs/zh-CN/network-config#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
*   [基本身份验证](https://code.claude.com/docs/zh-CN/network-config#%E5%9F%BA%E6%9C%AC%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)
*   [自定义 CA 证书](https://code.claude.com/docs/zh-CN/network-config#%E8%87%AA%E5%AE%9A%E4%B9%89-ca-%E8%AF%81%E4%B9%A6)
*   [mTLS 身份验证](https://code.claude.com/docs/zh-CN/network-config#mtls-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)
*   [网络访问要求](https://code.claude.com/docs/zh-CN/network-config#%E7%BD%91%E7%BB%9C%E8%AE%BF%E9%97%AE%E8%A6%81%E6%B1%82)
*   [其他资源](https://code.claude.com/docs/zh-CN/network-config#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)

部署

企业网络配置
======

复制页面

为企业环境配置 Claude Code，支持代理服务器、自定义证书颁发机构 (CA) 和相互传输层安全 (mTLS) 身份验证。

复制页面

Claude Code 通过环境变量支持各种企业网络和安全配置。这包括通过公司代理服务器路由流量、信任自定义证书颁发机构 (CA) 以及使用相互传输层安全 (mTLS) 证书进行身份验证以增强安全性。

本页面显示的所有环境变量也可以在 [`settings.json`](https://code.claude.com/docs/zh-CN/settings) 中配置。

[​](https://code.claude.com/docs/zh-CN/network-config#%E4%BB%A3%E7%90%86%E9%85%8D%E7%BD%AE)

代理配置
-------------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/network-config#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)

环境变量

Claude Code 遵守标准代理环境变量：

复制

询问AI

```
# HTTPS 代理（推荐）
export HTTPS_PROXY=https://proxy.example.com:8080

# HTTP 代理（如果 HTTPS 不可用）
export HTTP_PROXY=http://proxy.example.com:8080

# 绕过特定请求的代理 - 空格分隔格式
export NO_PROXY="localhost 192.168.1.1 example.com .example.com"
# 绕过特定请求的代理 - 逗号分隔格式
export NO_PROXY="localhost,192.168.1.1,example.com,.example.com"
# 绕过所有请求的代理
export NO_PROXY="*"
```

Claude Code 不支持 SOCKS 代理。

### [​](https://code.claude.com/docs/zh-CN/network-config#%E5%9F%BA%E6%9C%AC%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)

基本身份验证

如果您的代理需要基本身份验证，请在代理 URL 中包含凭据：

复制

询问AI

```
export HTTPS_PROXY=http://username:password@proxy.example.com:8080
```

避免在脚本中硬编码密码。改用环境变量或安全凭据存储。

对于需要高级身份验证（NTLM、Kerberos 等）的代理，请考虑使用支持您的身份验证方法的 LLM 网关服务。

[​](https://code.claude.com/docs/zh-CN/network-config#%E8%87%AA%E5%AE%9A%E4%B9%89-ca-%E8%AF%81%E4%B9%A6)

自定义 CA 证书
-------------------------------------------------------------------------------------------------------------------

如果您的企业环境使用自定义 CA 进行 HTTPS 连接（无论是通过代理还是直接 API 访问），请配置 Claude Code 以信任它们：

复制

询问AI

```
export NODE_EXTRA_CA_CERTS=/path/to/ca-cert.pem
```

[​](https://code.claude.com/docs/zh-CN/network-config#mtls-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)

mTLS 身份验证
-----------------------------------------------------------------------------------------------------------

对于需要客户端证书身份验证的企业环境：

复制

询问AI

```
# 用于身份验证的客户端证书
export CLAUDE_CODE_CLIENT_CERT=/path/to/client-cert.pem

# 客户端私钥
export CLAUDE_CODE_CLIENT_KEY=/path/to/client-key.pem

# 可选：加密私钥的密码短语
export CLAUDE_CODE_CLIENT_KEY_PASSPHRASE="your-passphrase"
```

[​](https://code.claude.com/docs/zh-CN/network-config#%E7%BD%91%E7%BB%9C%E8%AE%BF%E9%97%AE%E8%A6%81%E6%B1%82)

网络访问要求
---------------------------------------------------------------------------------------------------------------------

Claude Code 需要访问以下 URL：
*   `api.anthropic.com` - Claude API 端点
*   `claude.ai` - WebFetch 保护措施
*   `statsig.anthropic.com` - 遥测和指标
*   `sentry.io` - 错误报告

确保这些 URL 在您的代理配置和防火墙规则中被列入白名单。在容器化或受限网络环境中使用 Claude Code 时，这一点尤为重要。
[​](https://code.claude.com/docs/zh-CN/network-config#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)

其他资源
-------------------------------------------------------------------------------------------------

*   [Claude Code 设置](https://code.claude.com/docs/zh-CN/settings)
*   [环境变量参考](https://code.claude.com/docs/zh-CN/settings#environment-variables)
*   [故障排除指南](https://code.claude.com/docs/zh-CN/troubleshooting)

[Google Vertex AI](https://code.claude.com/docs/zh-CN/google-vertex-ai)[LLM gateway](https://code.claude.com/docs/zh-CN/llm-gateway)

⌘I

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
