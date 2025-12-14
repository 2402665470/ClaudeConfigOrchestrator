import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { AppData, Project, Plugin } from '@common/types';
import { claudeCli } from './claudeCli';
import { ConfigReaderService } from './services/ConfigReaderService';
import { ProjectScannerService } from './services/ProjectScannerService';
import { PluginLibraryService } from './services/PluginLibraryService';
import { ClaudeProjectScanner } from './services/ClaudeProjectScanner';
import { descriptionManager } from './services/DescriptionManager';

const DATA_PATH = path.join(app.getPath('userData'), 'data.json');

let win: BrowserWindow | null = null;

// 初始化服务
const configReader = new ConfigReaderService();
const projectScanner = new ProjectScannerService();
const pluginLibrary = new PluginLibraryService();
const claudeProjectScanner = new ClaudeProjectScanner();

function createWindow() {
  // 调试：确认运行时路径
  console.log('[Main] __dirname:', __dirname);
  console.log('[Main] preload path:', path.join(__dirname, '../preload.js'));

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
    // 调试：检查 preload 是否加载
    win.webContents.once('did-finish-load', () => {
      console.log('[Main] Window finished loading');
      win?.webContents?.executeJavaScript('console.log("Window global object:", Object.keys(window))');
      win?.webContents?.executeJavaScript('console.log("electronAPI:", window.electronAPI)');
    });
  } else {
    win.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* -------------------- 数据层 -------------------- */

async function ensureDataFile(): Promise<void> {
  if (!(await fs.pathExists(DATA_PATH))) {
    const initial: AppData = { marketPath: '', projects: [], hiddenProjects: [] };
    await fs.writeJSON(DATA_PATH, initial, { spaces: 2 });
  }
}

ipcMain.handle('app:getData', async () => {
  await ensureDataFile();
  return fs.readJSON(DATA_PATH) as Promise<AppData>;
});

ipcMain.handle('app:setData', async (_, data: AppData) => {
  await fs.writeJSON(DATA_PATH, data, { spaces: 2 });
  return true;
});

/* -------------------- 项目操作 -------------------- */

ipcMain.handle('project:selectFolder', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('project:inspect', async (_, projectPath: string) => {
  const claudeJsonPath = path.join(projectPath, 'claude.json');
  if (await fs.pathExists(claudeJsonPath)) {
    return fs.readJSON(claudeJsonPath);
  }
  return null;
});

/* -------------------- 市场扫描 -------------------- */
// 旧的本地市场扫描，已被 Claude CLI 集成替代
/*
ipcMain.handle('market:scan', async (_, marketPath: string) => {
  if (!(await fs.pathExists(marketPath))) return [];
  const items = await fs.readdir(marketPath, { withFileTypes: true });
  const plugins: Plugin[] = [];
  for (const dirent of items) {
    if (!dirent.isDirectory()) continue;
    const pluginRoot = path.join(marketPath, dirent.name);
    const metaPath = path.join(pluginRoot, 'plugin.json');
    const readmePath = path.join(pluginRoot, 'README.md');
    const iconPath = path.join(pluginRoot, 'icon.png');
    try {
      const meta = await fs.readJSON(metaPath);
      plugins.push({
        meta: {
          id: (meta as any).id ?? dirent.name,
          name: (meta as any).name ?? dirent.name,
          version: (meta as any).version,
          description: (meta as any).description,
          tags: (meta as any).tags ?? [],
          readmePath: (await fs.pathExists(readmePath)) ? readmePath : undefined,
          iconPath: (await fs.pathExists(iconPath)) ? iconPath : undefined
        },
        capabilities: meta.capabilities ?? {},
        rootPath: pluginRoot
      });
    } catch {
      // 忽略解析失败的目录
    }
  }
  return plugins;
});
*/

/* -------------------- Claude CLI 集成 -------------------- */

// 获取所有已配置的 marketplaces
ipcMain.handle('claude:getMarketplaces', async () => {
  try {
    return await claudeCli.getMarketplaces();
  } catch (error: any) {
    console.error('Failed to get marketplaces:', error);
    return [];
  }
});

// 添加新的 marketplace
ipcMain.handle('claude:addMarketplace', async (_, repo: string) => {
  try {
    await claudeCli.addMarketplace(repo);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to add marketplace:', error);
    return { success: false, error: error.message };
  }
});

// 更新 marketplace
ipcMain.handle('claude:updateMarketplace', async (_, marketplaceName?: string) => {
  try {
    await claudeCli.updateMarketplace(marketplaceName);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update marketplace:', error);
    return { success: false, error: error.message };
  }
});

// 获取所有 marketplace 中的插件列表（包括安装状态）
ipcMain.handle('market:scan', async () => {
  try {
    // 获取所有 marketplaces
    const marketplaces = await configReader.getMarketplaces();

    // 获取已安装的插件列表
    const installedPlugins = await configReader.getInstalledPlugins();
    const installedMap = new Map(installedPlugins.map(p => [p.id, p]));

    // 获取所有 marketplace 中的插件
    const allPlugins: Plugin[] = [];

    console.log('[Market Scan] Installed plugins:', installedPlugins.map(p => ({ id: p.id, version: p.version })));

    for (const marketplace of marketplaces) {
      const plugins = await configReader.getMarketplacePlugins(marketplace.name);

      // 为每个插件添加安装状态
      for (const plugin of plugins) {
        const installed = installedMap.get(plugin.meta.id);
        console.log(`[Market Scan] Plugin ${plugin.meta.id}, installed:`, !!installed);

        if (installed) {
          // 如果已安装，获取详细信息
          const pluginInfo = await configReader.getPluginInfo(plugin.meta.id);
          allPlugins.push({
            ...plugin,
            capabilities: pluginInfo?.capabilities || {},
            rootPath: pluginInfo?.installPath || plugin.rootPath,
            meta: {
              ...plugin.meta,
              version: installed.version
            },
            installed: true
          } as Plugin & { installed?: boolean });
        } else {
          allPlugins.push({
            ...plugin,
            installed: false
          });
        }
      }
    }

    return allPlugins;
  } catch (error: any) {
    console.error('Failed to scan plugins:', error);
    return [];
  }
});

// 使用 Claude CLI 安装插件
ipcMain.handle('claude:installPlugin', async (_, pluginId: string, marketplace: string, scope: 'user' | 'project' | 'local', projectPath?: string) => {
  try {
    await claudeCli.installPlugin(pluginId, marketplace, scope, projectPath);

    // 如果是项目级安装，需要在项目中启用插件
    if (scope === 'project' && projectPath) {
      const fullPluginId = `${pluginId}@${marketplace}`;
      await configReader.enablePluginInProject(projectPath, fullPluginId);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to install plugin:', error);
    return { success: false, error: error.message };
  }
});

// 使用 Claude CLI 卸载插件
ipcMain.handle('claude:uninstallPlugin', async (_, pluginId: string, scope: 'user' | 'project' | 'local' = 'user', projectPath?: string) => {
  try {
    await claudeCli.uninstallPlugin(pluginId, scope, projectPath);

    // 如果是项目级卸载，需要从项目设置中移除插件
    if (scope === 'project' && projectPath) {
      await configReader.disablePluginInProject(projectPath, pluginId);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to uninstall plugin:', error);
    return { success: false, error: error.message };
  }
});

// 获取已安装的插件
ipcMain.handle('claude:getInstalledPlugins', async (_, scope?: 'user' | 'project' | 'local') => {
  try {
    return await configReader.getInstalledPlugins(scope);
  } catch (error: any) {
    console.error('Failed to get installed plugins:', error);
    return [];
  }
});

// 获取插件信息（包括未安装插件的预览）
ipcMain.handle('claude:getPluginInfo', async (_, pluginId: string) => {
  try {
    const pluginInfo = await configReader.getPluginInfo(pluginId);
    return pluginInfo;
  } catch (error: any) {
    console.error('Failed to get plugin info:', error);
    return null;
  }
});

// 获取插件库信息（包含详细能力描述）
ipcMain.handle('plugin:getLibrary', async () => {
  try {
    const library = await pluginLibrary.getPluginLibrary();
    return library;
  } catch (error: any) {
    console.error('Failed to get plugin library:', error);
    throw error;
  }
});

/* -------------------- 项目管理 -------------------- */

// 扫描项目 - 使用新的 Claude 项目扫描器
ipcMain.handle('project:scan', async () => {
  try {
    // 获取现有项目
    const data = await fs.readJson(DATA_PATH).catch(() => ({ marketPath: '', projects: [], hiddenProjects: [] }));

    // 确保数组存在
    const projects = data.projects || [];
    const hiddenProjects = data.hiddenProjects || [];

    // 使用新的扫描器
    const result = await claudeProjectScanner.scanProjects([...projects, ...hiddenProjects]);

    return result;
  } catch (error: any) {
    console.error('Failed to scan Claude projects:', error);
    throw error;
  }
});

// 获取项目详情
ipcMain.handle('project:getDetails', async (_, projectPath: string) => {
  try {
    const project = await projectScanner.analyzeProject(projectPath);
    return project;
  } catch (error: any) {
    console.error('Failed to get project details:', error);
    return null;
  }
});

// 获取项目插件
ipcMain.handle('project:getPlugins', async (_, projectPath: string) => {
  try {
    const plugins = await configReader.getProjectPlugins(projectPath);
    return plugins;
  } catch (error: any) {
    console.error('Failed to get project plugins:', error);
    return [];
  }
});

// 启用项目插件
ipcMain.handle('project:enablePlugin', async (_, projectPath: string, pluginId: string) => {
  try {
    await configReader.enablePluginInProject(projectPath, pluginId);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to enable plugin:', error);
    return { success: false, error: error.message };
  }
});

// 禁用项目插件
ipcMain.handle('project:disablePlugin', async (_, projectPath: string, pluginId: string) => {
  try {
    await configReader.disablePluginInProject(projectPath, pluginId);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to disable plugin:', error);
    return { success: false, error: error.message };
  }
});

// 隐藏项目
ipcMain.handle('project:hide', async (_, projectId: string) => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'data.json');
    let data: AppData = { marketPath: '', projects: [], hiddenProjects: [] };

    if (await fs.pathExists(dataPath)) {
      data = await fs.readJSON(dataPath);
    }

    // 确保数组存在
    data.projects = data.projects || [];
    data.hiddenProjects = data.hiddenProjects || [];

    // 找到要隐藏的项目
    const projectIndex = data.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      const project = data.projects[projectIndex];
      // 移动到隐藏列表
      data.projects.splice(projectIndex, 1);
      data.hiddenProjects.push(project);

      // 保存
      await fs.writeJSON(dataPath, data);
      return { success: true };
    } else {
      return { success: false, error: 'Project not found' };
    }
  } catch (error: any) {
    console.error('Failed to hide project:', error);
    return { success: false, error: error.message };
  }
});

