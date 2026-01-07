import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ParserService } from '../src/main/services/ParserService';

describe('Parser Service Debug Tests', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-debug-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should handle empty plugin directory', async () => {
    // 创建空的插件目录
    const pluginDir = path.join(tempDir, 'empty-plugin');
    const claudeDir = path.join(pluginDir, '.claude');
    await fs.ensureDir(claudeDir);

    // 解析插件
    const capabilities = await parserService.parsePlugin(pluginDir);
    
    console.log('Empty plugin capabilities:', capabilities);
    expect(capabilities).toHaveLength(0);
  });

  it('should handle plugin with empty settings.json', async () => {
    // 创建插件目录
    const pluginDir = path.join(tempDir, 'empty-settings-plugin');
    const claudeDir = path.join(pluginDir, '.claude');
    await fs.ensureDir(claudeDir);

    // 创建空的 settings.json
    await fs.writeFile(path.join(claudeDir, 'settings.json'), '{}');

    // 解析插件
    const capabilities = await parserService.parsePlugin(pluginDir);
    
    console.log('Empty settings plugin capabilities:', capabilities);
    expect(capabilities).toHaveLength(0);
  });
});