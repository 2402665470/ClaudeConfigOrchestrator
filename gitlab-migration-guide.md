# Claude Code Templates - GitLab 本地仓库改造指南

## 概述

本文档提供将 Claude Code Templates 项目从 GitHub 仓库改造为 GitLab 本地仓库的完整方案。改造后，您可以在企业内部环境使用 GitLab 作为组件仓库，实现完全的自主控制和离线部署。

## 改造原理

### 当前架构
```
用户命令 → CLI 工具 → GitHub 下载 → 本地安装 → Claude Code 加载
```

### 改造后架构
```
用户命令 → CLI 工具 → GitLab 下载 → 本地安装 → Claude Code 加载
```

## 核心改造点

### 1. GitHub 硬编码位置分析

#### 1.1 配置文件 (`cli-tool/src/file-operations.js`)
```javascript
// 第 8-13 行 - GitHub 配置
const GITHUB_CONFIG = {
  owner: 'davila7',
  repo: 'claude-code-templates',
  branch: 'main',
  templatesPath: 'cli-tool/templates'
};
```

#### 1.2 URL 构建位置
- **文件下载**: `file-operations.js` 第 27 行
- **Agent 下载**: `index.js` 第 503 行
- **Command 下载**: `index.js` 第 568 行
- **MCP 下载**: `index.js` 第 632 行
- **Setting 下载**: `index.js` 第 753 行

### 2. GitLab URL 格式

#### GitHub Raw URL
```
https://raw.githubusercontent.com/owner/repo/branch/path/to/file
```

#### GitLab API Raw URL
```
http://gitlab.local/api/v4/projects/PROJECT_ID/repository/files/PATH%2FTO%2FFILE/raw?ref=BRANCH
```

#### GitLab Pages URL（可选）
```
http://gitlab.local/owner/repo/-/raw/branch/path/to/file
```

## 改造方案

### 方案一：环境变量配置（推荐）

#### 1. 修改 `file-operations.js`

```javascript
// 添加通用仓库配置
const REPOSITORY_CONFIG = {
  type: process.env.REPO_TYPE || 'github', // 'github' | 'gitlab' | 'gitlab-pages'
  // GitHub 配置
  github: {
    baseUrl: 'https://raw.githubusercontent.com',
    owner: 'davila7',
    repo: 'claude-code-templates',
    branch: 'main'
  },
  // GitLab 配置
  gitlab: {
    url: process.env.GITLAB_URL || 'http://gitlab.local',
    projectId: process.env.GITLAB_PROJECT_ID,
    branch: process.env.GITLAB_BRANCH || 'main',
    privateToken: process.env.GITLAB_PRIVATE_TOKEN
  },
  // GitLab Pages 配置
  gitlabPages: {
    url: process.env.GITLAB_PAGES_URL || 'http://gitlab.local',
    owner: process.env.GITLAB_PAGES_OWNER,
    repo: process.env.GITLAB_PAGES_REPO,
    branch: process.env.GITLAB_PAGES_BRANCH || 'main'
  }
};

// 修改下载函数
async function downloadFileFromRepository(filePath, options = {}) {
  const repoType = options.repoType || REPOSITORY_CONFIG.type;
  let url, headers = {};

  switch (repoType) {
    case 'gitlab':
      // GitLab API 方式
      const encodedPath = encodeURIComponent(options.basePath + filePath);
      url = `${REPOSITORY_CONFIG.gitlab.url}/api/v4/projects/${REPOSITORY_CONFIG.gitlab.projectId}/repository/files/${encodedPath}/raw?ref=${REPOSITORY_CONFIG.gitlab.branch}`;
      headers['PRIVATE-TOKEN'] = REPOSITORY_CONFIG.gitlab.privateToken;
      break;

    case 'gitlab-pages':
      // GitLab Pages 方式
      url = `${REPOSITORY_CONFIG.gitlabPages.url}/${REPOSITORY_CONFIG.gitlabPages.owner}/${REPOSITORY_CONFIG.gitlabPages.repo}/-/raw/${REPOSITORY_CONFIG.gitlabPages.branch}/${options.basePath}${filePath}`;
      break;

    default: // github
      url = `${REPOSITORY_CONFIG.github.baseUrl}/${REPOSITORY_CONFIG.github.owner}/${REPOSITORY_CONFIG.github.repo}/${REPOSITORY_CONFIG.github.branch}/${options.basePath}${filePath}`;
  }

  // 检查缓存
  if (downloadCache.has(filePath)) {
    return downloadCache.get(filePath);
  }

  // 下载文件
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`File not found: ${filePath} (404)`);
        }
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          console.log(chalk.yellow(`⚠️ Error ${response.status} downloading ${filePath}, retrying in ${delay}ms...`));
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      downloadCache.set(filePath, content);
      return content;

    } catch (error) {
      if (retryCount === maxRetries) {
        throw error;
      }
      if (error.message.includes('File not found')) {
        throw error; // 不重试 404
      }
      // 其他错误重试
      console.log(chalk.yellow(`⚠️ ${error.message}, retrying...`));
    }
  }
}
```

#### 2. 修改 `index.js` 中的组件安装函数

