import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import { Plugin } from '../common/types';

// 确保日志目录存在（使用项目目录）
const projectDir = path.resolve(__dirname, '..');
const logDir = path.join(projectDir, 'logs');
if (!fs.existsSync(logDir)) {
  fs.ensureDirSync(logDir);
}

const execAsync = promisify(exec);

// 日志输出函数
const log = {
    info: (message: string, data?: any) => {
      const msg = `[ClaudeCLI INFO] ${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}`;
      console.log(msg);
      // 写入日志文件
      fs.appendFileSync(path.join(logDir, 'claude-cli.log'), msg + '\n');
    },
    warn: (message: string, data?: any) => {
      const msg = `[ClaudeCLI WARN] ${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}`;
      console.warn(msg);
      fs.appendFileSync(path.join(logDir, 'claude-cli.log'), msg + '\n');
    },
    error: (message: string, error?: any) => {
      const msg = `[ClaudeCLI ERROR] ${new Date().toISOString()} - ${message} ${error ? JSON.stringify(error) : ''}`;
      console.error(msg);
      fs.appendFileSync(path.join(logDir, 'claude-cli.log'), msg + '\n');
    },
    debug: (message: string, data?: any) => {
      const msg = `[ClaudeCLI DEBUG] ${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}`;
      console.log(msg);
      fs.appendFileSync(path.join(logDir, 'claude-cli.log'), msg + '\n');
    }
  };

/**
 * Claude CLI 命令执行器
 */
export class ClaudeCliService {
  private readonly claudePath: string;

  constructor() {
    // Claude CLI 应该在 PATH 中，直接使用 'claude'
    this.claudePath = 'claude';
  }

  /**
   * 执行 Claude CLI 命令
   */
  async executeCommand(command: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> {
    const fullCommand = `${this.claudePath} ${command} ${args.join(' ')}`;
    log.info(`Executing command: ${fullCommand}`);

    try {
      const result = await execAsync(fullCommand);
      log.debug(`Command success: ${fullCommand}`, { stdout: result.stdout, stderr: result.stderr });
      return result;
    } catch (error: any) {
      log.error(`Command failed: ${fullCommand}`, error);
      throw new Error(`Claude CLI command failed: ${error.message}`);
    }
  }

  /**
   * 添加 marketplace
   */
  async addMarketplace(repo: string): Promise<void> {
    log.info(`Adding marketplace: ${repo}`);
    await this.executeCommand('plugin marketplace add', [repo]);
  }

  /**
   * 获取已配置的 marketplaces
   */
  async getMarketplaces(): Promise<MarketplaceInfo[]> {
    log.info('Getting configured marketplaces');

    const configPath = path.join(os.homedir(), '.claude/plugins/known_marketplaces.json');

    if (!await fs.pathExists(configPath)) {
      log.warn('Marketplaces config file not found');
      return [];
    }

    try {
      const config = await fs.readJson(configPath);
      const marketplaces: MarketplaceInfo[] = [];

      for (const [name, info] of Object.entries(config) as [string, any][]) {
        try {
          const manifestPath = path.join(info.installLocation, '.claude-plugin/marketplace.json');

          if (!await fs.pathExists(manifestPath)) {
            log.warn(`Marketplace manifest not found: ${manifestPath}`);
            continue;
          }

          const manifest = await fs.readJson(manifestPath);

          marketplaces.push({
            name,
            source: info.source,
            installLocation: info.installLocation,
            lastUpdated: info.lastUpdated,
            plugins: manifest.plugins || [],
            metadata: manifest.metadata || {}
          });
        } catch (error) {
          log.error(`Failed to parse marketplace ${name}`, error);
        }
      }

      log.debug(`Found ${marketplaces.length} marketplaces`);
      return marketplaces;
    } catch (error) {
      log.error('Failed to read marketplaces config', error);
      return [];
    }
  }

  /**
   * 更新 marketplace
   */
  async updateMarketplace(name?: string): Promise<void> {
    log.info(`Updating marketplace: ${name || 'all'}`);
    const args = name ? [name] : [];
    await this.executeCommand('plugin marketplace update', args);
  }

  /**
   * 安装插件
   */
  async installPlugin(pluginId: string, marketplace: string, scope: 'user' | 'project' | 'local' = 'user', projectPath?: string): Promise<void> {
    log.info(`Installing plugin: ${pluginId}@${marketplace} with scope: ${scope}`);

    const command = `plugin install -s ${scope} ${pluginId}@${marketplace}`;
    await this.executeCommand(command);

    // 如果是项目级安装，需要在项目中启用插件
    if (scope === 'project' && projectPath) {
      await this.enablePluginInProject(`${pluginId}@${marketplace}`, projectPath);
    }
  }

  /**
   * 在项目中启用插件
   */
  private async enablePluginInProject(pluginId: string, projectPath: string): Promise<void> {
    log.info(`Enabling plugin ${pluginId} in project ${projectPath}`);

    const settingsPath = path.join(projectPath, '.claude/settings.json');

    // 确保目录存在
    await fs.ensureDir(path.dirname(settingsPath));

    // 读取或创建设置
    let settings = { enabledPlugins: {} };
    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJson(settingsPath);
    }

    // 启用插件
    if (!settings.enabledPlugins) {
      settings.enabledPlugins = {};
    }
    settings.enabledPlugins[pluginId] = true;

    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    log.info(`Plugin ${pluginId} enabled in project`);
  }

