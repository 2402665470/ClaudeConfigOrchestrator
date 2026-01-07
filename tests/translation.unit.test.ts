import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { DatabaseManager } from '../src/main/services/database';
import { TranslationService } from '../src/main/services/TranslationService';

describe('TranslationService Unit Tests', () => {
  let dbManager: DatabaseManager;
  let translationService: TranslationService;
  let testDbPath: string;

  beforeEach(async () => {
    // 创建测试数据库
    const testDir = path.join(os.tmpdir(), 'translation-test');
    await fs.ensureDir(testDir);
    testDbPath = path.join(testDir, `test-${Date.now()}.db`);
    
    dbManager = new DatabaseManager(testDbPath);
    await dbManager.initialize();
    translationService = new TranslationService(dbManager);
  });

  afterEach(async () => {
    dbManager.close();
    try {
      await fs.remove(testDbPath);
    } catch (error) {
      // 忽略删除错误
    }
  });

  describe('配置管理', () => {
    it('应该有默认配置', () => {
      const config = translationService.getConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.provider).toBe('gemini');
      expect(config.apiKey).toBe('');
      expect(config.model).toBe('gemini-pro');
      expect(config.batchSize).toBe(10);
      expect(config.rateLimit).toBe(60);
    });

    it('应该能够更新配置', () => {
      translationService.updateConfig({
        enabled: true,
        apiKey: 'test-api-key',
        batchSize: 5
      });
      
      const config = translationService.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.apiKey).toBe('test-api-key');
      expect(config.batchSize).toBe(5);
      expect(config.model).toBe('gemini-pro'); // 未更新的字段保持不变
    });
  });

  describe('配置状态检查', () => {
    it('应该检测未配置状态', async () => {
      const status = await translationService.checkConfig();
      
      expect(status.configured).toBe(false);
      expect(status.enabled).toBe(false);
      expect(status.error).toBe('未配置 API Key');
    });

    it('应该检测已配置但未启用状态', async () => {
      translationService.updateConfig({
        apiKey: 'test-key',
        enabled: false
      });
      
      const status = await translationService.checkConfig();
      
      expect(status.configured).toBe(true);
      expect(status.enabled).toBe(false);
      expect(status.provider).toBe('gemini');
    });

    it('应该检测已配置且已启用状态', async () => {
      translationService.updateConfig({
        apiKey: 'test-key',
        enabled: true
      });
      
      const status = await translationService.checkConfig();
      
      expect(status.configured).toBe(true);
      expect(status.enabled).toBe(true);
      expect(status.provider).toBe('gemini');
    });
  });

  describe('翻译功能', () => {
    beforeEach(() => {
      // 启用翻译服务
      translationService.updateConfig({
        enabled: true,
        apiKey: 'test-api-key'
      });
    });

    it('应该翻译单个文本', async () => {
      const result = await translationService.translate('This is a command', {
        capabilityType: 'command',
        capabilityName: 'test-command'
      });
      
      expect(result).toContain('命令');
    });

    it('应该缓存翻译结果', async () => {
      const text = 'This is a skill';
      const context = {
        capabilityType: 'skill' as const,
        capabilityName: 'test-skill'
      };
      
      // 第一次翻译
      const result1 = await translationService.translate(text, context);
      
      // 第二次翻译应该使用缓存
      const result2 = await translationService.translate(text, context);
      
      expect(result1).toBe(result2);
      expect(result1).toContain('技能');
    });

    it('应该处理批量翻译', async () => {
      const items = [
        {
          id: '1',
          text: 'This is a command',
          context: { capabilityType: 'command' as const, capabilityName: 'cmd1' }
        },
        {
          id: '2',
          text: 'This is a skill',
          context: { capabilityType: 'skill' as const, capabilityName: 'skill1' }
        }
      ];
      
      const results = await translationService.translateBatch(items);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].translated).toContain('命令');
      expect(results[1].success).toBe(true);
      expect(results[1].translated).toContain('技能');
    });

    it('未配置时应该返回错误', async () => {
      translationService.updateConfig({ enabled: false });
      
      await expect(translationService.translate('test', {
        capabilityType: 'command',
        capabilityName: 'test'
      })).rejects.toThrow('翻译服务未启用');
    });

    it('批量翻译未配置时应该返回错误结果', async () => {
      translationService.updateConfig({ enabled: false });
      
      const items = [{
        id: '1',
        text: 'test',
        context: { capabilityType: 'command' as const, capabilityName: 'test' }
      }];
      
      const results = await translationService.translateBatch(items);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('翻译服务未启用');
    });
  });

  describe('缓存管理', () => {
    it('应该获取缓存统计', async () => {
      const stats = await translationService.getCacheStats();
      
      expect(stats.entries).toBe(0);
      expect(stats.sizeBytes).toBe(0);
      expect(typeof stats.hitRate).toBe('number');
    });

    it('应该清除缓存', async () => {
      // 启用翻译服务并添加一些缓存
      translationService.updateConfig({
        enabled: true,
        apiKey: 'test-api-key'
      });
      
      await translationService.translate('test text', {
        capabilityType: 'command',
        capabilityName: 'test'
      });
      
      // 验证缓存存在
      let stats = await translationService.getCacheStats();
      expect(stats.entries).toBeGreaterThan(0);
      
      // 清除缓存
      await translationService.clearCache();
      
      // 验证缓存已清除
      stats = await translationService.getCacheStats();
      expect(stats.entries).toBe(0);
    });
  });
});