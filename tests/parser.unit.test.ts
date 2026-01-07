import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ParserService } from '../src/main/services/ParserService';

describe('Parser Service Unit Tests', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-unit-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('Command Parser', () => {
    it('should parse command file with frontmatter', async () => {
      const commandContent = `---
name: test-command
description: A test command
author: Test Author
---

# Test Command

This is a test command.`;

      const commandFile = path.join(tempDir, 'test-command.md');
      await fs.writeFile(commandFile, commandContent);

      const capability = await parserService.parseCapability(commandFile, 'command');

      expect(capability.type).toBe('command');
      expect(capability.name).toBe('test-command');
      expect(capability.originalDescription).toBe('A test command');
      expect(capability.author).toBe('Test Author');
      expect(capability.content.type).toBe('command');
      expect((capability.content as any).markdown).toContain('# Test Command');
    });
  });

  describe('Agent Parser', () => {
    it('should parse agent file with frontmatter', async () => {
      const agentContent = `---
name: test-agent
description: A test agent
version: 1.0.0
---

# Test Agent

This is a test agent for testing purposes.`;

      const agentFile = path.join(tempDir, 'test-agent.md');
      await fs.writeFile(agentFile, agentContent);

      const capability = await parserService.parseCapability(agentFile, 'agent');

      expect(capability.type).toBe('agent');
      expect(capability.name).toBe('test-agent');
      expect(capability.originalDescription).toBe('A test agent');
      expect(capability.version).toBe('1.0.0');
      expect(capability.content.type).toBe('agent');
      expect((capability.content as any).markdown).toContain('# Test Agent');
    });
  });
});