  /**
   * 获取已安装的插件
   */
  async getInstalledPlugins(): Promise<InstalledPlugin[]> {
    log.info('Getting installed plugins');

    const installedPath = path.join(os.homedir(), '.claude/plugins/installed_plugins.json');

    if (!await fs.pathExists(installedPath)) {
      return [];
    }

    try {
      const installed = await fs.readJson(installedPath);
      const plugins: InstalledPlugin[] = [];

      for (const [pluginId, installations] of Object.entries(installed.plugins || {}) as [string, any][]) {
        for (const installation of installations) {
          plugins.push({
            id: pluginId,
            scope: installation.scope,
            installPath: installation.installPath,
            version: installation.version,
            installedAt: installation.installedAt,
            isLocal: installation.isLocal
          });
        }
      }

      return plugins;
    } catch (error) {
      log.error('Failed to read installed plugins', error);
      return [];
    }
  }

  /**
   * 获取缓存的插件信息（模拟原来的 scanMarket 功能）
   */
  async getCachedPlugins(): Promise<Plugin[]> {
    log.info('Getting cached plugins');

    const marketplaces = await this.getMarketplaces();
    const plugins: Plugin[] = [];

    for (const marketplace of marketplaces) {
      for (const pluginInfo of marketplace.plugins) {
        try {
          // 读取插件的 metadata.json
          const pluginPath = path.resolve(marketplace.installLocation, pluginInfo.source);
          const metaPath = path.join(pluginPath, '.claude-plugin/plugin.json') ||
                          path.join(pluginPath, 'metadata.json');

          let metadata = {};
          if (await fs.pathExists(metaPath)) {
            metadata = await fs.readJson(metaPath);
          }

          // 扫描插件的能力
          const capabilities = await this.scanPluginCapabilities(pluginPath);

          plugins.push({
            meta: {
              id: pluginInfo.name,
              name: pluginInfo.name,
              description: pluginInfo.description || (metadata as any)?.description || '',
              version: (metadata as any)?.version || '1.0.0',
              author: (metadata as any)?.author || '',
              tags: (metadata as any)?.keywords || [],
              ...(metadata as any)
            },
            capabilities,
            rootPath: pluginPath
          });
        } catch (error) {
          log.error(`Failed to scan plugin ${pluginInfo.name}`, error);
        }
      }
    }

    log.info(`Found ${plugins.length} cached plugins`);
    return plugins;
  }

  /**
   * 扫描插件的能力
   */
  private async scanPluginCapabilities(pluginPath: string): Promise<any> {
    const capabilities: any = {
      skills: {},
      commands: {},
      hooks: {},
      mcpServers: {},
      files: []
    };

    try {
      // 扫描各个目录
      const dirs = ['commands', 'skills', 'hooks', 'agents'];

      for (const dir of dirs) {
        const dirPath = path.join(pluginPath, dir);
        if (await fs.pathExists(dirPath)) {
          const files = await fs.readdir(dirPath);

          if (dir === 'commands' || dir === 'skills' || dir === 'hooks') {
            capabilities[dir] = files.reduce((acc: any, file) => {
              const name = path.basename(file, path.extname(file));
              acc[name] = path.join(dirPath, file);
              return acc;
            }, {});
          }
        }
      }

      // 检查 MCP 配置
      const mcpPath = path.join(pluginPath, 'mcp.json');
      if (await fs.pathExists(mcpPath)) {
        const mcpConfig = await fs.readJson(mcpPath);
        capabilities.mcpServers = mcpConfig.mcpServers || {};
      }
    } catch (error) {
      log.error('Failed to scan plugin capabilities', error);
    }

    return capabilities;
  }
}

// 类型定义
export interface MarketplaceInfo {
  name: string;
  source: {
    source: string;
    repo: string;
  };
  installLocation: string;
  lastUpdated: string;
  plugins: Array<{
    name: string;
    source: string;
    description: string;
    version?: string;
  }>;
  metadata: {
    description?: string;
    version?: string;
  };
}

export interface InstalledPlugin {
  id: string;
  scope: 'user' | 'project' | 'local';
  installPath: string;
  version: string;
  installedAt: string;
  isLocal: boolean;
}

// 导出单例
export const claudeCli = new ClaudeCliService();