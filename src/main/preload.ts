import { contextBridge, ipcRenderer } from 'electron';

import type { ConfigTemplate, Capability, Project, ProjectConfig, BackupInfo } from '@common/types';
import type { 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  TemplateStats, 
  TemplateExportData, 
  TemplateImportResult 
} from './services/TemplateService';
import type { PluginInfo, PluginPackage, ImportProgress } from './services/ImportService';
import type { AppSettings } from './services/SettingsService';

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  // System operations
  openDirectory: () => Promise<string | null>;
  openFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  showItemInFolder: (path: string) => void;
  
  // Dialog operations
  dialog: {
    showSaveDialog: (options: {
      title?: string;
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => Promise<{ canceled: boolean; filePath?: string }>;
  };
  
  // Import service
  parseMarketplace: (address: string) => Promise<{ success: boolean; plugins?: PluginInfo[]; error?: string }>;
  downloadPlugin: (plugin: PluginInfo, onProgress?: (progress: ImportProgress) => void) => Promise<{ success: boolean; result?: PluginPackage; error?: string }>;
  importFromLocal: (dirPath: string) => Promise<{ success: boolean; result?: PluginPackage; error?: string }>;
  importFromHttp: (url: string, onProgress?: (progress: ImportProgress) => void) => Promise<{ success: boolean; result?: PluginPackage; error?: string }>;
  importFromZip: (zipPath: string) => Promise<{ success: boolean; result?: PluginPackage; error?: string }>;
  
  // Template service
  templateService: {
    createTemplate: (request: CreateTemplateRequest) => Promise<ConfigTemplate>;
    updateTemplate: (id: string, updates: UpdateTemplateRequest) => Promise<ConfigTemplate>;
    deleteTemplate: (id: string) => Promise<void>;
    getAllTemplates: () => Promise<ConfigTemplate[]>;
    getTemplate: (id: string) => Promise<ConfigTemplate | null>;
    addCapabilityToTemplate: (templateId: string, capabilityId: string) => Promise<ConfigTemplate>;
    removeCapabilityFromTemplate: (templateId: string, capabilityId: string) => Promise<ConfigTemplate>;
    addCapabilitiesToTemplate: (templateId: string, capabilityIds: string[]) => Promise<ConfigTemplate>;
    getTemplateStats: (templateId: string) => Promise<TemplateStats>;
    getTemplateCapabilities: (templateId: string) => Promise<Capability[]>;
    exportTemplate: (templateId: string) => Promise<TemplateExportData>;
    exportTemplateToFile: (templateId: string, filePath: string) => Promise<void>;
    importTemplate: (data: TemplateExportData, options?: { overwriteExisting?: boolean; importCapabilities?: boolean }) => Promise<TemplateImportResult>;
    importTemplateFromFile: (filePath: string, options?: { overwriteExisting?: boolean; importCapabilities?: boolean }) => Promise<TemplateImportResult>;
  };

  // Project service
  projectService: {
    add: (projectPath: string, name?: string) => Promise<Project>;
    selectDirectory: () => Promise<string | null>;
    getAll: () => Promise<Project[]>;
    getVisible: () => Promise<Project[]>;
    update: (id: string, updates: Partial<Project>) => Promise<void>;
    hide: (id: string) => Promise<void>;
    show: (id: string) => Promise<void>;
    delete: (id: string) => Promise<void>;
    scanConfig: (projectPath: string) => Promise<ProjectConfig>;
    getBackups: (projectPath: string) => Promise<BackupInfo[]>;
    openFolder: (projectPath: string) => Promise<void>;
    rollback: (projectPath: string, backupId: string) => Promise<void>;
  };

  // Cache service
  cacheService: {
    getPluginStats: () => Promise<{ entries: number; totalSizeBytes: number; hitRate: number }>;
    getTranslationStats: () => Promise<{ entries: number; sizeBytes: number; hitRate: number }>;
    clearUnusedPlugin: () => Promise<{ deletedEntries: number; freedBytes: number }>;
    clearAllPlugin: () => Promise<{ deletedEntries: number; freedBytes: number }>;
    clearTranslation: () => Promise<{ deletedEntries: number }>;
    getAllPluginEntries: () => Promise<any[]>;
    getAllTranslationEntries: () => Promise<any[]>;
  };

  // Settings service
  settingsService: {
    get: () => Promise<AppSettings>;
    save: (settings: AppSettings) => Promise<void>;
    reset: () => Promise<AppSettings>;
    export: (filePath: string, settings?: AppSettings) => Promise<void>;
    import: (filePath: string) => Promise<AppSettings>;
    getSetting: (key: keyof AppSettings) => Promise<any>;
    updateSetting: (key: keyof AppSettings, value: any) => Promise<void>;
    getDataDirectory: () => Promise<string>;
    getCacheDirectory: () => Promise<string>;
    getTranslationSettings: () => Promise<any>;
    isTranslationConfigured: () => Promise<boolean>;
  };
  
  // IPC communication
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),
  
  dialog: {
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  },
  
  parseMarketplace: (address) => ipcRenderer.invoke('import:parseMarketplace', address),
  downloadPlugin: (plugin, onProgress) => {
    if (onProgress) {
      // 设置进度监听器
      const progressHandler = (event: any, pluginName: string, progress: ImportProgress) => {
        if (pluginName === plugin.name) {
          onProgress(progress);
        }
      };
      ipcRenderer.on('import:downloadProgress', progressHandler);
      
      // 调用下载，传递 true 表示需要进度回调
      return ipcRenderer.invoke('import:downloadPlugin', plugin, true).finally(() => {
        ipcRenderer.removeListener('import:downloadProgress', progressHandler);
      });
    } else {
      return ipcRenderer.invoke('import:downloadPlugin', plugin, false);
    }
  },
  importFromLocal: (dirPath) => ipcRenderer.invoke('import:fromLocal', dirPath),
  importFromHttp: (url, onProgress) => {
    if (onProgress) {
      const progressHandler = (event: any, requestUrl: string, progress: ImportProgress) => {
        if (requestUrl === url) {
          onProgress(progress);
        }
      };
      ipcRenderer.on('import:httpProgress', progressHandler);
      
      return ipcRenderer.invoke('import:fromHttp', url, true).finally(() => {
        ipcRenderer.removeListener('import:httpProgress', progressHandler);
      });
    } else {
      return ipcRenderer.invoke('import:fromHttp', url, false);
    }
  },
  importFromZip: (zipPath) => ipcRenderer.invoke('import:fromZip', zipPath),
  
  templateService: {
    createTemplate: (request) => ipcRenderer.invoke('template:create', request),
    updateTemplate: (id, updates) => ipcRenderer.invoke('template:update', id, updates),
    deleteTemplate: (id) => ipcRenderer.invoke('template:delete', id),
    getAllTemplates: () => ipcRenderer.invoke('template:getAll'),
    getTemplate: (id) => ipcRenderer.invoke('template:getById', id),
    addCapabilityToTemplate: (templateId, capabilityId) => 
      ipcRenderer.invoke('template:addCapability', templateId, capabilityId),
    removeCapabilityFromTemplate: (templateId, capabilityId) => 
      ipcRenderer.invoke('template:removeCapability', templateId, capabilityId),
    addCapabilitiesToTemplate: (templateId, capabilityIds) => 
      ipcRenderer.invoke('template:addCapabilities', templateId, capabilityIds),
    getTemplateStats: (templateId) => ipcRenderer.invoke('template:getStats', templateId),
    getTemplateCapabilities: (templateId) => ipcRenderer.invoke('template:getCapabilities', templateId),
    exportTemplate: (templateId) => ipcRenderer.invoke('template:export', templateId),
    exportTemplateToFile: (templateId, filePath) => ipcRenderer.invoke('template:exportToFile', templateId, filePath),
    importTemplate: (data, options) => ipcRenderer.invoke('template:import', data, options),
    importTemplateFromFile: (filePath, options) => ipcRenderer.invoke('template:importFromFile', filePath, options),
  },

  projectService: {
    add: (projectPath, name) => ipcRenderer.invoke('project:add', projectPath, name),
    selectDirectory: () => ipcRenderer.invoke('project:selectDirectory'),
    getAll: () => ipcRenderer.invoke('project:getAll'),
    getVisible: () => ipcRenderer.invoke('project:getVisible'),
    update: (id, updates) => ipcRenderer.invoke('project:update', id, updates),
    hide: (id) => ipcRenderer.invoke('project:hide', id),
    show: (id) => ipcRenderer.invoke('project:show', id),
    delete: (id) => ipcRenderer.invoke('project:delete', id),
    scanConfig: (projectPath) => ipcRenderer.invoke('project:scanConfig', projectPath),
    getBackups: (projectPath) => ipcRenderer.invoke('project:getBackups', projectPath),
    openFolder: (projectPath) => ipcRenderer.invoke('project:openFolder', projectPath),
    rollback: (projectPath, backupId) => ipcRenderer.invoke('project:rollback', projectPath, backupId),
  },

  cacheService: {
    getPluginStats: () => ipcRenderer.invoke('cache:getPluginStats'),
    getTranslationStats: () => ipcRenderer.invoke('cache:getTranslationStats'),
    clearUnusedPlugin: () => ipcRenderer.invoke('cache:clearUnusedPlugin'),
    clearAllPlugin: () => ipcRenderer.invoke('cache:clearAllPlugin'),
    clearTranslation: () => ipcRenderer.invoke('cache:clearTranslation'),
    getAllPluginEntries: () => ipcRenderer.invoke('cache:getAllPluginEntries'),
    getAllTranslationEntries: () => ipcRenderer.invoke('cache:getAllTranslationEntries'),
  },

  settingsService: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    reset: () => ipcRenderer.invoke('settings:reset'),
    export: (filePath, settings) => ipcRenderer.invoke('settings:export', filePath, settings),
    import: (filePath) => ipcRenderer.invoke('settings:import', filePath),
    getSetting: (key) => ipcRenderer.invoke('settings:getSetting', key),
    updateSetting: (key, value) => ipcRenderer.invoke('settings:updateSetting', key, value),
    getDataDirectory: () => ipcRenderer.invoke('settings:getDataDirectory'),
    getCacheDirectory: () => ipcRenderer.invoke('settings:getCacheDirectory'),
    getTranslationSettings: () => ipcRenderer.invoke('settings:getTranslationSettings'),
    isTranslationConfigured: () => ipcRenderer.invoke('settings:isTranslationConfigured'),
  },
  
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}