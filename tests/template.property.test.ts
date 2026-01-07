import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { TemplateService } from '../src/main/services/TemplateService';
import { StorageService } from '../src/main/services/StorageService';
import { databaseManager } from '../src/main/services/database';
import type { Capability, CapabilityType } from '../src/common/types';

describe('TemplateService - 属性测试', () => {
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

  /**
   * **Feature: claude-config-orchestrator, Property 11: 模板能力统计一致性**
   * **Validates: Requirements 7.3**
   * 
   * For any 配置模板，显示的能力数量和类型统计应与模板中实际包含的能力一致。
   */
  it('Property 11: 模板能力统计一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成能力类型数组
        fc.array(
          fc.constantFrom('skill', 'command', 'hook', 'mcp', 'setting', 'agent') as fc.Arbitrary<CapabilityType>,
          { minLength: 0, maxLength: 20 }
        ),
        // 生成模板名称和描述
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 500 }),
        }),
        async (capabilityTypes, templateInfo) => {
          // 创建对应的能力
          const capabilities: Capability[] = [];
          const capabilityIds: string[] = [];

          for (let i = 0; i < capabilityTypes.length; i++) {
            const capabilityId = `cap-${i}`;
            const capability: Capability = {
              id: capabilityId,
              type: capabilityTypes[i],
              name: `Test ${capabilityTypes[i]} ${i}`,
              originalDescription: `Test description for ${capabilityTypes[i]}`,
              translationStatus: 'pending',
              sourcePlugin: 'test-plugin',
              content: createContentForType(capabilityTypes[i]),
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            capabilities.push(capability);
            capabilityIds.push(capabilityId);
            await storageService.saveCapability(capability);
          }

          // 创建模板
          const template = await templateService.createTemplate({
            name: templateInfo.name,
            description: templateInfo.description,
            capabilityIds,
          });

          // 获取统计信息
          const stats = await templateService.getTemplateStats(template.id);

          // 验证总数一致性
          expect(stats.totalCapabilities).toBe(capabilities.length);

          // 验证类型统计一致性
          const expectedTypeStats: Record<string, number> = {};
          for (const capability of capabilities) {
            expectedTypeStats[capability.type] = (expectedTypeStats[capability.type] || 0) + 1;
          }

          expect(stats.typeStats).toEqual(expectedTypeStats);

          // 验证统计数据的总和等于总数
          const statsSum = Object.values(stats.typeStats).reduce((sum, count) => sum + count, 0);
          expect(statsSum).toBe(stats.totalCapabilities);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 12: 模板删除不影响能力**
   * **Validates: Requirements 7.5**
   * 
   * For any 配置模板删除操作，模板中引用的能力应仍然存在于私人市场中。
   */
  it('Property 12: 模板删除不影响能力', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成能力数组
        fc.array(
          fc.record({
            type: fc.constantFrom('skill', 'command', 'hook', 'mcp', 'setting', 'agent') as fc.Arbitrary<CapabilityType>,
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ maxLength: 200 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // 生成模板信息
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 500 }),
        }),
        async (capabilitySpecs, templateInfo) => {
          // 创建能力
          const capabilities: Capability[] = [];
          const capabilityIds: string[] = [];

          for (let i = 0; i < capabilitySpecs.length; i++) {
            const spec = capabilitySpecs[i];
            const capabilityId = `cap-${i}-${Date.now()}`;
            const capability: Capability = {
              id: capabilityId,
              type: spec.type,
              name: spec.name,
              originalDescription: spec.description,
              translationStatus: 'pending',
              sourcePlugin: 'test-plugin',
              content: createContentForType(spec.type),
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            capabilities.push(capability);
            capabilityIds.push(capabilityId);
            await storageService.saveCapability(capability);
          }

          // 创建模板
          const template = await templateService.createTemplate({
            name: templateInfo.name,
            description: templateInfo.description,
            capabilityIds,
          });

          // 验证模板存在
          const retrievedTemplate = await templateService.getTemplate(template.id);
          expect(retrievedTemplate).not.toBeNull();

          // 删除模板
          await templateService.deleteTemplate(template.id);

          // 验证模板已删除
          const deletedTemplate = await templateService.getTemplate(template.id);
          expect(deletedTemplate).toBeNull();

          // 验证所有能力仍然存在
          for (const capability of capabilities) {
            const retrievedCapability = await storageService.getCapability(capability.id);
            expect(retrievedCapability).not.toBeNull();
            expect(retrievedCapability!.name).toBe(capability.name);
            expect(retrievedCapability!.type).toBe(capability.type);
            expect(retrievedCapability!.originalDescription).toBe(capability.originalDescription);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 13: 模板导出导入往返一致性**
   * **Validates: Requirements 7.6, 7.7**
   * 
   * For any 配置模板，导出为 JSON 后再导入，应得到与原模板等价的模板（名称、描述、能力列表相同）。
   */
  it('Property 13: 模板导出导入往返一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成模板信息
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 500 }),
        }),
        // 生成能力数组
        fc.array(
          fc.record({
            type: fc.constantFrom('skill', 'command', 'hook', 'mcp', 'setting', 'agent') as fc.Arbitrary<CapabilityType>,
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ maxLength: 200 }),
            chineseDescription: fc.option(fc.string({ maxLength: 200 })),
            translationStatus: fc.constantFrom('pending', 'auto_translated', 'manually_edited') as fc.Arbitrary<any>,
          }),
          { minLength: 0, maxLength: 8 }
        ),
        async (templateInfo, capabilitySpecs) => {
          // 创建能力
          const capabilities: Capability[] = [];
          const capabilityIds: string[] = [];

          for (let i = 0; i < capabilitySpecs.length; i++) {
            const spec = capabilitySpecs[i];
            const capabilityId = `roundtrip-cap-${i}-${Date.now()}-${Math.random()}`;
            const capability: Capability = {
              id: capabilityId,
              type: spec.type,
              name: spec.name,
              originalDescription: spec.description,
              chineseDescription: spec.chineseDescription || undefined,
              translationStatus: spec.translationStatus,
              sourcePlugin: 'roundtrip-test-plugin',
              content: createContentForType(spec.type),
              metadata: { tags: ['roundtrip', 'test'] },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            capabilities.push(capability);
            capabilityIds.push(capabilityId);
            await storageService.saveCapability(capability);
          }

          // 创建原始模板
          const originalTemplate = await templateService.createTemplate({
            name: templateInfo.name,
            description: templateInfo.description,
            capabilityIds,
          });

          // 导出模板
          const exportData = await templateService.exportTemplate(originalTemplate.id);

          // 验证导出数据包含所有必要信息
          expect(exportData.template.id).toBe(originalTemplate.id);
          expect(exportData.template.name).toBe(originalTemplate.name);
          expect(exportData.template.description).toBe(originalTemplate.description);
          expect(exportData.template.capabilityIds).toEqual(originalTemplate.capabilityIds);
          expect(exportData.capabilities).toHaveLength(capabilities.length);

          // 删除原始模板和能力（模拟导入到新环境）
          await templateService.deleteTemplate(originalTemplate.id);
          for (const capability of capabilities) {
            await storageService.deleteCapability(capability.id);
          }

          // 导入模板
          const importResult = await templateService.importTemplate(exportData, {
            overwriteExisting: true,
            importCapabilities: true,
          });

          // 验证导入的模板与原始模板等价
          expect(importResult.template.id).toBe(originalTemplate.id);
          expect(importResult.template.name).toBe(originalTemplate.name);
          expect(importResult.template.description).toBe(originalTemplate.description);
          expect(importResult.template.capabilityIds).toEqual(originalTemplate.capabilityIds);

          // 验证所有能力都被正确导入
          expect(importResult.importedCapabilities).toHaveLength(capabilities.length);
          expect(importResult.skippedCapabilities).toHaveLength(0);

          // 验证导入的能力与原始能力等价
          for (const originalCapability of capabilities) {
            const importedCapability = await storageService.getCapability(originalCapability.id);
            expect(importedCapability).not.toBeNull();
            expect(importedCapability!.name).toBe(originalCapability.name);
            expect(importedCapability!.type).toBe(originalCapability.type);
            expect(importedCapability!.originalDescription).toBe(originalCapability.originalDescription);
            expect(importedCapability!.chineseDescription).toBe(originalCapability.chineseDescription);
            expect(importedCapability!.translationStatus).toBe(originalCapability.translationStatus);
          }

          // 验证模板统计信息一致
          const originalStats = await templateService.getTemplateStats(originalTemplate.id);
          const importedTemplate = await templateService.getTemplate(originalTemplate.id);
          expect(importedTemplate).not.toBeNull();
          
          const importedStats = await templateService.getTemplateStats(importedTemplate!.id);
          expect(importedStats.totalCapabilities).toBe(originalStats.totalCapabilities);
          expect(importedStats.typeStats).toEqual(originalStats.typeStats);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 辅助函数：为不同类型创建对应的内容
   */
  function createContentForType(type: CapabilityType) {
    switch (type) {
      case 'skill':
        return { type: 'skill', folderPath: '/test', files: [] };
      case 'command':
        return { type: 'command', filePath: '/test.md', markdown: '# Test' };
      case 'hook':
        return { type: 'hook', config: { test: true } };
      case 'mcp':
        return { 
          type: 'mcp', 
          serverName: 'test-server',
          config: { command: 'test' }
        };
      case 'setting':
        return { type: 'setting', key: 'permissions', config: { allow: [] } };
      case 'agent':
        return { type: 'agent', filePath: '/agent.md', markdown: '# Agent' };
      default:
        throw new Error(`Unknown capability type: ${type}`);
    }
  }
});