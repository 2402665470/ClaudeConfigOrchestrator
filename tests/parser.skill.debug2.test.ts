import { describe, it, beforeEach, afterEach } from 'vitest';
import { ParserService } from '../src/main/services/ParserService';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Parser Service Skill Debug Tests 2', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should debug skill parsing with minimal structure', async () => {
    // 创建最小的技能结构
    const skillDir = path.join(tempDir, 'skill-test', 'A');
    await fs.ensureDir(skillDir);

    // 创建 SKILL.md
    const skillContent = '          '; // 只有空格的内容
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent);

    console.log('Skill directory:', skillDir);
    console.log('Files in skill directory:');
    const allFiles = await fs.readdir(skillDir, { recursive: true });
    console.log(allFiles);

    // 解析技能
    const skillFile = path.join(skillDir, 'SKILL.md');
    const capability = await parserService.parseCapability(skillFile, 'skill');

    console.log('Parsed capability files:', (capability.content as any).files);
    console.log('Expected files: ["SKILL.md"]');
    console.log('Actual files count:', (capability.content as any).files.length);
  });

  it('should debug skill parsing with subdirectory structure', async () => {
    // 创建复杂的技能结构
    const skillDir = path.join(tempDir, 'skill-test', '0');
    await fs.ensureDir(skillDir);

    // 创建 SKILL.md
    const skillContent = '          '; // 只有空格的内容
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent);

    // 创建子目录和文件
    const subdirPath = path.join(skillDir, 'i');
    await fs.ensureDir(subdirPath);
    
    await fs.writeFile(path.join(subdirPath, 'HN'), 'content');
    await fs.writeFile(path.join(subdirPath, 'constructor'), 'content');
    await fs.writeFile(path.join(subdirPath, 'valueOf'), 'content');
    await fs.writeFile(path.join(subdirPath, '0Pv'), 'content');
    await fs.writeFile(path.join(subdirPath, '__proto__'), 'content');

    console.log('Skill directory:', skillDir);
    console.log('Files in skill directory:');
    const allFiles = await fs.readdir(skillDir, { recursive: true });
    console.log(allFiles);

    // 解析技能
    const skillFile = path.join(skillDir, 'SKILL.md');
    const capability = await parserService.parseCapability(skillFile, 'skill');

    console.log('Parsed capability files:', (capability.content as any).files);
    console.log('Expected files: ["SKILL.md", "i/HN", "i/constructor", "i/valueOf", "i/0Pv", "i/__proto__"]');
    console.log('Actual files count:', (capability.content as any).files.length);
  });
});