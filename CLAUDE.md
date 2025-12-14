# Claude Config Distributor 项目指南

## 项目定位

本工具是 Claude CLI 的图形化界面，提供以下核心功能：
1. 外部市场管理（可视化 marketplace 操作）
2. 项目配置管理（图形化项目配置）
3. 场景管理（插件组合快速应用）

## 核心设计原则

### 1. 封装而非替代
- 不重新实现 Claude CLI 的任何功能
- 所有操作都通过 Claude CLI 完成
- 我们只是提供图形化界面

### 2. 配置文件驱动
- 不复制任何插件文件
- 只操作 Claude 的配置文件
- 通过配置文件管理一切

### 3. 使用 Claude 的机制
- Marketplace: `~/.claude/plugins/known_marketplaces.json`
- 插件安装: `~/.claude/plugins/installed_plugins.json`
- 项目配置: `project/.claude/settings.json`
- 插件缓存: `~/.claude/plugins/cache/`

## 技术架构

### 目录结构
```
src/
├── main/                 # Electron 主进程
│   ├── services/        # 业务服务
│   │   ├── claudeCli.ts # Claude CLI 命令封装
│   │   ├── configReader.ts # 配置文件读取
│   │   └── projectScanner.ts # 项目扫描
│   ├── index.ts         # 主进程入口
│   └── preload.ts       # 预加载脚本
├── renderer/            # React 前端
│   ├── pages/          # 页面组件
│   └── components/     # UI 组件
└── common/             # 共享类型
    └── types.ts        # 类型定义
```

### 核心服务

#### ClaudeCliService
```typescript
class ClaudeCliService {
  async executeCommand(command: string): Promise<string>
  async addMarketplace(repo: string): Promise<void>
  async installPlugin(plugin: string, options: InstallOptions): Promise<void>
  async getInstalledPlugins(): Promise<Plugin[]>
}
```

#### ConfigReaderService
```typescript
class ConfigReaderService {
  async getMarketplaces(): Promise<Marketplace[]>
  async getProjectSettings(projectPath: string): Promise<ProjectSettings>
  async updateProjectSettings(projectPath: string, settings: ProjectSettings): Promise<void>
}
```

#### ProjectScannerService
```typescript
class ProjectScannerService {
  async scanProjects(basePath: string): Promise<Project[]>
  async isClaudeProject(path: string): boolean
}
```

## 实现指南

### 1. 添加外部市场
```typescript
// 使用 Claude CLI 添加
await claudeCli.executeCommand(`plugin marketplace add ${repo}`)
```

### 2. 获取市场插件列表
```typescript
// 读取配置文件
const config = await fs.readJson(path.join(os.homedir(), '.claude/plugins/known_marketplaces.json'))
const marketplace = config[marketplaceName]
const manifest = await fs.readJson(path.join(marketplace.installLocation, '.claude-plugin/marketplace.json'))
return manifest.plugins
```

### 3. 安装插件到项目
```typescript
// 1. 使用 CLI 安装
await claudeCli.executeCommand(`plugin install -s project ${plugin}@marketplace}`)

// 2. 更新项目配置
const settings = await configReader.getProjectSettings(projectPath)
settings.enabledPlugins[`${plugin}@marketplace`] = true
await configReader.updateProjectSettings(projectPath, settings)
```

### 4. 场景管理
```typescript
// 场景只保存插件 ID
interface Scene {
  id: string
  name: string
  pluginIds: string[]  // ["plugin1@market1", "plugin2@market2"]
}

// 应用场景
for (const pluginId of scene.pluginIds) {
  await claudeCli.installPlugin(pluginId, { scope: 'project', projectPath })
}
```

## 禁止事项

1. ❌ 不要手动克隆插件仓库
2. ❌ 不要复制任何插件文件
3. ❌ 不要修改 Claude 的缓存
4. ❌ 不要实现自己的插件解析
5. ❌ 不要处理文件冲突（CLI 会处理）

## 推荐做法

1. ✅ 所有操作通过 Claude CLI
2. ✅ 只读取和修改配置文件
3. ✅ 使用 CLI 的错误信息
4. ✅ 缓存 CLI 的输出结果
5. ✅ 提供友好的错误提示

## 参考文档

- [项目分析与开发建议](docs/project-analysis-and-recommendations.md)
- [重构清单](docs/refactoring-checklist.md)

## 开发提醒

记住：我们是 GUI 工具，不是插件管理器。专注于用户体验，让 Claude CLI 做所有脏活累活。

---

## 开发指南（重要）

### ⚠️ 常见问题：npm 脚本无法执行

**症状**：执行 `npm run dev` 时提示 "Missing script: dev"

**根本原因**：`node_modules` 目录缺失或损坏。没有 node_modules，npm 无法执行任何脚本。

### ✅ 正确的开发流程

#### 1. 首次设置
```bash
cd D:/MyProject/claude
npm install
```

#### 2. 启动开发服务器
```bash
npm run dev
```

#### 3. 开发过程中的重启
- **修改前端代码**：Vite 会自动热重载，无需重启
- **修改主进程代码**（src/main/）：需要重启 Electron
- **添加新依赖**：先 `npm install`，然后重启

#### 4. 如果遇到 "Missing script" 错误
```bash
# 1. 确保在正确目录
cd D:/MyProject/claude

# 2. 检查 node_modules 是否存在
ls node_modules

# 3. 如果不存在，重新安装
npm install

# 4. 启动应用
npm run dev
```

### 🚫 错误做法

1. **不要在批处理脚本中直接删除 node_modules**
2. **不要修改 package.json 后不运行 npm install**
3. **不要在不存在的目录中执行 npm 命令**

### 💡 最佳实践

1. **使用 git bash 而非 cmd/PowerShell**
   - Git bash 对 npm 支持更好
   - 避免路径和权限问题

2. **保持 node_modules 整洁**
   - 使用 .gitignore 排除 node_modules
   - 只在必要时删除并重新安装

3. **批处理脚本改进**
   ```batch
   @echo off
   cd /d D:\MyProject\claude

   REM 检查依赖
   if not exist "node_modules" (
       echo Installing dependencies...
       npm install
   )

   REM 启动服务
   npm run dev
   ```

4. **问题排查步骤**
   - 检查当前目录（pwd）
   - 检查 node_modules 存在（ls node_modules）
   - 检查 package.json 有效（cat package.json）
   - 重新安装依赖（npm install）

### 📝 记住这个原则

**npm 需要 node_modules 才能工作**。这是所有问题的根源。