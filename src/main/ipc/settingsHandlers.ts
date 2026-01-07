import { ipcMain, dialog } from 'electron';
import { SettingsService, AppSettings } from '../services/SettingsService';

let settingsService: SettingsService;

export function initializeSettingsHandlers() {
  settingsService = new SettingsService();

  // 获取应用设置
  ipcMain.handle('settings:get', async (): Promise<AppSettings> => {
    try {
      return await settingsService.getSettings();
    } catch (error) {
      throw new Error(`获取设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 保存应用设置
  ipcMain.handle('settings:save', async (_, settings: AppSettings): Promise<void> => {
    try {
      await settingsService.saveSettings(settings);
    } catch (error) {
      throw new Error(`保存设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 重置设置到默认值
  ipcMain.handle('settings:reset', async (): Promise<AppSettings> => {
    try {
      return await settingsService.resetSettings();
    } catch (error) {
      throw new Error(`重置设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 导出设置
  ipcMain.handle('settings:export', async (_, filePath: string, settings?: AppSettings): Promise<void> => {
    try {
      await settingsService.exportSettings(filePath, settings);
    } catch (error) {
      throw new Error(`导出设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 从文件导入设置
  ipcMain.handle('settings:import', async (_, filePath: string): Promise<AppSettings> => {
    try {
      return await settingsService.importSettings(filePath);
    } catch (error) {
      throw new Error(`导入设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取特定设置
  ipcMain.handle('settings:getSetting', async (_, key: keyof AppSettings): Promise<any> => {
    try {
      return await settingsService.getSetting(key);
    } catch (error) {
      throw new Error(`获取设置项失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 更新特定设置
  ipcMain.handle('settings:updateSetting', async (_, key: keyof AppSettings, value: any): Promise<void> => {
    try {
      await settingsService.updateSetting(key, value);
    } catch (error) {
      throw new Error(`更新设置项失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取数据目录
  ipcMain.handle('settings:getDataDirectory', async (): Promise<string> => {
    try {
      return await settingsService.getDataDirectory();
    } catch (error) {
      throw new Error(`获取数据目录失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取缓存目录
  ipcMain.handle('settings:getCacheDirectory', async (): Promise<string> => {
    try {
      return await settingsService.getCacheDirectory();
    } catch (error) {
      throw new Error(`获取缓存目录失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取翻译设置
  ipcMain.handle('settings:getTranslationSettings', async () => {
    try {
      return await settingsService.getTranslationSettings();
    } catch (error) {
      throw new Error(`获取翻译设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 检查翻译是否已配置
  ipcMain.handle('settings:isTranslationConfigured', async (): Promise<boolean> => {
    try {
      return await settingsService.isTranslationConfigured();
    } catch (error) {
      throw new Error(`检查翻译配置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}