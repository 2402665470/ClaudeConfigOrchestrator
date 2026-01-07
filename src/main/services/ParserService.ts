import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import * as yaml from 'yaml';
import { 
  Capability, 
  CapabilityType, 
  CapabilityContent,
  CapabilityMetadata,
  SkillContent,
  CommandContent,
  AgentContent,
  HookContent,
  McpContent,
  SettingContent
} from '../../common/types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  message: string;
  field?: string;
}

export interface ValidationWarning {
  message: string;
  field?: string;
}

export interface PluginStructure {
  hasClaudeDir: boolean;
  commandsDir?: string;
  skillsDir?: string;
  agentsDir?: string;
  settingsFile?: string;
  capabilities: ParsedCapability[];
}

export interface ParsedCapability {
  type: CapabilityType;
  name: string;
  description: string;
  filePath: string;
  content: any;
  metadata: CapabilityMetadata;
}

/**
 * Parser Service - 负责解析插件结构，提取原子能力
 */
export class ParserService {
  
  /**
   * 解析插件目录，提取所有能力
   */
  public async parsePlugin(pluginPath: string): Promise<Capability[]> {
    if (!await fs.pathExists(pluginPath)) {
      throw new Error(`插件路径不存在: ${pluginPath}`);
    }

    const structure = await this.analyzePluginStructure(pluginPath);
    const capabilities: Capability[] = [];

    // 解析各类型能力
    for (const parsed of structure.capabilities) {
      const capability = await this.createCapabilityFromParsed(parsed, pluginPath);
      capabilities.push(capability);
    }

    return capabilities;
  }

  /**
   * 分析插件目录结构
   */
  private async analyzePluginStructure(pluginPath: string): Promise<PluginStructure> {
    const claudeDir = path.join(pluginPath, '.claude');
    const hasClaudeDir = await fs.pathExists(claudeDir);

    if (!hasClaudeDir) {
      throw new Error('插件目录中未找到 .claude/ 目录');
    }

    const structure: PluginStructure = {
      hasClaudeDir: true,
      capabilities: []
    };

    // 检查各个子目录
    const commandsDir = path.join(claudeDir, 'commands');
    const skillsDir = path.join(claudeDir, 'skills');
    const agentsDir = path.join(claudeDir, 'agents');
    const settingsFile = path.join(claudeDir, 'settings.json');

    if (await fs.pathExists(commandsDir)) {
      structure.commandsDir = commandsDir;
      const commands = await this.parseCommandsDirectory(commandsDir);
      structure.capabilities.push(...commands);
    }

    if (await fs.pathExists(skillsDir)) {
      structure.skillsDir = skillsDir;
      const skills = await this.parseSkillsDirectory(skillsDir);
      structure.capabilities.push(...skills);
    }

    if (await fs.pathExists(agentsDir)) {
      structure.agentsDir = agentsDir;
      const agents = await this.parseAgentsDirectory(agentsDir);
      structure.capabilities.push(...agents);
    }

    if (await fs.pathExists(settingsFile)) {
      structure.settingsFile = settingsFile;
      const settings = await this.parseSettingsFile(settingsFile);
      structure.capabilities.push(...settings);
    }

    return structure;
  }

  /**
   * 解析 commands 目录
   */
  private async parseCommandsDirectory(commandsDir: string): Promise<ParsedCapability[]> {
    const capabilities: ParsedCapability[] = [];
    
    // 查找所有 .md 文件
    const pattern = path.join(commandsDir, '**/*.md').replace(/\\/g, '/');
    const files = await glob(pattern);

    for (const filePath of files) {
      try {
        const capability = await this.parseCommandFile(filePath);
        capabilities.push(capability);
      } catch (error) {
        console.warn(`解析命令文件失败: ${filePath}`, error);
      }
    }

    return capabilities;
  }

  /**
   * 解析 skills 目录
   */
  private async parseSkillsDirectory(skillsDir: string): Promise<ParsedCapability[]> {
    const capabilities: ParsedCapability[] = [];
    
    // 查找所有包含 SKILL.md 的目录
    const pattern = path.join(skillsDir, '**/SKILL.md').replace(/\\/g, '/');
    const skillFiles = await glob(pattern);

    for (const skillFile of skillFiles) {
      try {
        const skillDir = path.dirname(skillFile);
        const capability = await this.parseSkillDirectory(skillDir);
        capabilities.push(capability);
      } catch (error) {
        console.warn(`解析技能目录失败: ${skillFile}`, error);
      }
    }

    return capabilities;
  }

