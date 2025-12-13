<!-- Source: https://code.claude.com/docs/zh-CN/plugin-marketplaces -->

Title: 插件市场 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/plugin-marketplaces

Markdown Content:
插件市场是可用插件的目录，使发现、安装和管理 Claude Code 扩展变得容易。本指南展示了如何使用现有市场以及如何为团队分发创建自己的市场。

概述
--

市场是一个 JSON 文件，列出可用的插件并描述在哪里找到它们。市场提供：

*   **集中发现**：在一个地方浏览来自多个来源的插件
*   **版本管理**：自动跟踪和更新插件版本
*   **团队分发**：在整个组织中共享所需的插件
*   **灵活的来源**：支持 git 存储库、GitHub 存储库、本地路径和包管理器

### 前置条件

*   Claude Code 已安装并运行
*   基本熟悉 JSON 文件格式
*   创建市场：Git 存储库或本地开发环境

添加和使用市场
-------

使用 `/plugin marketplace` 命令添加市场以访问来自不同来源的插件：

### 添加 GitHub 市场

添加包含 .claude-plugin/marketplace.json 的 GitHub 存储库

```
/plugin marketplace add owner/repo
```

### 添加 Git 存储库

添加任何 git 存储库

```
/plugin marketplace add https://gitlab.com/company/plugins.git
```

### 添加本地市场用于开发

添加包含 .claude-plugin/marketplace.json 的本地目录

```
/plugin marketplace add ./my-marketplace
```

添加 marketplace.json 文件的直接路径

```
/plugin marketplace add ./path/to/marketplace.json
```

通过 URL 添加远程 marketplace.json

```
/plugin marketplace add https://url.of/marketplace.json
```

### 从市场安装插件

添加市场后，直接安装插件：

从任何已知市场安装

```
/plugin install plugin-name@marketplace-name
```

交互式浏览可用插件

```
/plugin
```

### 验证市场安装

添加市场后：

1.   **列出市场**：运行 `/plugin marketplace list` 以确认已添加
2.   **浏览插件**：使用 `/plugin` 查看来自您的市场的可用插件
3.   **测试安装**：尝试安装插件以验证市场是否正常工作

配置团队市场
------

通过在 `.claude/settings.json` 中指定所需的市场，为团队项目设置自动市场安装：

```
{
  "extraKnownMarketplaces": {
    "team-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    },
    "project-specific": {
      "source": {
        "source": "git",
        "url": "https://git.company.com/project-plugins.git"
      }
    }
  }
}
```

当团队成员信任存储库文件夹时，Claude Code 会自动安装这些市场以及 `enabledPlugins` 字段中指定的任何插件。

* * *

创建您自己的市场
--------

为您的团队或社区构建和分发自定义插件集合。

### 市场创建的前置条件

*   Git 存储库（GitHub、GitLab 或其他 git 托管）
*   了解 JSON 文件格式
*   一个或多个要分发的插件

### 创建市场文件

在存储库根目录中创建 `.claude-plugin/marketplace.json`：

```
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@company.com"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0",
      "author": {
        "name": "DevTools Team"
      }
    },
    {
      "name": "deployment-tools",
      "source": {
        "source": "github",
        "repo": "company/deploy-plugin"
      },
      "description": "Deployment automation tools"
    }
  ]
}
```

### 市场架构

#### 必需字段

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `name` | string | 市场标识符（kebab-case，无空格） |
| `owner` | object | 市场维护者信息 |
| `plugins` | array | 可用插件列表 |

#### 可选元数据

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `metadata.description` | string | 简短的市场描述 |
| `metadata.version` | string | 市场版本 |
| `metadata.pluginRoot` | string | 相对插件来源的基本路径 |

### 插件条目

**必需字段：**

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `name` | string | 插件标识符（kebab-case，无空格） |
| `source` | string|object | 从哪里获取插件 |

#### 可选插件字段

**标准元数据字段：**

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `description` | string | 简短的插件描述 |
| `version` | string | 插件版本 |
| `author` | object | 插件作者信息 |
| `homepage` | string | 插件主页或文档 URL |
| `repository` | string | 源代码存储库 URL |
| `license` | string | SPDX 许可证标识符（例如 MIT、Apache-2.0） |
| `keywords` | array | 用于插件发现和分类的标签 |
| `category` | string | 用于组织的插件类别 |
| `tags` | array | 用于可搜索性的标签 |
| `strict` | boolean | 在插件文件夹中需要 plugin.json（默认：true） 1 |

**组件配置字段：**

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `commands` | string|array | 命令文件或目录的自定义路径 |
| `agents` | string|array | 代理文件的自定义路径 |
| `hooks` | string|object | 自定义钩子配置或钩子文件的路径 |
| `mcpServers` | string|object | MCP 服务器配置或 MCP 配置的路径 |

_1 - 当 `strict: true`（默认）时，插件必须包含 `plugin.json` 清单文件，市场字段补充这些值。当 `strict: false` 时，plugin.json 是可选的。如果缺少，市场条目作为完整的插件清单。_

### 插件来源

#### 相对路径

对于同一存储库中的插件：

```
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin"
}
```

#### GitHub 存储库

```
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo"
  }
}
```

