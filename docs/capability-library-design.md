# 能力库（Capability Library）功能设计方案

## 一、核心概念定义

### 1.1 什么是能力库

能力库（Capability Library）是一个本地的插件管理系统，用于：
- 从外部源（GitHub、GitLab等）导入插件包
- 解析并标准化存储各种类型的能力（Agents、Skills、Commands、Hooks、MCPs）
- 将能力注入到 Claude 项目中
- 管理场景（能力的组合）

### 1.2 设计原则

1. **文件系统旁加载**：不使用 `claude plugin install`，直接管理文件
2. **标准化结构**：所有插件解析为统一的目录结构
3. **非侵入式**：通过文件操作管理，不修改 Claude CLI 内部逻辑
4. **用户友好**：提供图形界面简化操作流程

## 二、数据模型设计

### 2.1 核心数据结构

```typescript
// 全局配置
interface GlobalConfig {
  library_path: string;        // 能力库根目录
  editor_path: string;         // 外部编辑器路径
  git_path: string;           // Git 可执行文件路径
  last_update?: string;       // 最后更新时间
}

// 插件包元数据
interface PluginMetadata {
  id: string;                 // 唯一标识
  name: string;               // 显示名称
  description: string;        // 描述
  author: string;            // 作者
  version: string;           // 版本
  source: {                  // 来源信息
    type: 'github' | 'gitlab' | 'local';
    url: string;
    branch?: string;
    commit_hash?: string;
  };
  capabilities_stats: {       // 能力统计
    agents: number;
    skills: number;
    commands: number;
    hooks: number;
    mcps: number;
  };
  tags: string[];            // 标签
  installed_at: string;      // 安装时间
  updated_at: string;        // 更新时间
}

// 能力项定义
interface CapabilityItem {
  id: string;                // 格式: plugin_id/capability_type/capability_name
  plugin_id: string;         // 所属插件
  type: 'agent' | 'skill' | 'command' | 'hook' | 'mcp';
  name: string;              // 能力名称
  path: string;              // 在能力库中的路径
  display_name?: string;     // 显示名称
  description?: string;      // 描述
  metadata?: {               // 特定类型的元数据
    // Agent 特有
    role?: string;
    system_prompt?: string;

    // Skill 特有
    forms?: string[];
    scripts?: string[];

    // Command 特有
    slash_command?: string;

    // Hook 特有
    trigger_events?: string[];

    // MCP 特有
    server_config?: any;
  };
}

// 项目定义
interface Project {
  id: string;                // 唯一标识
  name: string;              // 项目名称
  path: string;              // 项目路径
  description?: string;      // 项目描述
  type?: string;             // 项目类型
  capabilities: {            // 已安装的能力
    agents: string[];        // agent 文件列表
    skills: string[];        // skill 文件夹列表
    commands: string[];      // command 文件列表
    hooks: string[];         // hook 文件列表
    mcps: string[];          // mcp 名称列表
  };
  profiles: string[];        // 可用的 profiles
  current_profile?: string;  // 当前 profile
  created_at: string;
  updated_at: string;
}

// 场景定义
interface Scene {
  id: string;                // 唯一标识
  name: string;              // 场景名称
  description: string;       // 场景描述
  capabilities: string[];    // 包含的能力 ID 列表
  projects?: string[];       // 应用过的项目
  created_at: string;
  updated_at: string;
}

// 注入任务
interface InjectionTask {
  id: string;
  project_id: string;
  capabilities: string[];
  conflict_strategy: 'skip' | 'overwrite' | 'merge';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  errors?: string[];
  created_at: string;
}
```

### 2.2 配置文件结构

```json
// ~/.claude-lem/config.json
{
  "library_path": "D:/Documents/ClaudeLibrary",
  "editor_path": "C:/Program Files/Microsoft VS Code/Code.exe",
  "git_path": "git",
  "last_update": "2024-12-14T00:00:00Z"
}

// {library_path}/index.json - 能力库索引
{
  "plugins": {},
  "capabilities": {},
  "scenes": [],
  "version": "1.0.0",
  "last_scan": "2024-12-14T00:00:00Z"
}
```

## 三、功能架构设计

### 3.1 服务层架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 UI 层                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │  能力库页面  │ │  项目管理   │ │  场景管理   │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────────────────────┘
                          │
                         IPC
                          │
┌─────────────────────────────────────────────────────────┐
│                  Electron 主进程                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ 配置管理器   │ │ 文件管理器   │ │ 任务管理器   │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   业务逻辑层                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ 解析器       │ │ 注入器       │ │ 扫描器       │         │
│  │ (Parser)    │ │ (Injector)  │ │ (Scanner)   │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   数据存储层                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │  本地文件系统 │ │  Git 仓库   │ │  配置文件   │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 核心服务实现