  /**
   * 解析 agents 目录
   */
  private async parseAgentsDirectory(agentsDir: string): Promise<ParsedCapability[]> {
    const capabilities: ParsedCapability[] = [];
    
    // 查找所有 .md 文件
    const pattern = path.join(agentsDir, '**/*.md').replace(/\\/g, '/');
    const files = await glob(pattern);

    for (const filePath of files) {
      try {
        const capability = await this.parseAgentFile(filePath);
        capabilities.push(capability);
      } catch (error) {
        console.warn(`解析代理文件失败: ${filePath}`, error);
      }
    }

    return capabilities;
  }

  /**
   * 解析 settings.json 文件
   */
  private async parseSettingsFile(settingsFile: string): Promise<ParsedCapability[]> {
    const capabilities: ParsedCapability[] = [];

    try {
      const content = await fs.readFile(settingsFile, 'utf-8');
      const settings = JSON.parse(content);

      // 解析 hooks
      if (settings.hooks && typeof settings.hooks === 'object') {
        for (const [hookName, hookConfig] of Object.entries(settings.hooks)) {
          const capability: ParsedCapability = {
            type: 'hook',
            name: hookName,
            description: `Hook: ${hookName}`,
            filePath: settingsFile,
            content: hookConfig,
            metadata: {}
          };
          capabilities.push(capability);
        }
      }

      // 解析 mcpServers
      if (settings.mcpServers && typeof settings.mcpServers === 'object') {
        for (const [serverName, serverConfig] of Object.entries(settings.mcpServers)) {
          const capability: ParsedCapability = {
            type: 'mcp',
            name: serverName,
            description: `MCP Server: ${serverName}`,
            filePath: settingsFile,
            content: serverConfig,
            metadata: {}
          };
          capabilities.push(capability);
        }
      }

      // 解析其他设置块
      const settingKeys = ['permissions', 'env', 'companyAnnouncements'];
      for (const key of settingKeys) {
        if (settings[key]) {
          const capability: ParsedCapability = {
            type: 'setting',
            name: key,
            description: `Setting: ${key}`,
            filePath: settingsFile,
            content: settings[key],
            metadata: {}
          };
          capabilities.push(capability);
        }
      }

    } catch (error) {
      console.warn(`解析设置文件失败: ${settingsFile}`, error);
    }

    return capabilities;
  }

