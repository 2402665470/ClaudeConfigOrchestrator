import path from 'path';
import fs from 'fs-extra';
import os from 'os';

export interface Plugin {
  meta: {
    id: string;
    name: string;
    description: string;
    version: string;
    readmePath?: string;
    iconPath?: string;
  };
  capabilities: any;
  rootPath: string;
}

export interface Marketplace {
  name: string;
  source: {
    source: string;
    repo: string;
  };
  installLocation: string;
  lastUpdated?: string;
  plugins?: any[];
}

export interface ProjectSettings {
  enabledPlugins?: Record<string, boolean>;
  [key: string]: any;
}

export class ConfigReaderService {
  private claudePath: string;
  private pluginsPath: string;

  constructor() {
    this.claudePath = path.join(os.homedir(), '.claude');
    this.pluginsPath = path.join(this.claudePath, 'plugins');
  }

  /* -------------------- Marketplace -------------------- */

  /**
   * 获取所有已配置的 marketplaces
   */
  async getMarketplaces(): Promise<Marketplace[]> {
    const marketplacesPath = path.join(this.pluginsPath, 'known_marketplaces.json');

    if (!await fs.pathExists(marketplacesPath)) {
      return [];
    }

    try {
      const config = await fs.readJSON(marketplacesPath);
      const marketplaces: Marketplace[] = [];

      for (const [name, info] of Object.entries(config as any)) {
        marketplaces.push({
          name,
          source: (info as any).source,
          installLocation: (info as any).installLocation,
          lastUpdated: (info as any).lastUpdated
        });
      }

      return marketplaces;
    } catch (error) {
      console.error('Failed to read marketplaces config:', error);
      return [];
    }
  }

  /**
   * 获取 marketplace 中的所有插件（只包含基本信息）
   */
  async getMarketplacePlugins(marketplaceName: string): Promise<Plugin[]> {
    const marketplaces = await this.getMarketplaces();
    const market = marketplaces.find(m => m.name === marketplaceName);

    if (!market) {
      console.log(`[Market] Marketplace not found: ${marketplaceName}`);
      return [];
    }

    // 读取 marketplace manifest
    const manifestPath = path.join(market.installLocation, '.claude-plugin', 'marketplace.json');
    if (!await fs.pathExists(manifestPath)) {
      console.log(`[Market] Marketplace manifest not found: ${manifestPath}`);
      return [];
    }

    try {
      const manifest = await fs.readJSON(manifestPath);
      const plugins: Plugin[] = [];

      for (const pluginInfo of manifest.plugins) {
        plugins.push({
          meta: {
            id: `${pluginInfo.name}@${marketplaceName}`,
            name: pluginInfo.name,
            description: pluginInfo.description,
            version: pluginInfo.version || 'N/A',
          },
          capabilities: {}, // 市场中的插件未下载，不包含能力信息
          rootPath: ''
        });
      }

      return plugins;
    } catch (error) {
      console.error(`[Market] Failed to read marketplace: ${error}`);
      return [];
    }
  }

  /**
   * 扫描插件的能力目录
   */
  private async scanPluginCapabilities(pluginPath: string): Promise<any> {
    console.log(`[ConfigReader] 扫描插件能力: ${pluginPath}`);
    const capabilities: any = {};
    const capabilityTypes = [
      { type: 'skills', icon: '🎯' },
      { type: 'commands', icon: '⚡' },
      { type: 'agents', icon: '🤖' },
      { type: 'hooks', icon: '🔗' },
      { type: 'mcpServers', icon: '🔌' },
      { type: 'settings', icon: '⚙️' },
      { type: 'prompts', icon: '💬' }
    ];

    for (const { type } of capabilityTypes) {
      const typePath = path.join(pluginPath, type);
      console.log(`[ConfigReader] 检查路径: ${typePath}`);
      if (await fs.pathExists(typePath)) {
        console.log(`[ConfigReader] 找到 ${type} 目录`);
        // 将 settings 映射为 configs，以保持前端一致性
        const capabilityType = type === 'settings' ? 'configs' : type;
        capabilities[capabilityType] = await this.parseCapabilityItems(typePath, type);
        console.log(`[ConfigReader] ${type} 目录解析完成，项目数: ${capabilities[capabilityType].length}`);
      }
    }

    console.log(`[ConfigReader] 最终能力对象:`, Object.keys(capabilities));
    return capabilities;
  }

