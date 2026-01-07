import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ParserService } from '../src/main/services/ParserService';

describe('Parser Service Skill Property Tests', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-skill-test-' + Date.now() + '-'));
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  /**
   * **Feature: claude-config-orchestrator, Property 4: Skill 文件夹结构保留**
   * For any Skill 类型能力，提取后的文件夹结构应与原始结构完全一致
   * **Validates: Requirements 3.2**
   */
  it('should preserve complete skill folder structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成技能文件夹结构
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          skillContent: fc.string({ minLength: 10, maxLength: 500 }),
          frontmatter: fc.option(fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            version: fc.option(fc.string({ minLength: 1, maxLength: 20 }))
          })),
          // 生成文件结构
          files: fc.array(
            fc.record({
              path: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(s)),
              content: fc.string({ minLength: 1, maxLength: 200 })
            }),
            { minLength: 0, maxLength: 5 }
          ),
          // 生成子目录结构
          subdirs: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              files: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(s)),
                  content: fc.string({ minLength: 1, maxLength: 100 })
                }),
                { minLength: 0, maxLength: 3 }
              )
            }),
            { minLength: 0, maxLength: 2 }
          )
        }),
        
        async (skillStructure) => {
          // 创建独立的技能目录
          const uniqueId = Math.random().toString(36).substring(7);
          const skillDir = path.join(tempDir, `skill-test-${uniqueId}`, skillStructure.name);
          await fs.ensureDir(skillDir);

          // 创建 SKILL.md
          let skillContent = '';
          if (skillStructure.frontmatter) {
            skillContent += '---\n';
            skillContent += `name: ${skillStructure.frontmatter.name}\n`;
            skillContent += `description: ${skillStructure.frontmatter.description}\n`;
            if (skillStructure.frontmatter.version) {
              skillContent += `version: ${skillStructure.frontmatter.version}\n`;
            }
            skillContent += '---\n\n';
          }
          skillContent += skillStructure.skillContent;
          
          await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent);

          // 记录预期的文件列表
          const expectedFiles = new Set(['SKILL.md']);

          // 创建根目录文件
          for (const file of skillStructure.files) {
            const filePath = path.join(skillDir, file.path);
            await fs.writeFile(filePath, file.content);
            expectedFiles.add(file.path);
          }

          // 创建子目录和文件
          for (const subdir of skillStructure.subdirs) {
            const subdirPath = path.join(skillDir, subdir.name);
            await fs.ensureDir(subdirPath);
            
            for (const file of subdir.files) {
              const filePath = path.join(subdirPath, file.name);
              await fs.writeFile(filePath, file.content);
              expectedFiles.add(`${subdir.name}/${file.name}`);
            }
          }

          // 解析技能
          const skillFile = path.join(skillDir, 'SKILL.md');
          const capability = await parserService.parseCapability(skillFile, 'skill');

          // 验证技能类型和基本信息
          expect(capability.type).toBe('skill');
          expect(capability.content.type).toBe('skill');

          // 验证文件列表完整性
          const skillContent_typed = capability.content as any;
          const actualFiles = new Set(skillContent_typed.files);

          // 调试信息
          if (actualFiles.size !== expectedFiles.size) {
            console.log('Expected files:', Array.from(expectedFiles));
            console.log('Actual files:', Array.from(actualFiles));
            console.log('Skill structure:', JSON.stringify(skillStructure, null, 2));
          }

          // 验证所有预期文件都存在
          expectedFiles.forEach(expectedFile => {
            expect(actualFiles.has(expectedFile)).toBe(true);
          });

          // 验证没有额外的文件
          expect(actualFiles.size).toBe(expectedFiles.size);

          // 验证文件夹路径正确
          expect(skillContent_typed.folderPath).toMatch(/skill-test/);
        }
      ),
      { numRuns: 30 }
    );
  });
});