import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectConfig, ExistingCapability, BackupInfo } from '@common/types';
import { StorageService } from './StorageService';

export class ProjectService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * 添加新项目
   */
  async addProject(projectPath: string, name?: string): Promise<Project> {
    // 验证路径存在
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error('指定路径不是一个目录');
      }
    } catch (error) {
      throw new Error(`无法访问项目路径: ${projectPath}`);
    }

    // 检查是否已存在
    const existingProjects = await this.storageService.getAllProjects();
    const existing = existingProjects.find(p => p.path === projectPath);
    if (existing) {
      throw new Error('该项目路径已存在');
    }

    const project: Project = {
      id: uuidv4(),
      name: name || path.basename(projectPath),
      path: projectPath,
      hidden: false,
      createdAt: new Date(),
    };

    await this.storageService.saveProject(project);
    return project;
  }

  /**
   * 获取所有项目
   */
  async getAllProjects(): Promise<Project[]> {
    return this.storageService.getAllProjects();
  }

  /**
   * 获取可见项目
   */
  async getVisibleProjects(): Promise<Project[]> {
    const projects = await this.getAllProjects();
    return projects.filter(p => !p.hidden);
  }

  /**
   * 更新项目
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const project = await this.storageService.getProject(id);
    if (!project) {
      throw new Error('项目不存在');
    }

    const updatedProject = { ...project, ...updates };
    await this.storageService.saveProject(updatedProject);
  }

  /**
   * 隐藏项目
   */
  async hideProject(id: string): Promise<void> {
    await this.updateProject(id, { hidden: true });
  }

  /**
   * 显示项目
   */
  async showProject(id: string): Promise<void> {
    await this.updateProject(id, { hidden: false });
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<void> {
    await this.storageService.deleteProject(id);
  }

  /**
   * 扫描项目配置
   */
  async scanProjectConfig(projectPath: string): Promise<ProjectConfig> {
    const claudeDir = path.join(projectPath, '.claude');
    
    try {
      const stats = await fs.stat(claudeDir);
      if (!stats.isDirectory()) {
        return {
          path: projectPath,
          hasClaudeDir: false,
          existingCapabilities: [],
        };
      }
    } catch (error) {
      return {
        path: projectPath,
        hasClaudeDir: false,
        existingCapabilities: [],
      };
    }

    const existingCapabilities: ExistingCapability[] = [];
    
    // 扫描 skills
    try {
      const skillsDir = path.join(claudeDir, 'skills');
      const skillStats = await fs.stat(skillsDir);
      if (skillStats.isDirectory()) {
        const skillDirs = await fs.readdir(skillsDir);
        for (const skillDir of skillDirs) {
          const skillPath = path.join(skillsDir, skillDir);
          const skillStat = await fs.stat(skillPath);
          if (skillStat.isDirectory()) {
            existingCapabilities.push({
              type: 'skill',
              name: skillDir,
              path: skillPath,
            });
          }
        }
      }
    } catch (error) {
      // Skills 目录不存在，忽略
    }

    // 扫描 commands
    try {
      const commandsDir = path.join(claudeDir, 'commands');
      const commandStats = await fs.stat(commandsDir);
      if (commandStats.isDirectory()) {
        const commandFiles = await fs.readdir(commandsDir);
        for (const commandFile of commandFiles) {
          if (commandFile.endsWith('.md')) {
            const commandPath = path.join(commandsDir, commandFile);
            existingCapabilities.push({
              type: 'command',
              name: path.basename(commandFile, '.md'),
              path: commandPath,
            });
          }
        }
      }
    } catch (error) {
      // Commands 目录不存在，忽略
    }

    // 扫描 agents
    try {
      const agentsDir = path.join(claudeDir, 'agents');
      const agentStats = await fs.stat(agentsDir);
      if (agentStats.isDirectory()) {
        const agentFiles = await fs.readdir(agentsDir);
        for (const agentFile of agentFiles) {
          if (agentFile.endsWith('.md')) {
            const agentPath = path.join(agentsDir, agentFile);
            existingCapabilities.push({
              type: 'agent',
              name: path.basename(agentFile, '.md'),
              path: agentPath,
            });
          }
        }
      }
    } catch (error) {
      // Agents 目录不存在，忽略
    }

    // 读取 settings.json
    let settingsJson: Record<string, unknown> | undefined;
    try {
      const settingsPath = path.join(claudeDir, 'settings.json');
      const settingsContent = await fs.readFile(settingsPath, 'utf-8');
      settingsJson = JSON.parse(settingsContent);

      // 从 settings.json 中提取 hooks 和 mcpServers
      if (settingsJson && settingsJson.hooks) {
        const hooks = settingsJson.hooks as Record<string, unknown>;
        Object.keys(hooks).forEach(hookName => {
          existingCapabilities.push({
            type: 'hook',
            name: hookName,
            path: settingsPath,
          });
        });
      }

      if (settingsJson && settingsJson.mcpServers) {
        const mcpServers = settingsJson.mcpServers as Record<string, unknown>;
        Object.keys(mcpServers).forEach(serverName => {
          existingCapabilities.push({
            type: 'mcp',
            name: serverName,
            path: settingsPath,
          });
        });
      }
    } catch (error) {
      // settings.json 不存在或格式错误，忽略
    }

    return {
      path: projectPath,
      hasClaudeDir: true,
      existingCapabilities,
      settingsJson,
    };
  }

  /**
   * 获取项目的注入历史
   */
  async getProjectBackups(projectPath: string): Promise<BackupInfo[]> {
    return this.storageService.getBackups(projectPath);
  }

  /**
   * 打开项目文件夹
   */
  async openProjectFolder(projectPath: string): Promise<void> {
    const { shell } = require('electron');
    await shell.openPath(projectPath);
  }
}