  /**
   * 解析能力项目
   */
  private async parseCapabilityItems(basePath: string, type: string): Promise<any[]> {
    try {
      const items = await fs.readdir(basePath);
      const result: any[] = [];

      for (const item of items) {
        const itemPath = path.join(basePath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          // 处理目录形式的能力（通常是 skills 类型）
          const description = await this.getCapabilityDescription(itemPath, item, type);
          if (description) {
            result.push({
              name: item,
              description,
              type
            });
          }
        } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.js') || item.endsWith('.py') || item.endsWith('.json'))) {
          // 处理文件形式的能力（agents, commands, hooks 等）
          const name = path.basename(item, path.extname(item));
          const description = await this.getCapabilityDescription(basePath, name, type);

          // 如果是配置文件，尝试读取内容
          let preview = null;
          if (type === 'settings' && item.endsWith('.json')) {
            try {
              const configPath = path.join(basePath, item);
              const configContent = await fs.readJSON(configPath);
              preview = configContent;
            } catch (e) {
              console.error(`Failed to read config file ${item}:`, e);
            }
          }

          // 如果无法从文件获取描述，使用文件名作为描述
          result.push({
            name,
            description: description || `${name} - ${type}`,
            type,
            preview
          });
        }
      }

      return result;
    } catch (error) {
      console.error(`Failed to parse ${type}: ${error}`);
      return [];
    }
  }

  /**
   * 获取能力的描述信息
   */
  private async getCapabilityDescription(itemPath: string, name: string, type: string): Promise<string> {
    // 尝试多种可能的文件路径
    const possibleFiles = [
      path.join(itemPath, `${name}.md`),
      path.join(itemPath, `${type.slice(0, -1)}.md`),
      path.join(itemPath, 'README.md'),
      path.join(itemPath, 'index.md')
    ];

    // 对于 skills 类型，额外尝试 SKILL.md
    if (type === 'skills') {
      possibleFiles.unshift(path.join(itemPath, 'SKILL.md'));
    }

    for (const file of possibleFiles) {
      if (await fs.pathExists(file)) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          return this.extractDescriptionFromMarkdown(content);
        } catch (e) {
          // 继续尝试下一个文件
        }
      }
    }

    return '';
  }

  /**
   * 从 Markdown 内容中提取描述
   */
  private extractDescriptionFromMarkdown(content: string): string {
    // 提取 frontmatter 中的 description（确保只提取 description 字段）
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];

      // 处理跨行的 description
      const lines = frontmatter.split('\n');
      let inDescription = false;
      let descriptionLines: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('description:')) {
          inDescription = true;
          // 获取冒号后的内容
          const afterColon = trimmedLine.substring(12).trim();
          if (afterColon) {
            // 如果有引号，提取引号内的内容
            const quotedMatch = afterColon.match(/^['"](.*)['"]$/);
            if (quotedMatch) {
              descriptionLines.push(quotedMatch[1]);
            } else {
              descriptionLines.push(afterColon);
            }
          }
        } else if (inDescription) {
          // 检查是否是新的字段
          if (trimmedLine.includes(':') && !trimmedLine.startsWith(' ')) {
            // 新字段开始，结束描述收集
            break;
          } else if (trimmedLine) {
            // 继续收集描述的后续行
            descriptionLines.push(trimmedLine);
          }
        }
      }

      if (descriptionLines.length > 0) {
        return descriptionLines.join(' ').replace(/['"]/g, '').trim();
      }
    }

    // 提取第一个段落
    const cleanContent = content.replace(/^---[\s\S]*?---\n/, '');
    const firstParagraph = cleanContent.split('\n\n')[0];
    return firstParagraph.replace(/^#\s+/, '').trim();
  }

  /* -------------------- 插件管理 -------------------- */

  /**
   * 获取已安装的插件列表
   */
  async getInstalledPlugins(scope?: 'user' | 'project' | 'local'): Promise<any[]> {
    const installedPath = path.join(this.pluginsPath, 'installed_plugins.json');

    if (!await fs.pathExists(installedPath)) {
      return [];
    }

    try {
      const installed = await fs.readJSON(installedPath);
      const plugins: any[] = [];

      // 处理嵌套结构：{ version: 2, plugins: { "plugin@market": [info] } }
      for (const [pluginId, infos] of Object.entries(installed.plugins)) {
        const pluginInfos = infos as any[];

        // 获取指定 scope 或第一个
        const pluginInfo = scope
          ? pluginInfos.find(p => p.scope === scope)
          : pluginInfos[0];

        if (pluginInfo) {
          plugins.push({
            id: pluginId,
            scope: pluginInfo.scope || 'user',
            installPath: pluginInfo.installPath,
            version: pluginInfo.version,
            installedAt: pluginInfo.installedAt,
            isLocal: pluginInfo.isLocal || false
          });
        }
      }

      return plugins;
    } catch (error) {
      console.error('Failed to read installed plugins:', error);
      return [];
    }
  }

  /**
   * 获取插件信息（优先从已安装缓存，其次从本地市场）
   */
  async getPluginInfo(pluginId: string): Promise<any> {
    const [name, marketplace] = pluginId.split('@');

    // 首先尝试从已安装的缓存读取
    const cachePath = path.join(this.pluginsPath, 'cache', marketplace, name);

    if (await fs.pathExists(cachePath)) {
      const cachedInfo = await this.getInstalledPluginInfo(cachePath, name);
      if (cachedInfo) {
        return { ...cachedInfo, source: 'installed' };
      }
    }

    // 如果未安装，从本地市场读取
    return await this.getMarketplacePluginInfo(name, marketplace);
  }

  /**
   * 获取已安装插件的信息
   */
  private async getInstalledPluginInfo(cachePath: string, name: string): Promise<any> {
    try {
      const entries = await fs.readdir(cachePath);
      const versions = entries.filter(entry => {
        const fullPath = path.join(cachePath, entry);
        return fs.statSync(fullPath).isDirectory();
      });

      if (versions.length === 0) return null;

      const latestVersion = versions.sort().pop();
      const versionPath = path.join(cachePath, latestVersion);

      // 查找插件元数据文件
      const possiblePaths = [
        path.join(versionPath, '.claude-plugin', 'plugin.json'),
        path.join(versionPath, 'plugin.json'),
        path.join(versionPath, name, '.claude-plugin', 'plugin.json')
      ];

      for (const metadataPath of possiblePaths) {
        if (await fs.pathExists(metadataPath)) {
          const metadata = await fs.readJson(metadataPath);
          const capabilities = await this.scanPluginCapabilities(versionPath);

          return {
            installPath: versionPath,
            version: metadata.version || latestVersion,
            capabilities,
            ...metadata
          };
        }
      }

      // 如果没有元数据，扫描目录结构
      return {
        installPath: versionPath,
        version: latestVersion,
        capabilities: await this.scanPluginCapabilities(versionPath)
      };
    } catch (error) {
      console.error(`[Installed] Failed to get plugin info: ${error}`);
      return null;
    }
  }

  /**
   * 从本地市场获取插件信息（未安装）
   */
  private async getMarketplacePluginInfo(name: string, marketplace: string): Promise<any> {
    try {
      const marketplaces = await this.getMarketplaces();
      const market = marketplaces.find(m => m.name === marketplace);

      if (!market) {
        console.log(`[Market] Marketplace not found: ${marketplace}`);
        return null;
      }

      // 读取 marketplace manifest
      const manifestPath = path.join(market.installLocation, '.claude-plugin', 'marketplace.json');
      if (!await fs.pathExists(manifestPath)) {
        console.log(`[Market] Marketplace manifest not found: ${manifestPath}`);
        return null;
      }

      const manifest = await fs.readJSON(manifestPath);
      const pluginInfo = manifest.plugins.find((p: any) => p.name === name);

      if (!pluginInfo) {
        console.log(`[Market] Plugin not found in marketplace: ${name}`);
        return null;
      }

      // 构建插件路径
      const pluginPath = path.join(market.installLocation, pluginInfo.source);

      if (!await fs.pathExists(pluginPath)) {
        console.log(`[Market] Plugin directory not found: ${pluginPath}`);
        return null;
      }

      // 扫描插件能力
      const capabilities = await this.scanPluginCapabilities(pluginPath);

      return {
        name: pluginInfo.name,
        description: pluginInfo.description,
        version: pluginInfo.version,
        author: pluginInfo.author,
        capabilities,
        source: 'marketplace',
        marketplacePath: pluginPath
      };
    } catch (error) {
      console.error(`[Market] Failed to get plugin info: ${error}`);
      return null;
    }
  }

  /* -------------------- 项目配置 -------------------- */

  /**
   * 获取项目设置
   */
  async getProjectSettings(projectPath: string): Promise<ProjectSettings> {
    const settingsPath = path.join(projectPath, '.claude', 'settings.json');

    if (!await fs.pathExists(settingsPath)) {
      return { enabledPlugins: {} };
    }

    try {
      return await fs.readJSON(settingsPath);
    } catch (error) {
      console.error('Failed to read project settings:', error);
      return { enabledPlugins: {} };
    }
  }

  /**
   * 更新项目设置
   */
  async updateProjectSettings(projectPath: string, settings: ProjectSettings): Promise<void> {
    const claudeDir = path.join(projectPath, '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');

    // 确保 .claude 目录存在
    await fs.ensureDir(claudeDir);

    // 写入设置
    await fs.writeJSON(settingsPath, settings, { spaces: 2 });
  }

  /**
   * 在项目中启用插件
   */
  async enablePluginInProject(projectPath: string, pluginId: string): Promise<void> {
    const settings = await this.getProjectSettings(projectPath);

    if (!settings.enabledPlugins) {
      settings.enabledPlugins = {};
    }

    settings.enabledPlugins[pluginId] = true;

    await this.updateProjectSettings(projectPath, settings);
  }

  /**
   * 在项目中禁用插件
   */
  async disablePluginInProject(projectPath: string, pluginId: string): Promise<void> {
    const settings = await this.getProjectSettings(projectPath);

    if (settings.enabledPlugins && settings.enabledPlugins[pluginId]) {
      delete settings.enabledPlugins[pluginId];
    }

    await this.updateProjectSettings(projectPath, settings);
  }

  /**
   * 获取项目中的插件列表
   */
  async getProjectPlugins(projectPath: string): Promise<string[]> {
    const settings = await this.getProjectSettings(projectPath);
    return Object.keys(settings.enabledPlugins || {});
  }

  /**
   * 检查项目是否有 Claude 配置
   */
  hasClaudeConfig(projectPath: string): Promise<boolean> {
    const claudeDir = path.join(projectPath, '.claude');
    return fs.pathExists(claudeDir);
  }
}