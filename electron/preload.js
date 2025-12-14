"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 数据管理
    getData: () => electron_1.ipcRenderer.invoke('app:getData'),
    setData: (data) => electron_1.ipcRenderer.invoke('app:setData', data),
    // 文件/文件夹选择
    selectFolder: () => electron_1.ipcRenderer.invoke('project:selectFolder'),
    // Marketplace 管理
    getMarketplaces: () => electron_1.ipcRenderer.invoke('claude:getMarketplaces'),
    addMarketplace: (repo) => electron_1.ipcRenderer.invoke('claude:addMarketplace', repo),
    updateMarketplace: (name) => electron_1.ipcRenderer.invoke('claude:updateMarketplace', name),
    // 插件管理
    scanMarket: () => electron_1.ipcRenderer.invoke('market:scan'),
    installPlugin: (pluginId, marketplace, scope, projectPath) => electron_1.ipcRenderer.invoke('claude:installPlugin', pluginId, marketplace, scope, projectPath),
    getInstalledPlugins: (scope) => electron_1.ipcRenderer.invoke('claude:getInstalledPlugins', scope),
    getPluginInfo: (pluginId) => electron_1.ipcRenderer.invoke('claude:getPluginInfo', pluginId),
    getPluginLibrary: () => electron_1.ipcRenderer.invoke('plugin:getLibrary'),
    // 项目管理
    inspectProject: (projectPath) => electron_1.ipcRenderer.invoke('project:inspect', projectPath),
    scanProjects: () => electron_1.ipcRenderer.invoke('project:scan'),
    getProjectDetails: (projectPath) => electron_1.ipcRenderer.invoke('project:getDetails', projectPath),
    getProjectPlugins: (projectPath) => electron_1.ipcRenderer.invoke('project:getPlugins', projectPath),
    enableProjectPlugin: (projectPath, pluginId) => electron_1.ipcRenderer.invoke('project:enablePlugin', projectPath, pluginId),
    disableProjectPlugin: (projectPath, pluginId) => electron_1.ipcRenderer.invoke('project:disablePlugin', projectPath, pluginId),
    hideProject: (projectId) => electron_1.ipcRenderer.invoke('project:hide', projectId),
    unhideProject: (projectId) => electron_1.ipcRenderer.invoke('project:unhide', projectId),
    openProjectFolder: (projectPath) => electron_1.ipcRenderer.invoke('project:openFolder', projectPath),
    // 场景管理
    listScenes: () => electron_1.ipcRenderer.invoke('scenes:list'),
    saveScene: (scene) => electron_1.ipcRenderer.invoke('scenes:save', scene),
    deleteScene: (sceneId) => electron_1.ipcRenderer.invoke('scenes:delete', sceneId),
    applyScene: (sceneId, targetPath, strategy) => electron_1.ipcRenderer.invoke('scenes:apply', sceneId, targetPath, strategy),
    // 编辑器
    openInEditor: (filePath) => electron_1.ipcRenderer.invoke('editor:open', filePath)
});
