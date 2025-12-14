# 能力库（Capability Library）技术实现示例

## 一、核心服务实现

### 1.1 配置管理服务

```typescript
// src/services/ConfigService.ts
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface GlobalConfig {
  library_path: string;
  editor_path: string;
  git_path: string;
  last_update?: string;
}

export class ConfigService {
  private configPath: string;
  private config: GlobalConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), '.claude-lem', 'config.json');
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): GlobalConfig {
    return {
      library_path: path.join(os.homedir(), 'Documents', 'ClaudeLibrary'),
      editor_path: this.findDefaultEditor(),
      git_path: 'git'
    };
  }

  private findDefaultEditor(): string {
    const commonEditors = [
      'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      'C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe',
      '/usr/bin/code',
      '/usr/local/bin/code'
    ];

    for (const editor of commonEditors) {
      if (fs.existsSync(editor)) {
        return editor;
      }
    }

    return 'code'; // 默认假设 code 在 PATH 中
  }

  async load(): Promise<GlobalConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        this.config = await fs.readJson(this.configPath);
      } else {
        await this.save(this.config);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return this.config;
  }

  async save(config?: Partial<GlobalConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, this.config, { spaces: 2 });
  }

  get(): GlobalConfig {
    return this.config;
  }
}
```

### 1.2 解析器服务实现

