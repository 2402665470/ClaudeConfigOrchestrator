import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateService } from '../src/main/services/TemplateService';
import { StorageService } from '../src/main/services/StorageService';
import { databaseManager } from '../src/main/services/database';
import type { Capability, ConfigTemplate } from '../src/common/types';

describe('TemplateService - 能力统计', () => {
  let templateService: TemplateService;
  let storageService: StorageService;

  beforeEach(async () => {
    await databaseManager.initialize(':memory:');
    storageService = new StorageService(databaseManager);
    templateService = new TemplateService(storageService);
  });

  afterEach(() => {
    databaseManager.close();
  });

  it('应该正确统计模板中的能力数量和类型', async () => {
    // 创建测试能力
    const capabilities: Capability[] = [
      {
        id: 'cap1',
        type: 'skill',
        name: 'Test Skill',
        originalDescription: 'A test skill',
        translationStatus: 'pending',
        sourcePlugin: 'test-plugin',
        content: { type: 'skill', folderPath: '/test', files: [] },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cap2',
        type: 'command',
        name: 'Test Command',
        originalDescription: 'A test command',
        translationStatus: 'pending',
        sourcePlugin: 'test-plugin',
        content: { type: 'command', filePath: '/test.md', markdown: '# Test' },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cap3',
        type: 'skill',
        name: 'Another Skill',
        originalDescription: 'Another test skill',
        translationStatus: 'pending',
        sourcePlugin: 'test-plugin',
        content: { type: 'skill', folderPath: '/test2', files: [] },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 保存能力
    for (const capability of capabilities) {
      await storageService.saveCapability(capability);
    }

    // 创建模板
    const template = await templateService.createTemplate({
      name: 'Test Template',
      description: 'A test template',
      capabilityIds: ['cap1', 'cap2', 'cap3'],
    });

    // 获取统计信息
    const stats = await templateService.getTemplateStats(template.id);

    // 验证统计结果
    expect(stats.totalCapabilities).toBe(3);
    expect(stats.typeStats).toEqual({
      skill: 2,
      command: 1,
    });
  });

  it('应该处理空模板的统计', async () => {
    // 创建空模板
    const template = await templateService.createTemplate({
      name: 'Empty Template',
      description: 'An empty template',
      capabilityIds: [],
    });

    // 获取统计信息
    const stats = await templateService.getTemplateStats(template.id);

    // 验证统计结果
    expect(stats.totalCapabilities).toBe(0);
    expect(stats.typeStats).toEqual({});
  });

  it('应该忽略不存在的能力ID', async () => {
    // 创建一个能力
    const capability: Capability = {
      id: 'existing-cap',
      type: 'mcp',
      name: 'Existing Capability',
      originalDescription: 'An existing capability',
      translationStatus: 'pending',
      sourcePlugin: 'test-plugin',
      content: { 
        type: 'mcp', 
        serverName: 'test-server',
        config: { command: 'test' }
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storageService.saveCapability(capability);

    // 创建模板，包含存在和不存在的能力ID
    const template = await templateService.createTemplate({
      name: 'Mixed Template',
      description: 'Template with existing and non-existing capabilities',
      capabilityIds: ['existing-cap', 'non-existing-cap'],
    });

    // 获取统计信息
    const stats = await templateService.getTemplateStats(template.id);

    // 应该只统计存在的能力
    expect(stats.totalCapabilities).toBe(1);
    expect(stats.typeStats).toEqual({
      mcp: 1,
    });
  });

  it('删除模板应该不影响能力', async () => {
    // 创建测试能力
    const capabilities: Capability[] = [
      {
        id: 'cap1',
        type: 'skill',
        name: 'Test Skill',
        originalDescription: 'A test skill',
        translationStatus: 'pending',
        sourcePlugin: 'test-plugin',
        content: { type: 'skill', folderPath: '/test', files: [] },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cap2',
        type: 'command',
        name: 'Test Command',
        originalDescription: 'A test command',
        translationStatus: 'pending',
        sourcePlugin: 'test-plugin',
        content: { type: 'command', filePath: '/test.md', markdown: '# Test' },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 保存能力
    for (const capability of capabilities) {
      await storageService.saveCapability(capability);
    }

    // 创建模板
    const template = await templateService.createTemplate({
      name: 'Test Template',
      description: 'A test template',
      capabilityIds: ['cap1', 'cap2'],
    });

    // 验证模板存在
    const retrievedTemplate = await templateService.getTemplate(template.id);
    expect(retrievedTemplate).not.toBeNull();
    expect(retrievedTemplate!.capabilityIds).toEqual(['cap1', 'cap2']);

    // 删除模板
    await templateService.deleteTemplate(template.id);

    // 验证模板已删除
    const deletedTemplate = await templateService.getTemplate(template.id);
    expect(deletedTemplate).toBeNull();

    // 验证能力仍然存在
    const capability1 = await storageService.getCapability('cap1');
    const capability2 = await storageService.getCapability('cap2');
    
    expect(capability1).not.toBeNull();
    expect(capability2).not.toBeNull();
    expect(capability1!.name).toBe('Test Skill');
    expect(capability2!.name).toBe('Test Command');
  });

  it('应该能够导出和导入模板', async () => {
    // 创建测试能力
    const capabilities: Capability[] = [
      {
        id: 'export-cap1',
        type: 'skill',
        name: 'Export Skill',
        originalDescription: 'A skill for export test',
        translationStatus: 'pending',
        sourcePlugin: 'export-plugin',
        content: { type: 'skill', folderPath: '/export-test', files: ['skill.md'] },
        metadata: { tags: ['export', 'test'] },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'export-cap2',
        type: 'mcp',
        name: 'Export MCP',
        originalDescription: 'An MCP for export test',
        translationStatus: 'auto_translated',
        chineseDescription: '导出测试的MCP',
        sourcePlugin: 'export-plugin',
        content: { 
          type: 'mcp', 
          serverName: 'export-server',
          config: { command: 'export-test', args: ['--test'] }
        },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 保存能力
    for (const capability of capabilities) {
      await storageService.saveCapability(capability);
    }

    // 创建模板
    const originalTemplate = await templateService.createTemplate({
      name: 'Export Test Template',
      description: 'A template for testing export/import',
      capabilityIds: ['export-cap1', 'export-cap2'],
    });

    // 导出模板
    const exportData = await templateService.exportTemplate(originalTemplate.id);

    // 验证导出数据
    expect(exportData.version).toBe('1.0.0');
    expect(exportData.template.id).toBe(originalTemplate.id);
    expect(exportData.template.name).toBe('Export Test Template');
    expect(exportData.capabilities).toHaveLength(2);
    expect(exportData.capabilities.map(c => c.id)).toEqual(['export-cap1', 'export-cap2']);

    // 删除原模板和能力（模拟导入到新环境）
    await templateService.deleteTemplate(originalTemplate.id);
    await storageService.deleteCapability('export-cap1');
    await storageService.deleteCapability('export-cap2');

    // 验证已删除
    expect(await templateService.getTemplate(originalTemplate.id)).toBeNull();
    expect(await storageService.getCapability('export-cap1')).toBeNull();
    expect(await storageService.getCapability('export-cap2')).toBeNull();

    // 导入模板
    const importResult = await templateService.importTemplate(exportData, {
      overwriteExisting: true,
      importCapabilities: true,
    });

    // 验证导入结果
    expect(importResult.template.id).toBe(originalTemplate.id);
    expect(importResult.template.name).toBe('Export Test Template');
    expect(importResult.importedCapabilities).toHaveLength(2);
    expect(importResult.skippedCapabilities).toHaveLength(0);

    // 验证模板已恢复
    const restoredTemplate = await templateService.getTemplate(originalTemplate.id);
    expect(restoredTemplate).not.toBeNull();
    expect(restoredTemplate!.name).toBe('Export Test Template');
    expect(restoredTemplate!.capabilityIds).toEqual(['export-cap1', 'export-cap2']);

    // 验证能力已恢复
    const restoredCap1 = await storageService.getCapability('export-cap1');
    const restoredCap2 = await storageService.getCapability('export-cap2');
    
    expect(restoredCap1).not.toBeNull();
    expect(restoredCap2).not.toBeNull();
    expect(restoredCap1!.name).toBe('Export Skill');
    expect(restoredCap2!.chineseDescription).toBe('导出测试的MCP');
  });
});