import { contextBridge, ipcRenderer } from 'electron';
import { AppData, Plugin, InstallationResult } from '@common/types';

export interface ElectronAPI {
  getData(): Promise<AppData>;
  setData(data: AppData): Promise<boolean>;
  selectFolder(): Promise<string | null>;
  inspectProject(projectPath: string): Promise<any>;
  scanMarket(marketPath: string): Promise<Plugin[]>;
  installPlugin(plugin: Plugin, projectPath: string, options?: { forceOverwrite?: boolean; skipConflicts?: boolean }): Promise<InstallationResult>;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getData: () => ipcRenderer.invoke('app:getData'),
  setData: (data: AppData) => ipcRenderer.invoke('app:setData', data),
  selectFolder: () => ipcRenderer.invoke('project:selectFolder'),
  inspectProject: (projectPath: string) => ipcRenderer.invoke('project:inspect', projectPath),
  scanMarket: (marketPath: string) => ipcRenderer.invoke('market:scan', marketPath),
  installPlugin: (plugin: Plugin, projectPath: string, options?: { forceOverwrite?: boolean; skipConflicts?: boolean }) => 
    ipcRenderer.invoke('plugin:install', plugin, projectPath, options)
} as ElectronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}