```typescript
// 解析器服务 - 负责解析下载的插件
class ParserService {
  async parseRepository(repoUrl: string, options: ParseOptions): Promise<PluginMetadata> {
    // 1. 克隆仓库到临时目录
    const tempDir = await this.gitClone(repoUrl, options);

    // 2. 扫描并识别能力
    const capabilities = await this.scanCapabilities(tempDir);

    // 3. 标准化目录结构
    const pluginId = this.generatePluginId(repoUrl);
    const pluginDir = path.join(this.config.library_path, pluginId);
    await this.organizeStructure(tempDir, pluginDir, capabilities);

    // 4. 生成 metadata.json
    const metadata = this.generateMetadata(pluginId, capabilities, repoUrl);
    await fs.writeJson(path.join(pluginDir, 'metadata.json'), metadata);

    // 5. 更新索引
    await this.updateIndex(pluginId, metadata);

    return metadata;
  }

  private async scanCapabilities(dir: string): Promise<CapabilityItem[]> {
    const capabilities: CapabilityItem[] = [];

    // 扫描 agents
    const agentFiles = await glob('**/*.md', { cwd: path.join(dir, 'agents') });
    capabilities.push(...agentFiles.map(file => ({
      type: 'agent',
      name: path.basename(file, '.md'),
      path: path.join('agents', file)
    })));

    // 扫描 skills (查找包含 SKILL.md 的文件夹)
    const skillDirs = await this.findSkillDirectories(dir);
    capabilities.push(...skillDirs.map(dir => ({
      type: 'skill',
      name: path.basename(dir),
      path: path.join('skills', dir)
    })));

    // 扫描其他类型...

    return capabilities;
  }
}

// 注入器服务 - 负责将能力注入到项目
class InjectorService {
  async injectCapabilities(
    projectId: string,
    capabilityIds: string[],
    conflictStrategy: ConflictStrategy
  ): Promise<InjectionTask> {
    const project = await this.getProject(projectId);
    const task = this.createInjectionTask(projectId, capabilityIds);

    try {
      for (const capabilityId of capabilityIds) {
        const capability = await this.getCapability(capabilityId);
        const targetPath = this.getTargetPath(project, capability);

        // 检查冲突
        if (await this.checkConflict(targetPath)) {
          await this.handleConflict(targetPath, conflictStrategy);
        }

        // 执行注入
        await this.performInjection(capability, targetPath);

        // 特殊处理：MCP 配置合并
        if (capability.type === 'mcp') {
          await this.mergeMcpConfig(project, capability);
        }
      }

      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.errors = [error.message];
    }

    return task;
  }

  private async mergeMcpConfig(project: Project, capability: CapabilityItem): Promise<void> {
    const projectConfigPath = path.join(project.path, 'claude_desktop_config.json');
    const mcpConfigPath = path.join(
      this.config.library_path,
      capability.plugin_id,
      'assets',
      'mcp.json'
    );

    // 读取现有配置
    let projectConfig = { mcpServers: {} };
    if (await fs.pathExists(projectConfigPath)) {
      projectConfig = await fs.readJson(projectConfigPath);
    }

    // 读取 MCP 配置
    const mcpConfig = await fs.readJson(mcpConfigPath);

    // 深度合并
    const merged = lodash.merge(projectConfig, mcpConfig);

    // 写回
    await fs.writeJson(projectConfigPath, merged, { spaces: 2 });
  }
}

// 扫描器服务 - 负责扫描项目和能力库
class ScannerService {
  async scanProjects(basePath: string): Promise<Project[]> {
    const projects: Project[] = [];
    const claudeDirs = await glob('**/.claude', {
      cwd: basePath,
      onlyDirectories: true,
      ignore: ['**/node_modules/**']
    });

    for (const dir of claudeDirs) {
      const projectPath = path.join(basePath, path.dirname(dir));
      const project = await this.analyzeProject(projectPath);
      if (project) {
        projects.push(project);
      }
    }

    return projects;
  }

  private async analyzeProject(projectPath: string): Promise<Project | null> {
    const claudeDir = path.join(projectPath, '.claude');
    if (!await fs.pathExists(claudeDir)) return null;

    const capabilities = await this.scanProjectCapabilities(claudeDir);
    const profiles = await this.scanProfiles(claudeDir);

    return {
      id: this.generateId(),
      name: path.basename(projectPath),
      path: projectPath,
      capabilities,
      profiles,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
```

## 四、用户界面流程设计

### 4.1 主要页面流程

```
┌─────────────────┐
│   主界面框架     │
│ ┌─────────────┐ │
│ │ 侧边导航栏   │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │  动态内容区  │ │
│ └─────────────┘ │
└─────────────────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐
│设置页面│   │能力库 │
└───┬───┘   └───┬───┘
    │           │
┌───▼───┐   ┌───▼───┐
│项目管理│   │场景管理│
└───────┘   └───────┘
```

