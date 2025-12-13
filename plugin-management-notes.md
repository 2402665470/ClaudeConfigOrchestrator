# 插件管理系统思路记录（个人本机版）

## 结论（当前选择）
- 使用范围：本机个人
- 市场来源：GitLab（任选最方便的方式）
- 推荐拉取方式：HTTPS + 个人访问令牌（PAT）更省事；SSH在初次配置后也很顺手
- 默认安装范围：项目目录优先（避免全局干扰）

## 最小可用方案（MVP）
- 功能：登记市场 → 浏览插件 → 选项目 → 一键安装到项目
- 复用：尽量复用 Claude CLI 与 Claude Code Templates 的安装能力（少自己造轮子）
- 冲突：同名组件出现时提供“项目优先/禁用来源”两个选项即可

## 母仓库（GitLab）规划
- 仓库：`claude-marketplace`（名称随意）
- 每个插件一个文件夹，至少包含：
  - `.claude-plugin/plugin.json`（插件清单：name、version、description）
  - `skills/<skill-name>/SKILL.md`
  - `agents/*.md`
  - `commands/*.md`
  - `hooks/hooks.json`
  - `.mcp.json`（如需外部服务集成）

## 关键操作
- 登记市场（GitLab）：`/plugin marketplace add https://gitlab.com/<your-org>/claude-marketplace.git`
- 浏览与安装：`/plugin`、`/plugin install <插件名>`
- 仪表盘查看与管理：`npx claude-code-templates@latest --plugins`

## 命名与冲突策略
- 命名规范：`组织/能力名`（如 `my-team/pdf-processing-pro`）
- 项目优先：把选定版本安装到项目的`.claude`，并在项目`CLAUDE.md`只允许这些组件
- 精简安装：只装需要的插件，避免广撒网导致同名冲突

## 下一步
- 在 GitLab 创建母仓库并放一个最小插件做连通性测试
- 在本机项目中用 `/plugin install <插件名>` 验证安装到项目目录
- 整理“10个常用能力”成一个标准组合插件，供新项目一键安装

## 待确认（保持简单）
- 是否采用 HTTPS+PAT 作为默认拉取方式（建议：是）
- 标准组合的组件清单（10个能力的名字/用途）
