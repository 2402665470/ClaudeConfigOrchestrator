// Common types shared between main and renderer processes

export type CapabilityType = 'skill' | 'command' | 'hook' | 'mcp' | 'setting' | 'agent';

export type TranslationStatus = 'pending' | 'translating' | 'auto_translated' | 'manually_edited' | 'failed';

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author?: string;
  repository?: string;
}

export interface ImportProgress {
  stage: 'downloading' | 'extracting' | 'parsing' | 'translating' | 'complete' | 'failed';
  percent: number;
  message: string;
}

export interface PluginPackage {
  info: PluginInfo;
  localPath: string;
  capabilities: Capability[];
}

export interface Capability {
  id: string;
  type: CapabilityType;
  name: string;
  originalDescription: string;
  chineseDescription?: string;
  translationStatus: TranslationStatus;
  sourcePlugin: string;
  version?: string;
  author?: string;
  content: CapabilityContent;
  metadata: CapabilityMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type CapabilityContent = 
  | SkillContent 
  | CommandContent 
  | HookContent 
  | McpContent 
  | SettingContent 
  | AgentContent;

export interface SkillContent {
  type: 'skill';
  folderPath: string;
  files: string[];
}

export interface CommandContent {
  type: 'command';
  filePath: string;
  markdown: string;
}

export interface HookContent {
  type: 'hook';
  config: Record<string, unknown>;
}

export interface McpContent {
  type: 'mcp';
  serverName: string;
  config: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };
}

export interface SettingContent {
  type: 'setting';
  key: string;
  config: Record<string, unknown>;
}

export interface AgentContent {
  type: 'agent';
  filePath: string;
  markdown: string;
}

export interface CapabilityMetadata {
  frontmatter?: Record<string, unknown>;
  dependencies?: string[];
  tags?: string[];
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  capabilityIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  hidden: boolean;
  lastInjectedAt?: Date;
  createdAt: Date;
}

// Injection Service Types
export interface ProjectConfig {
  path: string;
  hasClaudeDir: boolean;
  existingCapabilities: ExistingCapability[];
  settingsJson?: Record<string, unknown>;
  mcpJson?: Record<string, unknown>;
}

export interface ExistingCapability {
  type: CapabilityType;
  name: string;
  path: string;
}

export interface InjectionPreview {
  toCreate: InjectionItem[];
  toUpdate: InjectionItem[];
  conflicts: Conflict[];
}

export interface InjectionItem {
  capability: Capability;
  targetPath: string;
  action: 'create' | 'update' | 'merge';
}

export interface Conflict {
  capability: Capability;
  existingPath: string;
  conflictType: 'file_exists' | 'config_key_exists';
  resolution?: 'overwrite' | 'skip' | 'rename';
}

export interface InjectionOptions {
  conflictResolution: 'overwrite' | 'skip' | 'ask';
  createBackup: boolean;
}

export interface InjectionResult {
  success: boolean;
  injectedCapabilities: Capability[];
  skippedCapabilities: Capability[];
  backupId?: string;
  errors: string[];
}

export interface BackupInfo {
  id: string;
  projectPath: string;
  timestamp: Date;
  capabilities: string[];
  backupPath: string;
}

// Re-export utility functions
export { getDisplayDescription, getDisplayName, hasChineseDescription, needsTranslation } from './utils';