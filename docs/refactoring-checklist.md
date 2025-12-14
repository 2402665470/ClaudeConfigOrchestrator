# Claude Config Distributor 重构清单

## 📋 需要重新实现的核心功能

### 1. 【高优先级】外部市场管理
**当前问题**：
- 试图克隆整个仓库到本地
- 自己解析仓库结构
- 重新实现插件发现机制

**正确实现**：
```typescript
class MarketplaceManager {
  // 直接调用 Claude CLI 添加 marketplace
  async addMarketplace(repo: string): Promise<void> {
    await this.executeClaudeCommand(`plugin marketplace add ${repo}`)
  }

  // 获取已配置的 marketplaces
  async getMarketplaces(): Promise<Marketplace[]> {
    const configPath = path.join(os.homedir(), '.claude/plugins/known_marketplaces.json')
    const config = await fs.readJson(configPath)

    // 解析每个 marketplace 的插件列表
    const marketplaces = []
    for (const [name, info] of Object.entries(config)) {
      const manifestPath = path.join(info.installLocation, '.claude-plugin/marketplace.json')
      const manifest = await fs.readJson(manifestPath)
      marketplaces.push({
        name,
        plugins: manifest.plugins,
        source: info.source
      })
    }
    return marketplaces
  }

  // 刷新 marketplace（更新插件列表）
  async refreshMarketplace(name: string): Promise<void> {
    await this.executeClaudeCommand(`plugin marketplace update ${name}`)
  }
}
```

**修改步骤**：
1. 删除仓库克隆逻辑
2. 使用 `child_process` 执行 Claude CLI 命令
3. 解析 `known_marketplaces.json` 和各个 marketplace 的 manifest

### 2. 【高优先级】插件安装系统
**当前问题**：
- 复制插件文件到项目目录
- 手动管理文件结构
- 处理文件冲突

**正确实现**：
```typescript
class PluginInstaller {
  // 安装插件（本质上是注册）
  async installPlugin(pluginId: string, marketplace: string, scope: 'user' | 'project' | 'local', projectPath?: string): Promise<void> {
    // 1. 执行 Claude CLI 安装命令
    const command = `plugin install -s ${scope} ${pluginId}@${marketplace}`
    await this.executeClaudeCommand(command)

    // 2. 如果是项目级安装，创建项目配置
    if (scope === 'project' && projectPath) {
      await this.enablePluginInProject(pluginId, projectPath)
    }
  }

  // 在项目中启用插件
  private async enablePluginInProject(pluginId: string, projectPath: string): Promise<void> {
    const settingsPath = path.join(projectPath, '.claude/settings.json')

    // 确保目录存在
    await fs.ensureDir(path.dirname(settingsPath))

    // 读取或创建设置
    let settings = { enabledPlugins: {} }
    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJson(settingsPath)
    }

    // 启用插件
    settings.enabledPlugins[pluginId] = true
    await fs.writeJson(settingsPath, settings, { spaces: 2 })
  }

  // 获取已安装的插件
  async getInstalledPlugins(scope?: 'user' | 'project' | 'local', projectPath?: string): Promise<Plugin[]> {
    const installedPath = path.join(os.homedir(), '.claude/plugins/installed_plugins.json')
    const installed = await fs.readJson(installedPath)

    const plugins: Plugin[] = []

    // 根据作用域过滤
    for (const [pluginId, installations] of Object.entries(installed.plugins)) {
      for (const installation of installations) {
        if (!scope || installation.scope === scope) {
          // 读取插件元数据
          const metadata = await this.getPluginMetadata(installation.installPath)
          plugins.push({
            id: pluginId,
            metadata,
            scope: installation.scope,
            installPath: installation.installPath
          })
        }
      }
    }

    return plugins
  }
}
```

**修改步骤**：
1. 移除文件复制逻辑
2. 通过 Claude CLI 安装插件
3. 通过配置文件管理项目级插件

### 3. 【中优先级】项目管理
**当前问题**：
- 扫描项目文件夹结构
- 读取各种配置文件
- 自己维护项目列表

**正确实现**：
```typescript
class ProjectManager {
  // 扫描 Claude 项目
  async scanProjects(basePath: string): Promise<Project[]> {
    const projects: Project[] = []

    // 查找包含 .claude 目录的项目
    const claudeDirs = await glob('**/.claude', {
      cwd: basePath,
      onlyDirectories: true,
      ignore: ['**/node_modules/**', '**/.git/**']
    })

    for (const dir of claudeDirs) {
      const projectPath = path.join(basePath, path.dirname(dir))

      // 检查是否有项目配置
      const settingsPath = path.join(projectPath, '.claude/settings.json')
      if (await fs.pathExists(settingsPath)) {
        const settings = await fs.readJson(settingsPath)
        const plugins = Object.keys(settings.enabledPlugins || {})

        projects.push({
          path: projectPath,
          name: path.basename(projectPath),
          pluginCount: plugins.length,
          plugins
        })
      }
    }

    return projects
  }

  // 获取项目的插件状态
  async getProjectPlugins(projectPath: string): Promise<ProjectPlugin[]> {
    const settingsPath = path.join(projectPath, '.claude/settings.json')

    if (!await fs.pathExists(settingsPath)) {
      return []
    }

    const settings = await fs.readJson(settingsPath)
    const enabledPlugins = settings.enabledPlugins || {}

    // 获取每个插件的详细信息
    const plugins: ProjectPlugin[] = []
    for (const [pluginId, enabled] of Object.entries(enabledPlugins)) {
      if (enabled) {
        const metadata = await this.getPluginMetadataById(pluginId)
        plugins.push({
          id: pluginId,
          enabled: true,
          metadata
        })
      }
    }

    return plugins
  }
}
```

