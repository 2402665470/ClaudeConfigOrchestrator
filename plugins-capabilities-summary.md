# Claude Code 插件和能力清单

## 概览

系统中共安装了 **21 个插件**，提供了丰富的功能扩展。

### 能力统计
- 🎯 **技能 (Skills)**: 19 个
- ⚡ **命令 (Commands)**: 46 个
- 🤖 **代理 (Agents)**: 30 个
- 🔗 **钩子 (Hooks)**: 5 个
- 🔌 **MCP 服务器**: 0 个
- ⚙️ **配置 (Configs)**: 9 个
- 💬 **提示词 (Prompts)**: 0 个

---

## 插件详细信息

### 1. pr-review-toolkit
- **ID**: pr-review-toolkit@claude-code-plugins
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 综合的 PR 审查代理，专门负责评论、测试、错误处理、类型设计、代码质量和代码简化

**能力**:
- ⚡ **命令** (1个):
  - `/pr-review-toolkit:review-pr` - 执行 PR 审查

- 🤖 **代理** (6个):
  - `code-reviewer` - 代码审查代理
  - `code-simplifier` - 代码简化代理
  - `comment-analyzer` - 注释分析代理
  - `pr-test-analyzer` - PR 测试分析代理
  - `silent-failure-hunter` - 静默失败检测代理
  - `type-design-analyzer` - 类型设计分析代理

---

### 2. feature-dev
- **ID**: feature-dev@claude-code-plugins
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 综合功能开发工作流，配备专门代理用于代码库探索、架构设计和质量审查

**能力**:
- ⚡ **命令** (1个):
  - `/feature-dev:feature-dev` - 功能开发

- 🤖 **代理** (3个):
  - `code-architect` - 代码架构师代理
  - `code-explorer` - 代码探索代理
  - `code-reviewer` - 代码审查代理

---

### 3. commit-commands
- **ID**: commit-commands@claude-code-plugins
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 通过简单的命令简化 Git 工作流，用于提交、推送和创建拉取请求

**能力**:
- ⚡ **命令** (3个):
  - `/commit-commands:clean_gone` - 清理所有标记为 [gone] 的 git 分支
  - `/commit-commands:commit-push-pr` - 提交、推送并创建 PR
  - `/commit-commands:commit` - 创建 git 提交

---

### 4. autonomous-skill
- **ID**: autonomous-skill@claude-code-settings
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 用于执行需要多个会话完成的长时间运行任务。管理任务分解、进度跟踪和使用 Claude Code 无头模式的自主执行

**能力**:
- 🎯 **技能** (1个):
  - `autonomous-skill` - 长时间任务执行技能，支持任务管理、进度跟踪和会话自动继续

---

### 5. spec-kit-skill
- **ID**: spec-kit-skill@claude-code-settings
- **版本**: 1.0.0
- **作用域**: user
- **描述**: GitHub Spec-Kit 集成，支持基于章程的规范驱动开发（7阶段工作流）

**能力**:
- 🎯 **技能** (1个):
  - `spec-kit-skill` - 规范驱动开发技能，7阶段工作流程（章程、规范、澄清、计划、任务、分析、实现）

---

### 6. plugin-dev@claude-code-plugins
- **ID**: plugin-dev@claude-code-plugins
- **版本**: 0.1.0
- **作用域**: user
- **描述**: 插件开发工具集

**能力**:
- 🎯 **技能** (7个):
  - `plugin-development` - 代理开发
  - `command-development` - 命令开发
  - `hook-development` - 钩子开发
  - `mcp-integration` - MCP 集成
  - `plugin-settings` - 插件设置
  - `plugin-structure` - 插件结构
  - `skill-development` - 技能开发

- ⚡ **命令** (1个):
  - `/plugin-dev:create-plugin` - 创建插件

- 🤖 **代理** (3个):
  - `agent-creator` - 代理创建器
  - `plugin-validator` - 插件验证器
  - `skill-reviewer` - 技能审查器

---

### 7. code-review
- **ID**: code-review@claude-code-plugins
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 使用多个专门的代理自动进行拉取请求的代码审查，具有基于置信度的评分

**能力**:
- ⚡ **命令** (1个):
  - `/code-review:code-review` - 执行代码审查

---

### 8. frontend-design
- **ID**: frontend-design@claude-code-plugins
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 用于 UI/UX 实现的前端设计技能

**能力**:
- 🎯 **技能** (1个):
  - `frontend-design` - 创建独特、生产级前端界面的技能

---

### 9. explanatory-output-style
- **ID**: explanatory-output-style@claude-code-plugins
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 添加关于实现选择和代码库模式的教育性见解（模仿已弃用的解释性输出样式）

---

### 10. hookify
- **ID**: hookify@claude-code-plugins
- **版本**: 0.1.0
- **作用域**: user
- **描述**: 通过分析对话模式轻松创建钩子以防止不良行为

**能力**:
- 🎯 **技能** (1个):
  - `writing-rules` - 编写 hookify 规则

