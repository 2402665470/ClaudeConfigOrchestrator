import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';

export class DatabaseManager {
  private db: Database.Database | null = null;
  protected dbPath: string;

  constructor(customDbPath?: string) {
    if (customDbPath) {
      this.dbPath = customDbPath;
    } else {
      // 尝试获取用户数据目录，如果失败则使用临时目录
      let userDataPath: string;
      try {
        const { app } = require('electron');
        userDataPath = app.getPath('userData');
      } catch (error) {
        // 在测试环境中，使用临时目录
        userDataPath = os.tmpdir();
      }
      
      const dataDir = path.join(userDataPath, 'claude-orchestrator', 'data');
      
      // 确保数据目录存在
      fs.ensureDirSync(dataDir);
      
      this.dbPath = path.join(dataDir, 'orchestrator.db');
    }
  }

  /**
   * 初始化数据库连接
   */
  public async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    try {
      this.db = new Database(this.dbPath);

      // 启用外键约束
      this.db.pragma('foreign_keys = ON');

      // 设置 WAL 模式以提高并发性能
      this.db.pragma('journal_mode = WAL');

      // 创建数据库表
      await this.createTables();

      console.log('数据库初始化成功:', this.dbPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 检查是否是模块版本不匹配的问题
      if (errorMessage.includes('NODE_MODULE_VERSION') || errorMessage.includes('ERR_DLOPEN_FAILED')) {
        const detailedError = new Error(`
数据库模块编译错误！
原因：better-sqlite3 模块是为错误的 Node.js 版本编译的。

解决方案：
1. 运行以下命令重新编译原生模块：
   npm rebuild better-sqlite3

2. 如果上述命令失败，尝试：
   npx electron-rebuild

3. 如果还是失败，删除 node_modules 后重新安装：
   rmdir /s /q node_modules
   npm install
   npm run rebuild

详细错误信息：${errorMessage}
        `);

        console.error(detailedError.message);
        throw detailedError;
      }

      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }
    return this.db;
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 创建数据库表结构
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    // 能力表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS capabilities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        original_description TEXT,
        chinese_description TEXT,
        translation_status TEXT DEFAULT 'pending',
        source_plugin TEXT NOT NULL,
        version TEXT,
        author TEXT,
        content_json TEXT NOT NULL,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 配置模板表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        capability_ids_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 项目表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        hidden INTEGER DEFAULT 0,
        last_injected_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 备份表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        backup_path TEXT NOT NULL,
        capabilities_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 翻译缓存表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS translation_cache (
        hash TEXT PRIMARY KEY,
        original TEXT NOT NULL,
        translated TEXT NOT NULL,
        provider TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插件缓存表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugin_cache (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        source_url TEXT,
        local_path TEXT NOT NULL,
        size_bytes INTEGER,
        last_accessed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    this.createIndexes();
  }

  /**
   * 创建数据库索引
   */
  private createIndexes(): void {
    if (!this.db) {
      return;
    }

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_capabilities_type ON capabilities(type)',
      'CREATE INDEX IF NOT EXISTS idx_capabilities_source ON capabilities(source_plugin)',
      'CREATE INDEX IF NOT EXISTS idx_capabilities_translation ON capabilities(translation_status)',
      'CREATE INDEX IF NOT EXISTS idx_backups_project ON backups(project_path)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_cache_name ON plugin_cache(name)',
    ];

    indexes.forEach(indexSql => {
      try {
        this.db!.exec(indexSql);
      } catch (error) {
        console.warn('创建索引失败:', indexSql, error);
      }
    });
  }

  /**
   * 检查数据库健康状态
   */
  public checkHealth(): { healthy: boolean; error?: string } {
    try {
      if (!this.db) {
        return { healthy: false, error: '数据库未初始化' };
      }

      // 执行简单查询测试连接
      this.db.prepare('SELECT 1').get();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }

  /**
   * 获取数据库统计信息
   */
  public getStats(): DatabaseStats {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const stats: DatabaseStats = {
      capabilities: this.db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as { count: number },
      templates: this.db.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number },
      projects: this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number },
      backups: this.db.prepare('SELECT COUNT(*) as count FROM backups').get() as { count: number },
      translationCache: this.db.prepare('SELECT COUNT(*) as count FROM translation_cache').get() as { count: number },
      pluginCache: this.db.prepare('SELECT COUNT(*) as count FROM plugin_cache').get() as { count: number },
    };

    return stats;
  }
}

export interface DatabaseStats {
  capabilities: { count: number };
  templates: { count: number };
  projects: { count: number };
  backups: { count: number };
  translationCache: { count: number };
  pluginCache: { count: number };
}

// 单例实例
export const databaseManager = new DatabaseManager();