```typescript
// src/services/ParserService.ts
import * as fs from 'fs-extra';
import * as path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import * as glob from 'glob';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from './ConfigService';
import { PluginMetadata, CapabilityItem } from '../types';

interface ParseOptions {
  branch?: string;
  force?: boolean;
}

export class ParserService {
  private git: SimpleGit;
  private tempDir: string;

  constructor(private config: ConfigService) {
    this.git = simpleGit();
    this.tempDir = path.join(config.get().library_path, '.temp');
  }

  async parseRepository(repoUrl: string, options: ParseOptions = {}): Promise<PluginMetadata> {
    const pluginId = this.generatePluginId(repoUrl);
    const pluginDir = path.join(this.config.get().library_path, pluginId);

    // 检查是否已存在
    if (!options.force && await fs.pathExists(pluginDir)) {
      throw new Error(`Plugin ${pluginId} already exists. Use force option to overwrite.`);
    }

    try {
      // 1. 克隆仓库
      const repoDir = await this.cloneRepository(repoUrl, options);

      // 2. 扫描能力
      const capabilities = await this.scanCapabilities(repoDir);

      // 3. 组织文件结构
      await this.organizeStructure(repoDir, pluginDir, capabilities);

      // 4. 生成元数据
      const metadata = await this.generateMetadata(pluginId, capabilities, repoUrl);

      // 5. 保存元数据
      await fs.writeJson(path.join(pluginDir, 'metadata.json'), metadata, { spaces: 2 });

      // 6. 更新索引
      await this.updateIndex(pluginId, metadata);

      // 7. 清理临时文件
      await fs.remove(repoDir);

      return metadata;
    } catch (error) {
      // 清理临时文件
      await fs.remove(pluginDir).catch(() => {});
      throw error;
    }
  }

  private async cloneRepository(repoUrl: string, options: ParseOptions): Promise<string> {
    await fs.ensureDir(this.tempDir);
    const tempRepoDir = path.join(this.tempDir, uuidv4());

    let cloneUrl = repoUrl;
    if (!repoUrl.startsWith('http')) {
      // 处理 GitHub 简短格式
      cloneUrl = `https://github.com/${repoUrl}.git`;
    }

    const cloneOptions: string[] = ['--depth', '1'];
    if (options.branch) {
      cloneOptions.push('--branch', options.branch);
    }

    await this.git.clone(cloneUrl, tempRepoDir, cloneOptions);
    return tempRepoDir;
  }

  private async scanCapabilities(repoDir: string): Promise<CapabilityItem[]> {
    const capabilities: CapabilityItem[] = [];

    // 扫描 agents
    const agentsDir = path.join(repoDir, 'agents');
    if (await fs.pathExists(agentsDir)) {
      const agentFiles = await glob('**/*.md', { cwd: agentsDir });
      capabilities.push(...agentFiles.map(file => ({
        id: `agent/${path.basename(file, '.md')}`,
        type: 'agent' as const,
        name: path.basename(file, '.md'),
        path: path.join('assets', 'agents', file)
      })));
    }

    // 扫描 skills (查找包含 SKILL.md 的文件夹)
    const skillsDir = path.join(repoDir, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const skillDirs = await this.findSkillDirectories(skillsDir);
      capabilities.push(...skillDirs.map(dir => ({
        id: `skill/${path.basename(dir)}`,
        type: 'skill' as const,
        name: path.basename(dir),
        path: path.join('assets', 'skills', dir)
      })));
    }

    // 扫描 commands
    const commandsDir = path.join(repoDir, 'commands');
    if (await fs.pathExists(commandsDir)) {
      const commandFiles = await glob('**/*.{md,txt}', { cwd: commandsDir });
      capabilities.push(...commandFiles.map(file => ({
        id: `command/${path.basename(file, path.extname(file))}`,
        type: 'command' as const,
        name: path.basename(file, path.extname(file)),
        path: path.join('assets', 'commands', file)
      })));
    }

    // 扫描 hooks
    const hooksDir = path.join(repoDir, 'hooks');
    if (await fs.pathExists(hooksDir)) {
      const hookFiles = await glob('**/*', { cwd: hooksDir, nodir: true });
      capabilities.push(...hookFiles.map(file => ({
        id: `hook/${path.basename(file)}`,
        type: 'hook' as const,
        name: path.basename(file),
        path: path.join('assets', 'hooks', file)
      })));
    }

    // 扫描 MCP 配置
    const mcpFiles = [
      'claude_desktop_config.json',
      'mcp.json',
      '.claude/mcp.json'
    ];

    for (const mcpFile of mcpFiles) {
      const mcpPath = path.join(repoDir, mcpFile);
      if (await fs.pathExists(mcpPath)) {
        const config = await fs.readJson(mcpPath);
        if (config.mcpServers && Object.keys(config.mcpServers).length > 0) {
          capabilities.push({
            id: 'mcp/config',
            type: 'mcp' as const,
            name: 'MCP Servers',
            path: path.join('assets', 'mcp.json'),
            metadata: {
              server_config: config.mcpServers
            }
          });
          break;
        }
      }
    }

    return capabilities;
  }

  private async findSkillDirectories(baseDir: string): Promise<string[]> {
    const skillDirs: string[] = [];
    const items = await fs.readdir(baseDir);

    for (const item of items) {
      const itemPath = path.join(baseDir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        // 检查是否包含 SKILL.md
        const skillFile = path.join(itemPath, 'SKILL.md');
        if (await fs.pathExists(skillFile)) {
          skillDirs.push(item);
        }
      }
    }

    return skillDirs;
  }

  private async organizeStructure(
    sourceDir: string,
    targetDir: string,
    capabilities: CapabilityItem[]
  ): Promise<void> {
    // 清理目标目录
    await fs.remove(targetDir);
    await fs.ensureDir(targetDir);

    // 创建 assets 目录
    const assetsDir = path.join(targetDir, 'assets');
    await fs.ensureDir(assetsDir);

    // 移动文件
    for (const capability of capabilities) {
      const sourcePath = path.join(sourceDir, capability.path.replace('assets/', ''));
      const targetPath = path.join(targetDir, capability.path);

      await fs.ensureDir(path.dirname(targetPath));
      await fs.copy(sourcePath, targetPath);
    }

    // 复制 README（如果存在）
    const readmeFiles = ['README.md', 'readme.md', 'README.txt'];
    for (const readme of readmeFiles) {
      const readmePath = path.join(sourceDir, readme);
      if (await fs.pathExists(readmePath)) {
        await fs.copy(readmePath, path.join(targetDir, 'README.md'));
        break;
      }
    }
  }

  private async generateMetadata(
    pluginId: string,
    capabilities: CapabilityItem[],
    repoUrl: string
  ): Promise<PluginMetadata> {
    // 统计各类能力数量
    const stats = capabilities.reduce((acc, cap) => {
      acc[`${cap.type}s` as keyof typeof acc]++;
      return acc;
    }, {
      agents: 0,
      skills: 0,
      commands: 0,
      hooks: 0,
      mcps: 0
    });

    // 尝试从仓库获取更多信息
    let author = 'Unknown';
    let description = '';

    try {
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || pluginId;
      // 这里可以添加 GitHub API 调用来获取仓库信息
      description = `Imported from ${repoUrl}`;
    } catch (error) {
      console.warn('Failed to fetch repo info:', error);
    }

    return {
      id: pluginId,
      name: this.formatPluginName(pluginId),
      description,
      author,
      version: '1.0.0',
      source: {
        type: 'github',
        url: repoUrl
      },
      capabilities_stats: stats,
      tags: this.extractTags(capabilities),
      installed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private generatePluginId(repoUrl: string): string {
    // 从 URL 生成唯一 ID
    const parts = repoUrl.replace(/\.git$/, '').split('/');
    const owner = parts[parts.length - 2] || 'unknown';
    const repo = parts[parts.length - 1] || 'unknown';
    return `${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  private formatPluginName(pluginId: string): string {
    return pluginId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private extractTags(capabilities: CapabilityItem[]): string[] {
    const tags = new Set<string>();

    // 根据能力类型添加标签
    const types = [...new Set(capabilities.map(c => c.type))];
    types.forEach(type => tags.add(type));

    // 可以根据能力名称添加更具体的标签
    capabilities.forEach(cap => {
      if (cap.name.includes('git')) tags.add('git');
      if (cap.name.includes('docker')) tags.add('docker');
      if (cap.name.includes('python')) tags.add('python');
      if (cap.name.includes('javascript')) tags.add('javascript');
    });

    return Array.from(tags);
  }

  private async updateIndex(pluginId: string, metadata: PluginMetadata): Promise<void> {
    const indexPath = path.join(this.config.get().library_path, 'index.json');
    let index = { plugins: {}, capabilities: {}, version: '1.0.0' };

    if (await fs.pathExists(indexPath)) {
      index = await fs.readJson(indexPath);
    }

    // 更新插件信息
    index.plugins[pluginId] = metadata;

    // 保存索引
    await fs.writeJson(indexPath, index, { spaces: 2 });
  }
}
```

### 1.3 注入器服务实现

```typescript
// src/services/InjectorService.ts
import * as fs from 'fs-extra';
import * as path from 'path';
import * as lodash from 'lodash';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from './ConfigService';
import { Project, CapabilityItem, InjectionTask, ConflictStrategy } from '../types';

const execAsync = promisify(exec);

export class InjectorService {
  constructor(private config: ConfigService) {}

  async injectCapabilities(
    projectId: string,
    capabilityIds: string[],
    conflictStrategy: ConflictStrategy = 'skip'
  ): Promise<InjectionTask> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const task: InjectionTask = {
      id: this.generateTaskId(),
      project_id: projectId,
      capabilities: capabilityIds,
      conflict_strategy: conflictStrategy,
      status: 'running',
      progress: 0,
      created_at: new Date().toISOString()
    };

    try {
      // 确保项目目录结构存在
      await this.ensureProjectStructure(project.path);

      // 处理每个能力
      for (let i = 0; i < capabilityIds.length; i++) {
        const capabilityId = capabilityIds[i];
        const capability = await this.getCapability(capabilityId);

        if (!capability) {
          throw new Error(`Capability ${capabilityId} not found`);
        }

        // 注入能力
        await this.injectCapability(project, capability, conflictStrategy);

        // 更新进度
        task.progress = Math.round(((i + 1) / capabilityIds.length) * 100);
      }

      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.errors = [error.message];
      throw error;
    }

    return task;
  }

  private async ensureProjectStructure(projectPath: string): Promise<void> {
    const claudeDir = path.join(projectPath, '.claude');
    await fs.ensureDir(path.join(claudeDir, 'agents'));
    await fs.ensureDir(path.join(claudeDir, 'skills'));
    await fs.ensureDir(path.join(claudeDir, 'commands'));
    await fs.ensureDir(path.join(claudeDir, 'hooks'));
  }

  private async injectCapability(
    project: Project,
    capability: CapabilityItem,
    conflictStrategy: ConflictStrategy
  ): Promise<void> {
    // 解析能力路径
    const [pluginId] = capability.id.split('/');
    const sourceDir = path.join(this.config.get().library_path, pluginId);
    const sourcePath = path.join(sourceDir, capability.path);

    if (!await fs.pathExists(sourcePath)) {
      throw new Error(`Source path not found: ${sourcePath}`);
    }

    // 根据能力类型确定目标路径
    const targetPath = this.getTargetPath(project, capability);

    // 检查并处理冲突
    if (await fs.pathExists(targetPath)) {
      if (conflictStrategy === 'skip') {
        console.log(`Skipping existing file: ${targetPath}`);
        return;
      }

      if (conflictStrategy === 'overwrite') {
        if ((await fs.stat(targetPath)).isDirectory()) {
          await fs.remove(targetPath);
        }
      }
    }

    // 执行注入
    if (capability.type === 'skill') {
      // Skills 是文件夹，需要递归复制
      await fs.copy(sourcePath, targetPath, { overwrite: true });
    } else if (capability.type === 'mcp') {
      // MCP 配置需要合并
      await this.mergeMcpConfig(project, sourcePath);
    } else {
      // 其他类型直接复制
      await fs.ensureDir(path.dirname(targetPath));
      await fs.copy(sourcePath, targetPath, { overwrite: conflictStrategy === 'overwrite' });
    }

    // 特殊处理：在 Windows 上为 hooks 文件添加执行权限
    if (capability.type === 'hook' && process.platform !== 'win32') {
      try {
        await execAsync(`chmod +x "${targetPath}"`);
      } catch (error) {
        console.warn(`Failed to set execute permission for ${targetPath}:`, error);
      }
    }
  }

  private getTargetPath(project: Project, capability: CapabilityItem): string {
    const claudeDir = path.join(project.path, '.claude');

    switch (capability.type) {
      case 'agent':
        return path.join(claudeDir, 'agents', `${capability.name}.md`);
      case 'skill':
        return path.join(claudeDir, 'skills', capability.name);
      case 'command':
        return path.join(claudeDir, 'commands', `${capability.name}.md`);
      case 'hook':
        return path.join(claudeDir, 'hooks', capability.name);
      case 'mcp':
        return path.join(project.path, 'claude_desktop_config.json');
      default:
        throw new Error(`Unknown capability type: ${capability.type}`);
    }
  }

  private async mergeMcpConfig(project: Project, mcpConfigPath: string): Promise<void> {
    const projectConfigPath = path.join(project.path, 'claude_desktop_config.json');

    // 读取现有配置
    let projectConfig = { mcpServers: {} };
    if (await fs.pathExists(projectConfigPath)) {
      projectConfig = await fs.readJson(projectConfigPath);
    }

    // 确保 mcpServers 存在
    if (!projectConfig.mcpServers) {
      projectConfig.mcpServers = {};
    }

    // 读取 MCP 配置
    const mcpConfig = await fs.readJson(mcpConfigPath);

    // 深度合并配置
    const mergedConfig = lodash.merge(projectConfig, mcpConfig);

    // 写回文件
    await fs.writeJson(projectConfigPath, mergedConfig, { spaces: 2 });
  }

  private async getProject(projectId: string): Promise<Project | null> {
    // 这里应该从项目存储中获取项目信息
    // 实际实现可能需要从数据库或配置文件中读取
    return null;
  }

  private async getCapability(capabilityId: string): Promise<CapabilityItem | null> {
    // 这里应该从能力库索引中获取能力信息
    // 实际实现可能需要解析 capabilityId 并从相应位置读取
    return null;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 二、React 组件实现

### 2.1 能力库页面组件

```tsx
// src/renderer/pages/LibraryPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, Download, Plus, Eye, Trash2 } from 'lucide-react';
import { useClaudeLemStore } from '../store';
import { PluginMetadata, CapabilityItem } from '../types';
import { PluginDetailModal } from '../components/PluginDetailModal';
import { ImportModal } from '../components/ImportModal';

export const LibraryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'plugins' | 'capabilities'>('plugins');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginMetadata | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const { plugins, capabilities, refreshLibrary } = useClaudeLemStore();

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCapabilities = capabilities.filter(cap =>
    cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cap.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">能力库</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              导入插件
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              <Plus className="w-4 h-4" />
              新建插件
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索插件或能力..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('plugins')}
            className={`pb-2 px-1 ${
              activeTab === 'plugins'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            插件包
          </button>
          <button
            onClick={() => setActiveTab('capabilities')}
            className={`pb-2 px-1 ${
              activeTab === 'capabilities'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            原子能力
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'plugins' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onView={() => setSelectedPlugin(plugin)}
            />
          ))}
        </div>
      ) : (
        <CapabilityList capabilities={filteredCapabilities} />
      )}

      {/* Modals */}
      {selectedPlugin && (
        <PluginDetailModal
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            refreshLibrary();
          }}
        />
      )}
    </div>
  );
};