- ⚡ **命令** (4个):
  - `/hookify:configure` - 交互式启用或禁用 hookify 规则
  - `/hookify:help` - 获取 hookify 插件帮助
  - `/hookify:hookify` - 创建钩子以防止来自对话分析的不良行为
  - `/hookify:list` - 列出所有配置的 hookify 规则

- 🤖 **代理** (1个):
  - `conversation-analyzer` - 对话分析器

- 🔗 **钩子** (5个):
  - `__init__` - 初始化钩子
  - `posttooluse` - 工具使用后钩子
  - `pretooluse` - 工具使用前钩子
  - `stop` - 停止钩子
  - `userpromptsubmit` - 用户提示提交钩子

---

### 11. dotai (用户作用域)
- **ID**: dotai@dotai
- **版本**: 1.0.0
- **作用域**: user
- **描述**: 完整的开发工具包 - 文档、PRD、设计文档、调试、PR 工作流和规划

**能力**:
- ⚡ **命令** (10个):
  - `/dotai:create-app-design` - 生成综合的应用设计文档
  - `/dotai:create-snippet` - 创建代码片段
  - `/dotai:create-tech-stack` - 生成技术栈文档
  - `/dotai:fix` - 修复问题
  - `/dotai:install-all` - 安装所有 dotai 注册表项目
  - `/dotai:install` - 安装 dotai 先决条件和项目设置文件
  - `/dotai:opus` - Opus 模式执行
  - `/dotai:update-app-design` - 更新应用设计文档
  - `/dotai:update-project-structure` - 更新项目结构文档
  - `/dotai:update-tech-stack` - 更新技术栈文档

---

### 12. dotai (项目作用域)
- **ID**: dotai@dotai
- **版本**: 1.0.0
- **作用域**: project
- **描述**: 完整的开发工具包 - 文档、PRD、设计文档、调试、PR 工作流和规划

**能力**:
- ⚡ **命令** (10个):
  - （同上）

---

### 13. debugging-toolkit@claude-code-workflows
- **ID**: debugging-toolkit@claude-code-workflows
- **版本**: 1.2.0
- **作用域**: user
- **描述**: 调试工具集

**能力**:
- ⚡ **命令** (1个):
  - `/debugging-toolkit:smart-debug` - 智能调试

- 🤖 **代理** (2个):
  - `debugger` - 调试器
  - `dx-optimizer` - 体验优化器

---

### 14. tdd-workflows@claude-code-workflows
- **ID**: tdd-workflows@claude-code-workflows
- **版本**: 1.2.1
- **作用域**: user
- **描述**: TDD（测试驱动开发）工作流

**能力**:
- ⚡ **命令** (4个):
  - `/tdd-workflows:tdd-cycle` - TDD 循环
  - `/tdd-workflows:tdd-green` - TDD 绿色阶段
  - `/tdd-workflows:tdd-red` - TDD 红色阶段
  - `/tdd-workflows:tdd-refactor` - TDD 重构阶段

- 🤖 **代理** (2个):
  - `code-reviewer` - 代码审查器
  - `tdd-orchestrator` - TDD 编排器

---

### 15. error-debugging@claude-code-workflows
- **ID**: error-debugging@claude-code-workflows
- **版本**: 1.2.0
- **作用域**: user
- **描述**: 错误调试工具

**能力**:
- ⚡ **命令** (3个):
  - `/error-debugging:error-analysis` - 错误分析
  - `/error-debugging:error-trace` - 错误追踪
  - `/error-debugging:multi-agent-review` - 多代理审查

- 🤖 **代理** (2个):
  - `debugger` - 调试器
  - `error-detective` - 错误侦探

---

### 16. plan@dotai
- **ID**: plan@dotai
- **版本**: 0.1.0
- **作用域**: user
- **描述**: 软件开发的规划和头脑风暴工作流 - 帮助将想法细化为设计并创建详细的实施计划

**能力**:
- 🎯 **技能** (3个):
  - `brainstorming` - 在编写代码或实施计划之前，通过协作性提问、替代方案探索和增量验证将粗略的想法细化为完全成型的设计
  - `executing-plans` - 分批执行计划，配备审查检查点
  - `writing-plans` - 创建详细的实施计划

- ⚡ **命令** (3个):
  - `/plan:brainstorm` - 交互式设计优化
  - `/plan:execute-plan` - 分批执行计划
  - `/plan:write-plan` - 创建详细计划

---

### 17. skills@dotai
- **ID**: skills@dotai
- **版本**: 0.1.0
- **作用域**: user
- **描述**: 查找、使用和编写代理技能的元技能 - 强制执行技能使用协议并提供技能编写指导

**能力**:
- 🎯 **技能** (2个):
  - `using-skills` - 开始任何对话时的强制工作流程 - 建立查找和使用技能的强制性工作流程
  - `writing-skills` - 创建或编辑 .claude/rules/ 中的规则/技能

- ⚡ **命令** (1个):
  - `/skills:skills` - 强制执行技能使用协议和强制性工作流程

---

### 18. git@dotai
- **ID**: git@dotai
- **版本**: 0.1.0
- **作用域**: user
- **描述**: Git 和 GitHub 工作流自动化 - 简化的 PR 创建、草稿管理和代码审查工作流

