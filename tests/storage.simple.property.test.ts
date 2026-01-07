/**
 * **Feature: claude-config-orchestrator, Property 24: 数据持久化往返一致性**
 * **Validates: Requirements 14.4, 14.5**
 * 
 * 简化版属性测试：测试数据持久化的往返一致性
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs-extra';
import { DatabaseManager } from '../src/main/services/database';
import { StorageService } from '../src/main/services/StorageService';
import { Capability } from '../src/common/types';
import { TEST_DATA_DIR } from './setup';

describe('StorageService Simple Property Tests', () => {
  let dbManager: DatabaseManager;
  let storageService: StorageService;
  let testDbPath: string;

  beforeEach(async () => {
    // 为每个测试创建独立的数据库
    testDbPath = path.join(TEST_DATA_DIR, `simple-test-${Date.now()}-${Math.random()}.db`);
    
    // 确保测试数据库文件不存在
    try {
      await fs.remove(testDbPath);
    } catch (error) {
      // 忽略删除错误
    }
    
    // 等待一小段时间确保文件系统操作完成
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 创建测试用的数据库管理器
    dbManager = new DatabaseManager(testDbPath);
    
    await dbManager.initialize();
    storageService = new StorageService(dbManager);
  });

  afterEach(async () => {
    dbManager.close();
    try {
      await fs.remove(testDbPath);
    } catch (error) {
      // 忽略删除错误
    }
  });

  // 生成匹配的能力类型和内容
  const skillCapabilityArb = fc.record({
    id: fc.uuid(),
    type: fc.constant('skill' as const),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    originalDescription: fc.string({ maxLength: 200 }),
    chineseDescription: fc.option(fc.string({ maxLength: 200 })),
    translationStatus: fc.constantFrom('pending', 'auto_translated', 'manually_edited'),
    sourcePlugin: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    version: fc.option(fc.string({ minLength: 1, maxLength: 10 })),
    author: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    content: fc.record({
      type: fc.constant('skill' as const),
      folderPath: fc.string({ minLength: 1, maxLength: 100 }),
      files: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 })
    }),
    metadata: fc.record({
      frontmatter: fc.option(fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean()))),
      dependencies: fc.option(fc.array(fc.string())),
      tags: fc.option(fc.array(fc.string()))
    }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  const commandCapabilityArb = fc.record({
    id: fc.uuid(),
    type: fc.constant('command' as const),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    originalDescription: fc.string({ maxLength: 200 }),
    chineseDescription: fc.option(fc.string({ maxLength: 200 })),
    translationStatus: fc.constantFrom('pending', 'auto_translated', 'manually_edited'),
    sourcePlugin: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    version: fc.option(fc.string({ minLength: 1, maxLength: 10 })),
    author: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    content: fc.record({
      type: fc.constant('command' as const),
      filePath: fc.string({ minLength: 1, maxLength: 100 }),
      markdown: fc.string({ maxLength: 500 })
    }),
    metadata: fc.record({
      frontmatter: fc.option(fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean()))),
      dependencies: fc.option(fc.array(fc.string())),
      tags: fc.option(fc.array(fc.string()))
    }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  const mcpCapabilityArb = fc.record({
    id: fc.uuid(),
    type: fc.constant('mcp' as const),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    originalDescription: fc.string({ maxLength: 200 }),
    chineseDescription: fc.option(fc.string({ maxLength: 200 })),
    translationStatus: fc.constantFrom('pending', 'auto_translated', 'manually_edited'),
    sourcePlugin: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    version: fc.option(fc.string({ minLength: 1, maxLength: 10 })),
    author: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    content: fc.record({
      type: fc.constant('mcp' as const),
      serverName: fc.string({ minLength: 1, maxLength: 50 }),
      config: fc.record({
        command: fc.string({ minLength: 1, maxLength: 50 }),
        args: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 })),
        env: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ minLength: 1, maxLength: 50 })))
      })
    }),
    metadata: fc.record({
      frontmatter: fc.option(fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean()))),
      dependencies: fc.option(fc.array(fc.string())),
      tags: fc.option(fc.array(fc.string()))
    }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  // 简单的能力生成器
  const simpleCapabilityArb = fc.oneof(skillCapabilityArb, commandCapabilityArb, mcpCapabilityArb);

  it('Property 24: 单个能力的往返一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        simpleCapabilityArb,
        async (capability) => {
          // 在每次属性测试迭代中创建新的数据库
          const iterationDbPath = path.join(TEST_DATA_DIR, `iter-${Date.now()}-${Math.random()}.db`);
          
          try {
            await fs.remove(iterationDbPath);
          } catch (error) {
            // 忽略删除错误
          }
          
          const iterDbManager = new DatabaseManager(iterationDbPath);
          await iterDbManager.initialize();
          const iterStorageService = new StorageService(iterDbManager);
          
          try {
            // 保存能力
            await iterStorageService.saveCapability(capability);

            // 导出数据
            const exportData = await iterStorageService.exportAll();
            expect(exportData.capabilities).toHaveLength(1);

            // 清空数据库
            const db = iterDbManager.getDatabase();
            const clearTransaction = db.transaction(() => {
              db.exec('DELETE FROM capabilities');
            });
            clearTransaction();

            // 验证数据库已清空
            const emptyCapabilities = await iterStorageService.getAllCapabilities();
            expect(emptyCapabilities).toHaveLength(0);

            // 导入数据
            await iterStorageService.importAll(exportData);

            // 验证数据一致性
            const importedCapabilities = await iterStorageService.getAllCapabilities();
            expect(importedCapabilities).toHaveLength(1);

            const imported = importedCapabilities[0];
            expect(imported.id).toBe(capability.id);
            expect(imported.type).toBe(capability.type);
            expect(imported.name).toBe(capability.name);
            expect(imported.originalDescription).toBe(capability.originalDescription);
            // 处理 null 和 undefined 的情况
            if (capability.chineseDescription === null || capability.chineseDescription === undefined) {
              expect(imported.chineseDescription).toBeNull();
            } else if (capability.chineseDescription === '') {
              // 空字符串在数据库中存储为 null
              expect(imported.chineseDescription).toBeNull();
            } else {
              expect(imported.chineseDescription).toBe(capability.chineseDescription);
            }
            expect(imported.translationStatus).toBe(capability.translationStatus);
            expect(imported.sourcePlugin).toBe(capability.sourcePlugin);
          } finally {
            iterDbManager.close();
            try {
              await fs.remove(iterationDbPath);
            } catch (error) {
              // 忽略删除错误
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it('Property 24: 空数据的往返一致性', async () => {
    // 导出空数据
    const exportData = await storageService.exportAll();
    expect(exportData.capabilities).toHaveLength(0);
    expect(exportData.templates).toHaveLength(0);
    expect(exportData.projects).toHaveLength(0);

    // 导入空数据（应该不会出错）
    await storageService.importAll(exportData);

    // 验证仍然是空的
    const capabilities = await storageService.getAllCapabilities();
    const templates = await storageService.getAllTemplates();
    const projects = await storageService.getAllProjects();

    expect(capabilities).toHaveLength(0);
    expect(templates).toHaveLength(0);
    expect(projects).toHaveLength(0);
  });

  it('Property 24: 多个能力的往返一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(simpleCapabilityArb, { minLength: 1, maxLength: 3 }),
        async (capabilities) => {
          // 在每次属性测试迭代中创建新的数据库
          const iterationDbPath = path.join(TEST_DATA_DIR, `multi-iter-${Date.now()}-${Math.random()}.db`);
          
          try {
            await fs.remove(iterationDbPath);
          } catch (error) {
            // 忽略删除错误
          }
          
          const iterDbManager = new DatabaseManager(iterationDbPath);
          await iterDbManager.initialize();
          const iterStorageService = new StorageService(iterDbManager);
          
          try {
            // 保存所有能力
            for (const capability of capabilities) {
              await iterStorageService.saveCapability(capability);
            }

            // 导出数据
            const exportData = await iterStorageService.exportAll();
            expect(exportData.capabilities).toHaveLength(capabilities.length);

            // 清空数据库
            const db = iterDbManager.getDatabase();
            const clearTransaction = db.transaction(() => {
              db.exec('DELETE FROM capabilities');
            });
            clearTransaction();

            // 验证数据库已清空
            const emptyCapabilities = await iterStorageService.getAllCapabilities();
            expect(emptyCapabilities).toHaveLength(0);

            // 导入数据
            await iterStorageService.importAll(exportData);

            // 验证数据一致性
            const importedCapabilities = await iterStorageService.getAllCapabilities();
            expect(importedCapabilities).toHaveLength(capabilities.length);

            // 按ID排序比较
            const originalSorted = capabilities.sort((a, b) => a.id.localeCompare(b.id));
            const importedSorted = importedCapabilities.sort((a, b) => a.id.localeCompare(b.id));

            for (let i = 0; i < originalSorted.length; i++) {
              const original = originalSorted[i];
              const imported = importedSorted[i];

              expect(imported.id).toBe(original.id);
              expect(imported.type).toBe(original.type);
              expect(imported.name).toBe(original.name);
            }
          } finally {
            iterDbManager.close();
            try {
              await fs.remove(iterationDbPath);
            } catch (error) {
              // 忽略删除错误
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });
});