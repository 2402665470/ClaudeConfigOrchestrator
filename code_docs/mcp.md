<!-- Source: https://code.claude.com/docs/zh-CN/mcp -->

Title: 通过 MCP 将 Claude Code 连接到工具 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/mcp

Markdown Content:
Claude Code 可以通过 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction)（一个用于 AI 工具集成的开源标准）连接到数百个外部工具和数据源。MCP 服务器为 Claude Code 提供对您的工具、数据库和 API 的访问权限。

连接 MCP 服务器后，您可以要求 Claude Code：

*   **从问题跟踪器实现功能**：“添加 JIRA 问题 ENG-4521 中描述的功能，并在 GitHub 上创建 PR。”
*   **分析监控数据**：“检查 Sentry 和 Statsig 以检查 ENG-4521 中描述的功能的使用情况。”
*   **查询数据库**：“根据我们的 Postgres 数据库，查找使用功能 ENG-4521 的 10 个随机用户的电子邮件。”
*   **集成设计**：“根据在 Slack 中发布的新 Figma 设计更新我们的标准电子邮件模板”
*   **自动化工作流**：“创建 Gmail 草稿，邀请这 10 个用户参加关于新功能的反馈会议。“

热门 MCP 服务器
----------

以下是一些您可以连接到 Claude Code 的常用 MCP 服务器：

安装 MCP 服务器
----------

MCP 服务器可以根据您的需求以三种不同的方式进行配置：

### 选项 1：添加远程 HTTP 服务器

HTTP 服务器是连接到远程 MCP 服务器的推荐选项。这是云服务最广泛支持的传输方式。

```
# 基本语法
claude mcp add --transport http <name> <url>

# 真实示例：连接到 Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# 带有 Bearer 令牌的示例
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### 选项 2：添加远程 SSE 服务器

```
# 基本语法
claude mcp add --transport sse <name> <url>

# 真实示例：连接到 Asana
claude mcp add --transport sse asana https://mcp.asana.com/sse

# 带有身份验证标头的示例
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

### 选项 3：添加本地 stdio 服务器

Stdio 服务器作为本地进程在您的计算机上运行。它们非常适合需要直接系统访问或自定义脚本的工具。

```
# 基本语法
claude mcp add --transport stdio <name> <command> [args...]

# 真实示例：添加 Airtable 服务器
claude mcp add --transport stdio airtable --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server
```

### 管理您的服务器

配置后，您可以使用以下命令管理 MCP 服务器：

```
# 列出所有已配置的服务器
claude mcp list

# 获取特定服务器的详细信息
claude mcp get github

# 删除服务器
claude mcp remove github

# （在 Claude Code 中）检查服务器状态
/mcp
```

### 插件提供的 MCP 服务器