// 显示项目（从隐藏列表恢复）
ipcMain.handle('project:unhide', async (_, projectId: string) => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'data.json');
    let data: AppData = { marketPath: '', projects: [], hiddenProjects: [] };

    if (await fs.pathExists(dataPath)) {
      data = await fs.readJSON(dataPath);
    }

    // 确保数组存在
    data.projects = data.projects || [];
    data.hiddenProjects = data.hiddenProjects || [];

    // 找到要显示的项目
    const projectIndex = data.hiddenProjects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      const project = data.hiddenProjects[projectIndex];
      // 移动回显示列表
      data.hiddenProjects.splice(projectIndex, 1);
      data.projects.push(project);

      // 保存
      await fs.writeJSON(dataPath, data);
      return { success: true };
    } else {
      return { success: false, error: 'Project not found in hidden list' };
    }
  } catch (error: any) {
    console.error('Failed to unhide project:', error);
    return { success: false, error: error.message };
  }
});

// 打开项目文件夹
ipcMain.handle('project:openFolder', async (_, projectPath: string) => {
  try {
    const { shell } = await import('electron');
    await shell.openPath(projectPath);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to open folder:', error);
    return { success: false, error: error.message };
  }
});

/* -------------------- 场景管理 -------------------- */

// 获取所有场景
ipcMain.handle('scenes:list', async () => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'data.json');
    if (await fs.pathExists(dataPath)) {
      const data = await fs.readJSON(dataPath);
      return data.scenes || [];
    }
    return [];
  } catch (error: any) {
    console.error('Failed to get scenes:', error);
    return [];
  }
});

