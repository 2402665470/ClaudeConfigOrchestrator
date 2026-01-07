import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ParserService } from '../src/main/services/ParserService';

describe('Parser Service Frontmatter Property Tests', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-frontmatter-prop-test-' + Date.now() + '-'));
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  /**
   * **Feature: claude-config-orchestrator, Property 5: Frontmatter 元数据提取**
   * For any 包含 frontmatter 的能力文件，解析器应正确提取名称、描述、作者、版本等元数据字段
   * **Validates: Requirements 3.3**
   */
  it('should correctly extract frontmatter metadata fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成简单的字符串字段（避免 YAML 类型转换问题）
        fc.record({
          name: fc.option(fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_\-\s]*$/.test(s))),
          description: fc.option(fc.string({ minLength: 2, maxLength: 200 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_\-\s.,!?]*$/.test(s))),
          author: fc.option(fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_\-\s]*$/.test(s))),
          version: fc.option(fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[a-zA-Z0-9][a-zA-Z0-9._\-]*$/.test(s)))
        }),
        fc.string({ minLength: 10, maxLength: 500 }), // markdown content
        
        async (frontmatterData, markdownContent) => {
          // 过滤掉空值
          const cleanFrontmatter: Record<string, any> = {};
          Object.entries(frontmatterData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value.trim && value.trim().length > 0) {
              cleanFrontmatter[key] = value.trim();
            }
          });

          // 如果没有任何 frontmatter 数据，跳过这个测试用例
          if (Object.keys(cleanFrontmatter).length === 0) {
            return;
          }

          // 构建文件内容
          let content = '---\n';
          
          // 添加简单的键值对（用引号包围以避免 YAML 类型转换）
          if (cleanFrontmatter.name) content += `name: "${cleanFrontmatter.name}"\n`;
          if (cleanFrontmatter.description) content += `description: "${cleanFrontmatter.description}"\n`;
          if (cleanFrontmatter.author) content += `author: "${cleanFrontmatter.author}"\n`;
          if (cleanFrontmatter.version) content += `version: "${cleanFrontmatter.version}"\n`;
          
          content += '---\n\n';
          content += markdownContent;

          // 创建测试文件
          const testFile = path.join(tempDir, 'test-capability.md');
          await fs.writeFile(testFile, content);

          // 解析能力
          const capability = await parserService.parseCapability(testFile, 'command');

          // 验证基本字段
          if (cleanFrontmatter.name) {
            expect(capability.name).toBe(cleanFrontmatter.name);
          }
          if (cleanFrontmatter.description) {
            expect(capability.originalDescription).toBe(cleanFrontmatter.description);
          }
          if (cleanFrontmatter.author) {
            expect(capability.author).toBe(cleanFrontmatter.author);
          }
          if (cleanFrontmatter.version) {
            expect(capability.version).toBe(cleanFrontmatter.version);
          }

          // 验证 frontmatter 对象包含所有预期字段
          const parsedFrontmatter = capability.metadata.frontmatter;
          expect(parsedFrontmatter).toBeDefined();

          Object.entries(cleanFrontmatter).forEach(([key, expectedValue]) => {
            expect(parsedFrontmatter).toHaveProperty(key);
            expect(parsedFrontmatter[key]).toBe(expectedValue);
          });

          // 验证内容类型正确
          expect(capability.type).toBe('command');
          expect(capability.content.type).toBe('command');
          expect((capability.content as any).markdown).toContain(markdownContent);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 5: Frontmatter 元数据提取**
   * For any 不包含 frontmatter 的能力文件，解析器应使用合理的默认值
   * **Validates: Requirements 3.5**
   */
  it('should provide reasonable defaults when frontmatter is missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // filename
        fc.string({ minLength: 10, maxLength: 500 }), // content
        
        async (filename, content) => {
          // 创建没有 frontmatter 的文件
          const testFile = path.join(tempDir, `${filename}.md`);
          await fs.writeFile(testFile, content);

          // 解析能力
          const capability = await parserService.parseCapability(testFile, 'command');

          // 验证默认值
          expect(capability.name).toBe(filename);
          expect(capability.originalDescription).toBe(`Command: ${filename}`);
          expect(capability.metadata.frontmatter).toEqual({});
          expect(capability.type).toBe('command');
          expect((capability.content as any).markdown).toBe(content);
        }
      ),
      { numRuns: 30 }
    );
  });
});