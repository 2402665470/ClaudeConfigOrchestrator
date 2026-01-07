import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs-extra';
import { DatabaseManager } from '../src/main/services/database';
import { StorageService } from '../src/main/services/StorageService';
import { TEST_DATA_DIR } from './setup';

describe('Debug Tests', () => {
  it('应该创建空的数据库', async () => {
    const testDbPath = path.join(TEST_DATA_DIR, `debug-${Date.now()}.db`);
    
    // 确保文件不存在
    await fs.remove(testDbPath);
    
    const dbManager = new DatabaseManager(testDbPath);
    await dbManager.initialize();
    const storageService = new StorageService(dbManager);
    
    // 检查数据库是否为空
    const capabilities = await storageService.getAllCapabilities();
    const templates = await storageService.getAllTemplates();
    const projects = await storageService.getAllProjects();
    
    console.log('Capabilities count:', capabilities.length);
    console.log('Templates count:', templates.length);
    console.log('Projects count:', projects.length);
    
    expect(capabilities).toHaveLength(0);
    expect(templates).toHaveLength(0);
    expect(projects).toHaveLength(0);
    
    dbManager.close();
    await fs.remove(testDbPath);
  });

  it('应该能够清空数据库', async () => {
    const testDbPath = path.join(TEST_DATA_DIR, `debug2-${Date.now()}.db`);
    
    // 确保文件不存在
    await fs.remove(testDbPath);
    
    const dbManager = new DatabaseManager(testDbPath);
    await dbManager.initialize();
    const storageService = new StorageService(dbManager);
    
    // 添加一些测试数据
    await storageService.saveCapability({
      id: 'test-1',
      type: 'command',
      name: 'Test Command',
      originalDescription: 'Test',
      translationStatus: 'pending',
      sourcePlugin: 'test',
      content: { type: 'command', filePath: '/test.md', markdown: '# Test' },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 验证数据已添加
    let capabilities = await storageService.getAllCapabilities();
    expect(capabilities).toHaveLength(1);
    
    // 清空数据库
    const db = dbManager.getDatabase();
    const clearTransaction = db.transaction(() => {
      db.exec('DELETE FROM capabilities');
      db.exec('DELETE FROM templates');
      db.exec('DELETE FROM projects');
    });
    clearTransaction();
    
    // 验证数据已清空
    capabilities = await storageService.getAllCapabilities();
    const templates = await storageService.getAllTemplates();
    const projects = await storageService.getAllProjects();
    
    console.log('After clear - Capabilities count:', capabilities.length);
    console.log('After clear - Templates count:', templates.length);
    console.log('After clear - Projects count:', projects.length);
    
    expect(capabilities).toHaveLength(0);
    expect(templates).toHaveLength(0);
    expect(projects).toHaveLength(0);
    
    dbManager.close();
    await fs.remove(testDbPath);
  });
});