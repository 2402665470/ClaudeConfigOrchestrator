import path from 'path';
import fs from 'fs-extra';
import yaml from 'yaml';
import { ConfigReaderService } from './ConfigReaderService';

export interface PluginLibrary {
  plugins: PluginDetail[];
  totalPlugins: number;
  totalCapabilities: {
    agents: number;
    commands: number;
    hooks: number;
    skills: number;
    mcpServers: number;
    configs: number;
  };
}

export interface PluginDetail {
  // 基本信息
  id: string;              // feature-dev@claude-code-plugins
  name: string;            // feature-dev
  marketplace: string;     // claude-code-plugins
  version: string;
  scope: 'user' | 'project';
  installPath: string;
  installedAt: string;

  // 插件元数据（从 plugin.json 读取）
  metadata?: {
    name: string;
    version: string;
    description: string;
    author?: {
      name: string;
      email: string;
    };
    homepage?: string;
    repository?: string;
  };

  // 详细能力信息
  capabilities: {
    agents?: Array<{
      name: string;
      description: string;
      content?: string;     // .md 文件内容
      type: string;         // general-purpose, etc.
    }>;
    commands?: Array<{
      name: string;
      description: string;
      content?: string;
      examples?: string[];  // 使用示例
    }>;
    hooks?: Array<{
      name: string;
      description: string;
      events: string[];     // 触发事件
    }>;
    skills?: Array<{
      name: string;
      description: string;
      triggers: string[];   // 触发短语
    }>;
    mcpServers?: Array<{
      name: string;
      description: string;
      config: any;          // 配置信息
    }>;
    configs?: Array<{
      name: string;
      description: string;
      preview?: any;        // 配置内容预览
      category?: string;    // 配置分类
    }>;
  };

  // 统计信息
  stats: {
    totalCapabilities: number;
    capabilitiesByType: Record<string, number>;
  };
}

export interface InstalledPlugin {
  id: string;
  scope: string;
  installPath: string;
  version: string;
  installedAt: string;
  isLocal: boolean;
}

export class PluginLibraryService {
  private configReader: ConfigReaderService;

  constructor() {
    this.configReader = new ConfigReaderService();
  }

  /**
   * 获取完整的插件库信息
   */
  async getPluginLibrary(): Promise<PluginLibrary> {
    console.log('[PluginLibrary] 开始获取插件库信息...');

    try {
      // 1. 获取已安装插件列表
      const installedPlugins = await this.configReader.getInstalledPlugins();
      console.log(`[PluginLibrary] 找到 ${installedPlugins.length} 个已安装插件`);

      // 2. 解析每个插件的详细信息
      const plugins = await Promise.all(
        installedPlugins.map(plugin => this.parsePluginDetail(plugin))
      );

      // 过滤掉解析失败的插件
      const validPlugins = plugins.filter(Boolean) as PluginDetail[];

      // 3. 计算总览统计
      const stats = this.calculateStats(validPlugins);

      console.log(`[PluginLibrary] 成功解析 ${validPlugins.length} 个插件`);

      return {
        plugins: validPlugins,
        totalPlugins: validPlugins.length,
        totalCapabilities: stats
      };
    } catch (error) {
      console.error('[PluginLibrary] 获取插件库失败:', error);
      throw error;
    }
  }

  /**
   * 解析单个插件的详细信息
   */
  private async parsePluginDetail(plugin: InstalledPlugin): Promise<PluginDetail | null> {
    try {
      const [, pluginName, marketplace] = plugin.id.match(/(.+)@(.+)/) || [];
      const pluginRoot = plugin.installPath;

      console.log(`[PluginLibrary] 解析插件: ${plugin.id}`);

      // 1. 读取 plugin.json
      const metadata = await this.readPluginMetadata(pluginRoot);

      // 2. 解析能力
      const capabilities = await this.parseCapabilities(pluginRoot);

      // 3. 计算统计
      const stats = this.calculateCapabilityStats(capabilities);

      return {
        id: plugin.id,
        name: pluginName,
        marketplace,
        version: plugin.version,
        scope: plugin.scope as 'user' | 'project',
        installPath: plugin.installPath,
        installedAt: plugin.installedAt,
        metadata,
        capabilities,
        stats
      };
    } catch (error) {
      console.error(`[PluginLibrary] 解析插件 ${plugin.id} 失败:`, error);
      return null;
    }
  }

