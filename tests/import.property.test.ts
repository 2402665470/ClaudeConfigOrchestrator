/**
 * **Feature: claude-config-orchestrator, Property 1: 市场地址解析一致性**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * **Feature: claude-config-orchestrator, Property 2: 无效地址错误处理**
 * **Validates: Requirements 1.6**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ImportService } from '../src/main/services/ImportService';

describe('ImportService Property Tests', () => {
  let importService: ImportService;
  let tempDir: string;

  beforeEach(async () => {
    importService = new ImportService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'import-property-test-'));
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  /**
   * **Feature: claude-config-orchestrator, Property 1: 市场地址解析一致性**
   * For any 有效的市场地址（Claude 命令格式或 GitHub URL），解析器应返回相同的地址解析结果
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  it('should parse marketplace addresses consistently', async () => {
    await fc.assert(
      fc.property(
        // 生成有效的 owner/repo 组合
        fc.record({
          owner: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_.-]+$/.test(s)),
          repo: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_.-]+$/.test(s))
        }),
        
        ({ owner, repo }) => {
          // 测试地址解析逻辑（不进行实际的 API 调用）
          const claudeAddress = `${owner}/${repo}`;
          const githubAddress = `https://github.com/${owner}/${repo}`;
          
          // 使用私有方法测试地址解析（通过反射访问）
          const parseAddress = (importService as any).parseMarketplaceAddress.bind(importService);
          
          const claudeParsed = parseAddress(claudeAddress);
          const githubParsed = parseAddress(githubAddress);
          
          // 验证两种格式都能正确解析
          expect(claudeParsed).not.toBeNull();
          expect(githubParsed).not.toBeNull();
          
          // 验证解析结果的一致性
          expect(claudeParsed.owner).toBe(owner);
          expect(claudeParsed.repo).toBe(repo);
          expect(githubParsed.owner).toBe(owner);
          expect(githubParsed.repo).toBe(repo);
          
          // 验证类型标识正确
          expect(claudeParsed.type).toBe('claude-command');
          expect(githubParsed.type).toBe('github-url');
          
          // 验证原始地址保存正确
          expect(claudeParsed.originalAddress).toBe(claudeAddress);
          expect(githubParsed.originalAddress).toBe(githubAddress);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 2: 无效地址错误处理**
   * For any 无效或格式错误的市场地址，系统应返回明确的错误信息而不是崩溃
   * **Validates: Requirements 1.6**
   */
  it('should handle invalid addresses gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成各种无效地址格式
        fc.oneof(
          // 空字符串
          fc.constant(''),
          // 只有斜杠
          fc.constant('/'),
          // 多个斜杠
          fc.constant('owner//repo'),
          // 无效字符
          fc.string().filter(s => s.length > 0 && !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(s) && !s.startsWith('https://github.com/')),
          // 不完整的 GitHub URL
          fc.constant('https://github.com/'),
          fc.constant('https://github.com/owner'),
          // 错误的域名
          fc.constant('https://gitlab.com/owner/repo'),
          // 包含特殊字符的地址
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /[^a-zA-Z0-9_\-\/\.\:\/]/.test(s))
        ),
        
        async (invalidAddress) => {
          // 验证无效地址会抛出明确的错误
          await expect(importService.parseMarketplace(invalidAddress)).rejects.toThrow();
          
          try {
            await importService.parseMarketplace(invalidAddress);
            // 如果没有抛出错误，测试失败
            expect(true).toBe(false);
          } catch (error) {
            // 验证错误信息是明确的
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('无效的市场地址格式');
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 22: 缓存命中正确性**
   * For any 已缓存的插件，再次导入时应使用缓存而不重新下载，且返回的内容应与首次下载一致
   * **Validates: Requirements 12.1**
   */
  it('should use cache correctly for repeated downloads', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成插件信息
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          version: fc.tuple(fc.integer({ min: 0, max: 9 }), fc.integer({ min: 0, max: 9 }), fc.integer({ min: 0, max: 9 }))
            .map(([major, minor, patch]) => `${major}.${minor}.${patch}`),
          description: fc.string({ minLength: 1, maxLength: 100 }),
          author: fc.string({ minLength: 1, maxLength: 30 }),
          repository: fc.string({ minLength: 1, maxLength: 50 }).map(s => `https://github.com/test/${s}`)
        }),
        
        async (pluginInfo) => {
          // 创建一个模拟的插件目录用于测试缓存
          const testPluginDir = path.join(tempDir, `test-plugin-${Date.now()}-${Math.random().toString(36).substring(7)}`);
          const claudeDir = path.join(testPluginDir, '.claude');
          const commandsDir = path.join(claudeDir, 'commands');
          
          await fs.ensureDir(commandsDir);
          
          // 创建 package.json
          await fs.writeJson(path.join(testPluginDir, 'package.json'), pluginInfo);
          
          // 创建一个命令文件
          const commandContent = `---
name: test-command
description: 测试命令
---

# 测试命令

这是一个测试命令。
`;
          await fs.writeFile(path.join(commandsDir, 'test-command.md'), commandContent);
          
          // 测试缓存机制的内部方法
          const checkCache = (importService as any).checkCache.bind(importService);
          const saveToCache = (importService as any).saveToCache.bind(importService);
          
          // 首次检查缓存应该返回 null
          const initialCacheCheck = await checkCache(pluginInfo);
          expect(initialCacheCheck).toBeNull();
          
          // 保存到缓存
          const cachedPath = await saveToCache(pluginInfo, testPluginDir);
          expect(cachedPath).toBeTruthy();
          expect(await fs.pathExists(cachedPath)).toBe(true);
          
          // 再次检查缓存应该返回缓存路径
          const secondCacheCheck = await checkCache(pluginInfo);
          expect(secondCacheCheck).toBe(cachedPath);
          
          // 验证缓存的内容与原始内容一致
          const originalPackageJson = await fs.readJson(path.join(testPluginDir, 'package.json'));
          const cachedPackageJson = await fs.readJson(path.join(cachedPath, 'package.json'));
          expect(cachedPackageJson).toEqual(originalPackageJson);
          
          // 验证命令文件也被正确缓存
          const originalCommand = await fs.readFile(path.join(commandsDir, 'test-command.md'), 'utf8');
          const cachedCommand = await fs.readFile(path.join(cachedPath, '.claude', 'commands', 'test-command.md'), 'utf8');
          expect(cachedCommand).toBe(originalCommand);
        }
      ),
      { numRuns: 5, timeout: 10000 }
    );
  }, 30000);

  /**
   * **Feature: claude-config-orchestrator, Property 3: 本地导入路径处理**
   * For any 有效的本地插件目录，导入应该成功并返回正确的插件信息
   */
  it('should handle local plugin directories correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成插件信息
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          version: fc.tuple(fc.integer({ min: 0, max: 99 }), fc.integer({ min: 0, max: 99 }), fc.integer({ min: 0, max: 99 }))
            .map(([major, minor, patch]) => `${major}.${minor}.${patch}`),
          description: fc.string({ minLength: 1, maxLength: 100 }),
          author: fc.option(fc.string({ minLength: 1, maxLength: 30 })),
          hasPackageJson: fc.boolean(),
          commandCount: fc.integer({ min: 0, max: 3 })
        }),
        
        async (pluginInfo) => {
          // 创建测试插件目录
          const pluginDir = path.join(tempDir, `plugin-${Date.now()}-${Math.random().toString(36).substring(7)}`);
          const claudeDir = path.join(pluginDir, '.claude');
          const commandsDir = path.join(claudeDir, 'commands');
          
          await fs.ensureDir(commandsDir);
          
          // 可选创建 package.json
          if (pluginInfo.hasPackageJson) {
            const packageJson: any = {
              name: pluginInfo.name,
              version: pluginInfo.version,
              description: pluginInfo.description
            };
            if (pluginInfo.author) {
              packageJson.author = pluginInfo.author;
            }
            await fs.writeJson(path.join(pluginDir, 'package.json'), packageJson);
          }
          
          // 创建命令文件
          for (let i = 0; i < pluginInfo.commandCount; i++) {
            const commandContent = `---
name: command-${i}
description: 测试命令 ${i}
---

# 命令 ${i}

这是测试命令 ${i}。
`;
            await fs.writeFile(path.join(commandsDir, `command-${i}.md`), commandContent);
          }
          
          // 导入插件
          const result = await importService.importFromLocal(pluginDir);
          
          // 验证插件信息
          if (pluginInfo.hasPackageJson) {
            expect(result.info.name).toBe(pluginInfo.name);
            expect(result.info.version).toBe(pluginInfo.version);
            expect(result.info.description).toBe(pluginInfo.description);
            if (pluginInfo.author) {
              expect(result.info.author).toBe(pluginInfo.author);
            }
          } else {
            // 没有 package.json 时使用目录名
            expect(result.info.name).toBe(path.basename(pluginDir));
            expect(result.info.version).toBe('1.0.0');
          }
          
          // 验证本地路径
          expect(result.localPath).toBe(pluginDir);
          
          // 验证能力数量
          expect(result.capabilities).toHaveLength(pluginInfo.commandCount);
          
          // 验证每个能力的类型
          result.capabilities.forEach(capability => {
            expect(capability.type).toBe('command');
            expect(capability.name).toMatch(/^command-\d+$/);
          });
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  });
});