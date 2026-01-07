import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { glob } from 'glob';
import { v4 as uuidv4 } from 'uuid';
import merge from 'lodash.merge';
import {
  Capability,
  ProjectConfig,
  ExistingCapability,
  InjectionPreview,
  InjectionOptions,
  InjectionResult,
  Conflict,
  BackupInfo,
  CapabilityType
} from '@common/types';
import { StorageService } from './StorageService';

export class InjectionService {
  private backupsDir: string;
  private storageService: StorageService;

  constructor(backupsDir: string, storageService: StorageService) {
    this.backupsDir = backupsDir;
    this.storageService = storageService;
    fs.ensureDirSync(this.backupsDir);
  }

  /**
   * 扫描项目现有配置
   */
  async scanProject(projectPath: string): Promise<ProjectConfig> {
    const claudeDir = path.join(projectPath, '.claude');
    const hasClaudeDir = await fs.pathExists(claudeDir);
    
    const config: ProjectConfig = {
      path: projectPath,
      hasClaudeDir,
      existingCapabilities: [],
      settingsJson: undefined,
      mcpJson: undefined
    };

    if (!hasClaudeDir) {
      return config;
    }

    // 扫描现有能力
    config.existingCapabilities = await this.scanExistingCapabilities(claudeDir);

    // 读取 settings.json
    const settingsPath = path.join(claudeDir, 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf-8');
        config.settingsJson = JSON.parse(settingsContent);
      } catch (error) {
        console.warn('Failed to parse settings.json:', error);
      }
    }

    // 读取 MCP 配置 (.kiro/settings/mcp.json)
    const kiroMcpPath = path.join(projectPath, '.kiro', 'settings', 'mcp.json');
    if (await fs.pathExists(kiroMcpPath)) {
      try {
        const mcpContent = await fs.readFile(kiroMcpPath, 'utf-8');
        config.mcpJson = JSON.parse(mcpContent);
      } catch (error) {
        console.warn('Failed to parse mcp.json:', error);
      }
    }

