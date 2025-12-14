export type GitAuthSettings = {
  gitUsername: string
  personalAccessToken: string
}

export type PrivateMarketConfig = {
  gitUrl: string
  localClonePath: string
}

export type ExternalMarketSource = {
  name: string
  url: string
  type: string
}

export type AppSettings = {
  gitAuth: GitAuthSettings
  privateMarket: PrivateMarketConfig
}

export type AppData = {
  marketPath: string
  projects: Project[]
  hiddenProjects: Project[]  // 隐藏的项目列表
  appSettings?: AppSettings
  externalMarkets?: ExternalMarketSource[]
}

export type Project = {
  id: string
  alias: string
  path: string
  description?: string
}

export type Plugin = {
  meta: {
    id: string;
    name: string;
    readmePath?: string;
    iconPath?: string;
    version?: string;
    description?: string;
    author?: string;
    tags?: string[];
  }
  capabilities: Record<string, unknown>
  rootPath: string
  installed?: boolean; // 是否已安装
}

// Claude 项目配置
export type ClaudeProjectConfig = {
  enabledPlugins?: Record<string, boolean>;
  skills?: Record<string, any>;
  mcpServers?: Record<string, any>;
  hooks?: Record<string, any>;
  docker?: {
    services: any[];
  };
}

// 能力类型
export type CapabilityType = 'skill' | 'hook' | 'mcpServer' | 'config';

// 配置能力
export type ConfigCapability = {
  type: 'config';
  name: string;
  description?: string;
  category?: 'model' | 'environment' | 'integration' | 'workflow';
  filePath?: string;
  preview?: {
    env?: Record<string, string>;
    settings?: Record<string, any>;
    model?: string;
  };
}

// 冲突信息
export type ConflictInfo = {
  type: CapabilityType | 'file';
  key: string;
  existing: any;
  incoming: any;
}

// 安装结果
export type InstallationResult = {
  success: boolean;
  error?: string;
  conflicts?: ConflictInfo[];
  installedCapabilities?: string[];
}

// MCP 服务器配置
export type McpServerConfig = {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}