// Plugin Card Component
interface PluginCardProps {
  plugin: PluginMetadata;
  onView: () => void;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, onView }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-semibold text-lg mb-2">{plugin.name}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{plugin.description}</p>

      {/* Stats Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {plugin.capabilities_stats.agents > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            🤖 {plugin.capabilities_stats.agents} agents
          </span>
        )}
        {plugin.capabilities_stats.skills > 0 && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
            ⚡ {plugin.capabilities_stats.skills} skills
          </span>
        )}
        {plugin.capabilities_stats.commands > 0 && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            💻 {plugin.capabilities_stats.commands} commands
          </span>
        )}
        {plugin.capabilities_stats.hooks > 0 && (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
            🪝 {plugin.capabilities_stats.hooks} hooks
          </span>
        )}
        {plugin.capabilities_stats.mcps > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
            🔌 {plugin.capabilities_stats.mcps} mcps
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">v{plugin.version}</span>
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            <Eye className="w-3 h-3" />
            详情
          </button>
        </div>
      </div>
    </div>
  );
};

// Capability List Component
interface CapabilityListProps {
  capabilities: CapabilityItem[];
}

const CapabilityList: React.FC<CapabilityListProps> = ({ capabilities }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'agent': return '🤖';
      case 'skill': return '⚡';
      case 'command': return '💻';
      case 'hook': return '🪝';
      case 'mcp': return '🔌';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'agent': return 'text-blue-600';
      case 'skill': return 'text-purple-600';
      case 'command': return 'text-green-600';
      case 'hook': return 'text-orange-600';
      case 'mcp': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      {capabilities.map((capability) => (
        <div
          key={capability.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getIcon(capability.type)}</span>
            <div>
              <div className="font-medium">{capability.name}</div>
              <div className={`text-sm ${getTypeColor(capability.type)}`}>
                {capability.type}
              </div>
            </div>
          </div>
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            安装
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 2.2 项目详情页面（双栏布局）

```tsx
// src/renderer/pages/ProjectDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Download, Settings, FileText, Folder } from 'lucide-react';
import { useClaudeLemStore } from '../store';
import { ConflictModal } from '../components/ConflictModal';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { projects, capabilities, scanProjects } = useClaudeLemStore();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (!projects.length) {
      scanProjects();
    }
  }, []);

  if (!project) {
    return <div>Project not found</div>;
  }

  const handleInstallCapabilities = async () => {
    // 检查冲突
    const conflicts = await checkConflicts(project, selectedCapabilities);
    if (conflicts.length > 0) {
      setShowConflictModal(true);
    } else {
      await performInjection(project.id, selectedCapabilities, 'skip');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-gray-600">{project.path}</p>
          </div>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex">
        {/* Left Pane - Current Capabilities */}
        <div className="w-1/2 border-r p-4 overflow-auto">
          <h2 className="font-semibold mb-4">当前已装能力</h2>
          <CapabilityTree project={project} />
        </div>

        {/* Right Pane - Library */}
        <div className="w-1/2 p-4 overflow-auto">
          <div className="mb-4">
            <h2 className="font-semibold mb-2">能力库</h2>
            <input
              type="text"
              placeholder="搜索能力..."
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Scene Cards */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">场景快照</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {/* Scene cards would go here */}
            </div>
          </div>

          {/* Capability List */}
          <div className="space-y-2">
            {capabilities
              .filter(cap => !isCapabilityInstalled(project, cap))
              .map((capability) => (
                <CapabilityItem
                  key={capability.id}
                  capability={capability}
                  selected={selectedCapabilities.includes(capability.id)}
                  onToggle={(id, selected) => {
                    if (selected) {
                      setSelectedCapabilities([...selectedCapabilities, id]);
                    } else {
                      setSelectedCapabilities(selectedCapabilities.filter(c => c !== id));
                    }
                  }}
                />
              ))}
          </div>

          {/* Install Button */}
          {selectedCapabilities.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span>已选择 {selectedCapabilities.length} 个能力</span>
                <button
                  onClick={handleInstallCapabilities}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  安装选中项
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conflict Modal */}
      {showConflictModal && (
        <ConflictModal
          conflicts={[]}
          onResolve={async (strategy) => {
            await performInjection(project.id, selectedCapabilities, strategy);
            setShowConflictModal(false);
            setSelectedCapabilities([]);
          }}
          onCancel={() => setShowConflictModal(false)}
        />
      )}
    </div>
  );
};

