import { ipcMain } from 'electron';
import { ImportService, PluginInfo, ImportProgress, ProgressCallback } from '../services/ImportService';
import { StorageService } from '../services/StorageService';

let importService = new ImportService();
let storageService: StorageService | null = null;

/**
 * 设置存储服务（需要在数据库初始化后调用）
 */
export function setStorageService(service: StorageService): void {
  storageService = service;
  importService.setStorageService(service);
}

// 解析市场地址
ipcMain.handle('import:parseMarketplace', async (event, address: string) => {
  try {
    const plugins = await importService.parseMarketplace(address);
    return { success: true, plugins };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '解析失败' 
    };
  }
});

// 下载插件
ipcMain.handle('import:downloadPlugin', async (event, plugin: PluginInfo, progressCallback?: boolean) => {
  try {
    let onProgress: ProgressCallback | undefined;
    
    if (progressCallback) {
      onProgress = (progress: ImportProgress) => {
        event.sender.send('import:downloadProgress', plugin.name, progress);
      };
    }

    const result = await importService.downloadPlugin(plugin, onProgress);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '下载失败' 
    };
  }
});

// 从本地目录导入
ipcMain.handle('import:fromLocal', async (event, dirPath: string) => {
  try {
    const result = await importService.importFromLocal(dirPath);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '导入失败' 
    };
  }
});

// 从 HTTP 链接导入
ipcMain.handle('import:fromHttp', async (event, url: string, progressCallback?: boolean) => {
  try {
    let onProgress: ProgressCallback | undefined;
    
    if (progressCallback) {
      onProgress = (progress: ImportProgress) => {
        event.sender.send('import:httpProgress', url, progress);
      };
    }

    const result = await importService.importFromHttp(url, onProgress);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '导入失败' 
    };
  }
});

// 从 ZIP 文件导入
ipcMain.handle('import:fromZip', async (event, zipPath: string) => {
  try {
    const result = await importService.importFromZip(zipPath);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '导入失败' 
    };
  }
});

// 保存文件到临时位置
ipcMain.handle('file:saveToTemp', async (event, { filename, data }: { filename: string; data: number[] }) => {
  try {
    const fs = require('fs-extra');
    const path = require('path');
    const os = require('os');
    const { v4: uuidv4 } = require('uuid');
    
    const tempDir = path.join(os.tmpdir(), 'claude-orchestrator', 'uploads');
    await fs.ensureDir(tempDir);
    
    const tempPath = path.join(tempDir, `${uuidv4()}-${filename}`);
    const buffer = Buffer.from(data);
    
    await fs.writeFile(tempPath, buffer);
    return tempPath;
  } catch (error) {
    throw new Error(`保存文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
});

// 获取导入任务列表（模拟）
ipcMain.handle('import:getTasks', async (event) => {
  try {
    // 这里应该从数据库或缓存中获取真实的任务列表
    // 目前返回模拟数据
    const tasks: any[] = [];
    return { success: true, tasks };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '获取任务失败' 
    };
  }
});

// 清理已完成的任务
ipcMain.handle('import:clearCompleted', async (event) => {
  try {
    // 这里应该清理数据库中已完成的任务
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '清理任务失败' 
    };
  }
});

// 清理所有任务
ipcMain.handle('import:clearAll', async (event) => {
  try {
    // 这里应该清理数据库中的所有任务
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '清理任务失败' 
    };
  }
});

// 创建自定义能力
ipcMain.handle('capability:createCustom', async (event, { type, name, description, content }) => {
  try {
    // 这里应该调用 ParserService 或 StorageService 创建自定义能力
    // 目前返回模拟成功
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '创建能力失败' 
    };
  }
});

export default importService;