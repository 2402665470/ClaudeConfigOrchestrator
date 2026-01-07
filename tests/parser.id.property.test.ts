import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ParserService } from '../src/main/services/ParserService';

describe('Parser Service ID Property Tests', () => {
  let parserService: ParserService;

  beforeEach(() => {
    parserService = new ParserService();
  });

  /**
   * **Feature: claude-config-orchestrator, Property 6: 能力 ID 唯一性**
   * For any 两个不同的能力，生成的唯一标识符应不相同
   * **Validates: Requirements 3.6**
   */
  it('should generate unique IDs for different capabilities', async () => {
    await fc.assert(
      fc.property(
        // 生成两个不同的能力
        fc.record({
          type: fc.constantFrom('command', 'skill', 'agent'),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          content: fc.string({ minLength: 1, maxLength: 500 })
        }),
        fc.record({
          type: fc.constantFrom('command', 'skill', 'agent'),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          content: fc.string({ minLength: 1, maxLength: 500 })
        }),
        
        (capability1, capability2) => {
          // 确保两个能力不完全相同
          const isDifferent = 
            capability1.type !== capability2.type ||
            capability1.name !== capability2.name ||
            capability1.content !== capability2.content;

          if (!isDifferent) {
            return; // 跳过相同的能力
          }

          // 生成 ID
          const id1 = parserService.generateId({
            type: capability1.type as any,
            name: capability1.name,
            description: '',
            filePath: '',
            content: capability1.content,
            metadata: {}
          });

          const id2 = parserService.generateId({
            type: capability2.type as any,
            name: capability2.name,
            description: '',
            filePath: '',
            content: capability2.content,
            metadata: {}
          });

          // 验证 ID 不相同
          expect(id1).not.toBe(id2);
          
          // 验证 ID 格式正确
          expect(id1).toMatch(/^(command|skill|agent)_[a-f0-9]{8}$/);
          expect(id2).toMatch(/^(command|skill|agent)_[a-f0-9]{8}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 测试相同能力生成相同 ID（确定性）
   */
  it('should generate same ID for identical capabilities', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('command', 'skill', 'agent'),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          content: fc.string({ minLength: 1, maxLength: 500 })
        }),
        
        (capability) => {
          const parsedCapability = {
            type: capability.type as any,
            name: capability.name,
            description: '',
            filePath: '',
            content: capability.content,
            metadata: {}
          };

          // 生成两次 ID
          const id1 = parserService.generateId(parsedCapability);
          const id2 = parserService.generateId(parsedCapability);

          // 验证 ID 相同（确定性）
          expect(id1).toBe(id2);
        }
      ),
      { numRuns: 50 }
    );
  });
});