// Capability Tree Component
const CapabilityTree: React.FC<{ project: any }> = ({ project }) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev =>
      prev.includes(folder)
        ? prev.filter(f => f !== folder)
        : [...prev, folder]
    );
  };

  return (
    <div className="space-y-2">
      {/* Agents */}
      <TreeNode
        name="Sub-agents"
        icon="🤖"
        isFolder={true}
        expanded={expandedFolders.includes('agents')}
        onToggle={() => toggleFolder('agents')}
      >
        {project.capabilities.agents.map((agent: string) => (
          <TreeNode
            key={agent}
            name={agent}
            icon="📄"
            isFolder={false}
          />
        ))}
      </TreeNode>

      {/* Skills */}
      <TreeNode
        name="Skills"
        icon="⚡"
        isFolder={true}
        expanded={expandedFolders.includes('skills')}
        onToggle={() => toggleFolder('skills')}
      >
        {project.capabilities.skills.map((skill: string) => (
          <TreeNode
            key={skill}
            name={skill}
            icon="📂"
            isFolder={true}
            expanded={expandedFolders.includes(`skills/${skill}`)}
            onToggle={() => toggleFolder(`skills/${skill}`)}
          >
            <TreeNode name="SKILL.md" icon="📄" isFolder={false} />
            <TreeNode name="forms.md" icon="📄" isFolder={false} />
            <TreeNode name="scripts" icon="📂" isFolder={true}>
              <TreeNode name="script.py" icon="📄" isFolder={false} />
            </TreeNode>
          </TreeNode>
        ))}
      </TreeNode>

      {/* Commands */}
      <TreeNode
        name="Commands"
        icon="💻"
        isFolder={true}
        expanded={expandedFolders.includes('commands')}
        onToggle={() => toggleFolder('commands')}
      >
        {project.capabilities.commands.map((command: string) => (
          <TreeNode
            key={command}
            name={command}
            icon="📄"
            isFolder={false}
          />
        ))}
      </TreeNode>
    </div>
  );
};