  /**
   * 解析单个命令文件
   */
  private async parseCommandFile(filePath: string): Promise<ParsedCapability> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, markdown } = this.extractFrontmatter(content);
    
    const name = (frontmatter.name !== undefined && frontmatter.name !== null) ? String(frontmatter.name) : path.basename(filePath, '.md');
    const description = (frontmatter.description !== undefined && frontmatter.description !== null) ? String(frontmatter.description) : `Command: ${name}`;

    return {
      type: 'command',
      name,
      description,
      filePath,
      content: markdown,
      metadata: { frontmatter }
    };
  }

  /**
   * 解析技能目录
   */
  private async parseSkillDirectory(skillDir: string): Promise<ParsedCapability> {
    const skillFile = path.join(skillDir, 'SKILL.md');
    const content = await fs.readFile(skillFile, 'utf-8');
    const { frontmatter, markdown } = this.extractFrontmatter(content);
    
    const name = (frontmatter.name !== undefined && frontmatter.name !== null) ? String(frontmatter.name) : path.basename(skillDir);
    const description = (frontmatter.description !== undefined && frontmatter.description !== null) ? String(frontmatter.description) : `Skill: ${name}`;

    // 获取技能目录中的所有文件
    const allFiles = await glob('**/*', { 
      cwd: skillDir,
      absolute: false,
      dot: false
    });
    // 手动过滤，只保留文件
    const files = [];
    for (const file of allFiles) {
      const fullPath = path.join(skillDir, file);
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        files.push(file);
      }
    }

    return {
      type: 'skill',
      name,
      description,
      filePath: skillFile,
      content: {
        markdown,
        files: files.map(f => f.replace(/\\/g, '/'))
      },
      metadata: { frontmatter }
    };
  }

  /**
   * 解析代理文件
   */
  private async parseAgentFile(filePath: string): Promise<ParsedCapability> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, markdown } = this.extractFrontmatter(content);
    
    const name = (frontmatter.name !== undefined && frontmatter.name !== null) ? String(frontmatter.name) : path.basename(filePath, '.md');
    const description = (frontmatter.description !== undefined && frontmatter.description !== null) ? String(frontmatter.description) : `Agent: ${name}`;

    return {
      type: 'agent',
      name,
      description,
      filePath,
      content: markdown,
      metadata: { frontmatter }
    };
  }

  /**
   * 从 ParsedCapability 创建 Capability
   */
  private async createCapabilityFromParsed(parsed: ParsedCapability, pluginPath: string): Promise<Capability> {
    const pluginName = path.basename(pluginPath);
    const id = this.generateId(parsed);
    
    let content: CapabilityContent;
    
    switch (parsed.type) {
      case 'skill':
        content = {
          type: 'skill',
          folderPath: path.relative(pluginPath, path.dirname(parsed.filePath)),
          files: parsed.content.files || []
        } as SkillContent;
        break;
        
      case 'command':
        content = {
          type: 'command',
          filePath: path.relative(pluginPath, parsed.filePath),
          markdown: parsed.content
        } as CommandContent;
        break;
        
      case 'agent':
        content = {
          type: 'agent',
          filePath: path.relative(pluginPath, parsed.filePath),
          markdown: parsed.content
        } as AgentContent;
        break;
        
      case 'hook':
        content = {
          type: 'hook',
          config: parsed.content
        } as HookContent;
        break;
        
      case 'mcp':
        content = {
          type: 'mcp',
          serverName: parsed.name,
          config: parsed.content
        } as McpContent;
        break;
        
      case 'setting':
        content = {
          type: 'setting',
          key: parsed.name,
          config: parsed.content
        } as SettingContent;
        break;
        
      default:
        throw new Error(`不支持的能力类型: ${parsed.type}`);
    }

    return {
      id,
      type: parsed.type,
      name: parsed.name,
      originalDescription: parsed.description,
      translationStatus: 'pending',
      sourcePlugin: pluginName,
      version: parsed.metadata.frontmatter?.version as string,
      author: parsed.metadata.frontmatter?.author as string,
      content,
      metadata: parsed.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * 提取 Markdown 文件的 frontmatter
   */
  private extractFrontmatter(content: string): { frontmatter: Record<string, any>, markdown: string } {
    const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return { frontmatter: {}, markdown: content };
    }

    try {
      // 使用 yaml 包解析 frontmatter
      const frontmatterText = match[1];
      const frontmatter = yaml.parse(frontmatterText) || {};
      
      // 确保返回的是对象
      if (typeof frontmatter !== 'object' || frontmatter === null) {
        console.warn('Frontmatter 不是有效的对象格式');
        return { frontmatter: {}, markdown: match[2] };
      }

      return { frontmatter, markdown: match[2] };
    } catch (error) {
      console.warn('解析 frontmatter 失败:', error);
      
      // 回退到简单解析
      try {
        const frontmatterText = match[1];
        const frontmatter: Record<string, any> = {};
        
        const lines = frontmatterText.split(/\r?\n/);
        for (const line of lines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // 移除引号
            value = value.replace(/^["']|["']$/g, '');
            
            // 尝试转换类型
            if (value === 'true') {
              frontmatter[key] = true;
            } else if (value === 'false') {
              frontmatter[key] = false;
            } else if (/^\d+$/.test(value)) {
              frontmatter[key] = parseInt(value, 10);
            } else if (/^\d+\.\d+$/.test(value)) {
              frontmatter[key] = parseFloat(value);
            } else {
              frontmatter[key] = value;
            }
          }
        }

        return { frontmatter, markdown: match[2] };
      } catch (fallbackError) {
        console.warn('简单解析 frontmatter 也失败:', fallbackError);
        return { frontmatter: {}, markdown: content };
      }
    }
  }

  /**
   * 生成能力的唯一标识符
   */
  public generateId(capability: ParsedCapability): string {
    // 基于能力内容生成确定性的 ID
    const contentString = JSON.stringify({
      type: capability.type,
      name: capability.name,
      content: capability.content
    });
    
    const hash = createHash('md5').update(contentString).digest('hex');
    return `${capability.type}_${hash.substring(0, 8)}`;
  }

  /**
   * 解析单个能力文件
   */
  public async parseCapability(filePath: string, type: CapabilityType): Promise<Capability> {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`能力文件不存在: ${filePath}`);
    }

    let parsed: ParsedCapability;

    switch (type) {
      case 'command':
        parsed = await this.parseCommandFile(filePath);
        break;
      case 'agent':
        parsed = await this.parseAgentFile(filePath);
        break;
      case 'skill':
        // 对于 skill，filePath 应该是 SKILL.md 文件
        const skillDir = path.dirname(filePath);
        parsed = await this.parseSkillDirectory(skillDir);
        break;
      default:
        throw new Error(`不支持单独解析的能力类型: ${type}`);
    }

    // 创建 Capability 对象
    const pluginPath = this.findPluginRoot(filePath);
    return await this.createCapabilityFromParsed(parsed, pluginPath);
  }

  /**
   * 查找插件根目录
   */
  private findPluginRoot(filePath: string): string {
    let currentDir = path.dirname(filePath);
    
    // 向上查找包含 .claude 目录的父目录
    while (currentDir !== path.dirname(currentDir)) {
      const claudeDir = path.join(currentDir, '.claude');
      if (fs.existsSync(claudeDir)) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // 如果找不到，返回文件所在目录的父目录
    return path.dirname(path.dirname(filePath));
  }

  /**
   * 验证能力配置
   */
  public validateCapability(capability: Capability): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 基本字段验证
    if (!capability.id || capability.id.trim().length === 0) {
      errors.push({ message: '能力 ID 不能为空', field: 'id' });
    }

    if (!capability.name || capability.name.trim().length === 0) {
      errors.push({ message: '能力名称不能为空', field: 'name' });
    }

    if (!capability.type) {
      errors.push({ message: '能力类型不能为空', field: 'type' });
    }

    // 类型特定验证
    switch (capability.type) {
      case 'mcp':
        this.validateMcpCapability(capability, errors, warnings);
        break;
      case 'setting':
        this.validateSettingCapability(capability, errors, warnings);
        break;
      case 'hook':
        this.validateHookCapability(capability, errors, warnings);
        break;
      case 'skill':
        this.validateSkillCapability(capability, errors, warnings);
        break;
      case 'command':
      case 'agent':
        this.validateMarkdownCapability(capability, errors, warnings);
        break;
      default:
        errors.push({ message: `不支持的能力类型: ${capability.type}`, field: 'type' });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证 MCP 能力配置
   */
  private validateMcpCapability(capability: Capability, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const content = capability.content as McpContent;
    
    if (!content.config) {
      errors.push({ message: 'MCP 配置不能为空', field: 'content.config' });
      return;
    }

    if (!content.config.command || content.config.command.trim().length === 0) {
      errors.push({ message: 'MCP 配置必须包含 command 字段', field: 'content.config.command' });
    }

    if (content.config.args && !Array.isArray(content.config.args)) {
      errors.push({ message: 'MCP 配置的 args 字段必须是数组', field: 'content.config.args' });
    }

    if (content.config.env && typeof content.config.env !== 'object') {
      errors.push({ message: 'MCP 配置的 env 字段必须是对象', field: 'content.config.env' });
    }
  }

  /**
   * 验证 Setting 能力配置
   */
  private validateSettingCapability(capability: Capability, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const content = capability.content as SettingContent;
    
    if (!content.key || content.key.trim().length === 0) {
      errors.push({ message: 'Setting 配置必须包含 key 字段', field: 'content.key' });
    }

    if (!content.config) {
      errors.push({ message: 'Setting 配置不能为空', field: 'content.config' });
      return;
    }

    // 验证常见的设置键
    const validSettingKeys = ['permissions', 'env', 'companyAnnouncements', 'hooks', 'mcpServers'];
    if (!validSettingKeys.includes(content.key)) {
      warnings.push({ message: `未知的设置键: ${content.key}`, field: 'content.key' });
    }

    // 特定设置键的验证
    if (content.key === 'permissions') {
      this.validatePermissionsConfig(content.config, errors, warnings);
    }
  }

  /**
   * 验证权限配置
   */
  private validatePermissionsConfig(config: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (typeof config !== 'object') {
      errors.push({ message: 'permissions 配置必须是对象', field: 'content.config' });
      return;
    }

    if (config.allow && !Array.isArray(config.allow)) {
      errors.push({ message: 'permissions.allow 必须是数组', field: 'content.config.allow' });
    }

    if (config.deny && !Array.isArray(config.deny)) {
      errors.push({ message: 'permissions.deny 必须是数组', field: 'content.config.deny' });
    }
  }

  /**
   * 验证 Hook 能力配置
   */
  private validateHookCapability(capability: Capability, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const content = capability.content as HookContent;
    
    if (!content.config) {
      errors.push({ message: 'Hook 配置不能为空', field: 'content.config' });
    }
  }

  /**
   * 验证 Skill 能力配置
   */
  private validateSkillCapability(capability: Capability, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const content = capability.content as SkillContent;
    
    if (!content.folderPath || content.folderPath.trim().length === 0) {
      errors.push({ message: 'Skill 必须包含文件夹路径', field: 'content.folderPath' });
    }

    if (!content.files || !Array.isArray(content.files)) {
      errors.push({ message: 'Skill 必须包含文件列表', field: 'content.files' });
    } else if (content.files.length === 0) {
      warnings.push({ message: 'Skill 文件列表为空', field: 'content.files' });
    } else if (!content.files.includes('SKILL.md')) {
      errors.push({ message: 'Skill 必须包含 SKILL.md 文件', field: 'content.files' });
    }
  }

  /**
   * 验证 Markdown 能力配置（Command 和 Agent）
   */
  private validateMarkdownCapability(capability: Capability, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const content = capability.content as CommandContent | AgentContent;
    
    if (!content.filePath || content.filePath.trim().length === 0) {
      errors.push({ message: `${capability.type} 必须包含文件路径`, field: 'content.filePath' });
    }

    if (!content.markdown || content.markdown.trim().length === 0) {
      warnings.push({ message: `${capability.type} 内容为空`, field: 'content.markdown' });
    }
  }
}