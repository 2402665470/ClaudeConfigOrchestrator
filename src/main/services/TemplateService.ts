import { v4 as uuidv4 } from 'uuid';
import type { ConfigTemplate, Capability } from '@common/types';
import { StorageService } from './StorageService';

export interface CreateTemplateRequest {
  name: string;
  description: string;
  capabilityIds?: string[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  capabilityIds?: string[];
}

export interface TemplateStats {
  totalCapabilities: number;
  typeStats: Record<string, number>;
}

export interface TemplateExportData {
  version: string;
  exportedAt: Date;
  template: ConfigTemplate;
  capabilities: Capability[];
}

export interface TemplateImportResult {
  template: ConfigTemplate;
  importedCapabilities: Capability[];
  skippedCapabilities: string[];
}

export class TemplateService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * 创建新的配置模板
   */
  public async createTemplate(request: CreateTemplateRequest): Promise<ConfigTemplate> {
    const now = new Date();
    
    const template: ConfigTemplate = {
      id: uuidv4(),
      name: request.name,
      description: request.description,
      capabilityIds: request.capabilityIds || [],
      createdAt: now,
      updatedAt: now,
    };

    await this.storageService.saveTemplate(template);
    return template;
  }

  /**
   * 更新配置模板
   */
  public async updateTemplate(id: string, request: UpdateTemplateRequest): Promise<ConfigTemplate> {
    const existingTemplate = await this.storageService.getTemplate(id);
    if (!existingTemplate) {
      throw new Error(`Template with id ${id} not found`);
    }

    const updatedTemplate: ConfigTemplate = {
      ...existingTemplate,
      ...request,
      updatedAt: new Date(),
    };

    await this.storageService.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }

  /**
   * 添加能力到模板
   */
  public async addCapabilityToTemplate(templateId: string, capabilityId: string): Promise<ConfigTemplate> {
    const template = await this.storageService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // 检查能力是否存在
    const capability = await this.storageService.getCapability(capabilityId);
    if (!capability) {
      throw new Error(`Capability with id ${capabilityId} not found`);
    }

    // 检查能力是否已经在模板中
    if (template.capabilityIds.includes(capabilityId)) {
      return template; // 已存在，直接返回
    }

    const updatedTemplate: ConfigTemplate = {
      ...template,
      capabilityIds: [...template.capabilityIds, capabilityId],
      updatedAt: new Date(),
    };

    await this.storageService.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }

  /**
   * 从模板中移除能力
   */
  public async removeCapabilityFromTemplate(templateId: string, capabilityId: string): Promise<ConfigTemplate> {
    const template = await this.storageService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    const updatedTemplate: ConfigTemplate = {
      ...template,
      capabilityIds: template.capabilityIds.filter(id => id !== capabilityId),
      updatedAt: new Date(),
    };

    await this.storageService.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }

  /**
   * 批量添加能力到模板
   */
  public async addCapabilitiesToTemplate(templateId: string, capabilityIds: string[]): Promise<ConfigTemplate> {
    const template = await this.storageService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // 验证所有能力都存在
    for (const capabilityId of capabilityIds) {
      const capability = await this.storageService.getCapability(capabilityId);
      if (!capability) {
        throw new Error(`Capability with id ${capabilityId} not found`);
      }
    }

    // 合并能力ID，去重
    const uniqueCapabilityIds = Array.from(new Set([...template.capabilityIds, ...capabilityIds]));

    const updatedTemplate: ConfigTemplate = {
      ...template,
      capabilityIds: uniqueCapabilityIds,
      updatedAt: new Date(),
    };

    await this.storageService.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }

  /**
   * 获取模板的能力统计信息
   */
  public async getTemplateStats(templateId: string): Promise<TemplateStats> {
    const template = await this.storageService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // 获取模板中所有能力的详细信息
    const capabilities: Capability[] = [];
    for (const capabilityId of template.capabilityIds) {
      const capability = await this.storageService.getCapability(capabilityId);
      if (capability) {
        capabilities.push(capability);
      }
    }

    // 统计各类型能力数量
    const typeStats: Record<string, number> = {};
    for (const capability of capabilities) {
      typeStats[capability.type] = (typeStats[capability.type] || 0) + 1;
    }

    return {
      totalCapabilities: capabilities.length,
      typeStats,
    };
  }

