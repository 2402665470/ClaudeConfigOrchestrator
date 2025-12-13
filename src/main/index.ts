import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { AppData, Project, Plugin } from '@common/types';
import { installPlugin } from './merge';

const DATA_PATH = path.join(app.getPath('userData'), 'data.json');

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
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
    const initial: AppData = { marketPath: '', projects: [] };
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
          id: meta.id ?? dirent.name,
          name: meta.name ?? dirent.name,
          version: meta.version,
          description: meta.description,
          tags: meta.tags ?? [],
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

/* -------------------- 插件安装 -------------------- */

ipcMain.handle('plugin:install', async (_, plugin: Plugin, projectPath: string, options?: { forceOverwrite?: boolean; skipConflicts?: boolean }) => {
  const result = await installPlugin(plugin, projectPath, options);
  return result;
});