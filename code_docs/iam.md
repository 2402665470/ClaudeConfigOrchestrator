<!-- Source: https://code.claude.com/docs/zh-CN/iam -->

Title: 身份和访问管理 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/iam

Markdown Content:
身份验证方法
------

设置 Claude Code 需要访问 Anthropic 模型。对于团队，您可以通过以下三种方式之一设置 Claude Code 访问：

*   通过 Claude 控制台的 Claude API
*   Amazon Bedrock
*   Google Vertex AI

### Claude API 身份验证

**通过 Claude API 为您的团队设置 Claude Code 访问：**

1.   使用您现有的 Claude 控制台账户或创建新的 Claude 控制台账户
2.   您可以通过以下任一方法添加用户： 
    *   从控制台内批量邀请用户（控制台 -> 设置 -> 成员 -> 邀请）
    *   [设置 SSO](https://support.claude.com/en/articles/10280258-setting-up-single-sign-on-on-the-api-console)

3.   邀请用户时，他们需要具有以下角色之一： 
    *   “Claude Code” 角色意味着用户只能创建 Claude Code API 密钥
    *   “Developer” 角色意味着用户可以创建任何类型的 API 密钥

4.   每个被邀请的用户需要完成以下步骤： 
    *   接受控制台邀请
    *   [检查系统要求](https://code.claude.com/docs/zh-CN/setup#system-requirements)
    *   [安装 Claude Code](https://code.claude.com/docs/zh-CN/setup#installation)
    *   使用控制台账户凭证登录

### 云提供商身份验证

**通过 Bedrock 或 Vertex 为您的团队设置 Claude Code 访问：**

1.   按照 [Bedrock 文档](https://code.claude.com/docs/zh-CN/amazon-bedrock) 或 [Vertex 文档](https://code.claude.com/docs/zh-CN/google-vertex-ai)
2.   将环境变量和生成云凭证的说明分发给您的用户。阅读有关如何 [在此处管理配置](https://code.claude.com/docs/zh-CN/settings) 的更多信息。
3.   用户可以 [安装 Claude Code](https://code.claude.com/docs/zh-CN/setup#installation)

访问控制和权限
-------

我们支持细粒度权限，以便您能够准确指定代理允许执行的操作（例如运行测试、运行 linter）和不允许执行的操作（例如更新云基础设施）。这些权限设置可以检入版本控制并分发给组织中的所有开发人员，也可以由个别开发人员自定义。

### 权限系统

Claude Code 使用分层权限系统来平衡功能和安全性：

| 工具类型 | 示例 | 需要批准 | ”是，不再询问”行为 |
| --- | --- | --- | --- |
| 只读 | 文件读取、LS、Grep | 否 | 不适用 |
| Bash 命令 | Shell 执行 | 是 | 每个项目目录和命令永久有效 |
| 文件修改 | 编辑/写入文件 | 是 | 直到会话结束 |

### 配置权限

您可以使用 `/permissions` 查看和管理 Claude Code 的工具权限。此 UI 列出所有权限规则及其来源的 settings.json 文件。

*   **Allow** 规则将允许 Claude Code 使用指定的工具，无需进一步的手动批准。
*   **Ask** 规则将在 Claude Code 尝试使用指定工具时要求用户确认。Ask 规则优先于 allow 规则。
*   **Deny** 规则将阻止 Claude Code 使用指定的工具。Deny 规则优先于 allow 和 ask 规则。
*   **Additional directories** 将 Claude 的文件访问权限扩展到初始工作目录之外的目录。
*   **Default mode** 控制 Claude 在遇到新请求时的权限行为。

权限规则使用格式：`Tool` 或 `Tool(optional-specifier)`仅为工具名称的规则匹配该工具的任何使用。例如，将 `Bash` 添加到允许规则列表将允许 Claude Code 使用 Bash 工具，无需用户批准。

#### 权限模式

Claude Code 支持多种权限模式，可以在 [settings 文件](https://code.claude.com/docs/zh-CN/settings#settings-files) 中设置为 `defaultMode`：

| 模式 | 描述 |
| --- | --- |
| `default` | 标准行为 - 在首次使用每个工具时提示权限 |
| `acceptEdits` | 自动接受会话的文件编辑权限 |
| `plan` | 计划模式 - Claude 可以分析但不能修改文件或执行命令 |
| `bypassPermissions` | 跳过所有权限提示（需要安全环境 - 见下面的警告） |

#### 工作目录

默认情况下，Claude 可以访问启动它的目录中的文件。您可以扩展此访问权限：

*   **启动期间**：使用 `--add-dir <path>` CLI 参数
*   **会话期间**：使用 `/add-dir` 斜杠命令
*   **持久配置**：添加到 [settings 文件](https://code.claude.com/docs/zh-CN/settings#settings-files) 中的 `additionalDirectories`

其他目录中的文件遵循与原始工作目录相同的权限规则 - 它们变为可读的，无需提示，文件编辑权限遵循当前权限模式。

#### 工具特定的权限规则

某些工具支持更细粒度的权限控制：**Bash**

*   `Bash(npm run build)` 匹配确切的 Bash 命令 `npm run build`
*   `Bash(npm run test:*)` 匹配以 `npm run test` 开头的 Bash 命令
*   `Bash(curl http://site.com/:*)` 匹配以 `curl http://site.com/` 开头的 curl 命令

**Read & Edit**`Edit` 规则适用于所有编辑文件的内置工具。Claude 将尽力将 `Read` 规则应用于所有读取文件的内置工具，如 Grep、Glob 和 LS。Read & Edit 规则都遵循 [gitignore](https://git-scm.com/docs/gitignore) 规范，具有四种不同的模式类型：

| 模式 | 含义 | 示例 | 匹配 |
| --- | --- | --- | --- |
| `//path` | 从文件系统根目录的**绝对**路径 | `Read(//Users/alice/secrets/**)` | `/Users/alice/secrets/**` |
| `~/path` | 从**主**目录的路径 | `Read(~/Documents/*.pdf)` | `/Users/alice/Documents/*.pdf` |
| `/path` | **相对于 settings 文件**的路径 | `Edit(/src/**/*.ts)` | `<settings file path>/src/**/*.ts` |
| `path` 或 `./path` | **相对于当前目录**的路径 | `Read(*.env)` | `<cwd>/*.env` |

*   `Edit(/docs/**)` - 编辑 `<project>/docs/` 中的文件（不是 `/docs/`！）
*   `Read(~/.zshrc)` - 读取您主目录的 `.zshrc`
*   `Edit(//tmp/scratch.txt)` - 编辑绝对路径 `/tmp/scratch.txt`
*   `Read(src/**)` - 从 `<current-directory>/src/` 读取

**WebFetch**

*   `WebFetch(domain:example.com)` 匹配对 example.com 的获取请求

**MCP**

*   `mcp__puppeteer` 匹配由 `puppeteer` 服务器提供的任何工具（名称在 Claude Code 中配置）
*   `mcp__puppeteer__puppeteer_navigate` 匹配由 `puppeteer` 服务器提供的 `puppeteer_navigate` 工具

### 使用钩子的其他权限控制

[Claude Code 钩子](https://code.claude.com/docs/zh-CN/hooks-guide) 提供了一种方法来注册自定义 shell 命令以在运行时执行权限评估。当 Claude Code 进行工具调用时，PreToolUse 钩子在权限系统运行之前运行，钩子输出可以确定是否批准或拒绝工具调用以代替权限系统。

### 企业托管策略设置

对于 Claude Code 的企业部署，我们支持企业托管策略设置，这些设置优先于用户和项目设置。这允许系统管理员强制执行用户无法覆盖的安全策略。系统管理员可以将策略部署到：

*   macOS：`/Library/Application Support/ClaudeCode/managed-settings.json`
*   Linux 和 WSL：`/etc/claude-code/managed-settings.json`
*   Windows：`C:\ProgramData\ClaudeCode\managed-settings.json`

这些策略文件遵循与常规 [settings 文件](https://code.claude.com/docs/zh-CN/settings#settings-files) 相同的格式，但不能被用户或项目设置覆盖。这确保了整个组织的一致安全策略。

### 设置优先级

当存在多个设置源时，它们按以下顺序应用（从高到低优先级）：

1.   企业策略
2.   命令行参数
3.   本地项目设置（`.claude/settings.local.json`）
4.   共享项目设置（`.claude/settings.json`）
5.   用户设置（`~/.claude/settings.json`）

此层次结构确保组织策略始终被强制执行，同时在适当的地方仍允许项目和用户级别的灵活性。

凭证管理
----

Claude Code 安全地管理您的身份验证凭证：

*   **存储位置**：在 macOS 上，API 密钥、OAuth 令牌和其他凭证存储在加密的 macOS Keychain 中。
*   **支持的身份验证类型**：Claude.ai 凭证、Claude API 凭证、Bedrock Auth 和 Vertex Auth。
*   **自定义凭证脚本**：[`apiKeyHelper`](https://code.claude.com/docs/zh-CN/settings#available-settings) 设置可以配置为运行返回 API 密钥的 shell 脚本。
*   **刷新间隔**：默认情况下，`apiKeyHelper` 在 5 分钟后或在 HTTP 401 响应时调用。设置 `CLAUDE_CODE_API_KEY_HELPER_TTL_MS` 环境变量以获得自定义刷新间隔。
