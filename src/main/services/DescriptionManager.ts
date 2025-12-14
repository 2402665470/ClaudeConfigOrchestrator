import * as fs from 'fs-extra';
import * as path from 'path';
import { CustomDescriptions } from '../../common/types';

/**
 * 自定义描述管理服务
 */
export class DescriptionManager {
  private dataPath: string;

  constructor() {
    // data.json 文件路径 - 使用项目根目录
    this.dataPath = path.resolve(process.cwd(), 'data.json');
  }

  /**
   * 读取数据文件
   */
  private async readData(): Promise<any> {
    try {
      if (await fs.pathExists(this.dataPath)) {
        return await fs.readJson(this.dataPath);
      }
      return {};
    } catch (error) {
      console.error('Failed to read data.json:', error);
      return {};
    }
  }

  /**
   * 写入数据文件
   */
  private async writeData(data: any): Promise<void> {
    try {
      await fs.writeJson(this.dataPath, data, { spaces: 2 });
    } catch (error) {
      console.error('Failed to write data.json:', error);
      throw error;
    }
  }

  /**
   * 获取插件自定义描述
   */
  async getPluginDescription(pluginId: string): Promise<string | null> {
    const data = await this.readData();
    return data.customDescriptions?.plugins?.[pluginId] || null;
  }

  /**
   * 设置插件自定义描述
   */
  async setPluginDescription(pluginId: string, description: string): Promise<void> {
    const data = await this.readData();

    // 初始化 customDescriptions
    if (!data.customDescriptions) {
      data.customDescriptions = {};
    }
    if (!data.customDescriptions.plugins) {
      data.customDescriptions.plugins = {};
    }

    // 设置描述
    if (description && description.trim()) {
      data.customDescriptions.plugins[pluginId] = description.trim();
    } else {
      // 如果描述为空，删除它
      delete data.customDescriptions.plugins[pluginId];
    }

    await this.writeData(data);
  }

  /**
   * 获取能力自定义描述
   */
  async getCapabilityDescription(capabilityId: string): Promise<string | null> {
    const data = await this.readData();
    return data.customDescriptions?.capabilities?.[capabilityId] || null;
  }

  /**
   * 设置能力自定义描述
   */
  async setCapabilityDescription(capabilityId: string, description: string): Promise<void> {
    const data = await this.readData();

    // 初始化 customDescriptions
    if (!data.customDescriptions) {
      data.customDescriptions = {};
    }
    if (!data.customDescriptions.capabilities) {
      data.customDescriptions.capabilities = {};
    }

    // 设置描述
    if (description && description.trim()) {
      data.customDescriptions.capabilities[capabilityId] = description.trim();
    } else {
      // 如果描述为空，删除它
      delete data.customDescriptions.capabilities[capabilityId];
    }

    await this.writeData(data);
  }

  /**
   * 批量获取描述
   */
  async getBatchDescriptions(ids: string[], type: 'plugin' | 'capability'): Promise<Record<string, string | null>> {
    const data = await this.readData();
    const descriptions: Record<string, string | null> = {};

    const collection = type === 'plugin'
      ? data.customDescriptions?.plugins
      : data.customDescriptions?.capabilities;

    if (collection) {
      ids.forEach(id => {
        descriptions[id] = collection[id] || null;
      });
    } else {
      ids.forEach(id => {
        descriptions[id] = null;
      });
    }

    return descriptions;
  }

  /**
   * 删除插件自定义描述
   */
  async deletePluginDescription(pluginId: string): Promise<void> {
    await this.setPluginDescription(pluginId, '');
  }

  /**
   * 删除能力自定义描述
   */
  async deleteCapabilityDescription(capabilityId: string): Promise<void> {
    await this.setCapabilityDescription(capabilityId, '');
  }

  /**
   * 获取所有自定义描述
   */
  async getAllDescriptions(): Promise<CustomDescriptions> {
    const data = await this.readData();
    return data.customDescriptions || { plugins: {}, capabilities: {} };
  }
}

// 导出单例
export const descriptionManager = new DescriptionManager();