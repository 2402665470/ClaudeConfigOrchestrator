import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import { ConfigReaderService } from './ConfigReaderService';

export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  pluginCount: number;
  plugins: string[];
  lastModified: Date;
}

/**
 * 项目扫描服务
 */
export class ProjectScannerService {
  private configReader: ConfigReaderService;

  constructor() {
    this.configReader = new ConfigReaderService();
  }

  /**
   * 扫描指定目录下的所有 Claude 项目
   */
  async scanProjects(basePath: string): Promise<Project[]> {
    const projects: Project[] = [];

    try {
      // 查找所有包含 .claude 目录的路径
      const claudeDirs = await glob('**/.claude', {
        cwd: basePath,
        onlyDirectories: true,
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/build/**',
          '**/.next/**',
          '**/.nuxt/**'
        ]
      });

      for (const dir of claudeDirs) {
        const projectPath = path.join(basePath, path.dirname(dir));

        try {
          const project = await this.analyzeProject(projectPath);
          if (project) {
            projects.push(project);
          }
        } catch (error) {
          console.error(`Failed to analyze project: ${projectPath}`, error);
        }
      }
    } catch (error) {
      console.error('Failed to scan projects', error);
    }

    return projects;
  }

  /**
   * 分析单个项目
   */
  async analyzeProject(projectPath: string): Promise<Project | null> {
    // 检查是否有 Claude 配置
    if (!await this.configReader.hasClaudeConfig(projectPath)) {
      return null;
    }

    try {
      // 获取项目基本信息
      const stats = await fs.stat(projectPath);
      const name = path.basename(projectPath);

      // 读取项目配置
      const settings = await this.configReader.getProjectSettings(projectPath);
      const plugins = Object.keys(settings.enabledPlugins || {});

      // 尝试读取 package.json 获取更多信息
      let description = '';
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        description = packageJson.description || '';
      }

      // 尝试读取 README.md 获取描述
      if (!description) {
        const readmePath = path.join(projectPath, 'README.md');
        if (await fs.pathExists(readmePath)) {
          const readme = await fs.readFile(readmePath, 'utf-8');
          const firstLine = readme.split('\n')[0].replace(/^#\s*/, '');
          if (firstLine.length < 100) {
            description = firstLine;
          }
        }
      }

      return {
        id: this.generateProjectId(projectPath),
        name,
        path: projectPath,
        description,
        pluginCount: plugins.length,
        plugins,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error(`Failed to analyze project: ${projectPath}`, error);
      return null;
    }
  }

  /**
   * 生成项目唯一 ID
   */
  private generateProjectId(projectPath: string): string {
    // 使用路径的哈希作为 ID
    return Buffer.from(projectPath).toString('base64').replace(/[+/=]/g, '');
  }

  /**
   * 检查路径是否是 Claude 项目
   */
  async isClaudeProject(projectPath: string): Promise<boolean> {
    return await this.configReader.hasClaudeConfig(projectPath);
  }

  /**
   * 监听项目变化
   */
  async watchProject(projectPath: string, callback: (project: Project) => void): Promise<void> {
    const configPath = path.join(projectPath, '.claude');

    // 使用 chokidar 如果可用，否则使用简单的轮询
    try {
      const chokidar = require('chokidar');

      const watcher = chokidar.watch(configPath, {
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('change', async () => {
        const project = await this.analyzeProject(projectPath);
        if (project) {
          callback(project);
        }
      });
    } catch (error) {
      // 如果 chokidar 不可用，使用轮询
      console.warn('chokidar not available, falling back to polling');
      let lastModified = Date.now();

      setInterval(async () => {
        try {
          const stats = await fs.stat(configPath);
          if (stats.mtime.getTime() > lastModified) {
            lastModified = stats.mtime.getTime();
            const project = await this.analyzeProject(projectPath);
            if (project) {
              callback(project);
            }
          }
        } catch (error) {
          // 忽略错误
        }
      }, 5000); // 每 5 秒检查一次
    }
  }

  /**
   * 获取项目统计信息
   */
  async getProjectStats(basePath: string): Promise<{
    totalProjects: number;
    totalPlugins: number;
    topPlugins: Array<{ name: string; count: number }>;
  }> {
    const projects = await this.scanProjects(basePath);
    const pluginCounts: Record<string, number> = {};

    let totalPlugins = 0;
    for (const project of projects) {
      totalPlugins += project.pluginCount;

      for (const plugin of project.plugins) {
        pluginCounts[plugin] = (pluginCounts[plugin] || 0) + 1;
      }
    }

    // 获取使用最多的插件
    const topPlugins = Object.entries(pluginCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      totalProjects: projects.length,
      totalPlugins,
      topPlugins
    };
  }
}