### 4.2 能力库页面交互流程

```
┌────────────────────────────────────┐
│           能力库页面                │
├────────────────────────────────────┤
│ 搜索框 [        ] [导入] [新建]     │
├────────────────────────────────────┤
│ [插件包] [原子能力] [已下载]        │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 插件卡片网格                    │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐        │ │
│ │ │全栈 │ │AI助 │ │Git  │        │ │
│ │ │开发 │ │手集 │ │自动化│        │ │
│ │ │套件 │ │     │ │     │        │ │
│ │ └─────┘ └─────┘ └─────┘        │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
          │
          ▼ 点击导入
┌────────────────────────────────────┐
│           导入弹窗                  │
├────────────────────────────────────┤
│ Git 仓库 URL: [_____________]      │
│ ☑ 强制重新下载                    │
│                                   │
│           [取消] [开始导入]        │
└────────────────────────────────────┘
          │
          ▼ 导入过程
┌────────────────────────────────────┐
│          进度提示                  │
├────────────────────────────────────┤
│ 正在克隆仓库... 45%               │
│ 正在解析插件结构...                │
│ 正在标准化文件...                  │
└────────────────────────────────────┘
```

### 4.3 项目注入流程

```
┌────────────────────────────────────┐
│         项目详情页面               │
├────────────────────────────────────┤
│ 左栏：当前能力        │ 右栏：能力库│
│ ┌─────────────────┐   │ ┌─────────┐ │
│ │ 📂 agents       │   │ │搜索框   │ │
│ │   📄 coder.md   │   │ └─────────┘ │
│ │   📄 tester.md  │   │ ┌─────────┐ │
│ │                 │   │ │📦 全栈  │ │
│ │ 📂 skills       │   │ │  开发套 │ │
│ │   📂 pdf-reader │   │ │  件    │ │
│ │     📄 SKILL.md │   │ │ [安装]  │ │
│ └─────────────────┘   │ └─────────┘ │
└────────────────────────────────────┘
          │
          ▼ 点击安装
┌────────────────────────────────────┐
│          冲突检测弹窗               │
├────────────────────────────────────┤
│ ⚠️ 检测到以下文件已存在：          │
│   • agents/coder.md                │
│   • skills/pdf-reader/             │
│                                    │
│ 冲突解决策略：                     │
│ ○ 跳过冲突文件                     │
│ ● 覆盖冲突文件                     │
│                                    │
│ ☑ 合并 MCP 配置                   │
│                                    │
│           [取消] [确认安装]         │
└────────────────────────────────────┘
```

## 五、与现有系统集成方案

### 5.1 与 Electron 应用的集成

```typescript
// 主进程服务注册
class MainProcessServices {
  constructor() {
    this.registerServices();
  }

  private registerServices() {
    // 初始化服务
    this.configService = new ConfigService();
    this.parserService = new ParserService(this.configService);
    this.injectorService = new InjectorService(this.configService);
    this.scannerService = new ScannerService(this.configService);

    // 注册 IPC 处理器
    ipcMain.handle('config:get', () => this.configService.getConfig());
    ipcMain.handle('config:update', (_, config) => this.configService.updateConfig(config));

    ipcMain.handle('library:import', (_, repoUrl) => this.parserService.parseRepository(repoUrl));
    ipcMain.handle('library:getPlugins', () => this.scannerService.scanLibrary());

    ipcMain.handle('projects:scan', (_, path) => this.scannerService.scanProjects(path));
    ipcMain.handle('projects:inject', (_, projectId, capabilities, strategy) =>
      this.injectorService.injectCapabilities(projectId, capabilities, strategy)
    );

    ipcMain.handle('scenes:create', (_, scene) => this.sceneService.createScene(scene));
    ipcMain.handle('scenes:apply', (_, sceneId, projectId) =>
      this.sceneService.applyScene(sceneId, projectId)
    );
  }
}

// 预加载脚本暴露 API
contextBridge.exposeInMainWorld('claudeLem', {
  // 配置管理
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (config) => ipcRenderer.invoke('config:update', config)
  },

  // 能力库
  library: {
    import: (repoUrl) => ipcRenderer.invoke('library:import', repoUrl),
    getPlugins: () => ipcRenderer.invoke('library:getPlugins'),
    getCapabilities: () => ipcRenderer.invoke('library:getCapabilities')
  },

  // 项目管理
  projects: {
    scan: (path) => ipcRenderer.invoke('projects:scan', path),
    inject: (projectId, capabilities, strategy) =>
      ipcRenderer.invoke('projects:inject', projectId, capabilities, strategy)
  },

  // 场景管理
  scenes: {
    create: (scene) => ipcRenderer.invoke('scenes:create', scene),
    apply: (sceneId, projectId) => ipcRenderer.invoke('scenes:apply', sceneId, projectId)
  }
});
```

