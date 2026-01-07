import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ParserService } from '../src/main/services/ParserService';
import { Capability, McpContent, SettingContent } from '../src/common/types';

describe('Parser Service Validation Property Tests', () => {
  let parserService: ParserService;

  beforeEach(() => {
    parserService = new ParserService();
  });

  /**
   * **Feature: claude-config-orchestrator, Property 7: JSON 配置验证**
   * For any MCP 类型配置，验证器应检查 command 字段存在
   * **Validates: Requirements 4.3, 4.4**
   */
  it('should validate MCP configuration requires command field', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          command: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          args: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 })),
          env: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 50 })
          ))
        }),
        
        (mcpConfig) => {
          const capability: Capability = {
            id: 'test_mcp',
            type: 'mcp',
            name: 'test-mcp',
            originalDescription: 'Test MCP',
            translationStatus: 'pending',
            sourcePlugin: 'test',
            content: {
              type: 'mcp',
              serverName: 'test-server',
              config: mcpConfig
            } as McpContent,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = parserService.validateCapability(capability);

          if (mcpConfig.command && mcpConfig.command.trim().length > 0) {
            // 如果有有效的 command，应该通过验证
            expect(result.errors.filter(e => e.field === 'content.config.command')).toHaveLength(0);
          } else {
            // 如果没有有效的 command，应该有错误
            expect(result.errors.some(e => e.field === 'content.config.command')).toBe(true);
            expect(result.valid).toBe(false);
          }

          // 验证 args 类型
          if (mcpConfig.args !== undefined && mcpConfig.args !== null && !Array.isArray(mcpConfig.args)) {
            expect(result.errors.some(e => e.field === 'content.config.args')).toBe(true);
          }

          // 验证 env 类型
          if (mcpConfig.env !== undefined && mcpConfig.env !== null && typeof mcpConfig.env !== 'object') {
            expect(result.errors.some(e => e.field === 'content.config.env')).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: claude-config-orchestrator, Property 7: JSON 配置验证**
   * For any Setting 类型配置，验证器应接受 permissions、env、companyAnnouncements 等有效配置块
   * **Validates: Requirements 4.3, 4.4**
   */
  it('should validate Setting configuration accepts valid setting keys', async () => {
    await fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('permissions'),
          fc.constant('env'),
          fc.constant('companyAnnouncements'),
          fc.string({ minLength: 1, maxLength: 20 }) // 随机键
        ),
        fc.record({
          allow: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 })),
          deny: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }))
        }),
        
        (settingKey, settingConfig) => {
          const capability: Capability = {
            id: 'test_setting',
            type: 'setting',
            name: 'test-setting',
            originalDescription: 'Test Setting',
            translationStatus: 'pending',
            sourcePlugin: 'test',
            content: {
              type: 'setting',
              key: settingKey,
              config: settingConfig
            } as SettingContent,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = parserService.validateCapability(capability);

          // 基本验证应该通过
          expect(result.errors.filter(e => e.field === 'content.key')).toHaveLength(0);

          const validKeys = ['permissions', 'env', 'companyAnnouncements', 'hooks', 'mcpServers'];
          if (!validKeys.includes(settingKey)) {
            // 未知的设置键应该产生警告
            expect(result.warnings.some(w => w.field === 'content.key')).toBe(true);
          }

          // 如果是 permissions 配置，验证其结构
          if (settingKey === 'permissions') {
            // allow 和 deny 应该是数组
            if (settingConfig.allow !== undefined && settingConfig.allow !== null && !Array.isArray(settingConfig.allow)) {
              expect(result.errors.some(e => e.field === 'content.config.allow')).toBe(true);
            }
            if (settingConfig.deny !== undefined && settingConfig.deny !== null && !Array.isArray(settingConfig.deny)) {
              expect(result.errors.some(e => e.field === 'content.config.deny')).toBe(true);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});