import { contextBridge, ipcRenderer } from 'electron';
import { AppData, Plugin } from '@common/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // 数据管理
  getData: () => ipcRenderer.invoke('app:getData'),
  setData: (data: AppData) => ipcRenderer.invoke('app:setData', data),

  // 文件/文件夹选择
  selectFolder: () => ipcRenderer.invoke('project:selectFolder'),

  // Marketplace 管理
  getMarketplaces: () => ipcRenderer.invoke('claude:getMarketplaces'),
  addMarketplace: (repo: string) => ipcRenderer.invoke('claude:addMarketplace', repo),
  updateMarketplace: (name?: string) => ipcRenderer.invoke('claude:updateMarketplace', name),

  // 插件管理
  scanMarket: () => ipcRenderer.invoke('market:scan'),
  installPlugin: (pluginId: string, marketplace: string, scope: 'user' | 'project' | 'local', projectPath?: string) =>
    ipcRenderer.invoke('claude:installPlugin', pluginId, marketplace, scope, projectPath),
  getInstalledPlugins: (scope?: 'user' | 'project' | 'local') =>
    ipcRenderer.invoke('claude:getInstalledPlugins', scope),
  getPluginInfo: (pluginId: string) =>
    ipcRenderer.invoke('claude:getPluginInfo', pluginId),
  getPluginLibrary: () => ipcRenderer.invoke('plugin:getLibrary'),

  // 项目管理
  inspectProject: (projectPath: string) => ipcRenderer.invoke('project:inspect', projectPath),
  scanProjects: () => ipcRenderer.invoke('project:scan'),
  getProjectDetails: (projectPath: string) => ipcRenderer.invoke('project:getDetails', projectPath),
  getProjectPlugins: (projectPath: string) => ipcRenderer.invoke('project:getPlugins', projectPath),
  enableProjectPlugin: (projectPath: string, pluginId: string) => ipcRenderer.invoke('project:enablePlugin', projectPath, pluginId),
  disableProjectPlugin: (projectPath: string, pluginId: string) => ipcRenderer.invoke('project:disablePlugin', projectPath, pluginId),
  hideProject: (projectId: string) => ipcRenderer.invoke('project:hide', projectId),
  unhideProject: (projectId: string) => ipcRenderer.invoke('project:unhide', projectId),
  openProjectFolder: (projectPath: string) => ipcRenderer.invoke('project:openFolder', projectPath),

  // 场景管理
  listScenes: () => ipcRenderer.invoke('scenes:list'),
  saveScene: (scene: { id?: string; name: string; plugins: string[] }) => ipcRenderer.invoke('scenes:save', scene),
  deleteScene: (sceneId: string) => ipcRenderer.invoke('scenes:delete', sceneId),
  applyScene: (sceneId: string, targetPath: string, strategy: 'overwrite' | 'skip') =>
    ipcRenderer.invoke('scenes:apply', sceneId, targetPath, strategy),

  // 编辑器
  openInEditor: (filePath: string) => ipcRenderer.invoke('editor:open', filePath),

  // 自定义描述管理
  getPluginDescription: (pluginId: string) => ipcRenderer.invoke('custom:getPluginDescription', pluginId),
  setPluginDescription: (pluginId: string, description: string) =>
    ipcRenderer.invoke('custom:setPluginDescription', pluginId, description),
  getCapabilityDescription: (capabilityId: string) => ipcRenderer.invoke('custom:getCapabilityDescription', capabilityId),
  setCapabilityDescription: (capabilityId: string, description: string) =>
    ipcRenderer.invoke('custom:setCapabilityDescription', capabilityId, description),
  getBatchDescriptions: (ids: string[], type: 'plugin' | 'capability') =>
    ipcRenderer.invoke('custom:getBatchDescriptions', ids, type),
  deletePluginDescription: (pluginId: string) => ipcRenderer.invoke('custom:deletePluginDescription', pluginId),
  deleteCapabilityDescription: (capabilityId: string) => ipcRenderer.invoke('custom:deleteCapabilityDescription', capabilityId)
});

declare global {
  interface Window {
    electronAPI: {
      // 数据管理
      getData(): Promise<AppData>;
      setData(data: AppData): Promise<boolean>;

      // 文件/文件夹选择
      selectFolder(): Promise<string | null>;

      // Marketplace 管理
      getMarketplaces(): Promise<any[]>;
      addMarketplace(repo: string): Promise<{ success: boolean; error?: string }>;
      updateMarketplace(name?: string): Promise<{ success: boolean; error?: string }>;

      // 插件管理
      scanMarket(): Promise<Plugin[]>;
      installPlugin(pluginId: string, marketplace: string, scope: 'user' | 'project' | 'local', projectPath?: string): Promise<{ success: boolean; error?: string }>;
      getInstalledPlugins(scope?: 'user' | 'project' | 'local'): Promise<any[]>;
      getPluginInfo(pluginId: string): Promise<any>;
      getPluginLibrary(): Promise<any>;

      // 项目管理
      inspectProject(projectPath: string): Promise<any>;
      scanProjects(): Promise<any>;
      getProjectDetails(projectPath: string): Promise<any>;
      getProjectPlugins(projectPath: string): Promise<string[]>;
      enableProjectPlugin(projectPath: string, pluginId: string): Promise<{ success: boolean; error?: string }>;
      disableProjectPlugin(projectPath: string, pluginId: string): Promise<{ success: boolean; error?: string }>;
      hideProject(projectId: string): Promise<{ success: boolean; error?: string }>;
      unhideProject(projectId: string): Promise<{ success: boolean; error?: string }>;
      openProjectFolder(projectPath: string): Promise<{ success: boolean; error?: string }>;

      // 场景管理
      listScenes(): Promise<Array<{ id: string; name: string; plugins: string[] }>>;
      saveScene(scene: { id?: string; name: string; plugins: string[] }): Promise<{ id: string; name: string; plugins: string[] }>;
      deleteScene(sceneId: string): Promise<{ success: boolean; error?: string }>;
      applyScene(sceneId: string, targetPath: string, strategy: 'overwrite' | 'skip'): Promise<boolean>;

      // 编辑器
      openInEditor(filePath: string): Promise<boolean>;

      // 自定义描述管理
      getPluginDescription(pluginId: string): Promise<string | null>;
      setPluginDescription(pluginId: string, description: string): Promise<{ success: boolean; error?: string }>;
      getCapabilityDescription(capabilityId: string): Promise<string | null>;
      setCapabilityDescription(capabilityId: string, description: string): Promise<{ success: boolean; error?: string }>;
      getBatchDescriptions(ids: string[], type: 'plugin' | 'capability'): Promise<Record<string, string | null>>;
      deletePluginDescription(pluginId: string): Promise<{ success: boolean; error?: string }>;
      deleteCapabilityDescription(capabilityId: string): Promise<{ success: boolean; error?: string }>;
    };
  }
}