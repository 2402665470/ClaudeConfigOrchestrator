<!-- Source: https://code.claude.com/docs/zh-CN/devcontainer -->

Title: 开发容器 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/devcontainer

Markdown Content:
开发容器 - Claude Code Docs

===============

[跳转到主要内容](https://code.claude.com/docs/zh-CN/devcontainer#content-area)

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

开发容器

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
*   [主要功能](https://code.claude.com/docs/zh-CN/devcontainer#%E4%B8%BB%E8%A6%81%E5%8A%9F%E8%83%BD)
*   [4 步快速入门](https://code.claude.com/docs/zh-CN/devcontainer#4-%E6%AD%A5%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)
*   [配置分解](https://code.claude.com/docs/zh-CN/devcontainer#%E9%85%8D%E7%BD%AE%E5%88%86%E8%A7%A3)
*   [安全功能](https://code.claude.com/docs/zh-CN/devcontainer#%E5%AE%89%E5%85%A8%E5%8A%9F%E8%83%BD)
*   [自定义选项](https://code.claude.com/docs/zh-CN/devcontainer#%E8%87%AA%E5%AE%9A%E4%B9%89%E9%80%89%E9%A1%B9)
*   [示例用例](https://code.claude.com/docs/zh-CN/devcontainer#%E7%A4%BA%E4%BE%8B%E7%94%A8%E4%BE%8B)
*   [安全的客户端工作](https://code.claude.com/docs/zh-CN/devcontainer#%E5%AE%89%E5%85%A8%E7%9A%84%E5%AE%A2%E6%88%B7%E7%AB%AF%E5%B7%A5%E4%BD%9C)
*   [团队入职](https://code.claude.com/docs/zh-CN/devcontainer#%E5%9B%A2%E9%98%9F%E5%85%A5%E8%81%8C)
*   [一致的 CI/CD 环境](https://code.claude.com/docs/zh-CN/devcontainer#%E4%B8%80%E8%87%B4%E7%9A%84-ci%2Fcd-%E7%8E%AF%E5%A2%83)
*   [相关资源](https://code.claude.com/docs/zh-CN/devcontainer#%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)

部署

开发容器
====

复制页面

了解 Claude Code 开发容器，为需要一致、安全环境的团队提供解决方案。

复制页面

参考 [devcontainer 设置](https://github.com/anthropics/claude-code/tree/main/.devcontainer) 和相关的 [Dockerfile](https://github.com/anthropics/claude-code/blob/main/.devcontainer/Dockerfile) 提供了一个预配置的开发容器，您可以按原样使用或根据需要自定义。此 devcontainer 与 Visual Studio Code [Dev Containers 扩展](https://code.visualstudio.com/docs/devcontainers/containers) 和类似工具兼容。容器的增强安全措施（隔离和防火墙规则）允许您运行 `claude --dangerously-skip-permissions` 来绕过权限提示以进行无人值守操作。

虽然 devcontainer 提供了实质性的保护，但没有任何系统完全免疫所有攻击。 当使用 `--dangerously-skip-permissions` 执行时，devcontainer 不会阻止恶意项目泄露 devcontainer 中可访问的任何内容，包括 Claude Code 凭证。 我们建议仅在使用受信任的存储库进行开发时使用 devcontainer。 始终保持良好的安全实践并监控 Claude 的活动。

[​](https://code.claude.com/docs/zh-CN/devcontainer#%E4%B8%BB%E8%A6%81%E5%8A%9F%E8%83%BD)

主要功能
-----------------------------------------------------------------------------------------------

*   **生产就绪的 Node.js**：基于 Node.js 20 构建，包含必要的开发依赖项
*   **安全设计**：自定义防火墙限制网络访问仅限于必要的服务
*   **开发者友好的工具**：包括 git、ZSH 及生产力增强功能、fzf 等
*   **无缝 VS Code 集成**：预配置的扩展和优化的设置
*   **会话持久性**：在容器重启之间保留命令历史和配置
*   **随处可用**：兼容 macOS、Windows 和 Linux 开发环境

[​](https://code.claude.com/docs/zh-CN/devcontainer#4-%E6%AD%A5%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)

4 步快速入门
-------------------------------------------------------------------------------------------------------------

1.   安装 VS Code 和 Remote - Containers 扩展
2.   克隆 [Claude Code 参考实现](https://github.com/anthropics/claude-code/tree/main/.devcontainer) 存储库
3.   在 VS Code 中打开存储库
4.   出现提示时，点击”在容器中重新打开”（或使用命令面板：Cmd+Shift+P → “Remote-Containers: Reopen in Container”）

[​](https://code.claude.com/docs/zh-CN/devcontainer#%E9%85%8D%E7%BD%AE%E5%88%86%E8%A7%A3)

配置分解
-----------------------------------------------------------------------------------------------

devcontainer 设置由三个主要组件组成：
*   [**devcontainer.json**](https://github.com/anthropics/claude-code/blob/main/.devcontainer/devcontainer.json)：控制容器设置、扩展和卷挂载
*   [**Dockerfile**](https://github.com/anthropics/claude-code/blob/main/.devcontainer/Dockerfile)：定义容器镜像和已安装的工具
*   [**init-firewall.sh**](https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh)：建立网络安全规则

[​](https://code.claude.com/docs/zh-CN/devcontainer#%E5%AE%89%E5%85%A8%E5%8A%9F%E8%83%BD)

安全功能
-----------------------------------------------------------------------------------------------

容器通过其防火墙配置实现多层安全方法：
*   **精确访问控制**：将出站连接限制为仅白名单域（npm 注册表、GitHub、Claude API 等）
*   **允许的出站连接**：防火墙允许出站 DNS 和 SSH 连接
*   **默认拒绝策略**：阻止所有其他外部网络访问
*   **启动验证**：容器初始化时验证防火墙规则
*   **隔离**：创建与主系统分离的安全开发环境

[​](https://code.claude.com/docs/zh-CN/devcontainer#%E8%87%AA%E5%AE%9A%E4%B9%89%E9%80%89%E9%A1%B9)

自定义选项
---------------------------------------------------------------------------------------------------------

devcontainer 配置设计为适应您的需求：
*   根据您的工作流添加或删除 VS Code 扩展
*   为不同的硬件环境修改资源分配
*   调整网络访问权限
*   自定义 shell 配置和开发者工具

[​](https://code.claude.com/docs/zh-CN/devcontainer#%E7%A4%BA%E4%BE%8B%E7%94%A8%E4%BE%8B)

示例用例
-----------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/devcontainer#%E5%AE%89%E5%85%A8%E7%9A%84%E5%AE%A2%E6%88%B7%E7%AB%AF%E5%B7%A5%E4%BD%9C)

安全的客户端工作

使用 devcontainer 隔离不同的客户端项目，确保代码和凭证在环境之间不会混合。
### [​](https://code.claude.com/docs/zh-CN/devcontainer#%E5%9B%A2%E9%98%9F%E5%85%A5%E8%81%8C)

团队入职

新团队成员可以在几分钟内获得完全配置的开发环境，所有必要的工具和设置都已预安装。
### [​](https://code.claude.com/docs/zh-CN/devcontainer#%E4%B8%80%E8%87%B4%E7%9A%84-ci/cd-%E7%8E%AF%E5%A2%83)

一致的 CI/CD 环境

在 CI/CD 管道中镜像您的 devcontainer 配置，以确保开发和生产环境相匹配。
[​](https://code.claude.com/docs/zh-CN/devcontainer#%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)

相关资源
-----------------------------------------------------------------------------------------------

*   [VS Code devcontainer 文档](https://code.visualstudio.com/docs/devcontainers/containers)
*   [Claude Code 安全最佳实践](https://code.claude.com/docs/zh-CN/security)
*   [企业网络配置](https://code.claude.com/docs/zh-CN/network-config)

[LLM gateway](https://code.claude.com/docs/zh-CN/llm-gateway)[沙箱隔离](https://code.claude.com/docs/zh-CN/sandboxing)

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
