import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { isDev } from './utils/env';
import { databaseManager } from './services/database';
import { registerTemplateHandlers } from './ipc/templateHandlers';
import { registerDialogHandlers } from './ipc/dialogHandlers';
import { initializeProjectHandlers } from './ipc/projectHandlers';
import { initializeCacheHandlers } from './ipc/cacheHandlers';
import { initializeSettingsHandlers } from './ipc/settingsHandlers';
import { StorageService } from './services/StorageService';
import { InjectionService } from './services/InjectionService';
import { setStorageService } from './ipc/importHandlers';
import './ipc/importHandlers';

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    titleBarStyle: 'default',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // 先注册不需要数据库的对话框处理器
  registerDialogHandlers();

  // 尝试初始化数据库
  let storageService: StorageService | null = null;
  let injectionService: InjectionService | null = null;

  try {
    await databaseManager.initialize();
    console.log('数据库初始化完成');

    // 创建服务实例
    storageService = new StorageService(databaseManager);

    // 设置导入服务的存储服务
    setStorageService(storageService);

    // 创建注入服务实例
    const backupsDir = path.join(os.homedir(), '.claude-orchestrator', 'backups');
    injectionService = new InjectionService(backupsDir, storageService);

    // 注册所有处理器（依赖数据库的服务）
    registerTemplateHandlers();
    initializeProjectHandlers(storageService, injectionService);
    initializeCacheHandlers(storageService);
    initializeSettingsHandlers();
  } catch (error) {
    console.warn('⚠️ 数据库初始化失败，使用模拟数据模式:', error instanceof Error ? error.message : error);

    // 即使数据库失败，也注册所有处理器（使用模拟数据）
    storageService = new StorageService(databaseManager);

    // 设置导入服务的存储服务
    setStorageService(storageService);

    // 创建一个简单的注入服务实例（即使数据库不可用）
    const backupsDir = path.join(os.homedir(), '.claude-orchestrator', 'backups');
    injectionService = new InjectionService(backupsDir, storageService);

    registerTemplateHandlers();
    initializeProjectHandlers(storageService, injectionService);
    initializeCacheHandlers(storageService);
    initializeSettingsHandlers();
  }

  console.log('IPC 处理程序注册完成');

  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 关闭数据库连接
    databaseManager.close();
    app.quit();
  }
});

// 应用退出前清理资源
app.on('before-quit', () => {
  databaseManager.close();
});