#### Git 存储库

```
{
  "name": "git-plugin",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git"
  }
}
```

#### 高级插件条目

插件条目可以覆盖默认组件位置并提供其他元数据。注意 `${CLAUDE_PLUGIN_ROOT}` 是一个环境变量，解析为插件的安装目录（有关详细信息，请参阅[环境变量](https://code.claude.com/docs/zh-CN/plugins-reference#environment-variables)）：

```
{
  "name": "enterprise-tools",
  "source": {
    "source": "github",
    "repo": "company/enterprise-plugin"
  },
  "description": "Enterprise workflow automation tools",
  "version": "2.1.0",
  "author": {
    "name": "Enterprise Team",
    "email": "enterprise@company.com"
  },
  "homepage": "https://docs.company.com/plugins/enterprise-tools",
  "repository": "https://github.com/company/enterprise-plugin",
  "license": "MIT",
  "keywords": ["enterprise", "workflow", "automation"],
  "category": "productivity",
  "commands": [
    "./commands/core/",
    "./commands/enterprise/",
    "./commands/experimental/preview.md"
  ],
  "agents": [
    "./agents/security-reviewer.md",
    "./agents/compliance-checker.md"
  ],
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"}]
      }
    ]
  },
  "mcpServers": {
    "enterprise-db": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
    }
  },
  "strict": false
}
```

* * *

托管和分发市场
-------

为您的插件分发需求选择最佳的托管策略。

### 在 GitHub 上托管（推荐）

GitHub 提供最简单的分发方法：

1.   **创建存储库**：为您的市场设置新存储库
2.   **添加市场文件**：使用您的插件定义创建 `.claude-plugin/marketplace.json`
3.   **与团队共享**：团队成员使用 `/plugin marketplace add owner/repo` 添加

**优点**：内置版本控制、问题跟踪和团队协作功能。

### 在其他 git 服务上托管

任何 git 托管服务都可用于市场分发，使用任意 git 存储库的 URL。例如，使用 GitLab：

```
/plugin marketplace add https://gitlab.com/company/plugins.git
```

### 使用本地市场进行开发

在分发前在本地测试您的市场：

添加本地市场用于测试

```
/plugin marketplace add ./my-local-marketplace
```

测试插件安装

```
/plugin install test-plugin@my-local-marketplace
```

管理市场操作
------

### 列出已知市场

列出所有配置的市场

```
/plugin marketplace list
```

显示所有配置的市场及其来源和状态。

### 更新市场元数据

刷新市场元数据

```
/plugin marketplace update marketplace-name
```

从市场来源刷新插件列表和元数据。

### 移除市场

移除市场

```
/plugin marketplace remove marketplace-name
```

从您的配置中移除市场。

* * *

市场故障排除
------

### 常见市场问题

#### 市场未加载

**症状**：无法添加市场或看不到来自它的插件**解决方案**：

*   验证市场 URL 是否可访问
*   检查 `.claude-plugin/marketplace.json` 是否存在于指定路径
*   使用 `claude plugin validate` 确保 JSON 语法有效
*   对于私有存储库，确认您有访问权限

#### 插件安装失败

**症状**：市场出现但插件安装失败**解决方案**：

*   验证插件源 URL 是否可访问
*   检查插件目录是否包含所需文件
*   对于 GitHub 来源，确保存储库是公开的或您有访问权限
*   通过手动克隆/下载来测试插件来源

### 验证和测试

在共享前测试您的市场：

验证市场 JSON 语法

```
claude plugin validate .
```

添加市场用于测试

```
/plugin marketplace add ./path/to/marketplace
```

安装测试插件

```
/plugin install test-plugin@marketplace-name
```

有关完整的插件测试工作流，请参阅[在本地测试您的插件](https://code.claude.com/docs/zh-CN/plugins#test-your-plugins-locally)。有关技术故障排除，请参阅[插件参考](https://code.claude.com/docs/zh-CN/plugins-reference)。

* * *

后续步骤
----

### 对于市场用户

*   **发现社区市场**：在 GitHub 上搜索 Claude Code 插件集合
*   **贡献反馈**：向市场维护者报告问题并提出改进建议
*   **共享有用的市场**：帮助您的团队发现有价值的插件集合

### 对于市场创建者

*   **构建插件集合**：围绕特定用例创建主题市场
*   **建立版本控制**：实施清晰的版本控制和更新政策
*   **社区参与**：收集反馈并维护活跃的市场社区
*   **文档**：提供清晰的 README 文件，说明您的市场内容

### 对于组织

*   **私有市场**：为专有工具设置内部市场
*   **治理政策**：建立插件批准和安全审查的指南
*   **培训资源**：帮助团队有效地发现和采用有用的插件

另请参阅
----

*   [插件](https://code.claude.com/docs/zh-CN/plugins) - 安装和使用插件
*   [插件参考](https://code.claude.com/docs/zh-CN/plugins-reference) - 完整的技术规范和架构
*   [插件开发](https://code.claude.com/docs/zh-CN/plugins#develop-more-complex-plugins) - 创建您自己的插件
*   [设置](https://code.claude.com/docs/zh-CN/settings#plugin-configuration) - 插件配置选项
