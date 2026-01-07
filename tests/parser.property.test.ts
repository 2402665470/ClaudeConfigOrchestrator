import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ParserService } from '../src/main/services/ParserService';
import { CapabilityType } from '../src/common/types';

describe('Parser Service Property Tests', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-test-' + Date.now() + '-'));
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  /**
   * **Feature: claude-config-orchestrator, Property 3: 插件目录解析完整性**
   * For any 包含 Claude 插件结构的目录，解析器应识别并提取所有类型的原子能力
   * **Validates: Requirements 2.1, 3.1**
   */
  it('should extract all capability types from plugin directory structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成插件结构
        fc.record({
          commands: fc.array(fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 500 }),
            frontmatter: fc.option(fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s) && s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9_\s.-]+$/.test(s) && s.trim().length > 0),
              author: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s)))
            }))
          }), { minLength: 0, maxLength: 3 }),
          
          skills: fc.array(fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 500 }),
            files: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(s)), { minLength: 0, maxLength: 5 }),
            frontmatter: fc.option(fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s) && s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9_\s.-]+$/.test(s) && s.trim().length > 0)
            }))
          }), { minLength: 0, maxLength: 3 }),
          
          agents: fc.array(fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 500 }),
            frontmatter: fc.option(fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s) && s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9_\s.-]+$/.test(s) && s.trim().length > 0)
            }))
          }), { minLength: 0, maxLength: 3 }),
          
          hooks: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.record({
              trigger: fc.string({ minLength: 1, maxLength: 50 }),
              action: fc.string({ minLength: 1, maxLength: 100 })
            })
          )),
          
          mcpServers: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.record({
              command: fc.string({ minLength: 1, maxLength: 50 }),
              args: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 })),
              env: fc.option(fc.dictionary(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 50 })
              ))
            })
          )),
          
          settings: fc.option(fc.record({
            permissions: fc.option(fc.record({
              allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 })),
              deny: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }))
            })),
            env: fc.option(fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.string({ minLength: 1, maxLength: 50 })
            ))
          }))
        }),
        
        async (pluginStructure) => {
          // 创建临时插件目录
          const pluginDir = path.join(tempDir, 'test-plugin-' + Math.random().toString(36).substring(7));
          const claudeDir = path.join(pluginDir, '.claude');
          await fs.ensureDir(claudeDir);

          let expectedCapabilityCount = 0;
          const expectedTypes = new Set<CapabilityType>();

          // 创建 commands
          if (pluginStructure.commands.length > 0) {
            const commandsDir = path.join(claudeDir, 'commands');
            await fs.ensureDir(commandsDir);
            
            for (let i = 0; i < pluginStructure.commands.length; i++) {
              const command = pluginStructure.commands[i];
              let content = '';
              if (command.frontmatter) {
                content += '---\n';
                content += `name: ${command.frontmatter.name}\n`;
                content += `description: ${command.frontmatter.description}\n`;
                if (command.frontmatter.author) {
                  content += `author: ${command.frontmatter.author}\n`;
                }
                content += '---\n\n';
              }
              content += command.content;
              
              // 确保文件名唯一
              const fileName = `${command.name}_${i}.md`;
              await fs.writeFile(path.join(commandsDir, fileName), content);
              expectedCapabilityCount++;
              expectedTypes.add('command');
            }
          }

          // 创建 skills
          if (pluginStructure.skills.length > 0) {
            const skillsDir = path.join(claudeDir, 'skills');
            await fs.ensureDir(skillsDir);
            
            for (let i = 0; i < pluginStructure.skills.length; i++) {
              const skill = pluginStructure.skills[i];
              // 确保目录名唯一
              const skillDirName = `${skill.name}_${i}`;
              const skillDir = path.join(skillsDir, skillDirName);
              await fs.ensureDir(skillDir);
              
              let content = '';
              if (skill.frontmatter) {
                content += '---\n';
                content += `name: ${skill.frontmatter.name}\n`;
                content += `description: ${skill.frontmatter.description}\n`;
                content += '---\n\n';
              }
              content += skill.content;
              
              await fs.writeFile(path.join(skillDir, 'SKILL.md'), content);
              
              // 创建额外文件
              for (const fileName of skill.files) {
                await fs.writeFile(path.join(skillDir, fileName), `Content of ${fileName}`);
              }
              
              expectedCapabilityCount++;
              expectedTypes.add('skill');
            }
          }

          // 创建 agents
          if (pluginStructure.agents.length > 0) {
            const agentsDir = path.join(claudeDir, 'agents');
            await fs.ensureDir(agentsDir);
            
            for (let i = 0; i < pluginStructure.agents.length; i++) {
              const agent = pluginStructure.agents[i];
              let content = '';
              if (agent.frontmatter) {
                content += '---\n';
                content += `name: ${agent.frontmatter.name}\n`;
                content += `description: ${agent.frontmatter.description}\n`;
                content += '---\n\n';
              }
              content += agent.content;
              
              // 确保文件名唯一
              const fileName = `${agent.name}_${i}.md`;
              await fs.writeFile(path.join(agentsDir, fileName), content);
              expectedCapabilityCount++;
              expectedTypes.add('agent');
            }
          }

          // 创建 settings.json
          const settingsData: any = {};
          
          if (pluginStructure.hooks && Object.keys(pluginStructure.hooks).length > 0) {
            settingsData.hooks = pluginStructure.hooks;
            expectedCapabilityCount += Object.keys(pluginStructure.hooks).length;
            expectedTypes.add('hook');
          }
          
          if (pluginStructure.mcpServers && Object.keys(pluginStructure.mcpServers).length > 0) {
            settingsData.mcpServers = pluginStructure.mcpServers;
            expectedCapabilityCount += Object.keys(pluginStructure.mcpServers).length;
            expectedTypes.add('mcp');
          }
          
          if (pluginStructure.settings) {
            // 只添加非空的设置块
            if (pluginStructure.settings.permissions) {
              settingsData.permissions = pluginStructure.settings.permissions;
              expectedCapabilityCount++;
              expectedTypes.add('setting');
            }
            if (pluginStructure.settings.env && Object.keys(pluginStructure.settings.env).length > 0) {
              settingsData.env = pluginStructure.settings.env;
              expectedCapabilityCount++;
              expectedTypes.add('setting');
            }
          }

          if (Object.keys(settingsData).length > 0) {
            await fs.writeFile(
              path.join(claudeDir, 'settings.json'),
              JSON.stringify(settingsData, null, 2)
            );
          }

          // 解析插件
          const capabilities = await parserService.parsePlugin(pluginDir);

          // 调试信息
          if (capabilities.length !== expectedCapabilityCount) {
            console.log('Expected count:', expectedCapabilityCount);
            console.log('Actual count:', capabilities.length);
            console.log('Plugin structure:', JSON.stringify(pluginStructure, null, 2));
            console.log('Capabilities:', capabilities.map(c => ({ type: c.type, name: c.name })));
          }

          // 验证解析结果
          expect(capabilities).toHaveLength(expectedCapabilityCount);
          
          // 验证所有预期的类型都被识别
          const actualTypes = new Set(capabilities.map(c => c.type));
          expectedTypes.forEach(expectedType => {
            expect(actualTypes.has(expectedType)).toBe(true);
          });

          // 验证每个能力都有必要的字段
          for (const capability of capabilities) {
            expect(capability.id).toBeTruthy();
            expect(capability.type).toBeTruthy();
            expect(capability.name).toBeTruthy();
            expect(capability.originalDescription).toBeTruthy();
            expect(capability.sourcePlugin).toMatch(/^test-plugin/);
            expect(capability.content).toBeTruthy();
            expect(capability.createdAt).toBeInstanceOf(Date);
            expect(capability.updatedAt).toBeInstanceOf(Date);
          }
        }
      ),
      { numRuns: 50 }
    );
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
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s) && s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9_\s.-]+$/.test(s) && s.trim().length > 0),
            version: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)))
          })),
          // 生成文件结构
          files: fc.array(
            fc.record({
              path: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_][a-zA-Z0-9_/-]*\.[a-zA-Z0-9]+$/.test(s) && !s.includes('/.') && !s.startsWith('.')),
              content: fc.string({ minLength: 1, maxLength: 200 })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          // 生成子目录结构
          subdirs: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              files: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(s) && s !== '.' && s !== '..' && s.toLowerCase() !== s.toUpperCase()),
                  content: fc.string({ minLength: 1, maxLength: 100 })
                }),
                { minLength: 0, maxLength: 3 }
              )
            }),
            { minLength: 0, maxLength: 3 }
          )
        }),
        
        async (skillStructure) => {
          // 为每个技能创建独立的临时目录
          const uniqueTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
          const skillDir = path.join(uniqueTempDir, skillStructure.name);
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
          const createdRootFiles = new Set<string>();
          for (const file of skillStructure.files) {
            let filePath = file.path;
            let counter = 1;
            
            // 处理文件名冲突（大小写不敏感）
            while (createdRootFiles.has(filePath.toLowerCase()) || filePath.toLowerCase() === 'skill.md') {
              const ext = path.extname(file.path);
              const base = path.basename(file.path, ext);
              const dir = path.dirname(file.path);
              const newName = `${base}_${counter}${ext}`;
              filePath = dir === '.' ? newName : `${dir}/${newName}`;
              counter++;
            }
            
            createdRootFiles.add(filePath.toLowerCase());
            
            const fullPath = path.join(skillDir, filePath);
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, file.content);
            expectedFiles.add(filePath.replace(/\\/g, '/'));
          }

          // 创建子目录和文件
          for (const subdir of skillStructure.subdirs) {
            const subdirPath = path.join(skillDir, subdir.name);
            await fs.ensureDir(subdirPath);
            
            // 使用 Set 来确保文件名唯一（处理大小写不敏感的文件系统）
            const createdFiles = new Set<string>();
            
            for (const file of subdir.files) {
              let fileName = file.name;
              let counter = 1;
              
              // 如果文件名已存在（大小写不敏感），添加后缀
              while (createdFiles.has(fileName.toLowerCase())) {
                const ext = path.extname(file.name);
                const base = path.basename(file.name, ext);
                fileName = `${base}_${counter}${ext}`;
                counter++;
              }
              
              createdFiles.add(fileName.toLowerCase());
              
              const filePath = path.join(subdirPath, fileName);
              await fs.writeFile(filePath, file.content);
              expectedFiles.add(`${subdir.name}/${fileName}`);
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

          // 验证所有预期文件都存在
          expectedFiles.forEach(expectedFile => {
            expect(actualFiles.has(expectedFile)).toBe(true);
          });

          // 验证没有额外的文件
          if (actualFiles.size !== expectedFiles.size) {
            console.log('Expected files:', Array.from(expectedFiles));
            console.log('Actual files:', Array.from(actualFiles));
            console.log('Skill directory:', skillDir);
            console.log('Expected size:', expectedFiles.size);
            console.log('Actual size:', actualFiles.size);
          }
          expect(actualFiles.size).toBe(expectedFiles.size);

          // 验证文件夹路径正确
          expect(skillContent_typed.folderPath).toMatch(/skill-test/);
          
          // 清理临时目录
          try {
            await fs.remove(uniqueTempDir);
          } catch (error) {
            // 忽略清理错误，让系统自动清理临时文件
            console.warn('Failed to clean up temp directory:', uniqueTempDir);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});