**能力**:
- 🎯 **技能** (3个):
  - `creating-pr` - 使用综合描述创建或更新 PR
  - `drafting-pr` - 为进行中的工作创建或更新草稿 PR
  - `reviewing-pr` - 使用全面的代码分析和建设性反馈审查拉取请求

- ⚡ **命令** (3个):
  - `/git:create-pr` - 创建或更新 PR
  - `/git:draft-pr` - 创建或更新草稿 PR
  - `/git:review-pr` - 审查 PR

---

### 19. dependency-management@claude-code-workflows
- **ID**: dependency-management@claude-code-workflows
- **版本**: 1.2.0
- **作用域**: user
- **描述**: 依赖管理工具

**能力**:
- ⚡ **命令** (1个):
  - `/dependency-management:deps-audit` - 依赖审计

- 🤖 **代理** (1个):
  - `legacy-modernizer` - 遗留代码现代化

---

### 20. cicd-automation@claude-code-workflows
- **ID**: cicd-automation@claude-code-workflows
- **版本**: 1.2.1
- **作用域**: user
- **描述**: CI/CD 自动化工具

**能力**:
- 🎯 **技能** (4个):
  - `deployment-pipeline-design` - 设计多阶段 CI/CD 管道
  - `github-actions-templates` - 创建生产就绪的 GitHub Actions 工作流
  - `gitlab-ci-patterns` - 构建 GitLab CI/CD 管道
  - `secrets-management` - 实现安全的密钥管理

- ⚡ **命令** (1个):
  - `/cicd-automation:workflow-automate` - 工作流自动化

- 🤖 **代理** (5个):
  - `cloud-architect` - 云架构师
  - `deployment-engineer` - 部署工程师
  - `devops-troubleshooter` - DevOps 故障排除专家
  - `kubernetes-architect` - Kubernetes 架构师
  - `terraform-specialist` - Terraform 专家

---

### 21. claude-code-settings
- **ID**: claude-code-settings@claude-code-settings
- **版本**: 2.1.0
- **作用域**: user
- **描述**: Claude Code 设置和规范驱动开发工作流技能

**能力**:
- ⚡ **命令** (8个):
  - `/claude-code-settings:cc:create-command` - 创建新的 Claude Code 自定义命令
  - `/claude-code-settings:eureka` - 捕获技术突破并转换为可操作的、可重用的文档
  - `/claude-code-settings:gh:fix-issue` - 修复 GitHub 问题
  - `/claude-code-settings:gh:review-pr` - 审查 GitHub 拉取请求
  - `/claude-code-settings:reflection-harder` - 全面的会话分析和学习捕获
  - `/claude-code-settings:reflection` - 分析和改进 Claude Code 指令
  - `/claude-code-settings:think-harder` - 增强分析思维
  - `/claude-code-settings:translate` - 文本翻译

- 🤖 **代理** (7个):
  - `command-creator` - 命令创建器
  - `deep-reflector` - 深度反思器
  - `github-issue-fixer` - GitHub 问题修复器
  - `insight-documenter` - 洞察文档记录器
  - `instruction-reflector` - 指令反思器
  - `pr-reviewer` - PR 审查器
  - `ui-engineer` - UI 工程师

- ⚙️ **配置** (9个):
  - `azure-foundry-settings` - Azure Foundry 配置
  - `azure-settings` - Azure 设置
  - `copilot-settings` - Copilot 设置
  - `deepseek-settings` - DeepSeek 设置
  - `litellm-settings` - LiteLLM 设置
  - `minimax` - MiniMax 配置
  - `qwen-settings` - Qwen 设置
  - `siliconflow-settings` - SiliconFlow 设置
  - `vertex-settings` - Vertex 设置

---

## 快速参考

### 常用命令速查

```bash
# Git 工作流
/commit                  # 提交代码
/commit-push-pr         # 提交并创建 PR
/create-pr              # 创建 PR
/draft-pr               # 创建草稿 PR
/review-pr              # 审查 PR

# 开发工作流
/feature-dev            # 功能开发
/brainstorm             # 头脑风暴
/write-plan             # 编写计划
/execute-plan           # 执行计划

# 代码审查
/code-review            # 代码审查
/review-pr              # PR 审查

# 调试
/smart-debug            # 智能调试
/error-analysis         # 错误分析

# TDD
/tdd-cycle              # TDD 循环
/tdd-red                # 编写失败测试
/tdd-green              # 使测试通过
/tdd-refactor           # 重构

# 技能使用
/skills                 # 强制技能使用协议
/autonomous             # 执行长任务
/spec-kit               # 规范驱动开发

# Claude Code 设置
/cc:create-command       # 创建自定义命令
/think-harder           # 深度思考
/reflection             # 反思分析
/eureka                 # 记录突破
/translate              # 翻译

# Hookify
/hookify                # 创建钩子
/hookify:list          # 列出规则
/hookify:configure      # 配置规则
```

---

*生成时间: 2025-12-15*
*数据来源: Claude Code 插件系统*