  /**
   * 获取模板中的所有能力
   */
  public async getTemplateCapabilities(templateId: string): Promise<Capability[]> {
    const template = await this.storageService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    const capabilities: Capability[] = [];
    for (const capabilityId of template.capabilityIds) {
      const capability = await this.storageService.getCapability(capabilityId);
      if (capability) {
        capabilities.push(capability);
      }
    }

    return capabilities;
  }

  /**
   * 删除模板（但保留能力）
   */
  public async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.storageService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    await this.storageService.deleteTemplate(templateId);
  }

  /**
   * 获取所有模板
   */
  public async getAllTemplates(): Promise<ConfigTemplate[]> {
    return await this.storageService.getAllTemplates();
  }

  /**
   * 获取单个模板
   */
  public async getTemplate(templateId: string): Promise<ConfigTemplate | null> {
    return await this.storageService.getTemplate(templateId);
  }

  /**
   * 导出模板为 JSON 文件
   */
  public async exportTemplate(templateId: string): Promise<TemplateExportData> {
    const template = await this.storageService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // 获取模板中的所有能力
    const capabilities: Capability[] = [];
    for (const capabilityId of template.capabilityIds) {
      const capability = await this.storageService.getCapability(capabilityId);
      if (capability) {
        capabilities.push(capability);
      }
    }

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      template,
      capabilities,
    };
  }

  /**
   * 从 JSON 数据导入模板
   */
  public async importTemplate(data: TemplateExportData, options?: {
    overwriteExisting?: boolean;
    importCapabilities?: boolean;
  }): Promise<TemplateImportResult> {
    const { overwriteExisting = false, importCapabilities = true } = options || {};

    // 检查模板是否已存在
    const existingTemplate = await this.storageService.getTemplate(data.template.id);
    if (existingTemplate && !overwriteExisting) {
      throw new Error(`Template with id ${data.template.id} already exists`);
    }

    const importedCapabilities: Capability[] = [];
    const skippedCapabilities: string[] = [];

    // 导入能力（如果需要）
    if (importCapabilities) {
      for (const capability of data.capabilities) {
        try {
          const existingCapability = await this.storageService.getCapability(capability.id);
          if (!existingCapability || overwriteExisting) {
            await this.storageService.saveCapability(capability);
            importedCapabilities.push(capability);
          } else {
            skippedCapabilities.push(capability.id);
          }
        } catch (error) {
          console.error(`Failed to import capability ${capability.id}:`, error);
          skippedCapabilities.push(capability.id);
        }
      }
    }

    // 导入模板
    const templateToImport: ConfigTemplate = {
      ...data.template,
      updatedAt: new Date(),
    };

    await this.storageService.saveTemplate(templateToImport);

    return {
      template: templateToImport,
      importedCapabilities,
      skippedCapabilities,
    };
  }

  /**
   * 导出模板到文件系统
   */
  public async exportTemplateToFile(templateId: string, filePath: string): Promise<void> {
    const exportData = await this.exportTemplate(templateId);
    const fs = await import('fs-extra');
    
    await fs.writeJSON(filePath, exportData, { spaces: 2 });
  }

  /**
   * 从文件系统导入模板
   */
  public async importTemplateFromFile(filePath: string, options?: {
    overwriteExisting?: boolean;
    importCapabilities?: boolean;
  }): Promise<TemplateImportResult> {
    const fs = await import('fs-extra');
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const data = await fs.readJSON(filePath) as TemplateExportData;
    
    // 验证数据格式
    if (!data.template || !data.capabilities || !Array.isArray(data.capabilities)) {
      throw new Error('Invalid template export file format');
    }

    return await this.importTemplate(data, options);
  }
}