[插件](https://code.claude.com/docs/zh-CN/plugins)可以捆绑 MCP 服务器，在启用插件时自动提供工具和集成。插件 MCP 服务器的工作方式与用户配置的服务器相同。**插件 MCP 服务器的工作原理**：

*   插件在插件根目录的 `.mcp.json` 中或在 `plugin.json` 中内联定义 MCP 服务器
*   启用插件时，其 MCP 服务器会自动启动
*   插件 MCP 工具与手动配置的 MCP 工具一起出现
*   插件服务器通过插件安装进行管理（不是 `/mcp` 命令）

**示例插件 MCP 配置**：在插件根目录的 `.mcp.json` 中：

```
{
  "database-tools": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
    "env": {
      "DB_URL": "${DB_URL}"
    }
  }
}
```

或在 `plugin.json` 中内联：

```
{
  "name": "my-plugin",
  "mcpServers": {
    "plugin-api": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
      "args": ["--port", "8080"]
    }
  }
}
```

**插件 MCP 功能**：

*   **自动生命周期**：服务器在插件启用时启动，但您必须重新启动 Claude Code 以应用 MCP 服务器更改（启用或禁用）
*   **环境变量**：使用 `${CLAUDE_PLUGIN_ROOT}` 表示插件相对路径
*   **用户环境访问**：访问与手动配置的服务器相同的环境变量
*   **多种传输类型**：支持 stdio、SSE 和 HTTP 传输（传输支持可能因服务器而异）

**查看插件 MCP 服务器**：

```
# 在 Claude Code 中，查看所有 MCP 服务器，包括插件服务器
/mcp
```

插件服务器在列表中出现，并带有指示它们来自插件的指示符。**插件 MCP 服务器的优势**：

*   **捆绑分发**：工具和服务器打包在一起
*   **自动设置**：无需手动 MCP 配置
*   **团队一致性**：安装插件时，每个人都获得相同的工具

有关使用插件捆绑 MCP 服务器的详细信息，请参阅[插件组件参考](https://code.claude.com/docs/zh-CN/plugins-reference#mcp-servers)。

MCP 安装范围
--------

MCP 服务器可以在三个不同的范围级别进行配置，每个级别都用于管理服务器可访问性和共享的不同目的。了解这些范围可以帮助您确定为特定需求配置服务器的最佳方式。

### 本地范围

本地范围的服务器代表默认配置级别，存储在您的项目特定用户设置中。这些服务器对您保持私密，仅在当前项目目录中工作时可访问。此范围非常适合个人开发服务器、实验配置或包含不应共享的敏感凭证的服务器。

```
# 添加本地范围的服务器（默认）
claude mcp add --transport http stripe https://mcp.stripe.com

# 显式指定本地范围
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
```

### 项目范围

项目范围的服务器通过在项目根目录中存储配置到 `.mcp.json` 文件来启用团队协作。此文件设计为检入版本控制，确保所有团队成员都可以访问相同的 MCP 工具和服务。添加项目范围的服务器时，Claude Code 会自动创建或更新此文件，使用适当的配置结构。

```
# 添加项目范围的服务器
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
```

生成的 `.mcp.json` 文件遵循标准化格式：

```
{
  "mcpServers": {
    "shared-server": {
      "command": "/path/to/server",
      "args": [],
      "env": {}
    }
  }
}
```

出于安全原因，Claude Code 在使用来自 `.mcp.json` 文件的项目范围服务器之前会提示批准。如果您需要重置这些批准选择，请使用 `claude mcp reset-project-choices` 命令。

### 用户范围

用户范围的服务器提供跨项目可访问性，使其在您计算机上的所有项目中可用，同时对您的用户帐户保持私密。此范围适用于个人实用程序服务器、开发工具或您在不同项目中经常使用的服务。

```
# 添加用户服务器
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

### 选择正确的范围

根据以下条件选择您的范围：

*   **本地范围**：个人服务器、实验配置或特定于一个项目的敏感凭证
*   **项目范围**：团队共享服务器、项目特定工具或协作所需的服务
*   **用户范围**：跨多个项目需要的个人实用程序、开发工具或经常使用的服务

### 范围层次结构和优先级

MCP 服务器配置遵循明确的优先级层次结构。当具有相同名称的服务器存在于多个范围时，系统通过首先优先考虑本地范围的服务器、其次是项目范围的服务器，最后是用户范围的服务器来解决冲突。此设计确保个人配置可以在需要时覆盖共享配置。

### `.mcp.json` 中的环境变量扩展

Claude Code 支持 `.mcp.json` 文件中的环境变量扩展，允许团队共享配置，同时保持对计算机特定路径和 API 密钥等敏感值的灵活性。**支持的语法：**

*   `${VAR}` - 扩展为环境变量 `VAR` 的值
*   `${VAR:-default}` - 如果设置了 `VAR`，则扩展为 `VAR`，否则使用 `default`

**扩展位置：** 环境变量可以在以下位置扩展：

*   `command` - 服务器可执行文件路径
*   `args` - 命令行参数
*   `env` - 传递给服务器的环境变量
*   `url` - 对于 HTTP 服务器类型
*   `headers` - 对于 HTTP 服务器身份验证

**带有变量扩展的示例：**

```
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

如果未设置必需的环境变量且没有默认值，Claude Code 将无法解析配置。

实际示例
----

### 示例：使用 Sentry 监控错误

```
# 1. 添加 Sentry MCP 服务器
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# 2. 使用 /mcp 对您的 Sentry 帐户进行身份验证
> /mcp

# 3. 调试生产问题
> "过去 24 小时内最常见的错误是什么？"
> "显示错误 ID abc123 的堆栈跟踪"
> "哪个部署引入了这些新错误？"
```

### 示例：连接到 GitHub 进行代码审查

```
# 1. 添加 GitHub MCP 服务器
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# 2. 在 Claude Code 中，如果需要进行身份验证
> /mcp
# 为 GitHub 选择"身份验证"

# 3. 现在您可以要求 Claude 使用 GitHub
> "审查 PR #456 并建议改进"
> "为我们刚发现的错误创建新问题"
> "显示分配给我的所有打开的 PR"
```

### 示例：查询您的 PostgreSQL 数据库

```
# 1. 使用您的连接字符串添加数据库服务器
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:[email protected]:5432/analytics"

# 2. 自然地查询您的数据库
> "本月我们的总收入是多少？"
> "显示订单表的架构"
> "查找 90 天内未进行购买的客户"
```

使用远程 MCP 服务器进行身份验证
------------------

许多基于云的 MCP 服务器需要身份验证。Claude Code 支持 OAuth 2.0 以实现安全连接。

1

2

从 JSON 配置添加 MCP 服务器
-------------------

如果您有 MCP 服务器的 JSON 配置，可以直接添加它：

1

2

从 Claude Desktop 导入 MCP 服务器
---------------------------

如果您已在 Claude Desktop 中配置了 MCP 服务器，可以导入它们：

1

2

3

将 Claude Code 用作 MCP 服务器
------------------------

您可以将 Claude Code 本身用作 MCP 服务器，其他应用程序可以连接到它：

```
# 启动 Claude 作为 stdio MCP 服务器
claude mcp serve
```

您可以通过将此配置添加到 claude_desktop_config.json 在 Claude Desktop 中使用它：

```
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "claude",
      "args": ["mcp", "serve"],
      "env": {}
    }
  }
}
```

MCP 输出限制和警告
-----------

当 MCP 工具产生大量输出时，Claude Code 可帮助管理令牌使用情况，以防止压倒您的对话上下文：

*   **输出警告阈值**：当任何 MCP 工具输出超过 10,000 个令牌时，Claude Code 显示警告
*   **可配置限制**：您可以使用 `MAX_MCP_OUTPUT_TOKENS` 环境变量调整最大允许的 MCP 输出令牌
*   **默认限制**：默认最大值为 25,000 个令牌

要增加产生大量输出的工具的限制：

```
# 为 MCP 工具输出设置更高的限制
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

这在使用以下 MCP 服务器时特别有用：

*   查询大型数据集或数据库
*   生成详细的报告或文档
*   处理大量日志文件或调试信息

使用 MCP 资源
---------

MCP 服务器可以暴露资源，您可以使用 @ 提及来引用这些资源，类似于引用文件的方式。

### 引用 MCP 资源

1

2

3

将 MCP 提示用作斜杠命令
--------------

MCP 服务器可以暴露提示，这些提示在 Claude Code 中作为斜杠命令可用。

### 执行 MCP 提示

1

2

3

企业 MCP 配置
---------

对于需要对 MCP 服务器进行集中控制的组织，Claude Code 支持企业管理的 MCP 配置。这允许 IT 管理员：

*   **控制员工可以访问哪些 MCP 服务器**：在整个组织中部署一组标准化的已批准 MCP 服务器
*   **防止未授权的 MCP 服务器**：可选择限制用户添加自己的 MCP 服务器
*   **完全禁用 MCP**：如果需要，完全删除 MCP 功能

### 设置企业 MCP 配置

系统管理员可以在托管设置文件旁边部署企业 MCP 配置文件：

*   **macOS**：`/Library/Application Support/ClaudeCode/managed-mcp.json`
*   **Windows**：`C:\ProgramData\ClaudeCode\managed-mcp.json`
*   **Linux**：`/etc/claude-code/managed-mcp.json`

`managed-mcp.json` 文件使用与标准 `.mcp.json` 文件相同的格式：

```
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    },
    "company-internal": {
      "type": "stdio",
      "command": "/usr/local/bin/company-mcp-server",
      "args": ["--config", "/etc/company/mcp-config.json"],
      "env": {
        "COMPANY_API_URL": "https://internal.company.com"
      }
    }
  }
}
```

### 使用允许列表和拒绝列表限制 MCP 服务器

除了提供企业管理的服务器外，管理员还可以使用 `managed-settings.json` 文件中的 `allowedMcpServers` 和 `deniedMcpServers` 控制用户可以配置哪些 MCP 服务器：

*   **macOS**：`/Library/Application Support/ClaudeCode/managed-settings.json`
*   **Windows**：`C:\ProgramData\ClaudeCode\managed-settings.json`
*   **Linux**：`/etc/claude-code/managed-settings.json`

```
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverName": "sentry" },
    { "serverName": "company-internal" }
  ],
  "deniedMcpServers": [
    { "serverName": "filesystem" }
  ]
}
```

**允许列表行为（`allowedMcpServers`）**：

*   `undefined`（默认）：无限制 - 用户可以配置任何 MCP 服务器
*   空数组 `[]`：完全锁定 - 用户无法配置任何 MCP 服务器
*   服务器名称列表：用户只能配置指定的服务器

**拒绝列表行为（`deniedMcpServers`）**：

*   `undefined`（默认）：没有服务器被阻止
*   空数组 `[]`：没有服务器被阻止
*   服务器名称列表：指定的服务器在所有范围内被显式阻止

**重要说明**：

*   这些限制适用于所有范围：用户、项目、本地，甚至来自 `managed-mcp.json` 的企业服务器
*   **拒绝列表具有绝对优先级**：如果服务器同时出现在两个列表中，它将被阻止
