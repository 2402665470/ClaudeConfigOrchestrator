import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface StorageSettings {
  dataDirectory: string;
  cacheDirectory: string;
  maxCacheSize: number; // MB
  autoCleanup: boolean;
  backupRetentionDays: number;
}

export interface TranslationSettings {
  enabled: boolean;
  provider: 'gemini';
  apiKey: string;
  model: string;
  batchSize: number;
  rateLimit: number;
}

export interface AppSettings {
  storage: StorageSettings;
  translation: TranslationSettings;
}

export class SettingsService {
  private configPath: string;
  private defaultSettings: AppSettings;

  constructor() {
    this.configPath = path.join(os.homedir(), '.claude-orchestrator', 'config.json');
    
    this.defaultSettings = {
      storage: {
        dataDirectory: path.join(os.homedir(), '.claude-orchestrator', 'data'),
        cacheDirectory: path.join(os.homedir(), '.claude-orchestrator', 'cache'),
        maxCacheSize: 1024, // 1GB
        autoCleanup: true,
        backupRetentionDays: 30,
      },
      translation: {
        enabled: false,
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-pro',
        batchSize: 10,
        rateLimit: 60,
      },
    };
  }

  /**
   * 获取应用设置
   */
  async getSettings(): Promise<AppSettings> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configContent = await fs.readFile(this.configPath, 'utf-8');
        const savedSettings = JSON.parse(configContent);
        
        // 合并默认设置和保存的设置，确保新增的配置项有默认值
        return this.mergeSettings(this.defaultSettings, savedSettings);
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    
    return this.defaultSettings;
  }

  /**
   * 保存应用设置
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      // 确保配置目录存在
      await fs.ensureDir(path.dirname(this.configPath));
      
      // 保存设置到文件
      await fs.writeFile(this.configPath, JSON.stringify(settings, null, 2));
      
      // 确保数据和缓存目录存在
      await fs.ensureDir(settings.storage.dataDirectory);
      await fs.ensureDir(settings.storage.cacheDirectory);
    } catch (error) {
      throw new Error(`保存设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 重置设置到默认值
   */
  async resetSettings(): Promise<AppSettings> {
    await this.saveSettings(this.defaultSettings);
    return this.defaultSettings;
  }

  /**
   * 导出设置到文件
   */
  async exportSettings(filePath: string, settings?: AppSettings): Promise<void> {
    try {
      const settingsToExport = settings || await this.getSettings();
      
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings: settingsToExport,
      };
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    } catch (error) {
      throw new Error(`导出设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从文件导入设置
   */
  async importSettings(filePath: string): Promise<AppSettings> {
    try {
      const importContent = await fs.readFile(filePath, 'utf-8');
      const importData = JSON.parse(importContent);
      
      let importedSettings: AppSettings;
      
      // 检查是否是导出的格式
      if (importData.settings && importData.version) {
        importedSettings = importData.settings;
      } else {
        // 假设直接是设置对象
        importedSettings = importData;
      }
      
      // 合并默认设置，确保所有必需的字段都存在
      const mergedSettings = this.mergeSettings(this.defaultSettings, importedSettings);
      
      // 保存导入的设置
      await this.saveSettings(mergedSettings);
      
      return mergedSettings;
    } catch (error) {
      throw new Error(`导入设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取特定的设置值
   */
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  /**
   * 更新特定的设置值
   */
  async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.saveSettings(settings);
  }

  /**
   * 获取数据目录路径
   */
  async getDataDirectory(): Promise<string> {
    const settings = await this.getSettings();
    return settings.storage.dataDirectory;
  }

  /**
   * 获取缓存目录路径
   */
  async getCacheDirectory(): Promise<string> {
    const settings = await this.getSettings();
    return settings.storage.cacheDirectory;
  }

  /**
   * 获取翻译设置
   */
  async getTranslationSettings(): Promise<TranslationSettings> {
    const settings = await this.getSettings();
    return settings.translation;
  }

  /**
   * 检查翻译是否已配置
   */
  async isTranslationConfigured(): Promise<boolean> {
    const translationSettings = await this.getTranslationSettings();
    return translationSettings.enabled && !!translationSettings.apiKey;
  }

  /**
   * 深度合并设置对象
   */
  private mergeSettings(defaultSettings: AppSettings, userSettings: Partial<AppSettings>): AppSettings {
    const merged = { ...defaultSettings };
    
    if (userSettings.storage) {
      merged.storage = { ...defaultSettings.storage, ...userSettings.storage };
    }
    
    if (userSettings.translation) {
      merged.translation = { ...defaultSettings.translation, ...userSettings.translation };
    }
    
    return merged;
  }
}