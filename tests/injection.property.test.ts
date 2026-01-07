import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { InjectionService } from '../src/main/services/InjectionService';
import { Capability, CapabilityType, ProjectConfig } from '../src/common/types';

describe('Injection Service Property Tests', () => {
  let injectionService: InjectionService;
  let tempDir: string;
  let backupsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'injection-test-' + Date.now() + '-'));
    backupsDir = path.join(tempDir, 'backups');
    injectionService = new InjectionService(backupsDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  /**
   * **Feature: claude-config-orchestrator, Property 14: 项目配置扫描完整性**
   * For any 包含 .claude/ 目录的项目，扫描应识别所有现有的能力配置
   * **Validates: Requirements 8.1, 9.3**
   */
  it('should identify all existing capability configurations in project', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成项目结构
        fc.record({
          skills: fc.array(fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 200 }),
            files: fc.array(fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(s)), { minLength: 0, maxLength: 3 })
          }), { minLength: 0, maxLength: 5 }),
          
          commands: fc.array(fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 200 })
          }), { minLength: 0, maxLength: 5 }),
          
          agents: fc.array(fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 200 })
          }), { minLength: 0, maxLength: 5 }),
          
          hooks: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.record({
              trigger: fc.string({ minLength: 1, maxLength: 30 }),
              action: fc.string({ minLength: 1, maxLength: 50 })
            })
          )),
          
          mcpServers: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.record({
              command: fc.string({ minLength: 1, maxLength: 30 }),
              args: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })),
              env: fc.option(fc.dictionary(
                fc.string({ minLength: 1, maxLength: 15 }),
                fc.string({ minLength: 1, maxLength: 30 })
              ))
            })
          )),
          
          settings: fc.option(fc.record({
            permissions: fc.option(fc.record({
              allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 })),
              deny: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }))
            })),
            env: fc.option(fc.dictionary(
              fc.string({ minLength: 1, maxLength: 15 }),
              fc.string({ minLength: 1, maxLength: 30 })
            )),
            companyAnnouncements: fc.option(fc.record({
              enabled: fc.boolean(),
              message: fc.option(fc.string({ minLength: 1, maxLength: 100 }))
            }))
          })),
          
          hasMcpJson: fc.boolean()
        }),
        
        async (projectStructure) => {
          // 创建项目目录
          const projectDir = path.join(tempDir, 'test-project-' + Math.random().toString(36).substring(7));
          const claudeDir = path.join(projectDir, '.claude');
          await fs.ensureDir(claudeDir);

          let expectedCapabilityCount = 0;
          const expectedCapabilities: Array<{ type: CapabilityType; name: string }> = [];

          // 创建 Skills
          if (projectStructure.skills.length > 0) {
            const skillsDir = path.join(claudeDir, 'skills');
            await fs.ensureDir(skillsDir);
            
            for (let i = 0; i < projectStructure.skills.length; i++) {
              const skill = projectStructure.skills[i];
              // 确保技能目录名唯一
              const skillDirName = `${skill.name}_${i}`;
              const skillDir = path.join(skillsDir, skillDirName);
              await fs.ensureDir(skillDir);
              
              await fs.writeFile(path.join(skillDir, 'SKILL.md'), skill.content);
              
              // 创建额外文件
              for (const fileName of skill.files) {
                await fs.writeFile(path.join(skillDir, fileName), `Content of ${fileName}`);
              }
              
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'skill', name: skillDirName });
            }
          }

          // 创建 Commands
          if (projectStructure.commands.length > 0) {
            const commandsDir = path.join(claudeDir, 'commands');
            await fs.ensureDir(commandsDir);
            
            for (let i = 0; i < projectStructure.commands.length; i++) {
              const command = projectStructure.commands[i];
              // 确保命令文件名唯一
              const fileName = `${command.name}_${i}.md`;
              await fs.writeFile(path.join(commandsDir, fileName), command.content);
              
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'command', name: path.basename(fileName, '.md') });
            }
          }

          // 创建 Agents
          if (projectStructure.agents.length > 0) {
            const agentsDir = path.join(claudeDir, 'agents');
            await fs.ensureDir(agentsDir);
            
            for (let i = 0; i < projectStructure.agents.length; i++) {
              const agent = projectStructure.agents[i];
              // 确保代理文件名唯一
              const fileName = `${agent.name}_${i}.md`;
              await fs.writeFile(path.join(agentsDir, fileName), agent.content);
              
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'agent', name: path.basename(fileName, '.md') });
            }
          }

          // 创建 settings.json
          const settingsData: any = {};
          
          if (projectStructure.hooks && Object.keys(projectStructure.hooks).length > 0) {
            settingsData.hooks = projectStructure.hooks;
            for (const hookName of Object.keys(projectStructure.hooks)) {
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'hook', name: hookName });
            }
          }
          
          if (projectStructure.mcpServers && Object.keys(projectStructure.mcpServers).length > 0) {
            settingsData.mcpServers = projectStructure.mcpServers;
            for (const serverName of Object.keys(projectStructure.mcpServers)) {
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'mcp', name: serverName });
            }
          }
          
          if (projectStructure.settings) {
            // 添加非空的设置块
            if (projectStructure.settings.permissions) {
              settingsData.permissions = projectStructure.settings.permissions;
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'setting', name: 'permissions' });
            }
            if (projectStructure.settings.env && Object.keys(projectStructure.settings.env).length > 0) {
              settingsData.env = projectStructure.settings.env;
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'setting', name: 'env' });
            }
            if (projectStructure.settings.companyAnnouncements) {
              settingsData.companyAnnouncements = projectStructure.settings.companyAnnouncements;
              expectedCapabilityCount++;
              expectedCapabilities.push({ type: 'setting', name: 'companyAnnouncements' });
            }
          }

          if (Object.keys(settingsData).length > 0) {
            await fs.writeFile(
              path.join(claudeDir, 'settings.json'),
              JSON.stringify(settingsData, null, 2)
            );
          }

          // 创建 MCP 配置文件（如果需要）
          if (projectStructure.hasMcpJson && projectStructure.mcpServers) {
            const kiroDir = path.join(projectDir, '.kiro', 'settings');
            await fs.ensureDir(kiroDir);
            
            const mcpData = {
              mcpServers: projectStructure.mcpServers
            };
            
            await fs.writeFile(
              path.join(kiroDir, 'mcp.json'),
              JSON.stringify(mcpData, null, 2)
            );
          }

          // 扫描项目配置
          const projectConfig = await injectionService.scanProject(projectDir);

          // 验证基本属性
          expect(projectConfig.path).toBe(projectDir);
          expect(projectConfig.hasClaudeDir).toBe(true);

          // 验证能力数量
          expect(projectConfig.existingCapabilities).toHaveLength(expectedCapabilityCount);

          // 验证每个预期的能力都被识别
          for (const expectedCapability of expectedCapabilities) {
            const found = projectConfig.existingCapabilities.find(
              cap => cap.type === expectedCapability.type && cap.name === expectedCapability.name
            );
            expect(found).toBeTruthy();
            expect(found!.path).toBeTruthy();
          }

          // 验证 settings.json 解析
          if (Object.keys(settingsData).length > 0) {
            expect(projectConfig.settingsJson).toBeTruthy();
            expect(projectConfig.settingsJson).toEqual(settingsData);
          }

          // 验证 MCP 配置解析
          if (projectStructure.hasMcpJson && projectStructure.mcpServers) {
            expect(projectConfig.mcpJson).toBeTruthy();
            expect(projectConfig.mcpJson).toHaveProperty('mcpServers');
          }

          // 验证每个能力都有正确的路径
          for (const capability of projectConfig.existingCapabilities) {
            expect(await fs.pathExists(capability.path)).toBe(true);
            
            // 验证路径格式
            switch (capability.type) {
              case 'skill':
                expect(capability.path).toMatch(/skills[/\\][^/\\]+$/);
                break;
              case 'command':
                expect(capability.path).toMatch(/commands[/\\][^/\\]+\.md$/);
                break;
              case 'agent':
                expect(capability.path).toMatch(/agents[/\\][^/\\]+\.md$/);
                break;
              case 'hook':
              case 'mcp':
              case 'setting':
                expect(capability.path).toMatch(/settings\.json$/);
                break;
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * 测试空项目的扫描
   */
  it('should handle empty project correctly', async () => {
    const projectDir = path.join(tempDir, 'empty-project');
    await fs.ensureDir(projectDir);

    const projectConfig = await injectionService.scanProject(projectDir);

    expect(projectConfig.path).toBe(projectDir);
    expect(projectConfig.hasClaudeDir).toBe(false);
    expect(projectConfig.existingCapabilities).toHaveLength(0);
    expect(projectConfig.settingsJson).toBeUndefined();
    expect(projectConfig.mcpJson).toBeUndefined();
  });

  /**
   * 测试只有 .claude 目录但为空的项目
   */
  it('should handle project with empty .claude directory', async () => {
    const projectDir = path.join(tempDir, 'empty-claude-project');
    const claudeDir = path.join(projectDir, '.claude');
    await fs.ensureDir(claudeDir);

    const projectConfig = await injectionService.scanProject(projectDir);

    expect(projectConfig.path).toBe(projectDir);
    expect(projectConfig.hasClaudeDir).toBe(true);
    expect(projectConfig.existingCapabilities).toHaveLength(0);
    expect(projectConfig.settingsJson).toBeUndefined();
    expect(projectConfig.mcpJson).toBeUndefined();
  });

  /**
   * **Feature: claude-config-orchestrator, Property 15: Skill 注入结构完整性**
   * For any Skill 类型能力注入，目标项目的 .claude/skills/ 目录应包含完整的技能文件夹结构
   * **Validates: Requirements 8.3**
   */
  it('should preserve complete skill folder structure during injection', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成技能结构
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          skillContent: fc.string({ minLength: 10, maxLength: 300 }),
          frontmatter: fc.option(fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s) && s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9_\s.-]+$/.test(s) && s.trim().length > 0),
            version: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)))
          })),
          // 生成文件结构
          files: fc.array(
            fc.record({
              path: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_][a-zA-Z0-9_/-]*\.[a-zA-Z0-9]+$/.test(s) && !s.includes('/.') && !s.startsWith('.')),
              content: fc.string({ minLength: 1, maxLength: 100 })
            }),
            { minLength: 0, maxLength: 8 }
          ),
          // 生成子目录结构
          subdirs: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              files: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(s) && s !== '.' && s !== '..' && s.toLowerCase() !== s.toUpperCase()),
                  content: fc.string({ minLength: 1, maxLength: 80 })
                }),
                { minLength: 0, maxLength: 3 }
              )
            }),
            { minLength: 0, maxLength: 3 }
          )
        }),
        
        async (skillStructure) => {
          // 创建源技能目录
          const sourceSkillDir = path.join(tempDir, 'source-skills', skillStructure.name);
          await fs.ensureDir(sourceSkillDir);

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
          
          await fs.writeFile(path.join(sourceSkillDir, 'SKILL.md'), skillContent);

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
            
            const fullPath = path.join(sourceSkillDir, filePath);
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, file.content);
          }

          // 创建子目录和文件
          for (const subdir of skillStructure.subdirs) {
            const subdirPath = path.join(sourceSkillDir, subdir.name);
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
            }
          }

          // 扫描源目录获取实际的文件列表
          const expectedFiles = new Set<string>();
          
          async function collectSourceFiles(dir: string, relativePath: string = '') {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
              if (entry.isDirectory()) {
                await collectSourceFiles(path.join(dir, entry.name), entryPath);
              } else {
                expectedFiles.add(entryPath);
              }
            }
          }
          
          await collectSourceFiles(sourceSkillDir);

          // 创建能力对象
          const capability: Capability = {
            id: `skill-${skillStructure.name}`,
            type: 'skill',
            name: skillStructure.name,
            originalDescription: skillStructure.frontmatter?.description || 'Test skill',
            chineseDescription: undefined,
            translationStatus: 'pending',
            sourcePlugin: 'test-plugin',
            version: skillStructure.frontmatter?.version,
            content: {
              type: 'skill',
              folderPath: sourceSkillDir,
              files: Array.from(expectedFiles)
            },
            metadata: {
              frontmatter: skillStructure.frontmatter
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // 创建目标项目
          const projectDir = path.join(tempDir, 'target-project-' + Math.random().toString(36).substring(7));
          await fs.ensureDir(projectDir);

          // 执行注入
          const injectionOptions = {
            conflictResolution: 'overwrite' as const,
            createBackup: false
          };

          const result = await injectionService.inject(projectDir, [capability], injectionOptions);

          // 验证注入结果
          expect(result.success).toBe(true);
          expect(result.injectedCapabilities).toHaveLength(1);
          expect(result.skippedCapabilities).toHaveLength(0);
          expect(result.errors).toHaveLength(0);

          // 验证目标目录结构
          const targetSkillDir = path.join(projectDir, '.claude', 'skills', skillStructure.name);
          expect(await fs.pathExists(targetSkillDir)).toBe(true);

          // 验证所有预期文件都存在
          for (const expectedFile of expectedFiles) {
            const targetFilePath = path.join(targetSkillDir, expectedFile);
            expect(await fs.pathExists(targetFilePath)).toBe(true);
            
            // 验证文件内容
            const targetContent = await fs.readFile(targetFilePath, 'utf-8');
            expect(targetContent.length).toBeGreaterThan(0);
          }

          // 验证没有额外的文件
          const actualFiles = new Set<string>();
          
          async function collectFiles(dir: string, relativePath: string = '') {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
              if (entry.isDirectory()) {
                await collectFiles(path.join(dir, entry.name), entryPath);
              } else {
                actualFiles.add(entryPath);
              }
            }
          }
          
          await collectFiles(targetSkillDir);

          // 验证文件数量一致
          if (actualFiles.size !== expectedFiles.size) {
            console.log('Expected files:', Array.from(expectedFiles));
            console.log('Actual files:', Array.from(actualFiles));
            console.log('Source dir:', sourceSkillDir);
            console.log('Target dir:', targetSkillDir);
          }
          expect(actualFiles.size).toBe(expectedFiles.size);

          // 验证每个实际文件都在预期列表中
          actualFiles.forEach(actualFile => {
            expect(expectedFiles.has(actualFile)).toBe(true);
          });
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 16: Command 注入路径正确性**
   * For any Command 类型能力注入，命令文件应被复制到项目 .claude/commands/ 目录
   * **Validates: Requirements 8.4**
   */
  it('should inject command files to correct path', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成命令结构
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          content: fc.string({ minLength: 10, maxLength: 500 }),
          frontmatter: fc.option(fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s) && s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => /^[a-zA-Z0-9_\s.-]+$/.test(s) && s.trim().length > 0),
            author: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_\s-]+$/.test(s)))
          }))
        }),
        
        async (commandStructure) => {
          // 创建源命令文件
          const sourceCommandFile = path.join(tempDir, 'source-commands', `${commandStructure.name}.md`);
          await fs.ensureDir(path.dirname(sourceCommandFile));

          // 创建命令内容
          let commandContent = '';
          if (commandStructure.frontmatter) {
            commandContent += '---\n';
            commandContent += `name: ${commandStructure.frontmatter.name}\n`;
            commandContent += `description: ${commandStructure.frontmatter.description}\n`;
            if (commandStructure.frontmatter.author) {
              commandContent += `author: ${commandStructure.frontmatter.author}\n`;
            }
            commandContent += '---\n\n';
          }
          commandContent += commandStructure.content;
          
          await fs.writeFile(sourceCommandFile, commandContent);

          // 创建能力对象
          const capability: Capability = {
            id: `command-${commandStructure.name}`,
            type: 'command',
            name: commandStructure.name,
            originalDescription: commandStructure.frontmatter?.description || 'Test command',
            chineseDescription: undefined,
            translationStatus: 'pending',
            sourcePlugin: 'test-plugin',
            content: {
              type: 'command',
              filePath: sourceCommandFile,
              markdown: commandContent
            },
            metadata: {
              frontmatter: commandStructure.frontmatter
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // 创建目标项目
          const projectDir = path.join(tempDir, 'target-project-' + Math.random().toString(36).substring(7));
          await fs.ensureDir(projectDir);

          // 执行注入
          const injectionOptions = {
            conflictResolution: 'overwrite' as const,
            createBackup: false
          };

          const result = await injectionService.inject(projectDir, [capability], injectionOptions);

          // 验证注入结果
          expect(result.success).toBe(true);
          expect(result.injectedCapabilities).toHaveLength(1);
          expect(result.skippedCapabilities).toHaveLength(0);
          expect(result.errors).toHaveLength(0);

          // 验证目标文件路径
          const expectedTargetFile = path.join(projectDir, '.claude', 'commands', `${commandStructure.name}.md`);
          expect(await fs.pathExists(expectedTargetFile)).toBe(true);

          // 验证文件内容
          const targetContent = await fs.readFile(expectedTargetFile, 'utf-8');
          const sourceContent = await fs.readFile(sourceCommandFile, 'utf-8');
          expect(targetContent).toBe(sourceContent);

          // 验证文件在正确的目录中
          const commandsDir = path.join(projectDir, '.claude', 'commands');
          expect(await fs.pathExists(commandsDir)).toBe(true);
          
          const commandFiles = await fs.readdir(commandsDir);
          expect(commandFiles).toContain(`${commandStructure.name}.md`);
          expect(commandFiles).toHaveLength(1);

          // 验证文件不在其他目录中
          const skillsDir = path.join(projectDir, '.claude', 'skills');
          const agentsDir = path.join(projectDir, '.claude', 'agents');
          
          if (await fs.pathExists(skillsDir)) {
            const skillFiles = await fs.readdir(skillsDir);
            expect(skillFiles).not.toContain(`${commandStructure.name}.md`);
          }
          
          if (await fs.pathExists(agentsDir)) {
            const agentFiles = await fs.readdir(agentsDir);
            expect(agentFiles).not.toContain(`${commandStructure.name}.md`);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 17: Setting 合并正确性**
   * For any Setting 类型能力注入，配置块应被正确合并到项目 .claude/settings.json，不破坏现有配置
   * **Validates: Requirements 8.5**
   */
  it('should merge setting configurations correctly without breaking existing config', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成现有配置
        fc.record({
          existingPermissions: fc.option(fc.record({
            allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 })),
            deny: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }))
          })),
          existingEnv: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 15 }),
            fc.string({ minLength: 1, maxLength: 30 })
          )),
          existingOtherConfig: fc.option(fc.record({
            someKey: fc.string({ minLength: 1, maxLength: 50 }),
            someNumber: fc.integer({ min: 1, max: 100 })
          }))
        }),
        // 生成新的 Setting 配置
        fc.record({
          settingType: fc.constantFrom('permissions', 'env', 'companyAnnouncements'),
          settingConfig: fc.oneof(
            // permissions 配置
            fc.record({
              allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 })),
              deny: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }))
            }),
            // env 配置
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 15 }),
              fc.string({ minLength: 1, maxLength: 30 })
            ),
            // companyAnnouncements 配置
            fc.record({
              enabled: fc.boolean(),
              message: fc.option(fc.string({ minLength: 1, maxLength: 100 }))
            })
          )
        }),
        
        async (existingConfig, newSetting) => {
          // 创建项目目录
          const projectDir = path.join(tempDir, 'setting-project-' + Math.random().toString(36).substring(7));
          const claudeDir = path.join(projectDir, '.claude');
          await fs.ensureDir(claudeDir);

          // 创建现有 settings.json
          const existingSettings: Record<string, unknown> = {};
          if (existingConfig.existingPermissions) {
            existingSettings.permissions = existingConfig.existingPermissions;
          }
          if (existingConfig.existingEnv && Object.keys(existingConfig.existingEnv).length > 0) {
            existingSettings.env = existingConfig.existingEnv;
          }
          if (existingConfig.existingOtherConfig) {
            existingSettings.otherConfig = existingConfig.existingOtherConfig;
          }

          const settingsFile = path.join(claudeDir, 'settings.json');
          if (Object.keys(existingSettings).length > 0) {
            await fs.writeFile(settingsFile, JSON.stringify(existingSettings, null, 2));
          }

          // 创建 Setting 能力对象
          const capability: Capability = {
            id: `setting-${newSetting.settingType}`,
            type: 'setting',
            name: newSetting.settingType,
            originalDescription: `Test ${newSetting.settingType} setting`,
            chineseDescription: undefined,
            translationStatus: 'pending',
            sourcePlugin: 'test-plugin',
            content: {
              type: 'setting',
              key: newSetting.settingType,
              config: newSetting.settingConfig
            },
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // 执行注入
          const injectionOptions = {
            conflictResolution: 'overwrite' as const,
            createBackup: false
          };

          const result = await injectionService.inject(projectDir, [capability], injectionOptions);

          // 验证注入结果
          expect(result.success).toBe(true);
          expect(result.injectedCapabilities).toHaveLength(1);
          expect(result.skippedCapabilities).toHaveLength(0);
          expect(result.errors).toHaveLength(0);

          // 验证 settings.json 文件存在
          expect(await fs.pathExists(settingsFile)).toBe(true);

          // 读取并验证合并后的配置
          const mergedContent = await fs.readFile(settingsFile, 'utf-8');
          const mergedSettings = JSON.parse(mergedContent);

          // 验证新配置已添加
          expect(mergedSettings).toHaveProperty(newSetting.settingType);
          expect(mergedSettings[newSetting.settingType]).toEqual(newSetting.settingConfig);

          // 验证现有配置未被破坏
          if (existingConfig.existingPermissions && newSetting.settingType !== 'permissions') {
            expect(mergedSettings.permissions).toEqual(existingConfig.existingPermissions);
          }
          if (existingConfig.existingEnv && Object.keys(existingConfig.existingEnv).length > 0 && newSetting.settingType !== 'env') {
            expect(mergedSettings.env).toEqual(existingConfig.existingEnv);
          }
          if (existingConfig.existingOtherConfig) {
            expect(mergedSettings.otherConfig).toEqual(existingConfig.existingOtherConfig);
          }

          // 验证 JSON 格式正确
          expect(() => JSON.parse(mergedContent)).not.toThrow();

          // 验证配置结构完整性
          expect(typeof mergedSettings).toBe('object');
          expect(mergedSettings).not.toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 18: MCP 配置合并正确性**
   * For any MCP 类型能力注入，配置应被正确添加到项目配置文件的 mcpServers 块中
   * **Validates: Requirements 8.6**
   */
  it('should merge MCP server configurations correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成现有 MCP 配置
        fc.option(fc.dictionary(
          fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.record({
            command: fc.string({ minLength: 1, maxLength: 30 }),
            args: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })),
            env: fc.option(fc.dictionary(
              fc.string({ minLength: 1, maxLength: 15 }),
              fc.string({ minLength: 1, maxLength: 30 })
            ))
          })
        )),
        // 生成新的 MCP 服务器配置
        fc.record({
          serverName: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          config: fc.record({
            command: fc.string({ minLength: 1, maxLength: 30 }),
            args: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })),
            env: fc.option(fc.dictionary(
              fc.string({ minLength: 1, maxLength: 15 }),
              fc.string({ minLength: 1, maxLength: 30 })
            ))
          })
        }),
        // 生成其他现有配置
        fc.option(fc.record({
          permissions: fc.option(fc.record({
            allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }))
          })),
          env: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 15 }),
            fc.string({ minLength: 1, maxLength: 30 })
          ))
        })),
        
        async (existingMcpServers, newMcpServer, otherConfig) => {
          // 创建项目目录
          const projectDir = path.join(tempDir, 'mcp-project-' + Math.random().toString(36).substring(7));
          const claudeDir = path.join(projectDir, '.claude');
          await fs.ensureDir(claudeDir);

          // 创建现有 settings.json
          const existingSettings: Record<string, unknown> = {};
          if (existingMcpServers && Object.keys(existingMcpServers).length > 0) {
            existingSettings.mcpServers = existingMcpServers;
          }
          if (otherConfig) {
            if (otherConfig.permissions) {
              existingSettings.permissions = otherConfig.permissions;
            }
            if (otherConfig.env && Object.keys(otherConfig.env).length > 0) {
              existingSettings.env = otherConfig.env;
            }
          }

          const settingsFile = path.join(claudeDir, 'settings.json');
          if (Object.keys(existingSettings).length > 0) {
            await fs.writeFile(settingsFile, JSON.stringify(existingSettings, null, 2));
          }

          // 确保新服务器名称不与现有服务器冲突（用于测试正常情况）
          let finalServerName = newMcpServer.serverName;
          let counter = 1;
          while (existingMcpServers && finalServerName in existingMcpServers) {
            finalServerName = `${newMcpServer.serverName}_${counter}`;
            counter++;
          }

          // 创建 MCP 能力对象
          const capability: Capability = {
            id: `mcp-${finalServerName}`,
            type: 'mcp',
            name: finalServerName,
            originalDescription: `Test MCP server ${finalServerName}`,
            chineseDescription: undefined,
            translationStatus: 'pending',
            sourcePlugin: 'test-plugin',
            content: {
              type: 'mcp',
              serverName: finalServerName,
              config: newMcpServer.config
            },
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // 执行注入
          const injectionOptions = {
            conflictResolution: 'overwrite' as const,
            createBackup: false
          };

          const result = await injectionService.inject(projectDir, [capability], injectionOptions);

          // 验证注入结果
          expect(result.success).toBe(true);
          expect(result.injectedCapabilities).toHaveLength(1);
          expect(result.skippedCapabilities).toHaveLength(0);
          expect(result.errors).toHaveLength(0);

          // 验证 settings.json 文件存在
          expect(await fs.pathExists(settingsFile)).toBe(true);

          // 读取并验证合并后的配置
          const mergedContent = await fs.readFile(settingsFile, 'utf-8');
          const mergedSettings = JSON.parse(mergedContent);

          // 验证 mcpServers 块存在
          expect(mergedSettings).toHaveProperty('mcpServers');
          expect(typeof mergedSettings.mcpServers).toBe('object');

          // 验证新 MCP 服务器已添加
          expect(mergedSettings.mcpServers).toHaveProperty(finalServerName);
          expect(mergedSettings.mcpServers[finalServerName]).toEqual(newMcpServer.config);

          // 验证现有 MCP 服务器未被破坏
          if (existingMcpServers && Object.keys(existingMcpServers).length > 0) {
            for (const [serverName, serverConfig] of Object.entries(existingMcpServers)) {
              if (serverName !== finalServerName) {
                expect(mergedSettings.mcpServers[serverName]).toEqual(serverConfig);
              }
            }
          }

          // 验证其他配置未被破坏
          if (otherConfig) {
            if (otherConfig.permissions) {
              expect(mergedSettings.permissions).toEqual(otherConfig.permissions);
            }
            if (otherConfig.env && Object.keys(otherConfig.env).length > 0) {
              expect(mergedSettings.env).toEqual(otherConfig.env);
            }
          }

          // 验证 JSON 格式正确
          expect(() => JSON.parse(mergedContent)).not.toThrow();

          // 验证配置结构完整性
          expect(typeof mergedSettings).toBe('object');
          expect(mergedSettings).not.toBeNull();

          // 验证 MCP 配置格式正确
          const mcpConfig = mergedSettings.mcpServers[finalServerName];
          expect(mcpConfig).toHaveProperty('command');
          expect(typeof mcpConfig.command).toBe('string');
          expect(mcpConfig.command.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 19: 冲突检测准确性**
   * For any 能力注入操作，如果目标路径已存在同名文件或配置键，系统应检测并报告冲突
   * **Validates: Requirements 8.7**
   */
  it('should accurately detect conflicts when target paths or config keys exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成现有项目结构
        fc.record({
          existingSkills: fc.array(fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { minLength: 0, maxLength: 3 }),
          existingCommands: fc.array(fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { minLength: 0, maxLength: 3 }),
          existingAgents: fc.array(fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { minLength: 0, maxLength: 3 }),
          existingMcpServers: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.record({
              command: fc.string({ minLength: 1, maxLength: 30 })
            })
          )),
          existingSettings: fc.option(fc.record({
            permissions: fc.option(fc.record({
              allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }))
            })),
            env: fc.option(fc.dictionary(
              fc.string({ minLength: 1, maxLength: 15 }),
              fc.string({ minLength: 1, maxLength: 30 })
            ))
          }))
        }),
        // 生成要注入的能力
        fc.array(
          fc.oneof(
            // Skill 能力
            fc.record({
              type: fc.constant('skill' as const),
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
            }),
            // Command 能力
            fc.record({
              type: fc.constant('command' as const),
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
            }),
            // Agent 能力
            fc.record({
              type: fc.constant('agent' as const),
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
            }),
            // MCP 能力
            fc.record({
              type: fc.constant('mcp' as const),
              serverName: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
            }),
            // Setting 能力
            fc.record({
              type: fc.constant('setting' as const),
              key: fc.constantFrom('permissions', 'env', 'companyAnnouncements')
            })
          ),
          { minLength: 1, maxLength: 5 }
        ),
        
        async (existingProject, capabilitiesToInject) => {
          // 创建项目目录和现有结构
          const projectDir = path.join(tempDir, 'conflict-project-' + Math.random().toString(36).substring(7));
          const claudeDir = path.join(projectDir, '.claude');
          await fs.ensureDir(claudeDir);

          // 创建现有 Skills
          if (existingProject.existingSkills.length > 0) {
            const skillsDir = path.join(claudeDir, 'skills');
            await fs.ensureDir(skillsDir);
            for (const skillName of existingProject.existingSkills) {
              const skillDir = path.join(skillsDir, skillName);
              await fs.ensureDir(skillDir);
              await fs.writeFile(path.join(skillDir, 'SKILL.md'), `# ${skillName}`);
            }
          }

          // 创建现有 Commands
          if (existingProject.existingCommands.length > 0) {
            const commandsDir = path.join(claudeDir, 'commands');
            await fs.ensureDir(commandsDir);
            for (const commandName of existingProject.existingCommands) {
              await fs.writeFile(path.join(commandsDir, `${commandName}.md`), `# ${commandName}`);
            }
          }

          // 创建现有 Agents
          if (existingProject.existingAgents.length > 0) {
            const agentsDir = path.join(claudeDir, 'agents');
            await fs.ensureDir(agentsDir);
            for (const agentName of existingProject.existingAgents) {
              await fs.writeFile(path.join(agentsDir, `${agentName}.md`), `# ${agentName}`);
            }
          }

          // 创建现有 settings.json
          const existingSettings: Record<string, unknown> = {};
          if (existingProject.existingMcpServers && Object.keys(existingProject.existingMcpServers).length > 0) {
            existingSettings.mcpServers = existingProject.existingMcpServers;
          }
          if (existingProject.existingSettings) {
            if (existingProject.existingSettings.permissions) {
              existingSettings.permissions = existingProject.existingSettings.permissions;
            }
            if (existingProject.existingSettings.env && Object.keys(existingProject.existingSettings.env).length > 0) {
              existingSettings.env = existingProject.existingSettings.env;
            }
          }

          const settingsFile = path.join(claudeDir, 'settings.json');
          if (Object.keys(existingSettings).length > 0) {
            await fs.writeFile(settingsFile, JSON.stringify(existingSettings, null, 2));
          }

          // 创建能力对象
          const capabilities: Capability[] = capabilitiesToInject.map((capSpec, index) => {
            const baseCapability = {
              id: `test-${capSpec.type}-${index}`,
              type: capSpec.type,
              originalDescription: `Test ${capSpec.type}`,
              chineseDescription: undefined,
              translationStatus: 'pending' as const,
              sourcePlugin: 'test-plugin',
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date()
            };

            switch (capSpec.type) {
              case 'skill':
                return {
                  ...baseCapability,
                  name: capSpec.name,
                  content: {
                    type: 'skill',
                    folderPath: `/fake/path/${capSpec.name}`,
                    files: ['SKILL.md']
                  }
                } as Capability;

              case 'command':
                return {
                  ...baseCapability,
                  name: capSpec.name,
                  content: {
                    type: 'command',
                    filePath: `/fake/path/${capSpec.name}.md`,
                    markdown: `# ${capSpec.name}`
                  }
                } as Capability;

              case 'agent':
                return {
                  ...baseCapability,
                  name: capSpec.name,
                  content: {
                    type: 'agent',
                    filePath: `/fake/path/${capSpec.name}.md`,
                    markdown: `# ${capSpec.name}`
                  }
                } as Capability;

              case 'mcp':
                return {
                  ...baseCapability,
                  name: capSpec.serverName,
                  content: {
                    type: 'mcp',
                    serverName: capSpec.serverName,
                    config: {
                      command: 'test-command'
                    }
                  }
                } as Capability;

              case 'setting':
                return {
                  ...baseCapability,
                  name: capSpec.key,
                  content: {
                    type: 'setting',
                    key: capSpec.key,
                    config: { testValue: 'test' }
                  }
                } as Capability;

              default:
                throw new Error(`Unknown capability type: ${(capSpec as any).type}`);
            }
          });

          // 执行冲突检测
          const conflicts = await injectionService.detectConflicts(projectDir, capabilities);

          // 验证冲突检测结果
          for (const capability of capabilities) {
            let shouldHaveConflict = false;

            switch (capability.type) {
              case 'skill':
                shouldHaveConflict = existingProject.existingSkills.includes(capability.name);
                break;
              case 'command':
                shouldHaveConflict = existingProject.existingCommands.includes(capability.name);
                break;
              case 'agent':
                shouldHaveConflict = existingProject.existingAgents.includes(capability.name);
                break;
              case 'mcp':
                if (capability.content.type === 'mcp') {
                  shouldHaveConflict = !!(existingProject.existingMcpServers && 
                                         Object.prototype.hasOwnProperty.call(existingProject.existingMcpServers, capability.content.serverName));
                }
                break;
              case 'setting':
                if (capability.content.type === 'setting') {
                  shouldHaveConflict = !!(existingProject.existingSettings && 
                                         Object.prototype.hasOwnProperty.call(existingProject.existingSettings, capability.content.key) &&
                                         existingProject.existingSettings[capability.content.key] != null);
                }
                break;
            }

            const hasConflict = conflicts.some(c => c.capability.id === capability.id);

            if (shouldHaveConflict) {
              expect(hasConflict).toBe(true);
              
              // 验证冲突详情
              const conflict = conflicts.find(c => c.capability.id === capability.id);
              expect(conflict).toBeTruthy();
              expect(conflict!.capability).toEqual(capability);
              expect(conflict!.existingPath).toBeTruthy();
              
              if (capability.type === 'skill' || capability.type === 'command' || capability.type === 'agent') {
                expect(conflict!.conflictType).toBe('file_exists');
              } else {
                expect(conflict!.conflictType).toBe('config_key_exists');
              }
            } else {
              expect(hasConflict).toBe(false);
            }
          }

          // 验证冲突数量正确
          const expectedConflictCount = capabilities.filter(cap => {
            switch (cap.type) {
              case 'skill':
                return existingProject.existingSkills.includes(cap.name);
              case 'command':
                return existingProject.existingCommands.includes(cap.name);
              case 'agent':
                return existingProject.existingAgents.includes(cap.name);
              case 'mcp':
                return cap.content.type === 'mcp' && existingProject.existingMcpServers && 
                       Object.prototype.hasOwnProperty.call(existingProject.existingMcpServers, cap.content.serverName);
              case 'setting':
                return cap.content.type === 'setting' && existingProject.existingSettings && 
                       Object.prototype.hasOwnProperty.call(existingProject.existingSettings, cap.content.key) &&
                       existingProject.existingSettings[cap.content.key] != null;
              default:
                return false;
            }
          }).length;

          expect(conflicts).toHaveLength(expectedConflictCount);
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 20: 备份完整性**
   * For any 配置注入操作，备份的 .claude/ 目录应与注入前的原始目录内容一致
   * **Validates: Requirements 11.1**
   */
  it('should create complete backup of original .claude directory before injection', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成简化的项目结构
        fc.record({
          hasSkill: fc.boolean(),
          skillName: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          skillContent: fc.string({ minLength: 10, maxLength: 200 }),
          
          hasCommand: fc.boolean(),
          commandName: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          commandContent: fc.string({ minLength: 10, maxLength: 200 }),
          
          hasSettings: fc.boolean(),
          settingsData: fc.record({
            permissions: fc.option(fc.record({
              allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 2 }))
            })),
            env: fc.option(fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.string({ minLength: 1, maxLength: 20 })
            ))
          })
        }),
        
        async (projectStructure) => {
          // 创建原始项目目录
          const projectDir = path.join(tempDir, 'backup-project-' + Math.random().toString(36).substring(7));
          const claudeDir = path.join(projectDir, '.claude');
          await fs.ensureDir(claudeDir);

          // 创建原始文件
          let originalSkillContent: string | null = null;
          if (projectStructure.hasSkill) {
            const skillsDir = path.join(claudeDir, 'skills', projectStructure.skillName);
            await fs.ensureDir(skillsDir);
            originalSkillContent = projectStructure.skillContent;
            await fs.writeFile(path.join(skillsDir, 'SKILL.md'), originalSkillContent);
          }

          let originalCommandContent: string | null = null;
          if (projectStructure.hasCommand) {
            const commandsDir = path.join(claudeDir, 'commands');
            await fs.ensureDir(commandsDir);
            originalCommandContent = projectStructure.commandContent;
            await fs.writeFile(path.join(commandsDir, `${projectStructure.commandName}.md`), originalCommandContent);
          }

          let originalSettingsContent: string | null = null;
          if (projectStructure.hasSettings) {
            const settingsData: Record<string, unknown> = {};
            if (projectStructure.settingsData.permissions) {
              settingsData.permissions = projectStructure.settingsData.permissions;
            }
            if (projectStructure.settingsData.env && Object.keys(projectStructure.settingsData.env).length > 0) {
              settingsData.env = projectStructure.settingsData.env;
            }
            
            if (Object.keys(settingsData).length > 0) {
              originalSettingsContent = JSON.stringify(settingsData, null, 2);
              await fs.writeFile(path.join(claudeDir, 'settings.json'), originalSettingsContent);
            }
          }

          // 执行备份
          const backupInfo = await injectionService.backup(projectDir);

          // 验证备份信息
          expect(backupInfo.id).toBeTruthy();
          expect(backupInfo.projectPath).toBe(projectDir);
          expect(backupInfo.timestamp).toBeInstanceOf(Date);
          expect(backupInfo.backupPath).toBeTruthy();
          expect(await fs.pathExists(backupInfo.backupPath)).toBe(true);

          // 验证备份目录结构
          const backupClaudeDir = path.join(backupInfo.backupPath, '.claude');
          expect(await fs.pathExists(backupClaudeDir)).toBe(true);

          // 验证备份的 Skill
          if (originalSkillContent) {
            const backupSkillFile = path.join(backupClaudeDir, 'skills', projectStructure.skillName, 'SKILL.md');
            expect(await fs.pathExists(backupSkillFile)).toBe(true);
            
            const backupContent = await fs.readFile(backupSkillFile, 'utf-8');
            expect(backupContent).toBe(originalSkillContent);
          }

          // 验证备份的 Command
          if (originalCommandContent) {
            const backupCommandFile = path.join(backupClaudeDir, 'commands', `${projectStructure.commandName}.md`);
            expect(await fs.pathExists(backupCommandFile)).toBe(true);
            
            const backupContent = await fs.readFile(backupCommandFile, 'utf-8');
            expect(backupContent).toBe(originalCommandContent);
          }

          // 验证备份的 settings.json
          if (originalSettingsContent) {
            const backupSettingsFile = path.join(backupClaudeDir, 'settings.json');
            expect(await fs.pathExists(backupSettingsFile)).toBe(true);
            
            const backupContent = await fs.readFile(backupSettingsFile, 'utf-8');
            expect(backupContent).toBe(originalSettingsContent);
          }

          // 验证备份独立性 - 修改原始文件不影响备份
          if (originalSettingsContent) {
            const modifiedSettings = { modified: true };
            await fs.writeFile(path.join(claudeDir, 'settings.json'), JSON.stringify(modifiedSettings, null, 2));
            
            const backupSettingsFile = path.join(backupClaudeDir, 'settings.json');
            const backupContent = await fs.readFile(backupSettingsFile, 'utf-8');
            expect(backupContent).toBe(originalSettingsContent);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 21: 回滚一致性**
   * For any 回滚操作，恢复后的项目配置应与指定备份版本的配置完全一致
   * **Validates: Requirements 11.3**
   */
  it('should restore project configuration to match backup version exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成原始项目结构
        fc.record({
          originalSkill: fc.option(fc.record({
            name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 200 })
          })),
          originalCommand: fc.option(fc.record({
            name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 200 })
          })),
          originalSettings: fc.option(fc.record({
            permissions: fc.option(fc.record({
              allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 2 }))
            })),
            env: fc.option(fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.string({ minLength: 1, maxLength: 20 })
            ))
          }))
        }),
        // 生成修改后的项目结构
        fc.record({
          modifiedSkill: fc.option(fc.record({
            name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 200 })
          })),
          modifiedCommand: fc.option(fc.record({
            name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            content: fc.string({ minLength: 10, maxLength: 200 })
          })),
          modifiedSettings: fc.option(fc.record({
            newKey: fc.string({ minLength: 1, maxLength: 50 }),
            newValue: fc.string({ minLength: 1, maxLength: 100 })
          }))
        }),
        
        async (originalProject, modifications) => {
          // 创建项目目录
          const projectDir = path.join(tempDir, 'rollback-project-' + Math.random().toString(36).substring(7));
          const claudeDir = path.join(projectDir, '.claude');
          await fs.ensureDir(claudeDir);

          // 创建原始项目状态
          let originalSkillPath: string | null = null;
          let originalSkillContent: string | null = null;
          if (originalProject.originalSkill) {
            const skillsDir = path.join(claudeDir, 'skills', originalProject.originalSkill.name);
            await fs.ensureDir(skillsDir);
            originalSkillPath = path.join(skillsDir, 'SKILL.md');
            originalSkillContent = originalProject.originalSkill.content;
            await fs.writeFile(originalSkillPath, originalSkillContent);
          }

          let originalCommandPath: string | null = null;
          let originalCommandContent: string | null = null;
          if (originalProject.originalCommand) {
            const commandsDir = path.join(claudeDir, 'commands');
            await fs.ensureDir(commandsDir);
            originalCommandPath = path.join(commandsDir, `${originalProject.originalCommand.name}.md`);
            originalCommandContent = originalProject.originalCommand.content;
            await fs.writeFile(originalCommandPath, originalCommandContent);
          }

          let originalSettingsPath: string | null = null;
          let originalSettingsContent: string | null = null;
          if (originalProject.originalSettings) {
            const settingsData: Record<string, unknown> = {};
            if (originalProject.originalSettings.permissions) {
              settingsData.permissions = originalProject.originalSettings.permissions;
            }
            if (originalProject.originalSettings.env && Object.keys(originalProject.originalSettings.env).length > 0) {
              settingsData.env = originalProject.originalSettings.env;
            }
            
            if (Object.keys(settingsData).length > 0) {
              originalSettingsPath = path.join(claudeDir, 'settings.json');
              originalSettingsContent = JSON.stringify(settingsData, null, 2);
              await fs.writeFile(originalSettingsPath, originalSettingsContent);
            }
          }

          // 创建备份
          const backupInfo = await injectionService.backup(projectDir);

          // 修改项目状态
          if (modifications.modifiedSkill) {
            const skillsDir = path.join(claudeDir, 'skills', modifications.modifiedSkill.name);
            await fs.ensureDir(skillsDir);
            await fs.writeFile(path.join(skillsDir, 'SKILL.md'), modifications.modifiedSkill.content);
          }

          if (modifications.modifiedCommand) {
            const commandsDir = path.join(claudeDir, 'commands');
            await fs.ensureDir(commandsDir);
            await fs.writeFile(path.join(commandsDir, `${modifications.modifiedCommand.name}.md`), modifications.modifiedCommand.content);
          }

          if (modifications.modifiedSettings) {
            const settingsPath = path.join(claudeDir, 'settings.json');
            const modifiedSettings = {
              [modifications.modifiedSettings.newKey]: modifications.modifiedSettings.newValue
            };
            await fs.writeFile(settingsPath, JSON.stringify(modifiedSettings, null, 2));
          }

          // 验证项目已被修改
          const projectConfigAfterModification = await injectionService.scanProject(projectDir);
          
          // 执行回滚
          await injectionService.rollback(projectDir, backupInfo.id);

          // 验证回滚后的状态与原始状态一致
          const projectConfigAfterRollback = await injectionService.scanProject(projectDir);

          // 验证 Skills
          if (originalSkillPath && originalSkillContent) {
            expect(await fs.pathExists(originalSkillPath)).toBe(true);
            const restoredContent = await fs.readFile(originalSkillPath, 'utf-8');
            expect(restoredContent).toBe(originalSkillContent);
          }

          // 验证 Commands
          if (originalCommandPath && originalCommandContent) {
            expect(await fs.pathExists(originalCommandPath)).toBe(true);
            const restoredContent = await fs.readFile(originalCommandPath, 'utf-8');
            expect(restoredContent).toBe(originalCommandContent);
          }

          // 验证 Settings
          if (originalSettingsPath && originalSettingsContent) {
            expect(await fs.pathExists(originalSettingsPath)).toBe(true);
            const restoredContent = await fs.readFile(originalSettingsPath, 'utf-8');
            expect(restoredContent).toBe(originalSettingsContent);
          }

          // 验证修改后的文件不存在（如果它们与原始文件不同）
          if (modifications.modifiedSkill && 
              (!originalProject.originalSkill || modifications.modifiedSkill.name !== originalProject.originalSkill.name)) {
            const modifiedSkillPath = path.join(claudeDir, 'skills', modifications.modifiedSkill.name, 'SKILL.md');
            expect(await fs.pathExists(modifiedSkillPath)).toBe(false);
          }

          if (modifications.modifiedCommand && 
              (!originalProject.originalCommand || modifications.modifiedCommand.name !== originalProject.originalCommand.name)) {
            const modifiedCommandPath = path.join(claudeDir, 'commands', `${modifications.modifiedCommand.name}.md`);
            expect(await fs.pathExists(modifiedCommandPath)).toBe(false);
          }

          // 验证扫描结果一致性
          // 如果原始项目没有任何配置，回滚后也应该没有
          if (!originalProject.originalSkill && !originalProject.originalCommand && !originalProject.originalSettings) {
            expect(projectConfigAfterRollback.existingCapabilities).toHaveLength(0);
            expect(projectConfigAfterRollback.settingsJson).toBeUndefined();
          }

          // 验证备份目录仍然存在且未被修改
          expect(await fs.pathExists(backupInfo.backupPath)).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });
});