// 保存场景
ipcMain.handle('scenes:save', async (_, scene: any) => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'data.json');
    let data = { scenes: [] };

    if (await fs.pathExists(dataPath)) {
      data = await fs.readJSON(dataPath);
    }

    if (!data.scenes) {
      data.scenes = [];
    }

    const existingIndex = data.scenes.findIndex((s: any) => s.id === scene.id);
    if (existingIndex >= 0) {
      data.scenes[existingIndex] = scene;
    } else {
      data.scenes.push(scene);
    }

    await fs.writeJSON(dataPath, data, { spaces: 2 });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save scene:', error);
    return { success: false, error: error.message };
  }
});

// 删除场景
ipcMain.handle('scenes:delete', async (_, sceneId: string) => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'data.json');
    if (await fs.pathExists(dataPath)) {
      const data = await fs.readJSON(dataPath);
      if (data.scenes) {
        data.scenes = data.scenes.filter((s: any) => s.id !== sceneId);
        await fs.writeJSON(dataPath, data, { spaces: 2 });
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete scene:', error);
    return { success: false, error: error.message };
  }
});

/* -------------------- 自定义描述管理 -------------------- */

// 获取插件自定义描述
ipcMain.handle('custom:getPluginDescription', async (_, pluginId: string) => {
  try {
    const description = await descriptionManager.getPluginDescription(pluginId);
    return description;
  } catch (error: any) {
    console.error('Failed to get plugin description:', error);
    return null;
  }
});

