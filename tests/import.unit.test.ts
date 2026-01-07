import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ImportService } from '../src/main/services/ImportService';

describe('ImportService Unit Tests', () => {
  let importService: ImportService;
  let tempDir: string;

  beforeEach(async () => {
    importService = new ImportService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'import-service-test-'));
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('市场地址解析', () => {
    it('应该解析 Claude 命令格式', async () => {
      const plugins = await importService.parseMarketplace('anthropics/claude-code');
      
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('claude-code');
      expect(plugins[0].author).toBe('anthropics');
    });

    it('应该解析 GitHub URL 格式', async () => {
      const plugins = await importService.parseMarketplace('https://github.com/anthropics/claude-code');
      
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('claude-code');
      expect(plugins[0].author).toBe('anthropics');
    });

    it('应该拒绝无效的地址格式', async () => {
      await expect(importService.parseMarketplace('invalid-address')).rejects.toThrow('无效的市场地址格式');
    });
  });

  describe('本地目录导入', () => {
    it('应该成功导入有效的插件目录', async () => {
      // 创建测试插件目录结构
      const pluginDir = path.join(tempDir, 'test-plugin');
      const claudeDir = path.join(pluginDir, '.claude');
      const commandsDir = path.join(claudeDir, 'commands');
      
      await fs.ensureDir(commandsDir);
      
      // 创建 package.json
      await fs.writeJson(path.join(pluginDir, 'package.json'), {
        name: 'test-plugin',
        version: '1.0.0',
        description: '测试插件',
        author: 'test-author'
      });
      
      // 创建一个命令文件
      await fs.writeFile(path.join(commandsDir, 'test-command.md'), `---
name: test-command
description: 测试命令
---

# 测试命令

这是一个测试命令。
`);

      const result = await importService.importFromLocal(pluginDir);
      
      expect(result.info.name).toBe('test-plugin');
      expect(result.info.version).toBe('1.0.0');
      expect(result.info.description).toBe('测试插件');
      expect(result.info.author).toBe('test-author');
      expect(result.localPath).toBe(pluginDir);
      expect(result.capabilities).toHaveLength(1);
      expect(result.capabilities[0].type).toBe('command');
      expect(result.capabilities[0].name).toBe('test-command');
    });

    it('应该拒绝不存在的目录', async () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      
      await expect(importService.importFromLocal(nonExistentDir)).rejects.toThrow('本地目录不存在');
    });

    it('应该拒绝没有 .claude 目录的目录', async () => {
      const invalidDir = path.join(tempDir, 'invalid-plugin');
      await fs.ensureDir(invalidDir);
      
      await expect(importService.importFromLocal(invalidDir)).rejects.toThrow('目录中未找到 .claude 配置目录');
    });

    it('应该处理没有 package.json 的插件', async () => {
      // 创建测试插件目录结构（没有 package.json）
      const pluginDir = path.join(tempDir, 'no-package-plugin');
      const claudeDir = path.join(pluginDir, '.claude');
      const commandsDir = path.join(claudeDir, 'commands');
      
      await fs.ensureDir(commandsDir);
      
      // 创建一个命令文件
      await fs.writeFile(path.join(commandsDir, 'simple-command.md'), `# 简单命令

这是一个简单的命令。
`);

      const result = await importService.importFromLocal(pluginDir);
      
      expect(result.info.name).toBe('no-package-plugin');
      expect(result.info.version).toBe('1.0.0');
      expect(result.info.description).toBe('本地插件: no-package-plugin');
      expect(result.capabilities).toHaveLength(1);
      expect(result.capabilities[0].type).toBe('command');
    });
  });

  describe('HTTP 和 ZIP 导入', () => {
    it('HTTP 导入应该处理无效 URL', async () => {
      await expect(importService.importFromHttp('invalid-url')).rejects.toThrow('无效的 HTTP 链接格式');
    });

    it('HTTP 导入应该处理网络错误', async () => {
      await expect(importService.importFromHttp('https://example.com/nonexistent.zip')).rejects.toThrow();
    });

    it('ZIP 导入应该处理不存在的文件', async () => {
      await expect(importService.importFromZip('/path/to/nonexistent.zip')).rejects.toThrow('ZIP 文件不存在');
    });
  });
});