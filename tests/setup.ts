import { beforeAll, afterAll } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// 测试用的临时目录
export const TEST_DATA_DIR = path.join(os.tmpdir(), 'claude-orchestrator-test');

beforeAll(async () => {
  // 确保测试目录存在
  await fs.ensureDir(TEST_DATA_DIR);
});

afterAll(async () => {
  // 清理测试目录
  try {
    await fs.remove(TEST_DATA_DIR);
  } catch (error) {
    console.warn('清理测试目录失败:', error);
  }
});