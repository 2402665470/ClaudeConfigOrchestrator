import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ParserService } from '../src/main/services/ParserService';

describe('Parser Service Skill Debug Tests', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-skill-debug-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should debug skill parsing with simple structure', async () => {
    // 创建简单的技能目录
    const skillDir = path.join(tempDir, 'simple-skill');
    await fs.ensureDir(skillDir);

    // 创建 SKILL.md
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), '# Simple Skill\n\nThis is a simple skill.');

    // 创建一个子目录和文件
    const subDir = path.join(skillDir, 'subdir');
    await fs.ensureDir(subDir);
    await fs.writeFile(path.join(subDir, 'test.txt'), 'Test content');

    console.log('Files in skill directory:');
    const allFiles = await fs.readdir(skillDir, { recursive: true });
    console.log(allFiles);

    // 解析技能
    const skillFile = path.join(skillDir, 'SKILL.md');
    const capability = await parserService.parseCapability(skillFile, 'skill');

    console.log('Parsed capability files:', (capability.content as any).files);

    expect(capability.type).toBe('skill');
    expect((capability.content as any).files).toContain('SKILL.md');
    expect((capability.content as any).files).toContain('subdir/test.txt');
  });
});