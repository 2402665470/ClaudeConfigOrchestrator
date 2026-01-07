import { ipcMain } from 'electron';
import { StorageService } from '../services/StorageService';

let storageService: StorageService;

export function initializeCacheHandlers(storageServiceInstance: StorageService) {
  storageService = storageServiceInstance;

  // 获取插件缓存统计
  ipcMain.handle('cache:getPluginStats', async (): Promise<{ entries: number; totalSizeBytes: number; hitRate: number }> => {
    try {
      return await storageService.getPluginCacheStats();
    } catch (error) {
      throw new Error(`获取插件缓存统计失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取翻译缓存统计
  ipcMain.handle('cache:getTranslationStats', async (): Promise<{ entries: number; sizeBytes: number; hitRate: number }> => {
    try {
      return await storageService.getTranslationCacheStats();
    } catch (error) {
      throw new Error(`获取翻译缓存统计失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 清理未使用的插件缓存
  ipcMain.handle('cache:clearUnusedPlugin', async (): Promise<{ deletedEntries: number; freedBytes: number }> => {
    try {
      return await storageService.clearUnusedPluginCache();
    } catch (error) {
      throw new Error(`清理未使用插件缓存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 清空所有插件缓存
  ipcMain.handle('cache:clearAllPlugin', async (): Promise<{ deletedEntries: number; freedBytes: number }> => {
    try {
      return await storageService.clearAllPluginCache();
    } catch (error) {
      throw new Error(`清空所有插件缓存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 清空翻译缓存
  ipcMain.handle('cache:clearTranslation', async (): Promise<{ deletedEntries: number }> => {
    try {
      return await storageService.clearTranslationCache();
    } catch (error) {
      throw new Error(`清空翻译缓存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取所有插件缓存条目
  ipcMain.handle('cache:getAllPluginEntries', async (): Promise<any[]> => {
    try {
      return await storageService.getAllPluginCacheEntries();
    } catch (error) {
      throw new Error(`获取插件缓存条目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取所有翻译缓存条目
  ipcMain.handle('cache:getAllTranslationEntries', async (): Promise<any[]> => {
    try {
      return await storageService.getAllTranslationCacheEntries();
    } catch (error) {
      throw new Error(`获取翻译缓存条目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}