```javascript
// 修改 Agent 安装函数
async function installIndividualAgent(agentName, targetDir, options = {}) {
  // 构建文件路径
  const componentPath = agentName.includes('/')
    ? `agents/${agentName}.md`
    : `agents/${agentName}.md`;

  try {
    // 使用新的下载函数
    const agentContent = await downloadFileFromRepository(componentPath, {
      basePath: 'cli-tool/components/'
    });

    // 其余逻辑保持不变
    const agentsDir = path.join(targetDir, '.claude', 'agents');
    await fs.ensureDir(agentsDir);

    let fileName;
    if (agentName.includes('/')) {
      const [, filename] = agentName.split('/');
      fileName = filename;
    } else {
      fileName = agentName;
    }

    const targetFile = path.join(agentsDir, `${fileName}.md`);
    await fs.writeFile(targetFile, agentContent, 'utf8');

    console.log(chalk.green(`✅ Agent "${agentName}" installed successfully!`));
    console.log(chalk.cyan(`📁 Installed to: ${path.relative(targetDir, targetFile)}`));

  } catch (error) {
    if (error.message.includes('File not found')) {
      console.log(chalk.red(`❌ Agent "${agentName}" not found`));
      await showAvailableAgents();
      return;
    }
    throw error;
  }
}

// 类似地修改其他组件安装函数：
// - installIndividualCommand()
// - installIndividualMCP()
// - installIndividualSetting()
// - installIndividualHook()
// - installIndividualSkill()
```

#### 3. 创建环境配置文件

创建 `cli-tool/.env.example`：
```bash
# 仓库类型: github, gitlab, gitlab-pages
REPO_TYPE=gitlab

# GitLab API 配置
GITLAB_URL=http://gitlab.local
GITLAB_PROJECT_ID=your-group%2Fclaude-code-templates
GITLAB_BRANCH=main
GITLAB_PRIVATE_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx

# GitLab Pages 配置（如果使用 Pages 而不是 API）
# REPO_TYPE=gitlab-pages
# GITLAB_PAGES_URL=http://gitlab.local
# GITLAB_PAGES_OWNER=your-group
# GITLAB_PAGES_REPO=claude-code-templates
# GITLAB_PAGES_BRANCH=main
```

#### 4. 添加 dotenv 依赖

```bash
cd cli-tool
npm install dotenv
```

在 `cli-tool/src/index.js` 开头添加：
```javascript
// 加载环境变量
require('dotenv').config();
```

### 方案二：配置文件方案

创建 `cli-tool/config/repository.json`：
```json
{
  "repository": {
    "type": "gitlab",
    "gitlab": {
      "url": "http://gitlab.local",
      "projectId": "your-group%2Fclaude-code-templates",
      "branch": "main",
      "privateToken": "glpat-xxxxxxxxxxxxxxxxxxxx"
    },
    "components": {
      "basePath": "cli-tool/components",
      "paths": {
        "agents": "agents/",
        "commands": "commands/",
        "mcps": "mcps/",
        "settings": "settings/",
        "hooks": "hooks/",
        "skills": "skills/"
      }
    }
  }
}
```

## 实施步骤

### 步骤 1：准备 GitLab 仓库

#### 1.1 获取 GitLab Project ID
```bash
# 方法 1：通过 GitLab API
curl --header "PRIVATE-TOKEN: your-token" \
  http://gitlab.local/api/v4/projects?search=claude-code-templates

# 方法 2：从项目页面获取
# 访问 GitLab 项目 -> Settings -> General
# Project ID 显示在页面底部
```

#### 1.2 创建 Personal Access Token
1. 登录 GitLab
2. 进入 User Settings -> Access Tokens
3. 创建新 Token，权限：
   - `read_api`
   - `read_repository`
4. 保存 Token（glpat-xxxxxxxxxxxxxxxxxxxx）

#### 1.3 迁移组件到 GitLab
```bash
# 1. 克隆原始仓库
git clone https://github.com/davila7/claude-code-templates.git

# 2. 推送到 GitLab
cd claude-code-templates
git remote add gitlab http://gitlab.local/your-group/claude-code-templates.git
git push -u gitlab main

# 3. 验证组件文件
# 确保以下目录存在：
# - cli-tool/components/agents/
# - cli-tool/components/commands/
# - cli-tool/components/mcps/
# - cli-tool/components/settings/
# - cli-tool/components/hooks/
# - cli-tool/components/skills/
```

### 步骤 2：修改代码

#### 2.1 备份原始文件
```bash
# 在 cli-tool/src 目录
cp file-operations.js file-operations.js.bak
cp index.js index.js.bak
```

#### 2.2 应用修改
按照上述方案修改相应的文件。

### 步骤 3：配置环境

#### 3.1 创建环境配置
```bash
cd cli-tool
cp .env.example .env
vim .env  # 编辑配置
```

#### 3.2 测试连接
```bash
# 测试 GitLab API 连接
curl -H "PRIVATE-TOKEN: your-token" \
  http://gitlab.local/api/v4/projects/PROJECT_ID/repository/files/README%2Emd/raw?ref=main

# 测试组件下载
node -e "
require('dotenv').config();
require('./src/file-operations.js').downloadFileFromRepository('agents/frontend-developer.md', {
  basePath: 'cli-tool/components/'
}).then(console.log);
"
```

