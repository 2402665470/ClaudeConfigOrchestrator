import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { DatabaseManager } from '../src/main/services/database';
import { TranslationService } from '../src/main/services/TranslationService';
import { StorageService } from '../src/main/services/StorageService';
import { Capability, CapabilityType, TranslationStatus } from '../src/common/types';

describe('Translation Service Property Tests', () => {
  let dbManager: DatabaseManager;
  let translationService: TranslationService;
  let storageService: StorageService;
  let testDbPath: string;

  beforeEach(async () => {
    // 创建测试数据库
    const testDir = path.join(os.tmpdir(), 'translation-property-test');
    await fs.ensureDir(testDir);
    testDbPath = path.join(testDir, `test-${Date.now()}.db`);
    
    dbManager = new DatabaseManager(testDbPath);
    await dbManager.initialize();
    translationService = new TranslationService(dbManager);
    storageService = new StorageService(dbManager);
    
    // 启用翻译服务（使用模拟配置）
    translationService.updateConfig({
      enabled: true,
      apiKey: 'test-api-key'
    });
  });

  afterEach(async () => {
    dbManager.close();
    try {
      await fs.remove(testDbPath);
    } catch (error) {
      // 忽略删除错误
    }
  });

  // 生成器定义
  const capabilityTypeArb = fc.constantFrom<CapabilityType>('skill', 'command', 'hook', 'mcp', 'setting', 'agent');
  
  const translationStatusArb = fc.constantFrom<TranslationStatus>(
    'pending', 'translating', 'auto_translated', 'manually_edited', 'failed'
  );

  const capabilityArb = fc.record({
    id: fc.uuid(),
    type: capabilityTypeArb,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    originalDescription: fc.string({ minLength: 1, maxLength: 500 }),
    chineseDescription: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
    translationStatus: translationStatusArb,
    sourcePlugin: fc.string({ minLength: 1, maxLength: 50 }),
    version: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
    author: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    content: fc.record({
      type: capabilityTypeArb,
      filePath: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
      markdown: fc.option(fc.string({ maxLength: 1000 })),
      config: fc.option(fc.dictionary(fc.string(), fc.anything())),
      folderPath: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
      files: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 10 })),
      serverName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      key: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
    }),
    metadata: fc.record({
      frontmatter: fc.option(fc.dictionary(fc.string(), fc.anything())),
      dependencies: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 })),
      tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }))
    }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
  });

  /**
   * **Feature: claude-config-orchestrator, Property 25: 人工编辑保护**
   * **Validates: Requirements 15.6**
   * 
   * For any 标记为"已人工编辑"的能力描述，自动翻译操作不应覆盖该描述
   */
  it('Property 25: 人工编辑保护 - 人工编辑的能力不应被自动翻译覆盖', async () => {
    await fc.assert(
      fc.asyncProperty(
        capabilityArb,
        fc.string({ minLength: 1, maxLength: 500 }), // 新的翻译文本
        async (capability, newTranslation) => {
          // 清空数据库中的现有数据
          const db = dbManager.getDatabase();
          db.prepare('DELETE FROM capabilities').run();
          
          // 保存能力到数据库
          await storageService.saveCapability(capability);
          
          // 如果能力状态是 manually_edited，则不应该被自动翻译
          if (capability.translationStatus === 'manually_edited') {
            // 尝试自动翻译应该失败
            const canTranslate = await translationService.canAutoTranslate(capability.id);
            expect(canTranslate).toBe(false);
            
            // 尝试翻译能力应该抛出错误
            await expect(
              translationService.translateCapability(
                capability.id,
                capability.originalDescription,
                {
                  capabilityType: capability.type,
                  capabilityName: capability.name
                }
              )
            ).rejects.toThrow('该能力已被人工编辑，不能自动翻译');
            
            // 验证状态没有改变
            const updatedCapability = await storageService.getCapability(capability.id);
            expect(updatedCapability?.translationStatus).toBe('manually_edited');
          } else {
            // 其他状态的能力应该可以被翻译
            const canTranslate = await translationService.canAutoTranslate(capability.id);
            expect(canTranslate).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 测试翻译状态转换的正确性
   */
  it('Property: 翻译状态转换正确性', async () => {
    await fc.assert(
      fc.asyncProperty(
        capabilityArb,
        async (capability) => {
          // 清空数据库中的现有数据
          const db = dbManager.getDatabase();
          db.prepare('DELETE FROM capabilities').run();
          
          // 保存能力到数据库
          await storageService.saveCapability(capability);
          
          // 测试状态更新
          const newStatus: TranslationStatus = 'manually_edited';
          await translationService.updateTranslationStatus(capability.id, newStatus);
          
          // 验证状态已更新
          const updatedCapability = await storageService.getCapability(capability.id);
          expect(updatedCapability?.translationStatus).toBe(newStatus);
          
          // 验证人工编辑状态的保护
          const canTranslate = await translationService.canAutoTranslate(capability.id);
          expect(canTranslate).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 测试批量状态更新的一致性
   */
  it('Property: 批量状态更新一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(capabilityArb, { minLength: 1, maxLength: 10 }),
        translationStatusArb,
        async (capabilities, targetStatus) => {
          // 清空数据库中的现有数据
          const db = dbManager.getDatabase();
          db.prepare('DELETE FROM capabilities').run();
          
          // 确保每个能力都有唯一的ID
          const uniqueCapabilities = capabilities.map((cap, index) => ({
            ...cap,
            id: `test-capability-${index}-${Date.now()}`
          }));
          
          // 保存所有能力到数据库
          for (const capability of uniqueCapabilities) {
            await storageService.saveCapability(capability);
          }
          
          // 批量更新状态
          const updates = uniqueCapabilities.map(cap => ({ id: cap.id, status: targetStatus }));
          await translationService.updateTranslationStatusBatch(updates);
          
          // 验证所有能力的状态都已更新
          for (const capability of uniqueCapabilities) {
            const updated = await storageService.getCapability(capability.id);
            expect(updated?.translationStatus).toBe(targetStatus);
            
            // 验证 canAutoTranslate 的逻辑
            const canTranslate = await translationService.canAutoTranslate(capability.id);
            expect(canTranslate).toBe(targetStatus !== 'manually_edited');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 测试翻译状态统计的准确性
   */
  it('Property: 翻译状态统计准确性', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(capabilityArb, { minLength: 0, maxLength: 20 }),
        async (capabilities) => {
          // 清空数据库中的现有数据
          const db = dbManager.getDatabase();
          db.prepare('DELETE FROM capabilities').run();
          
          // 确保每个能力都有唯一的ID
          const uniqueCapabilities = capabilities.map((cap, index) => ({
            ...cap,
            id: `test-capability-${index}-${Date.now()}`
          }));
          
          // 保存所有能力到数据库
          for (const capability of uniqueCapabilities) {
            await storageService.saveCapability(capability);
          }
          
          // 获取统计信息
          const stats = await translationService.getTranslationStatusStats();
          
          // 手动计算期望的统计
          const expectedStats: Record<TranslationStatus, number> = {
            pending: 0,
            translating: 0,
            auto_translated: 0,
            manually_edited: 0,
            failed: 0
          };
          
          for (const capability of uniqueCapabilities) {
            expectedStats[capability.translationStatus]++;
          }
          
          // 验证统计准确性
          for (const status of Object.keys(expectedStats) as TranslationStatus[]) {
            expect(stats[status]).toBe(expectedStats[status]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 测试重置翻译状态的正确性
   */
  it('Property: 重置翻译状态正确性', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(capabilityArb, { minLength: 1, maxLength: 10 }),
        async (capabilities) => {
          // 清空数据库中的现有数据
          const db = dbManager.getDatabase();
          db.prepare('DELETE FROM capabilities').run();
          
          // 确保每个能力都有唯一的ID
          const uniqueCapabilities = capabilities.map((cap, index) => ({
            ...cap,
            id: `test-capability-${index}-${Date.now()}`
          }));
          
          // 保存所有能力到数据库
          for (const capability of uniqueCapabilities) {
            await storageService.saveCapability(capability);
          }
          
          // 批量重置状态
          const capabilityIds = uniqueCapabilities.map(cap => cap.id);
          await translationService.resetTranslationStatusBatch(capabilityIds);
          
          // 验证所有能力的状态都被重置为 pending
          for (const capability of uniqueCapabilities) {
            const updated = await storageService.getCapability(capability.id);
            expect(updated?.translationStatus).toBe('pending');
            
            // 验证重置后可以自动翻译
            const canTranslate = await translationService.canAutoTranslate(capability.id);
            expect(canTranslate).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});