// 设置插件自定义描述
ipcMain.handle('custom:setPluginDescription', async (_, pluginId: string, description: string) => {
  try {
    await descriptionManager.setPluginDescription(pluginId, description);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to set plugin description:', error);
    return { success: false, error: error.message };
  }
});

// 获取能力自定义描述
ipcMain.handle('custom:getCapabilityDescription', async (_, capabilityId: string) => {
  try {
    const description = await descriptionManager.getCapabilityDescription(capabilityId);
    return description;
  } catch (error: any) {
    console.error('Failed to get capability description:', error);
    return null;
  }
});

// 设置能力自定义描述
ipcMain.handle('custom:setCapabilityDescription', async (_, capabilityId: string, description: string) => {
  try {
    await descriptionManager.setCapabilityDescription(capabilityId, description);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to set capability description:', error);
    return { success: false, error: error.message };
  }
});

// 批量获取描述
ipcMain.handle('custom:getBatchDescriptions', async (_, ids: string[], type: 'plugin' | 'capability') => {
  try {
    const descriptions = await descriptionManager.getBatchDescriptions(ids, type);
    return descriptions;
  } catch (error: any) {
    console.error('Failed to get batch descriptions:', error);
    return {};
  }
});

// 删除插件自定义描述
ipcMain.handle('custom:deletePluginDescription', async (_, pluginId: string) => {
  try {
    await descriptionManager.deletePluginDescription(pluginId);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete plugin description:', error);
    return { success: false, error: error.message };
  }
});

// 删除能力自定义描述
ipcMain.handle('custom:deleteCapabilityDescription', async (_, capabilityId: string) => {
  try {
    await descriptionManager.deleteCapabilityDescription(capabilityId);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete capability description:', error);
    return { success: false, error: error.message };
  }
});