### 5.2 与现有 UI 组件的集成

```tsx
// 在 App.tsx 中添加能力库路由
function App() {
  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/scenes" element={<ScenesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// 使用 Zustand 管理全局状态
interface ClaudeLemStore {
  // 配置
  config: GlobalConfig | null;
  updateConfig: (config: Partial<GlobalConfig>) => void;

  // 能力库
  plugins: PluginMetadata[];
  capabilities: CapabilityItem[];
  refreshLibrary: () => Promise<void>;

  // 项目
  projects: Project[];
  currentProject: Project | null;
  scanProjects: (basePath?: string) => Promise<void>;

  // 任务
  injectionTasks: InjectionTask[];
}

const useClaudeLemStore = create<ClaudeLemStore>((set, get) => ({
  config: null,
  plugins: [],
  capabilities: [],
  projects: [],
  currentProject: null,
  injectionTasks: [],

  updateConfig: async (newConfig) => {
    await window.claudeLem.config.update(newConfig);
    const config = await window.claudeLem.config.get();
    set({ config });
  },

  refreshLibrary: async () => {
    const [plugins, capabilities] = await Promise.all([
      window.claudeLem.library.getPlugins(),
      window.claudeLem.library.getCapabilities()
    ]);
    set({ plugins, capabilities });
  },

  scanProjects: async (basePath) => {
    const projects = await window.claudeLem.projects.scan(basePath);
    set({ projects });
  }
}));
```

### 5.3 错误处理和日志

```typescript
// 统一错误处理
class ErrorHandler {
  static handle(error: Error, context: string) {
    console.error(`[Claude LEM] ${context}:`, error);

    // 发送错误到前端
    if (mainWindow) {
      mainWindow.webContents.send('error', {
        message: error.message,
        context,
        timestamp: new Date().toISOString()
      });
    }

    // 写入日志文件
    this.writeLog(error, context);
  }

  private static async writeLog(error: Error, context: string) {
    const logPath = path.join(os.homedir(), '.claude-lem', 'logs', 'error.log');
    await fs.ensureDir(path.dirname(logPath));

    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error.message,
        stack: error.stack
      }
    };

    await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
  }
}

// 进度通知
class ProgressNotifier {
  static notify(taskId: string, progress: number, message: string) {
    if (mainWindow) {
      mainWindow.webContents.send('progress', {
        taskId,
        progress,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

## 六、安全性和最佳实践

### 6.1 安全考虑

1. **路径验证**：确保所有文件操作都在允许的目录内进行
2. **代码审查**：在导入插件时扫描潜在的安全风险
3. **权限控制**：只请求必要的文件系统权限
4. **备份机制**：在执行注入前自动备份项目配置

### 6.2 性能优化

1. **异步操作**：所有文件 I/O 使用异步 API
2. **流式处理**：大文件使用流式复制
3. **缓存机制**：缓存扫描结果和索引
4. **增量更新**：只更新变更的文件

### 6.3 用户体验

1. **实时反馈**：显示操作进度和状态
2. **撤销功能**：支持撤销最近的注入操作
3. **批量操作**：支持批量安装/卸载能力
4. **搜索过滤**：快速查找需要的能力

## 七、实施计划

### Phase 1：基础设施建设（1-2周）
- [ ] 实现配置管理服务
- [ ] 创建数据模型和类型定义
- [ ] 搭建基础的 UI 框架
- [ ] 实现 IPC 通信机制

### Phase 2：解析器开发（1-2周）
- [ ] 实现 Git 克隆功能
- [ ] 开发插件解析逻辑
- [ ] 实现标准化目录结构
- [ ] 创建能力库索引系统

### Phase 3：注入器开发（2-3周）
- [ ] 实现文件复制和目录操作
- [ ] 开发冲突检测机制
- [ ] 实现 MCP 配置合并
- [ ] 创建进度反馈系统

### Phase 4：UI 完善（1-2周）
- [ ] 完善能力库页面 UI
- [ ] 实现项目详情双栏布局
- [ ] 添加场景管理界面
- [ ] 优化交互体验

### Phase 5：测试和优化（1周）
- [ ] 单元测试覆盖
- [ ] 集成测试
- [ ] 性能优化
- [ ] 错误处理完善

## 八、总结

本设计方案提供了一个完整的能力库管理解决方案，包括：

1. **清晰的数据模型**：定义了所有核心实体和关系
2. **模块化架构**：各服务职责明确，易于维护和扩展
3. **用户友好的界面**：直观的操作流程和反馈机制
4. **灵活的集成方案**：可以无缝集成到现有的 Electron 应用中

通过实施这个方案，用户可以方便地管理 Claude 插件和能力，提高开发效率。