### 步骤 4：测试功能

#### 4.1 测试组件安装
```bash
# 测试安装 Agent
npx claude-code-templates --agent frontend-developer

# 测试安装 Command
npx claude-code-templates --command setup-react

# 测试安装 MCP
npx claude-code-templates --mcp postgresql-integration

# 测试批量安装
npx claude-code-templates \
  --agent security-auditor \
  --command security-audit \
  --setting read-only-mode
```

#### 4.2 验证安装结果
```bash
# 检查安装的组件
ls -la .claude/agents/
ls -la .claude/commands/
cat .claude/settings.local.json
cat .mcp.json
```

## 高级功能

### 1. 支持多仓库配置

```javascript
// 支持不同类型组件来自不同仓库
const MULTI_REPO_CONFIG = {
  agents: {
    repoType: process.env.AGENTS_REPO_TYPE || 'gitlab',
    config: process.env.AGENTS_REPO_CONFIG
  },
  commands: {
    repoType: process.env.COMMANDS_REPO_TYPE || 'github',
    config: process.env.COMMANDS_REPO_CONFIG
  },
  // ... 其他组件类型
};
```

### 2. 本地文件系统支持

```javascript
// 支持从本地文件系统加载组件
if (process.env.REPO_TYPE === 'local') {
  const localPath = path.join(process.env.LOCAL_REPO_PATH, basePath, filePath);
  return await fs.readFile(localPath, 'utf8');
}
```

### 3. 缓存优化

```javascript
// 实现本地文件缓存
class RepositoryCache {
  constructor(cacheDir = '.repo-cache') {
    this.cacheDir = cacheDir;
    fs.ensureDirSync(cacheDir);
  }

  async get(filePath) {
    const cacheFile = path.join(this.cacheDir, filePath.replace(/\//g, '_'));
    if (await fs.pathExists(cacheFile)) {
      return await fs.readFile(cacheFile, 'utf8');
    }
  }

  async set(filePath, content) {
    const cacheFile = path.join(this.cacheDir, filePath.replace(/\//g, '_'));
    await fs.writeFile(cacheFile, content, 'utf8');
  }
}
```

## 故障排除

### 常见问题

#### 1. 403 Forbidden
```bash
# 检查 Token 权限
curl --header "PRIVATE-TOKEN: your-token" \
  http://gitlab.local/api/v4/user

# 确保项目是公开的或有访问权限
```

#### 2. 404 Not Found
```bash
# 检查 Project ID 是否正确
curl --header "PRIVATE-TOKEN: your-token" \
  http://gitlab.local/api/v4/projects/PROJECT_ID

# 检查文件路径编码
# 注意：GitLab API 需要对路径进行 URL 编码
```

#### 3. SSL 证书问题
```bash
# 如果使用自签名证书
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

# 或在环境变量中设置
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 调试技巧

1. **启用详细日志**
```javascript
console.log(`Downloading from: ${url}`);
console.log(`Using headers:`, headers);
```

2. **测试 API 请求**
```bash
# 使用 curl 测试 API 请求
curl -v -H "PRIVATE-TOKEN: your-token" \
  "http://gitlab.local/api/v4/projects/PROJECT_ID/repository/files/PATH/raw?ref=BRANCH"
```

3. **检查网络连接**
```bash
# 测试 GitLab 连通性
ping gitlab.local
telnet gitlab.local 80
```

## 安全考虑

### 1. Token 安全
- 不要将 Token 提交到版本控制
- 使用环境变量或加密存储
- 定期轮换 Token
- 使用最小权限原则

### 2. 网络安全
- 使用 HTTPS（如果可能）
- 配置防火墙规则
- 限制 API 访问频率

### 3. 访问控制
- 使用项目级访问控制
- 配置分支保护
- 审计组件下载日志

## 维护指南

### 1. 组件更新
```bash
# 从原始仓库同步更新
git remote add upstream https://github.com/davila7/claude-code-templates.git
git pull upstream main
git push gitlab main
```

### 2. 版本管理
```bash
# 使用 Git 标签管理版本
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 在环境变量中指定版本
export GITLAB_BRANCH=v1.0.0
```

### 3. 监控和日志
```javascript
// 添加下载统计
async function trackDownload(type, name, repoType) {
  console.log(`[${new Date().toISOString()}] Downloaded ${type}/${name} from ${repoType}`);
  // 可以发送到内部监控系统
}
```

## 总结

通过本改造方案，您可以：

1. **实现企业内自主控制**：使用内部 GitLab 作为组件仓库
2. **支持离线部署**：完全内网运行，不依赖外部服务
3. **保持原有功能**：所有组件安装功能保持不变
4. **灵活配置**：支持 GitHub、GitLab API、GitLab Pages 等多种方式
5. **安全可靠**：支持私有仓库和访问控制

改造后的系统既保持了原有的灵活性和易用性，又提供了企业级的安全性和可控性。