    return config;
  }

  /**
   * 扫描现有能力配置
   */
  private async scanExistingCapabilities(claudeDir: string): Promise<ExistingCapability[]> {
    const capabilities: ExistingCapability[] = [];

    // 扫描 Skills
    const skillsDir = path.join(claudeDir, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const skillDirs = await fs.readdir(skillsDir);
      for (const skillDir of skillDirs) {
        const skillPath = path.join(skillsDir, skillDir);
        const stat = await fs.stat(skillPath);
        if (stat.isDirectory()) {
          capabilities.push({
            type: 'skill',
            name: skillDir,
            path: skillPath
          });
        }
      }
    }

    // 扫描 Commands
    const commandsDir = path.join(claudeDir, 'commands');
    if (await fs.pathExists(commandsDir)) {
      const commandFiles = await glob('*.md', { cwd: commandsDir });
      for (const commandFile of commandFiles) {
        const name = path.basename(commandFile, '.md');
        capabilities.push({
          type: 'command',
          name,
          path: path.join(commandsDir, commandFile)
        });
      }
    }

    // 扫描 Agents
    const agentsDir = path.join(claudeDir, 'agents');
    if (await fs.pathExists(agentsDir)) {
      const agentFiles = await glob('*.md', { cwd: agentsDir });
      for (const agentFile of agentFiles) {
        const name = path.basename(agentFile, '.md');
        capabilities.push({
          type: 'agent',
          name,
          path: path.join(agentsDir, agentFile)
        });
      }
    }

    // 扫描 Settings 中的 Hooks
    const settingsPath = path.join(claudeDir, 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf-8');
        const settings = JSON.parse(settingsContent);
        
        if (settings.hooks && typeof settings.hooks === 'object') {
          for (const hookName of Object.keys(settings.hooks)) {
            capabilities.push({
              type: 'hook',
              name: hookName,
              path: settingsPath
            });
          }
        }

        // 扫描 MCP Servers
        if (settings.mcpServers && typeof settings.mcpServers === 'object') {
          for (const serverName of Object.keys(settings.mcpServers)) {
            capabilities.push({
              type: 'mcp',
              name: serverName,
              path: settingsPath
            });
          }
        }

        // 扫描其他 Settings
        const settingKeys = ['permissions', 'env', 'companyAnnouncements'];
        for (const key of settingKeys) {
          if (settings[key]) {
            capabilities.push({
              type: 'setting',
              name: key,
              path: settingsPath
            });
          }
        }
      } catch (error) {
        console.warn('Failed to parse settings.json for capability scanning:', error);
      }
    }

    return capabilities;
  }

  /**
   * 预览注入结果
   */
  async previewInjection(projectPath: string, capabilities: Capability[]): Promise<InjectionPreview> {
    const projectConfig = await this.scanProject(projectPath);
    const conflicts = await this.detectConflicts(projectPath, capabilities);
    
    const preview: InjectionPreview = {
      toCreate: [],
      toUpdate: [],
      conflicts
    };

    for (const capability of capabilities) {
      const targetPath = this.getTargetPath(projectPath, capability);
      const hasConflict = conflicts.some(c => c.capability.id === capability.id);
      
      if (!hasConflict) {
        const exists = await fs.pathExists(targetPath);
        preview.toCreate.push({
          capability,
          targetPath,
          action: exists ? 'update' : 'create'
        });
      }
    }

    return preview;
  }

  /**
   * 检测冲突
   */
  async detectConflicts(projectPath: string, capabilities: Capability[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const projectConfig = await this.scanProject(projectPath);

    for (const capability of capabilities) {
      // 检测文件冲突
      if (capability.type === 'skill' || capability.type === 'command' || capability.type === 'agent') {
        const targetPath = this.getTargetPath(projectPath, capability);
        if (await fs.pathExists(targetPath)) {
          conflicts.push({
            capability,
            existingPath: targetPath,
            conflictType: 'file_exists'
          });
        }
      }

      // 检测配置键冲突
      if (capability.type === 'hook' || capability.type === 'mcp' || capability.type === 'setting') {
        const hasConfigConflict = this.checkConfigConflict(capability, projectConfig);
        if (hasConfigConflict) {
          const settingsPath = path.join(projectPath, '.claude', 'settings.json');
          conflicts.push({
            capability,
            existingPath: settingsPath,
            conflictType: 'config_key_exists'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * 检查配置冲突
   */
  private checkConfigConflict(capability: Capability, projectConfig: ProjectConfig): boolean {
    if (!projectConfig.settingsJson) {
      return false;
    }

    const settings = projectConfig.settingsJson;

    switch (capability.type) {
      case 'hook':
        return !!(settings.hooks && typeof settings.hooks === 'object' && 
               Object.keys(settings.hooks).length > 0);
      
      case 'mcp':
        if (capability.content.type === 'mcp') {
          return !!(settings.mcpServers && 
                 typeof settings.mcpServers === 'object' &&
                 Object.prototype.hasOwnProperty.call(settings.mcpServers, capability.content.serverName));
        }
        return false;
      
      case 'setting':
        if (capability.content.type === 'setting') {
          return capability.content.key in settings && settings[capability.content.key] != null;
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * 获取目标路径
   */
  private getTargetPath(projectPath: string, capability: Capability): string {
    const claudeDir = path.join(projectPath, '.claude');

    switch (capability.type) {
      case 'skill':
        return path.join(claudeDir, 'skills', capability.name);
      
      case 'command':
        return path.join(claudeDir, 'commands', `${capability.name}.md`);
      
      case 'agent':
        return path.join(claudeDir, 'agents', `${capability.name}.md`);
      
      case 'hook':
      case 'mcp':
      case 'setting':
        return path.join(claudeDir, 'settings.json');
      
      default:
        throw new Error(`Unknown capability type: ${capability.type}`);
    }
  }

  /**
   * 执行注入
   */
  async inject(projectPath: string, capabilities: Capability[], options: InjectionOptions): Promise<InjectionResult> {
    const result: InjectionResult = {
      success: true,
      injectedCapabilities: [],
      skippedCapabilities: [],
      errors: []
    };

    // 创建备份（如果需要）
    if (options.createBackup) {
      try {
        const backupInfo = await this.backup(projectPath);
        result.backupId = backupInfo.id;
      } catch (error) {
        result.errors.push(`Failed to create backup: ${error}`);
        if (options.conflictResolution !== 'overwrite') {
          result.success = false;
          return result;
        }
      }
    }

    // 确保 .claude 目录存在
    const claudeDir = path.join(projectPath, '.claude');
    await fs.ensureDir(claudeDir);

    // 按类型分组处理能力
    for (const capability of capabilities) {
      try {
        await this.injectSingleCapability(projectPath, capability, options);
        result.injectedCapabilities.push(capability);
      } catch (error) {
        result.errors.push(`Failed to inject ${capability.name}: ${error}`);
        result.skippedCapabilities.push(capability);
        
        if (options.conflictResolution === 'ask') {
          // 在实际应用中，这里应该询问用户
          // 现在我们跳过这个能力
          continue;
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * 注入单个能力
   */
  private async injectSingleCapability(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    switch (capability.type) {
      case 'skill':
        await this.injectSkill(projectPath, capability, options);
        break;
      case 'command':
        await this.injectCommand(projectPath, capability, options);
        break;
      case 'agent':
        await this.injectAgent(projectPath, capability, options);
        break;
      case 'hook':
      case 'mcp':
      case 'setting':
        await this.injectConfigCapability(projectPath, capability, options);
        break;
      default:
        throw new Error(`Unknown capability type: ${capability.type}`);
    }
  }

  /**
   * 注入 Skill 能力
   */
  private async injectSkill(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    if (capability.content.type !== 'skill') {
      throw new Error('Invalid capability content type for skill injection');
    }

    const skillContent = capability.content;
    const targetDir = path.join(projectPath, '.claude', 'skills', capability.name);
    
    // 检查目标目录是否存在
    if (await fs.pathExists(targetDir)) {
      if (options.conflictResolution === 'skip') {
        throw new Error(`Skill directory already exists: ${targetDir}`);
      } else if (options.conflictResolution === 'overwrite') {
        await fs.remove(targetDir);
      }
    }

    // 获取源文件夹路径
    const sourceDir = this.getCapabilitySourcePath(capability);
    
    // 复制完整的技能文件夹
    await fs.copy(sourceDir, targetDir, {
      overwrite: options.conflictResolution === 'overwrite',
      errorOnExist: options.conflictResolution === 'skip'
    });
  }

  /**
   * 注入 Command 能力
   */
  private async injectCommand(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    if (capability.content.type !== 'command') {
      throw new Error('Invalid capability content type for command injection');
    }

    const commandContent = capability.content;
    const targetFile = path.join(projectPath, '.claude', 'commands', `${capability.name}.md`);
    
    // 检查目标文件是否存在
    if (await fs.pathExists(targetFile)) {
      if (options.conflictResolution === 'skip') {
        throw new Error(`Command file already exists: ${targetFile}`);
      } else if (options.conflictResolution === 'overwrite') {
        // 继续执行，会覆盖文件
      }
    }

    // 确保目标目录存在
    await fs.ensureDir(path.dirname(targetFile));

    // 获取源文件路径
    const sourceFile = this.getCapabilitySourcePath(capability);
    
    // 复制命令文件
    await fs.copy(sourceFile, targetFile, {
      overwrite: options.conflictResolution === 'overwrite',
      errorOnExist: options.conflictResolution === 'skip'
    });
  }

  /**
   * 注入 Agent 能力 - 占位符实现
   */
  private async injectAgent(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    // TODO: 在后续子任务中实现
    throw new Error('Agent injection not implemented yet');
  }

  /**
   * 注入配置类能力
   */
  private async injectConfigCapability(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    switch (capability.type) {
      case 'setting':
        await this.injectSetting(projectPath, capability, options);
        break;
      case 'hook':
        await this.injectHook(projectPath, capability, options);
        break;
      case 'mcp':
        await this.injectMcp(projectPath, capability, options);
        break;
      default:
        throw new Error(`Unknown config capability type: ${capability.type}`);
    }
  }

  /**
   * 注入 Setting 能力
   */
  private async injectSetting(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    if (capability.content.type !== 'setting') {
      throw new Error('Invalid capability content type for setting injection');
    }

    const settingContent = capability.content;
    const settingsFile = path.join(projectPath, '.claude', 'settings.json');
    
    // 确保 .claude 目录存在
    await fs.ensureDir(path.dirname(settingsFile));

    // 读取现有配置
    let existingSettings: Record<string, unknown> = {};
    if (await fs.pathExists(settingsFile)) {
      try {
        const content = await fs.readFile(settingsFile, 'utf-8');
        existingSettings = JSON.parse(content);
      } catch (error) {
        console.warn('Failed to parse existing settings.json:', error);
        if (options.conflictResolution === 'skip') {
          throw new Error('Cannot parse existing settings.json and conflict resolution is set to skip');
        }
        // 如果解析失败且允许覆盖，则使用空对象
        existingSettings = {};
      }
    }

    // 检查配置键冲突
    if (settingContent.key in existingSettings) {
      if (options.conflictResolution === 'skip') {
        throw new Error(`Setting key '${settingContent.key}' already exists in settings.json`);
      } else if (options.conflictResolution === 'ask') {
        // 在实际应用中，这里应该询问用户
        // 现在我们跳过这个设置
        throw new Error(`Setting key '${settingContent.key}' already exists, user input required`);
      }
      // 如果是 'overwrite'，继续执行
    }

    // 合并配置
    const newSettings = { ...existingSettings };
    if (options.conflictResolution === 'overwrite' || !(settingContent.key in existingSettings)) {
      newSettings[settingContent.key] = settingContent.config;
    } else {
      // 深度合并现有配置
      newSettings[settingContent.key] = merge({}, existingSettings[settingContent.key], settingContent.config);
    }

    // 写入配置文件
    await fs.writeFile(settingsFile, JSON.stringify(newSettings, null, 2));
  }

  /**
   * 注入 Hook 能力
   */
  private async injectHook(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    if (capability.content.type !== 'hook') {
      throw new Error('Invalid capability content type for hook injection');
    }

    const hookContent = capability.content;
    const settingsFile = path.join(projectPath, '.claude', 'settings.json');
    
    // 确保 .claude 目录存在
    await fs.ensureDir(path.dirname(settingsFile));

    // 读取现有配置
    let existingSettings: Record<string, unknown> = {};
    if (await fs.pathExists(settingsFile)) {
      try {
        const content = await fs.readFile(settingsFile, 'utf-8');
        existingSettings = JSON.parse(content);
      } catch (error) {
        console.warn('Failed to parse existing settings.json:', error);
        if (options.conflictResolution === 'skip') {
          throw new Error('Cannot parse existing settings.json and conflict resolution is set to skip');
        }
        existingSettings = {};
      }
    }

    // 确保 hooks 对象存在
    if (!existingSettings.hooks || typeof existingSettings.hooks !== 'object') {
      existingSettings.hooks = {};
    }

    // 合并 Hook 配置
    const hooks = existingSettings.hooks as Record<string, unknown>;
    if (options.conflictResolution === 'overwrite') {
      Object.assign(hooks, hookContent.config);
    } else {
      // 深度合并
      merge(hooks, hookContent.config);
    }

    // 写入配置文件
    await fs.writeFile(settingsFile, JSON.stringify(existingSettings, null, 2));
  }

  /**
   * 注入 MCP 能力
   */
  private async injectMcp(projectPath: string, capability: Capability, options: InjectionOptions): Promise<void> {
    if (capability.content.type !== 'mcp') {
      throw new Error('Invalid capability content type for MCP injection');
    }

    const mcpContent = capability.content;
    const settingsFile = path.join(projectPath, '.claude', 'settings.json');
    
    // 确保 .claude 目录存在
    await fs.ensureDir(path.dirname(settingsFile));

    // 读取现有配置
    let existingSettings: Record<string, unknown> = {};
    if (await fs.pathExists(settingsFile)) {
      try {
        const content = await fs.readFile(settingsFile, 'utf-8');
        existingSettings = JSON.parse(content);
      } catch (error) {
        console.warn('Failed to parse existing settings.json:', error);
        if (options.conflictResolution === 'skip') {
          throw new Error('Cannot parse existing settings.json and conflict resolution is set to skip');
        }
        existingSettings = {};
      }
    }

    // 确保 mcpServers 对象存在
    if (!existingSettings.mcpServers || typeof existingSettings.mcpServers !== 'object') {
      existingSettings.mcpServers = {};
    }

    const mcpServers = existingSettings.mcpServers as Record<string, unknown>;
    
    // 检查服务器名称冲突
    if (mcpContent.serverName in mcpServers) {
      if (options.conflictResolution === 'skip') {
        throw new Error(`MCP server '${mcpContent.serverName}' already exists in settings.json`);
      } else if (options.conflictResolution === 'ask') {
        throw new Error(`MCP server '${mcpContent.serverName}' already exists, user input required`);
      }
    }

    // 添加 MCP 服务器配置
    mcpServers[mcpContent.serverName] = mcpContent.config;

    // 写入配置文件
    await fs.writeFile(settingsFile, JSON.stringify(existingSettings, null, 2));
  }

  /**
   * 获取能力的源文件路径
   */
  private getCapabilitySourcePath(capability: Capability): string {
    // 根据设计文档，能力文件存储在 ~/.claude-orchestrator/data/capabilities/ 下
    // 这里我们假设有一个全局的数据目录配置
    const dataDir = process.env.CLAUDE_ORCHESTRATOR_DATA_DIR || path.join(os.homedir(), '.claude-orchestrator', 'data');
    
    switch (capability.type) {
      case 'skill':
        if (capability.content.type === 'skill') {
          // 如果 folderPath 是绝对路径，直接使用；否则相对于 capabilities/skills/
          if (path.isAbsolute(capability.content.folderPath)) {
            return capability.content.folderPath;
          } else {
            return path.join(dataDir, 'capabilities', 'skills', capability.id);
          }
        }
        throw new Error('Invalid skill content');
      
      case 'command':
        if (capability.content.type === 'command') {
          if (path.isAbsolute(capability.content.filePath)) {
            return capability.content.filePath;
          } else {
            return path.join(dataDir, 'capabilities', 'commands', `${capability.id}.md`);
          }
        }
        throw new Error('Invalid command content');
      
      case 'agent':
        if (capability.content.type === 'agent') {
          if (path.isAbsolute(capability.content.filePath)) {
            return capability.content.filePath;
          } else {
            return path.join(dataDir, 'capabilities', 'agents', `${capability.id}.md`);
          }
        }
        throw new Error('Invalid agent content');
      
      default:
        throw new Error(`Cannot get source path for capability type: ${capability.type}`);
    }
  }

  /**
   * 备份配置
   */
  async backup(projectPath: string): Promise<BackupInfo> {
    const claudeDir = path.join(projectPath, '.claude');
    
    // 如果 .claude 目录不存在，创建一个空备份
    if (!await fs.pathExists(claudeDir)) {
      const backupInfo: BackupInfo = {
        id: uuidv4(),
        projectPath,
        timestamp: new Date(),
        capabilities: [],
        backupPath: ''
      };
      return backupInfo;
    }

    // 扫描现有能力
    const projectConfig = await this.scanProject(projectPath);
    const capabilityNames = projectConfig.existingCapabilities.map(cap => `${cap.type}:${cap.name}`);

    // 创建备份目录
    const backupId = uuidv4();
    const projectHash = Buffer.from(projectPath).toString('base64').replace(/[/+=]/g, '_');
    const backupDir = path.join(this.backupsDir, projectHash, backupId);
    await fs.ensureDir(backupDir);

    // 复制 .claude 目录到备份位置
    const backupClaudeDir = path.join(backupDir, '.claude');
    await fs.copy(claudeDir, backupClaudeDir);

    // 如果存在 .kiro/settings/mcp.json，也备份它
    const kiroMcpPath = path.join(projectPath, '.kiro', 'settings', 'mcp.json');
    if (await fs.pathExists(kiroMcpPath)) {
      const backupKiroDir = path.join(backupDir, '.kiro', 'settings');
      await fs.ensureDir(backupKiroDir);
      await fs.copy(kiroMcpPath, path.join(backupKiroDir, 'mcp.json'));
    }

    const backupInfo: BackupInfo = {
      id: backupId,
      projectPath,
      timestamp: new Date(),
      capabilities: capabilityNames,
      backupPath: backupDir
    };

    // 保存备份信息到数据库
    await this.storageService.saveBackup(backupInfo);

    return backupInfo;
  }

  /**
   * 回滚配置
   */
  async rollback(projectPath: string, backupId: string): Promise<void> {
    // 查找备份目录
    const projectHash = Buffer.from(projectPath).toString('base64').replace(/[/+=]/g, '_');
    const backupDir = path.join(this.backupsDir, projectHash, backupId);
    
    if (!await fs.pathExists(backupDir)) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const backupClaudeDir = path.join(backupDir, '.claude');
    const targetClaudeDir = path.join(projectPath, '.claude');

    // 删除当前的 .claude 目录
    if (await fs.pathExists(targetClaudeDir)) {
      await fs.remove(targetClaudeDir);
    }

    // 如果备份中有 .claude 目录，则恢复它
    if (await fs.pathExists(backupClaudeDir)) {
      await fs.copy(backupClaudeDir, targetClaudeDir);
    }

    // 恢复 .kiro/settings/mcp.json（如果存在）
    const backupMcpFile = path.join(backupDir, '.kiro', 'settings', 'mcp.json');
    if (await fs.pathExists(backupMcpFile)) {
      const targetMcpFile = path.join(projectPath, '.kiro', 'settings', 'mcp.json');
      await fs.ensureDir(path.dirname(targetMcpFile));
      await fs.copy(backupMcpFile, targetMcpFile);
    } else {
      // 如果备份中没有 MCP 文件，删除当前的 MCP 文件（如果存在）
      const targetMcpFile = path.join(projectPath, '.kiro', 'settings', 'mcp.json');
      if (await fs.pathExists(targetMcpFile)) {
        await fs.remove(targetMcpFile);
      }
    }
  }
}