// Tree Node Component
interface TreeNodeProps {
  name: string;
  icon: string;
  isFolder: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  name,
  icon,
  isFolder,
  expanded,
  onToggle,
  children
}) => {
  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
        onClick={isFolder ? onToggle : undefined}
      >
        <span>{icon}</span>
        <span>{name}</span>
        {isFolder && (
          <span className="text-gray-400">
            {expanded ? '▼' : '▶'}
          </span>
        )}
      </div>
      {isFolder && expanded && (
        <div className="ml-4">
          {children}
        </div>
      )}
    </div>
  );
};

// Helper functions
const isCapabilityInstalled = (project: any, capability: any): boolean => {
  // Check if capability is already installed in project
  return false; // Implement actual check
};

const checkConflicts = async (project: any, capabilityIds: string[]): Promise<any[]> => {
  // Check for conflicts
  return []; // Return conflicts
};

const performInjection = async (
  projectId: string,
  capabilityIds: string[],
  strategy: string
): Promise<void> => {
  // Perform injection
  await window.claudeLem.projects.inject(projectId, capabilityIds, strategy);
};
```

## 三、错误处理和进度通知

### 3.1 进度通知组件

```tsx
// src/renderer/components/ProgressBar.tsx
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ProgressBarProps {
  taskId: string;
  title: string;
  onComplete?: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ taskId, title, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');

  useEffect(() => {
    // Listen for progress updates
    const unsubscribe = window.claudeLem.onProgress((data: any) => {
      if (data.taskId === taskId) {
        setProgress(data.progress);
        setMessage(data.message);
        if (data.progress === 100) {
          setStatus('completed');
          onComplete?.();
          setTimeout(() => unsubscribe(), 3000);
        }
      }
    });

    return unsubscribe;
  }, [taskId, onComplete]);

  if (status === 'completed' && progress === 100) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="text-green-800">{title} 完成</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-gray-600">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {message && (
        <p className="text-sm text-gray-600 mt-2">{message}</p>
      )}
    </div>
  );
};
```

### 3.2 全局错误边界

```tsx
// src/renderer/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // Report error to main process
    window.claudeLem.reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-4">
              出现错误
            </h1>
            <p className="text-gray-600 mb-4">
              应用程序遇到了一个错误。您可以选择重新加载页面或报告此问题。
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500">
                  错误详情
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                重新加载
              </button>
              <button
                onClick={() => window.claudeLem.openIssueReporter()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                报告问题
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 四、最佳实践总结

1. **类型安全**：全面使用 TypeScript，确保类型安全
2. **错误处理**：实现完善的错误边界和错误报告机制
3. **用户体验**：提供实时的进度反馈和状态更新
4. **性能优化**：使用异步操作和适当的缓存策略
5. **代码组织**：模块化设计，职责分离
6. **测试覆盖**：关键功能需要有单元测试和集成测试

这个实现示例提供了能力库功能的核心技术实现，可以根据实际需求进行调整和扩展。