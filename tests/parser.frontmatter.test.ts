import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ParserService } from '../src/main/services/ParserService';

describe('Parser Service Frontmatter Tests', () => {
  let parserService: ParserService;
  let tempDir: string;

  beforeEach(async () => {
    parserService = new ParserService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-frontmatter-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('Basic Frontmatter', () => {
    it('should parse simple key-value frontmatter', async () => {
      const content = `---
name: test-command
description: A test command
author: Test Author
version: 1.0.0
---

# Test Command

This is a test command.`;

      const commandFile = path.join(tempDir, 'test-command.md');
      await fs.writeFile(commandFile, content);

      const capability = await parserService.parseCapability(commandFile, 'command');

      expect(capability.name).toBe('test-command');
      expect(capability.originalDescription).toBe('A test command');
      expect(capability.author).toBe('Test Author');
      expect(capability.version).toBe('1.0.0');
      expect(capability.metadata.frontmatter).toEqual({
        name: 'test-command',
        description: 'A test command',
        author: 'Test Author',
        version: '1.0.0'
      });
    });

    it('should handle missing frontmatter', async () => {
      const content = `# Test Command

This is a test command without frontmatter.`;

      const commandFile = path.join(tempDir, 'test-command.md');
      await fs.writeFile(commandFile, content);

      const capability = await parserService.parseCapability(commandFile, 'command');

      expect(capability.name).toBe('test-command');
      expect(capability.originalDescription).toBe('Command: test-command');
      expect(capability.metadata.frontmatter).toEqual({});
    });
  });

  describe('Complex Frontmatter', () => {
    it('should parse array values', async () => {
      const content = `---
name: complex-command
description: A complex command
tags:
  - utility
  - development
  - testing
dependencies:
  - node
  - npm
---

# Complex Command

This command has complex frontmatter.`;

      const commandFile = path.join(tempDir, 'complex-command.md');
      await fs.writeFile(commandFile, content);

      const capability = await parserService.parseCapability(commandFile, 'command');

      expect(capability.name).toBe('complex-command');
      expect(capability.metadata.frontmatter.tags).toEqual(['utility', 'development', 'testing']);
      expect(capability.metadata.frontmatter.dependencies).toEqual(['node', 'npm']);
    });

    it('should parse nested objects', async () => {
      const content = `---
name: nested-command
description: A command with nested config
config:
  server:
    host: localhost
    port: 3000
  database:
    type: sqlite
    path: ./data.db
---

# Nested Command

This command has nested configuration.`;

      const commandFile = path.join(tempDir, 'nested-command.md');
      await fs.writeFile(commandFile, content);

      const capability = await parserService.parseCapability(commandFile, 'command');

      expect(capability.name).toBe('nested-command');
      expect(capability.metadata.frontmatter.config).toEqual({
        server: {
          host: 'localhost',
          port: 3000
        },
        database: {
          type: 'sqlite',
          path: './data.db'
        }
      });
    });

    it('should handle boolean and number values', async () => {
      const content = `---
name: typed-command
description: A command with typed values
enabled: true
disabled: false
port: 8080
timeout: 30.5
---

# Typed Command

This command has typed values.`;

      const commandFile = path.join(tempDir, 'typed-command.md');
      await fs.writeFile(commandFile, content);

      const capability = await parserService.parseCapability(commandFile, 'command');

      expect(capability.metadata.frontmatter.enabled).toBe(true);
      expect(capability.metadata.frontmatter.disabled).toBe(false);
      expect(capability.metadata.frontmatter.port).toBe(8080);
      expect(capability.metadata.frontmatter.timeout).toBe(30.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed YAML gracefully', async () => {
      const content = `---
name: malformed-command
description: A command with malformed YAML
invalid: [unclosed array
another: key: nested: badly
---

# Malformed Command

This command has malformed YAML.`;

      const commandFile = path.join(tempDir, 'malformed-command.md');
      await fs.writeFile(commandFile, content);

      const capability = await parserService.parseCapability(commandFile, 'command');

      // Should fallback to simple parsing or return empty frontmatter
      expect(capability.name).toBeTruthy();
      expect(capability.metadata.frontmatter).toBeDefined();
    });
  });
});