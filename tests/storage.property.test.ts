/**
 * **Feature: claude-config-orchestrator, Property 24: 数据持久化往返一致性**
 * **Validates: Requirements 14.4, 14.5**
 * 
 * 测试数据持久化的往返一致性：导出后再导入应恢复所有数据，包括自定义的中文描述
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs-extra';
import { DatabaseManager } from '../src/main/services/database';
import { StorageService } from '../src/main/services/StorageService';
import { 
  Capability, 
  ConfigTemplate, 
  Project, 
  CapabilityType, 
  TranslationStatus,
  CapabilityContent 
} from '../src/common/types';
import { TEST_DATA_DIR } from './setup';

describe('StorageService Property Tests', () => {
  let dbManager: DatabaseManager;
  let storageService: StorageService;
  let testDbPath: string;

  beforeEach(async () => {
    // 确保测试目录存在
    await fs.ensureDir(TEST_DATA_DIR);
    
    // 为每个测试创建完全独立的数据库，使用更精确的时间戳和随机数
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    testDbPath = path.join(TEST_DATA_DIR, `property-test-${uniqueId}.db`);
    
    // 确保测试数据库文件不存在
    try {
      await fs.remove(testDbPath);
    } catch (error) {
      // 忽略删除错误
    }
    
    // 等待一小段时间确保文件系统操作完成
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // 创建测试用的数据库管理器
    dbManager = new DatabaseManager(testDbPath);
    
    await dbManager.initialize();
    storageService = new StorageService(dbManager);
    
    // 验证数据库是空的
    const db = dbManager.getDatabase();
    const counts = {
      capabilities: db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as { count: number },
      templates: db.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number },
      projects: db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }
    };
    
    // 如果数据库不是空的，强制清空
    if (counts.capabilities.count > 0 || counts.templates.count > 0 || counts.projects.count > 0) {
      const clearTransaction = db.transaction(() => {
        db.exec('DELETE FROM capabilities');
        db.exec('DELETE FROM templates');
        db.exec('DELETE FROM projects');
        db.exec('DELETE FROM backups');
        db.exec('DELETE FROM translation_cache');
        db.exec('DELETE FROM plugin_cache');
      });
      clearTransaction();
    }
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

  const capabilityContentArb = fc.oneof(
    fc.record({
      type: fc.constant('skill' as const),
      folderPath: fc.string({ minLength: 1, maxLength: 100 }),
      files: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 })
    }),
    fc.record({
      type: fc.constant('command' as const),
      filePath: fc.string({ minLength: 1, maxLength: 100 }),
      markdown: fc.string({ maxLength: 1000 })
    }),
    fc.record({
      type: fc.constant('hook' as const),
      config: fc.dictionary(fc.string(), fc.anything())
    }),
    fc.record({
      type: fc.constant('mcp' as const),
      serverName: fc.string({ minLength: 1, maxLength: 50 }),
      config: fc.record({
        command: fc.string({ minLength: 1, maxLength: 100 }),
        args: fc.option(fc.array(fc.string())),
        env: fc.option(fc.dictionary(fc.string(), fc.string()))
      })
    }),
    fc.record({
      type: fc.constant('setting' as const),
      key: fc.string({ minLength: 1, maxLength: 50 }),
      config: fc.dictionary(fc.string(), fc.anything())
    }),
    fc.record({
      type: fc.constant('agent' as const),
      filePath: fc.string({ minLength: 1, maxLength: 100 }),
      markdown: fc.string({ maxLength: 1000 })
    })
  );

  // 创建一个非空字符串生成器
  const nonEmptyString = (options: { minLength?: number; maxLength?: number } = {}) => 
    fc.string({ minLength: options.minLength || 1, maxLength: options.maxLength || 100 })
      .filter(s => s.trim().length > 0);

  // 创建一个 JSON 安全的值生成器（避免 undefined）
  const jsonSafeValue = fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null)
  );

  // 创建 metadata 生成器
  const metadataArb = fc.record({
    frontmatter: fc.option(fc.dictionary(fc.string(), jsonSafeValue)),
    dependencies: fc.option(fc.array(fc.string())),
    tags: fc.option(fc.array(fc.string()))
  });

  // 创建有效日期生成器
  const validDateArb = fc.integer({ min: 1577836800000, max: 1893456000000 }).map(timestamp => new Date(timestamp));

  const capabilityArb = fc.oneof(
    // Skill capability
    fc.record({
      id: fc.uuid().map(uuid => `skill-${uuid}-${Math.random().toString(36).substring(2)}`),
      type: fc.constant('skill' as const),
      name: nonEmptyString({ maxLength: 100 }),
      originalDescription: fc.string({ maxLength: 500 }),
      chineseDescription: fc.option(fc.string({ maxLength: 500 })),
      translationStatus: translationStatusArb,
      sourcePlugin: nonEmptyString({ maxLength: 100 }),
      version: fc.option(nonEmptyString({ maxLength: 20 })),
      author: fc.option(nonEmptyString({ maxLength: 100 })),
      content: fc.record({
        type: fc.constant('skill' as const),
        folderPath: nonEmptyString({ maxLength: 100 }),
        files: fc.array(nonEmptyString({ maxLength: 50 }), { minLength: 1, maxLength: 10 })
      }),
      metadata: metadataArb,
      createdAt: validDateArb,
      updatedAt: validDateArb
    }),
    // Command capability
    fc.record({
      id: fc.uuid().map(uuid => `command-${uuid}-${Math.random().toString(36).substring(2)}`),
      type: fc.constant('command' as const),
      name: nonEmptyString({ maxLength: 100 }),
      originalDescription: fc.string({ maxLength: 500 }),
      chineseDescription: fc.option(fc.string({ maxLength: 500 })),
      translationStatus: translationStatusArb,
      sourcePlugin: nonEmptyString({ maxLength: 100 }),
      version: fc.option(nonEmptyString({ maxLength: 20 })),
      author: fc.option(nonEmptyString({ maxLength: 100 })),
      content: fc.record({
        type: fc.constant('command' as const),
        filePath: nonEmptyString({ maxLength: 100 }),
        markdown: fc.string({ maxLength: 1000 })
      }),
      metadata: metadataArb,
      createdAt: validDateArb,
      updatedAt: validDateArb
    }),
    // MCP capability
    fc.record({
      id: fc.uuid().map(uuid => `mcp-${uuid}-${Math.random().toString(36).substring(2)}`),
      type: fc.constant('mcp' as const),
      name: nonEmptyString({ maxLength: 100 }),
      originalDescription: fc.string({ maxLength: 500 }),
      chineseDescription: fc.option(fc.string({ maxLength: 500 })),
      translationStatus: translationStatusArb,
      sourcePlugin: nonEmptyString({ maxLength: 100 }),
      version: fc.option(nonEmptyString({ maxLength: 20 })),
      author: fc.option(nonEmptyString({ maxLength: 100 })),
      content: fc.record({
        type: fc.constant('mcp' as const),
        serverName: nonEmptyString({ maxLength: 50 }),
        config: fc.record({
          command: nonEmptyString({ maxLength: 100 }),
          args: fc.option(fc.array(fc.string())),
          env: fc.option(fc.dictionary(fc.string(), fc.string()))
        })
      }),
      metadata: metadataArb,
      createdAt: validDateArb,
      updatedAt: validDateArb
    })
  );

  const templateArb = fc.record({
    id: fc.uuid().map(uuid => `template-${uuid}-${Math.random().toString(36).substring(2)}`),
    name: nonEmptyString({ maxLength: 100 }),
    description: fc.string({ maxLength: 500 }),
    capabilityIds: fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
    createdAt: validDateArb,
    updatedAt: validDateArb
  });

  const projectArb = fc.record({
    id: fc.uuid().map(uuid => `project-${uuid}-${Math.random().toString(36).substring(2)}`),
    name: nonEmptyString({ maxLength: 100 }),
    path: fc.uuid().map(uuid => `project-path-${uuid}-${Math.random().toString(36).substring(2)}`), // 使用UUID+随机数确保路径唯一
    hidden: fc.boolean(),
    lastInjectedAt: fc.option(validDateArb),
    createdAt: validDateArb
  });

  it('Property 24: 数据持久化往返一致性 - 能力数据', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(capabilityArb, { minLength: 1, maxLength: 3 }),
        async (capabilities) => {
          // 清空数据库确保测试隔离
          const initDb = dbManager.getDatabase();
          initDb.exec('DELETE FROM capabilities');
          initDb.exec('DELETE FROM templates');
          initDb.exec('DELETE FROM projects');
          
          // 验证数据库是空的
          const initialCapabilities = await storageService.getAllCapabilities();
          expect(initialCapabilities).toHaveLength(0);

          // 保存能力数据
          for (const capability of capabilities) {
            await storageService.saveCapability(capability);
          }

          // 验证保存成功
          const savedCapabilities = await storageService.getAllCapabilities();
          expect(savedCapabilities).toHaveLength(capabilities.length);

          // 导出数据
          const exportData = await storageService.exportAll();
          expect(exportData.capabilities).toHaveLength(capabilities.length);

          // 清空数据库
          const clearDb1 = dbManager.getDatabase();
          clearDb1.exec('DELETE FROM capabilities');

          // 验证数据库已清空
          const emptyCapabilities = await storageService.getAllCapabilities();
          expect(emptyCapabilities).toHaveLength(0);

          // 导入数据
          await storageService.importAll(exportData);

          // 验证数据一致性
          const importedCapabilities = await storageService.getAllCapabilities();
          
          expect(importedCapabilities).toHaveLength(capabilities.length);

          // 按 ID 排序以便比较
          const originalSorted = capabilities.sort((a, b) => a.id.localeCompare(b.id));
          const importedSorted = importedCapabilities.sort((a, b) => a.id.localeCompare(b.id));

          for (let i = 0; i < originalSorted.length; i++) {
            const original = originalSorted[i];
            const imported = importedSorted[i];

            expect(imported.id).toBe(original.id);
            expect(imported.type).toBe(original.type);
            expect(imported.name).toBe(original.name);
            expect(imported.originalDescription).toBe(original.originalDescription);
            // 处理 null 和空字符串的等价性
            const normalizeDescription = (desc: string | null) => desc === '' ? null : desc;
            expect(normalizeDescription(imported.chineseDescription)).toBe(normalizeDescription(original.chineseDescription));
            expect(imported.translationStatus).toBe(original.translationStatus);
            expect(imported.sourcePlugin).toBe(original.sourcePlugin);
            expect(imported.version).toBe(original.version);
            expect(imported.author).toBe(original.author);
            expect(imported.content).toEqual(original.content);
            expect(imported.metadata).toEqual(original.metadata);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('Property 24: 数据持久化往返一致性 - 模板数据', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(templateArb, { minLength: 1, maxLength: 10 }),
        async (templates) => {
          // 清空数据库确保测试隔离
          const initDb2 = dbManager.getDatabase();
          initDb2.exec('DELETE FROM capabilities');
          initDb2.exec('DELETE FROM templates');
          initDb2.exec('DELETE FROM projects');
          
          // 保存模板数据
          for (const template of templates) {
            await storageService.saveTemplate(template);
          }

          // 导出数据
          const exportData = await storageService.exportAll();

          // 清空数据库
          const clearDb2 = dbManager.getDatabase();
          clearDb2.exec('DELETE FROM templates');

          // 导入数据
          await storageService.importAll(exportData);

          // 验证数据一致性
          const importedTemplates = await storageService.getAllTemplates();
          
          expect(importedTemplates).toHaveLength(templates.length);

          // 按 ID 排序以便比较
          const originalSorted = templates.sort((a, b) => a.id.localeCompare(b.id));
          const importedSorted = importedTemplates.sort((a, b) => a.id.localeCompare(b.id));

          for (let i = 0; i < originalSorted.length; i++) {
            const original = originalSorted[i];
            const imported = importedSorted[i];

            expect(imported.id).toBe(original.id);
            expect(imported.name).toBe(original.name);
            expect(imported.description).toBe(original.description);
            expect(imported.capabilityIds).toEqual(original.capabilityIds);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 24: 数据持久化往返一致性 - 项目数据', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(projectArb, { minLength: 1, maxLength: 10 }),
        async (projects) => {
          // 清空数据库确保测试隔离
          const initDb3 = dbManager.getDatabase();
          initDb3.exec('DELETE FROM capabilities');
          initDb3.exec('DELETE FROM templates');
          initDb3.exec('DELETE FROM projects');
          
          // 保存项目数据
          for (const project of projects) {
            await storageService.saveProject(project);
          }

          // 导出数据
          const exportData = await storageService.exportAll();

          // 清空数据库
          const clearDb3 = dbManager.getDatabase();
          clearDb3.exec('DELETE FROM projects');

          // 导入数据
          await storageService.importAll(exportData);

          // 验证数据一致性
          const importedProjects = await storageService.getAllProjects();
          
          // 注意：getAllProjects 只返回非隐藏的项目
          const visibleProjects = projects.filter(p => !p.hidden);
          expect(importedProjects).toHaveLength(visibleProjects.length);

          // 按 ID 排序以便比较
          const originalSorted = visibleProjects.sort((a, b) => a.id.localeCompare(b.id));
          const importedSorted = importedProjects.sort((a, b) => a.id.localeCompare(b.id));

          for (let i = 0; i < originalSorted.length; i++) {
            const original = originalSorted[i];
            const imported = importedSorted[i];

            expect(imported.id).toBe(original.id);
            expect(imported.name).toBe(original.name);
            expect(imported.path).toBe(original.path);
            expect(imported.hidden).toBe(original.hidden);
            
            // 日期比较需要特殊处理
            if (original.lastInjectedAt) {
              expect(imported.lastInjectedAt?.getTime()).toBe(original.lastInjectedAt.getTime());
            } else {
              expect(imported.lastInjectedAt).toBeUndefined();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 24: 数据持久化往返一致性 - 综合数据', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          capabilities: fc.array(capabilityArb, { minLength: 0, maxLength: 5 }),
          templates: fc.array(templateArb, { minLength: 0, maxLength: 5 }),
          projects: fc.array(projectArb, { minLength: 0, maxLength: 5 })
        }),
        async ({ capabilities, templates, projects }) => {
          // 清空数据库确保测试隔离
          const initDb4 = dbManager.getDatabase();
          initDb4.exec('DELETE FROM capabilities');
          initDb4.exec('DELETE FROM templates');
          initDb4.exec('DELETE FROM projects');
          
          // 保存所有数据
          for (const capability of capabilities) {
            await storageService.saveCapability(capability);
          }
          for (const template of templates) {
            await storageService.saveTemplate(template);
          }
          for (const project of projects) {
            await storageService.saveProject(project);
          }

          // 导出数据
          const exportData = await storageService.exportAll();

          // 验证导出数据的完整性
          expect(exportData.capabilities).toHaveLength(capabilities.length);
          expect(exportData.templates).toHaveLength(templates.length);
          expect(exportData.projects).toHaveLength(projects.length);
          expect(exportData.version).toBe('1.0.0');
          expect(exportData.exportedAt).toBeInstanceOf(Date);

          // 清空数据库
          const clearDb4 = dbManager.getDatabase();
          clearDb4.exec('DELETE FROM capabilities');
          clearDb4.exec('DELETE FROM templates');
          clearDb4.exec('DELETE FROM projects');

          // 导入数据
          await storageService.importAll(exportData);

          // 验证导入后的数据
          const importedCapabilities = await storageService.getAllCapabilities();
          const importedTemplates = await storageService.getAllTemplates();
          const importedProjects = await storageService.getAllProjects();

          expect(importedCapabilities).toHaveLength(capabilities.length);
          expect(importedTemplates).toHaveLength(templates.length);
          
          // 项目数据只包含非隐藏的
          const visibleProjects = projects.filter(p => !p.hidden);
          expect(importedProjects).toHaveLength(visibleProjects.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});