  /**
   * 读取插件元数据
   */
  private async readPluginMetadata(pluginRoot: string) {
    const manifestPath = path.join(pluginRoot, '.claude-plugin/plugin.json');

    try {
      if (await fs.pathExists(manifestPath)) {
        const content = await fs.readFile(manifestPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`[PluginLibrary] 读取插件元数据失败: ${manifestPath}`, error);
    }

    return null;
  }

  /**
   * 解析插件能力
   */
  private async parseCapabilities(pluginRoot: string): Promise<PluginDetail['capabilities']> {
    const capabilities: PluginDetail['capabilities'] = {};

    // 解析 agents
    const agentsDir = path.join(pluginRoot, 'agents');
    if (await fs.pathExists(agentsDir)) {
      capabilities.agents = await this.parseAgents(agentsDir);
    }

    // 解析 commands
    const commandsDir = path.join(pluginRoot, 'commands');
    if (await fs.pathExists(commandsDir)) {
      capabilities.commands = await this.parseCommands(commandsDir);
    }

    // 解析 hooks
    const hooksDir = path.join(pluginRoot, 'hooks');
    if (await fs.pathExists(hooksDir)) {
      capabilities.hooks = await this.parseHooks(hooksDir);
    }

    // 解析 skills
    const skillsDir = path.join(pluginRoot, 'skills');
    if (await fs.pathExists(skillsDir)) {
      capabilities.skills = await this.parseSkills(skillsDir);
    }

    // 解析 MCP servers
    const mcpServersDir = path.join(pluginRoot, 'mcp-servers');
    if (await fs.pathExists(mcpServersDir)) {
      capabilities.mcpServers = await this.parseMcpServers(mcpServersDir);
    }

    // 解析 settings/configs
    const settingsDir = path.join(pluginRoot, 'settings');
    if (await fs.pathExists(settingsDir)) {
      console.log(`[PluginLibrary] 找到 settings 目录: ${settingsDir}`);
      const configs = await this.parseSettings(settingsDir);
      console.log(`[PluginLibrary] 解析到 ${configs.length} 个配置文件`);
      capabilities.configs = configs;
    } else {
      console.log(`[PluginLibrary] settings 目录不存在: ${settingsDir}`);
    }

    return capabilities;
  }

  /**
   * 解析 Agents
   */
  private async parseAgents(agentsDir: string) {
    const agents: any[] = [];
    const files = await fs.readdir(agentsDir);

    for (const file of files) {
      if (path.extname(file) === '.md') {
        const filePath = path.join(agentsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const name = path.basename(file, '.md');

        // 解析 markdown frontmatter
        const { frontMatter, description } = this.parseMarkdown(content);

        agents.push({
          name,
          description: frontMatter.description || description,
          content,
          type: frontMatter.type || 'general-purpose'
        });
      }
    }

    return agents;
  }

  /**
   * 解析 Commands
   */
  private async parseCommands(commandsDir: string) {
    const commands: any[] = [];
    const files = await fs.readdir(commandsDir);

    for (const file of files) {
      if (path.extname(file) === '.md') {
        const filePath = path.join(commandsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const name = path.basename(file, '.md');

        // 解析使用示例
        const examples = this.extractExamples(content);

        commands.push({
          name,
          description: this.extractDescription(content),
          content,
          examples
        });
      }
    }

    return commands;
  }

  /**
   * 解析 Hooks
   */
  private async parseHooks(hooksDir: string) {
    const hooks: any[] = [];

    // 读取 hooks.json 配置
    const hooksConfigPath = path.join(hooksDir, 'hooks.json');
    if (await fs.pathExists(hooksConfigPath)) {
      try {
        const config = await fs.readJson(hooksConfigPath);

        // 提取钩子信息
        if (config.hooks) {
          for (const [event, eventConfig] of Object.entries(config.hooks)) {
            hooks.push({
              name: event,
              description: config.description || `${event} hook`,
              events: [event]
            });
          }
        }
      } catch (error) {
        console.warn(`[PluginLibrary] 解析 hooks.json 失败:`, error);
      }
    }

    // 同时检查 .py 和 .js 钩子文件
    const files = await fs.readdir(hooksDir);
    for (const file of files) {
      if (file.endsWith('.py') || file.endsWith('.js')) {
        const name = path.basename(file, path.extname(file));
        hooks.push({
          name,
          description: `${name} hook implementation`,
          events: ['Unknown'] // 无法从文件推断事件
        });
      }
    }

    return hooks;
  }

  /**
   * 解析 Skills
   */
  private async parseSkills(skillsDir: string) {
    const skills: any[] = [];
    const skillDirs = await fs.readdir(skillsDir);

    for (const skillDir of skillDirs) {
      const skillPath = path.join(skillsDir, skillDir);
      if ((await fs.stat(skillPath)).isDirectory()) {
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        if (await fs.pathExists(skillMdPath)) {
          const content = await fs.readFile(skillMdPath, 'utf-8');

          // 提取触发短语
          const triggers = this.extractTriggers(content);

          skills.push({
            name: skillDir,
            description: this.extractDescription(content),
            triggers
          });
        }
      }
    }

    return skills;
  }

  /**
   * 解析 MCP Servers
   */
  private async parseMcpServers(mcpServersDir: string) {
    const mcpServers: any[] = [];
    const files = await fs.readdir(mcpServersDir);

    for (const file of files) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(mcpServersDir, file);
        const config = await fs.readJson(filePath);
        const name = path.basename(file, '.json');

        mcpServers.push({
          name,
          description: config.description || `${name} MCP server`,
          config
        });
      }
    }

    return mcpServers;
  }

  /**
   * 解析 Markdown 文件
   */
  private parseMarkdown(content: string) {
    // 提取 frontmatter 和描述
    const frontMatterMatch = content.match(/^---\n(.*?)\n---/s);
    const frontMatter = frontMatterMatch
      ? yaml.parse(frontMatterMatch[1])
      : {};

    // 提取第一段作为描述
    const description = content
      .replace(/^---\n.*?\n---\n/s, '') // 移除 frontmatter
      .split('\n\n')[0] // 取第一段
      .replace(/^#\s+/, '') // 移除标题
      .trim();

    return { frontMatter, description };
  }

  /**
   * 提取命令示例
   */
  private extractExamples(content: string): string[] {
    const examples: string[] = [];

    // 查找代码块中的命令
    const codeBlockMatches = content.match(/```(?:bash|shell)?\n(\/[^\n]+)\n```/g);
    if (codeBlockMatches) {
      for (const match of codeBlockMatches) {
        const command = match.match(/```(?:bash|shell)?\n(\/[^\n]+)\n```/)?.[1];
        if (command) examples.push(command);
      }
    }

    // 查找行内的命令
    const inlineMatches = content.match(/\/[a-z-]+/gi);
    if (inlineMatches) {
      examples.push(...inlineMatches);
    }

    return [...new Set(examples)]; // 去重
  }

  /**
   * 提取触发短语
   */
  private extractTriggers(content: string): string[] {
    const triggers: string[] = [];

    // 查找各种触发短语的格式
    const patterns = [
      /Trigger phrases?:\s*(.*?)(?:\n\n|$)/si,
      /Triggers?:\s*(.*?)(?:\n\n|$)/si,
      /When to use:\s*(.*?)(?:\n\n|$)/si
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const triggerList = match[1]
          .split(/,|\n/)
          .map(t => t.trim().replace(/^["'\s-]+|["'\s-]+$/g, ''))
          .filter(t => t.length > 0);
        triggers.push(...triggerList);
      }
    }

    return [...new Set(triggers)]; // 去重
  }

  /**
   * 提取描述
   */
  private extractDescription(content: string): string {
    // 移除 frontmatter
    content = content.replace(/^---\n.*?\n---\n/s, '');

    // 尝试找到描述（各种模式）
    const patterns = [
      /^#\s+.*?\n\n(.*?)(?:\n\n|$)/s, // 标题后的第一段
      /Description:\s*(.*?)(?:\n\n|$)/smi, // Description 字段
      /^###?\s+Description\s*\n\n(.*?)(?:\n\n|$)/smi, // Description 标题
      /^(.*?)(?:\n\n|$)/s // 第一段
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'No description available';
  }

  /**
   * 计算总体统计
   */
  private calculateStats(plugins: PluginDetail[]) {
    const stats = {
      agents: 0,
      commands: 0,
      hooks: 0,
      skills: 0,
      mcpServers: 0,
      configs: 0
    };

    plugins.forEach(plugin => {
      Object.entries(plugin.stats.capabilitiesByType).forEach(([type, count]) => {
        if (type in stats) {
          (stats as any)[type] += count;
        }
      });
    });

    return stats;
  }

  /**
   * 解析 Settings 配置文件
   */
  private async parseSettings(settingsDir: string) {
    const settings: any[] = [];
    const files = await fs.readdir(settingsDir);
    console.log(`[PluginLibrary] settings 目录中的文件:`, files);

    for (const file of files) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(settingsDir, file);
        const name = path.basename(file, '.json');
        console.log(`[PluginLibrary] 正在解析配置文件: ${file}`);

        try {
          const configContent = await fs.readJson(filePath);

          // 尝试从配置中提取描述
          let description = `${name} configuration`;
          if (configContent.description) {
            description = configContent.description;
          } else if (configContent.env && configContent.env.ANTHROPIC_FOUNDRY_RESOURCE) {
            description = `Configuration for ${configContent.env.ANTHROPIC_FOUNDRY_RESOURCE}`;
          }

          settings.push({
            name,
            description,
            preview: configContent,
            category: this.getConfigCategory(name)
          });
        } catch (error) {
          console.error(`Failed to read config file ${file}:`, error);
          // 即使读取失败，也添加基本信息
          settings.push({
            name,
            description: `${name} configuration`,
            preview: null,
            category: 'environment'
          });
        }
      }
    }

    return settings;
  }

  /**
   * 获取配置分类
   */
  private getConfigCategory(name: string): string {
    if (name.includes('azure') || name.includes('foundry')) {
      return 'integration';
    } else if (name.includes('model') || name.includes('anthropic')) {
      return 'model';
    } else if (name.includes('env') || name.includes('development')) {
      return 'environment';
    } else {
      return 'workflow';
    }
  }

  /**
   * 计算单个插件的能力统计
   */
  private calculateCapabilityStats(capabilities: PluginDetail['capabilities']) {
    const capabilitiesByType: Record<string, number> = {};
    let totalCapabilities = 0;

    Object.entries(capabilities).forEach(([type, items]) => {
      if (items && items.length > 0) {
        capabilitiesByType[type] = items.length;
        totalCapabilities += items.length;
      }
    });

    return {
      totalCapabilities,
      capabilitiesByType
    };
  }
}