**修改步骤**：
1. 通过扫描 `.claude/settings.json` 识别 Claude 项目
2. 从配置文件读取插件信息
3. 移除手动配置文件操作

### 4. 【中优先级】场景管理
**当前问题**：
- 场景存储完整的插件数据
- 自己管理场景应用逻辑

**正确实现**：
```typescript
class SceneManager {
  // 创建场景（只存储插件引用）
  async createScene(name: string, pluginIds: string[]): Promise<Scene> {
    const scene: Scene = {
      id: generateId(),
      name,
      pluginIds,  // 只存储 ID，不存储完整插件数据
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 保存到本地
    const scenesPath = this.getScenesPath()
    const scenes = await this.loadScenes()
    scenes.push(scene)
    await fs.writeJson(scenesPath, scenes, { spaces: 2 })

    return scene
  }

  // 应用场景到项目
  async applySceneToProject(sceneId: string, projectPath: string): Promise<void> {
    const scene = await this.getScene(sceneId)
    if (!scene) throw new Error('Scene not found')

    // 确保所有插件都已安装
    for (const pluginId of scene.pluginIds) {
      const [pluginName, marketplace] = pluginId.split('@')
      await this.ensurePluginInstalled(pluginName, marketplace)
    }

    // 在项目中启用这些插件
    const settingsPath = path.join(projectPath, '.claude/settings.json')
    await fs.ensureDir(path.dirname(settingsPath))

    let settings = { enabledPlugins: {} }
    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJson(settingsPath)
    }

    // 启用场景中的所有插件
    scene.pluginIds.forEach(pluginId => {
      settings.enabledPlugins[pluginId] = true
    })

    await fs.writeJson(settingsPath, settings, { spaces: 2 })
  }
}
```

**修改步骤**：
1. 场景只存储插件 ID 引用
2. 应用场景时通过 Claude CLI 确保插件已安装
3. 通过修改项目配置文件启用插件

### 5. 【低优先级】本地能力库
**当前问题**：
- 克隆仓库到本地
- 自己解析和分类文件
- 维护缓存系统

**正确实现**：
```typescript
class LocalLibrary {
  // 本地库就是 Claude 的插件缓存
  async getCachedPlugins(): Promise<Plugin[]> {
    const cachePath = path.join(os.homedir(), '.claude/plugins/cache')
    const plugins: Plugin[] = []

    // 扫描所有已缓存的插件
    const marketplaceDirs = await fs.readdir(cachePath)

    for (const marketplace of marketplaceDirs) {
      const marketplacePath = path.join(cachePath, marketplace)
      const pluginDirs = await fs.readdir(marketplacePath)

      for (const pluginName of pluginDirs) {
        const pluginPath = path.join(marketplacePath, pluginName)
        const versions = await fs.readdir(pluginPath)

        // 获取最新版本
        const latestVersion = versions.sort().pop()
        const versionPath = path.join(pluginPath, latestVersion)

        // 读取插件元数据
        const metadata = await this.readPluginMetadata(versionPath)
        plugins.push({
          id: `${pluginName}@${marketplace}`,
          marketplace,
          name: pluginName,
          version: latestVersion,
          metadata,
          path: versionPath
        })
      }
    }

    return plugins
  }
}
```

**修改步骤**：
1. 直接使用 Claude 的插件缓存
2. 不需要单独的下载和存储逻辑
3. 从缓存中读取插件信息

## 🔧 技术实现调整

### 1. 移除不需要的功能

```typescript
// 删除这些文件或功能
- src/background/git.ts  // 不需要手动克隆
- src/background/fileOperations.ts  // 不需要手动复制文件
- src/background/conflictResolver.ts  // Claude CLI 处理冲突
- src/background/mcpMerger.ts  // Claude CLI 自动合并
```

### 2. 新增需要的功能

```typescript
// 新增这些文件
- src/services/claudeCli.ts  // Claude CLI 命令封装
- src/services/configReader.ts  // Claude 配置文件读取
- src/services/projectScanner.ts  // 项目扫描工具
```

### 3. UI 调整

**不需要的 UI**：
- 文件冲突解决界面
- 下载进度条
- MCP 配置编辑器

**需要增强的 UI**：
- Marketplace 浏览器（显示已配置的 marketplaces）
- 场景预览（显示包含的插件列表）
- 批量操作界面（批量安装/卸载插件）

## 📝 重构实施计划

### Phase 1: 核心 CLI 集成（2-3天）
1. 实现 `claudeCli.ts` 服务
2. 实现 `configReader.ts` 服务
3. 重构 Marketplace 模块
4. 重构 Plugin 安装逻辑

### Phase 2: 项目管理重构（1-2天）
1. 重构项目管理器
2. 实现项目扫描功能
3. 更新项目列表 UI

### Phase 3: 场景管理优化（1天）
1. 简化场景存储结构
2. 重构场景应用逻辑
3. 更新场景 UI

### Phase 4: UI 清理和优化（1-2天）
1. 移除不需要的 UI 组件
2. 优化用户体验流程
3. 添加错误处理

### Phase 5: 测试和优化（1天）
1. 全面测试新功能
2. 性能优化
3. 文档更新

## ⚠️ 注意事项

1. **向后兼容**：确保现有的场景配置可以迁移
2. **错误处理**：Claude CLI 命令可能失败，需要优雅处理
3. **性能考虑**：频繁调用 CLI 可能影响性能，考虑缓存
4. **权限问题**：确保有权限执行 Claude CLI 和读取配置文件

## 🎯 最终目标

重构后的工具将：
- 完全兼容 Claude CLI 的插件机制
- 提供更友好的图形界面
- 减少代码复杂度
- 提高可靠性和可维护性
- 专注于用户体验而非重复造轮子