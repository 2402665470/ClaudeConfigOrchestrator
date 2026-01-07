import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs-extra';
import { DatabaseManager } from '../src/main/services/database';
import { StorageService } from '../src/main/services/StorageService';
import { Capability } from '../src/common/types';
import { TEST_DATA_DIR } from './setup';

describe('StorageService Unit Tests', () => {
  let dbManager: DatabaseManager;
  let storageService: StorageService;
  let testDbPath: string;

  beforeEach(async () => {
    // 为每个测试创建独立的数据库
    testDbPath = path.join(TEST_DATA_DIR, `unit-test-${Date.now()}-${Math.random()}.db`);
    
    // 确保测试数据库文件不存在
    try {
      await fs.remove(testDbPath);
    } catch (error) {
      // 忽略删除错误
    }
    
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

  it('应该能够保存和获取能力', async () => {
    const capability: Capability = {
      id: 'test-capability-1',
      type: 'command',
      name: '测试命令',
      originalDescription: 'Test command description',
      chineseDescription: '测试命令描述',
      translationStatus: 'manually_edited',
      sourcePlugin: 'test-plugin',
      version: '1.0.0',
      author: 'Test Author',
      content: {
        type: 'command',
        filePath: '/path/to/command.md',
        markdown: '# Test Command\n\nThis is a test command.'
      },
      metadata: {
        frontmatter: { title: 'Test Command' },
        dependencies: [],
        tags: ['test']
      },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z')
    };

    // 保存能力
    await storageService.saveCapability(capability);

    // 获取能力
    const retrieved = await storageService.getCapability('test-capability-1');
    
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(capability.id);
    expect(retrieved!.name).toBe(capability.name);
    expect(retrieved!.type).toBe(capability.type);
    expect(retrieved!.chineseDescription).toBe(capability.chineseDescription);
  });

  it('应该能够导出和导入数据', async () => {
    const capability: Capability = {
      id: 'test-capability-2',
      type: 'skill',
      name: '测试技能',
      originalDescription: 'Test skill description',
      chineseDescription: '测试技能描述',
      translationStatus: 'auto_translated',
      sourcePlugin: 'test-plugin',
      content: {
        type: 'skill',
        folderPath: '/path/to/skill',
        files: ['SKILL.md', 'config.json']
      },
      metadata: {},
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z')
    };

    // 保存能力
    await storageService.saveCapability(capability);

    // 导出数据
    const exportData = await storageService.exportAll();
    
    expect(exportData.capabilities).toHaveLength(1);
    expect(exportData.capabilities[0].id).toBe(capability.id);

    // 清空数据库
    const db = dbManager.getDatabase();
    db.exec('DELETE FROM capabilities');

    // 验证数据已清空
    const emptyCapabilities = await storageService.getAllCapabilities();
    expect(emptyCapabilities).toHaveLength(0);

    // 导入数据
    await storageService.importAll(exportData);

    // 验证数据已恢复
    const importedCapabilities = await storageService.getAllCapabilities();
    expect(importedCapabilities).toHaveLength(1);
    expect(importedCapabilities[0].id).toBe(capability.id);
    expect(importedCapabilities[0].name).toBe(capability.name);
  });

  it('应该能够搜索能力', async () => {
    const capabilities: Capability[] = [
      {
        id: 'skill-1',
        type: 'skill',
        name: 'React 组件',
        originalDescription: 'React component helper',
        chineseDescription: 'React 组件助手',
        translationStatus: 'manually_edited',
        sourcePlugin: 'react-plugin',
        content: { type: 'skill', folderPath: '/react', files: ['SKILL.md'] },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'command-1',
        type: 'command',
        name: 'Vue 命令',
        originalDescription: 'Vue command helper',
        chineseDescription: 'Vue 命令助手',
        translationStatus: 'auto_translated',
        sourcePlugin: 'vue-plugin',
        content: { type: 'command', filePath: '/vue.md', markdown: '# Vue' },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 保存能力
    for (const capability of capabilities) {
      await storageService.saveCapability(capability);
    }

    // 按类型搜索
    const skillResults = await storageService.searchCapabilities({ type: 'skill' });
    expect(skillResults).toHaveLength(1);
    expect(skillResults[0].type).toBe('skill');

    // 按关键词搜索
    const reactResults = await storageService.searchCapabilities({ keyword: 'React' });
    expect(reactResults).toHaveLength(1);
    expect(reactResults[0].name).toContain('React');

    // 按源插件搜索
    const vueResults = await storageService.searchCapabilities({ sourcePlugin: 'vue-plugin' });
    expect(vueResults).toHaveLength(1);
    expect(vueResults[0].sourcePlugin).toBe('vue-plugin');
  });

  it('应该能够管理配置模板', async () => {
    const template: ConfigTemplate = {
      id: 'template-1',
      name: '前端开发模板',
      description: '包含 React 和 Vue 相关能力的模板',
      capabilityIds: ['skill-1', 'command-1'],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z')
    };

    // 保存模板
    await storageService.saveTemplate(template);

    // 获取模板
    const retrieved = await storageService.getTemplate('template-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe(template.name);
    expect(retrieved!.capabilityIds).toEqual(template.capabilityIds);

    // 获取所有模板
    const allTemplates = await storageService.getAllTemplates();
    expect(allTemplates).toHaveLength(1);

    // 删除模板
    await storageService.deleteTemplate('template-1');
    const deletedTemplate = await storageService.getTemplate('template-1');
    expect(deletedTemplate).toBeNull();
  });

  it('应该能够管理项目', async () => {
    const project: Project = {
      id: 'project-1',
      name: '我的项目',
      path: '/path/to/project',
      hidden: false,
      lastInjectedAt: new Date('2024-01-01T12:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z')
    };

    // 保存项目
    await storageService.saveProject(project);

    // 获取项目
    const retrieved = await storageService.getProject('project-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe(project.name);
    expect(retrieved!.path).toBe(project.path);
    expect(retrieved!.hidden).toBe(false);

    // 获取所有项目（只返回非隐藏的）
    const allProjects = await storageService.getAllProjects();
    expect(allProjects).toHaveLength(1);

    // 隐藏项目
    project.hidden = true;
    await storageService.saveProject(project);

    // 隐藏的项目不会在 getAllProjects 中返回
    const visibleProjects = await storageService.getAllProjects();
    expect(visibleProjects).toHaveLength(0);

    // 但可以通过 ID 获取
    const hiddenProject = await storageService.getProject('project-1');
    expect(hiddenProject).not.toBeNull();
    expect(hiddenProject!.hidden).toBe(true);
  });

  it('应该能够管理备份', async () => {
    const backup: BackupInfo = {
      id: 'backup-1',
      projectPath: '/path/to/project',
      backupPath: '/path/to/backup',
      capabilities: ['skill-1', 'command-1'],
      createdAt: new Date('2024-01-01T00:00:00.000Z')
    };

    // 保存备份
    await storageService.saveBackup(backup);

    // 获取项目的备份列表
    const backups = await storageService.getBackups('/path/to/project');
    expect(backups).toHaveLength(1);
    expect(backups[0].id).toBe(backup.id);
    expect(backups[0].capabilities).toEqual(backup.capabilities);

    // 获取不存在项目的备份
    const noBackups = await storageService.getBackups('/nonexistent/path');
    expect(noBackups).toHaveLength(0);
  });
});