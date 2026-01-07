import { DatabaseManager } from './database';
import { 
  Capability, 
  ConfigTemplate, 
  Project, 
  CapabilityType, 
  TranslationStatus,
  BackupInfo
} from '../../common/types';
// import { v4 as uuidv4 } from 'uuid'; // 暂时不需要

export interface SearchQuery {
  keyword?: string;
  type?: CapabilityType;
  sourcePlugin?: string;
  translationStatus?: TranslationStatus;
}

export interface ExportData {
  version: string;
  exportedAt: Date;
  capabilities: Capability[];
  templates: ConfigTemplate[];
  projects: Project[];
  translations: Record<string, string>;
}



export class StorageService {
  private dbManager: DatabaseManager;

  constructor(dbManager?: DatabaseManager) {
    // 如果没有传入 dbManager，使用全局实例
    this.dbManager = dbManager || require('./database').databaseManager;
  }

  // ==================== 能力操作 ====================

  /**
   * 保存能力
   */
  public async saveCapability(capability: Capability): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO capabilities (
        id, type, name, original_description, chinese_description, 
        translation_status, source_plugin, version, author, 
        content_json, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    
    stmt.run(
      capability.id,
      capability.type,
      capability.name,
      capability.originalDescription,
      capability.chineseDescription || null,
      capability.translationStatus,
      capability.sourcePlugin,
      capability.version || null,
      capability.author || null,
      JSON.stringify(capability.content),
      JSON.stringify(capability.metadata),
      capability.createdAt.toISOString(),
      now
    );
  }

  /**
   * 获取单个能力
   */
  public async getCapability(id: string): Promise<Capability | null> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM capabilities WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }

    return this.mapRowToCapability(row);
  }

  /**
   * 获取所有能力
   */
  public async getAllCapabilities(): Promise<Capability[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM capabilities ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => this.mapRowToCapability(row));
  }

  /**
   * 删除能力
   */
  public async deleteCapability(id: string): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('DELETE FROM capabilities WHERE id = ?');
    stmt.run(id);
  }

  /**
   * 更新能力
   */
  public async updateCapability(id: string, updates: Partial<Capability>): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    // 首先获取现有能力
    const existing = await this.getCapability(id);
    if (!existing) {
      throw new Error(`Capability with id ${id} not found`);
    }

    // 合并更新
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    
    // 保存更新后的能力
    await this.saveCapability(updated);
  }

  /**
   * 更新能力的中文描述
   */
  public async updateCapabilityChineseDescription(id: string, chineseDescription: string): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      UPDATE capabilities 
      SET chinese_description = ?, translation_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    // 如果是手动编辑，设置状态为 manually_edited
    stmt.run(chineseDescription, 'manually_edited', id);
  }

  /**
   * 搜索能力
   */
  public async searchCapabilities(query: SearchQuery): Promise<Capability[]> {
    const db = this.dbManager.getDatabase();
    
    let sql = 'SELECT * FROM capabilities WHERE 1=1';
    const params: any[] = [];

    if (query.keyword) {
      sql += ' AND (name LIKE ? OR original_description LIKE ? OR chinese_description LIKE ?)';
      const keyword = `%${query.keyword}%`;
      params.push(keyword, keyword, keyword);
    }

    if (query.type) {
      sql += ' AND type = ?';
      params.push(query.type);
    }

    if (query.sourcePlugin) {
      sql += ' AND source_plugin = ?';
      params.push(query.sourcePlugin);
    }

    if (query.translationStatus) {
      sql += ' AND translation_status = ?';
      params.push(query.translationStatus);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => this.mapRowToCapability(row));
  }

  // ==================== 模板操作 ====================

  /**
   * 保存配置模板
   */
  public async saveTemplate(template: ConfigTemplate): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO templates (
        id, name, description, capability_ids_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    
    stmt.run(
      template.id,
      template.name,
      template.description,
      JSON.stringify(template.capabilityIds),
      template.createdAt.toISOString(),
      now
    );
  }

  /**
   * 获取单个模板
   */
  public async getTemplate(id: string): Promise<ConfigTemplate | null> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }

    return this.mapRowToTemplate(row);
  }

  /**
   * 获取所有模板
   */
  public async getAllTemplates(): Promise<ConfigTemplate[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM templates ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => this.mapRowToTemplate(row));
  }

  /**
   * 删除模板
   */
  public async deleteTemplate(id: string): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
    stmt.run(id);
  }

  // ==================== 项目操作 ====================

  /**
   * 保存项目
   */
  public async saveProject(project: Project): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO projects (
        id, name, path, hidden, last_injected_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      project.id,
      project.name,
      project.path,
      project.hidden ? 1 : 0,
      project.lastInjectedAt?.toISOString() || null,
      project.createdAt.toISOString()
    );
  }

  /**
   * 获取单个项目
   */
  public async getProject(id: string): Promise<Project | null> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }

    return this.mapRowToProject(row);
  }

  /**
   * 获取所有项目（只返回非隐藏的）
   */
  public async getAllProjects(): Promise<Project[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM projects WHERE hidden = 0 ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => this.mapRowToProject(row));
  }

  /**
   * 获取所有项目（包括隐藏的）
   */
  private async getAllProjectsIncludingHidden(): Promise<Project[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => this.mapRowToProject(row));
  }

  /**
   * 删除项目
   */
  public async deleteProject(id: string): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }

  // ==================== 备份操作 ====================

  /**
   * 保存备份信息
   */
  public async saveBackup(backup: BackupInfo): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO backups (
        id, project_path, backup_path, capabilities_json, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      backup.id,
      backup.projectPath,
      backup.backupPath,
      JSON.stringify(backup.capabilities),
      backup.timestamp.toISOString()
    );
  }

  /**
   * 获取项目的备份列表
   */
  public async getBackups(projectPath: string): Promise<BackupInfo[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM backups WHERE project_path = ? ORDER BY created_at DESC');
    const rows = stmt.all(projectPath) as any[];
    
    return rows.map(row => ({
      id: row.id,
      projectPath: row.project_path,
      timestamp: new Date(row.created_at),
      capabilities: JSON.parse(row.capabilities_json),
      backupPath: row.backup_path,
    }));
  }

  // ==================== 缓存管理 ====================

  /**
   * 获取插件缓存统计
   */
  public async getPluginCacheStats(): Promise<{ entries: number; totalSizeBytes: number; hitRate: number }> {
    const db = this.dbManager.getDatabase();
    
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM plugin_cache');
    const sizeStmt = db.prepare('SELECT SUM(size_bytes) as total_size FROM plugin_cache');
    
    const countResult = countStmt.get() as any;
    const sizeResult = sizeStmt.get() as any;
    
    return {
      entries: countResult.count || 0,
      totalSizeBytes: sizeResult.total_size || 0,
      hitRate: 0, // TODO: 实现命中率计算
    };
  }

  /**
   * 获取翻译缓存统计
   */
  public async getTranslationCacheStats(): Promise<{ entries: number; sizeBytes: number; hitRate: number }> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT COUNT(*) as count, SUM(LENGTH(original) + LENGTH(translated)) as size FROM translation_cache');
    const result = stmt.get() as any;
    
    return {
      entries: result.count || 0,
      sizeBytes: result.size || 0,
      hitRate: 0, // TODO: 实现命中率计算
    };
  }

  /**
   * 清理未使用的插件缓存
   * 保留能力信息和中文描述，只清理插件文件缓存
   */
  public async clearUnusedPluginCache(): Promise<{ deletedEntries: number; freedBytes: number }> {
    const db = this.dbManager.getDatabase();
    
    // 获取所有已导入能力的源插件
    const usedPluginsStmt = db.prepare('SELECT DISTINCT source_plugin FROM capabilities');
    const usedPlugins = usedPluginsStmt.all() as any[];
    const usedPluginNames = new Set(usedPlugins.map(row => row.source_plugin));
    
    // 查找未使用的缓存条目
    const unusedCacheStmt = db.prepare(`
      SELECT id, name, size_bytes FROM plugin_cache 
      WHERE name NOT IN (${usedPluginNames.size > 0 ? Array.from(usedPluginNames).map(() => '?').join(',') : 'NULL'})
    `);
    
    const unusedEntries = unusedCacheStmt.all(...Array.from(usedPluginNames)) as any[];
    
    if (unusedEntries.length === 0) {
      return { deletedEntries: 0, freedBytes: 0 };
    }
    
    // 计算释放的空间
    const freedBytes = unusedEntries.reduce((total, entry) => total + (entry.size_bytes || 0), 0);
    
    // 删除未使用的缓存条目
    const deleteStmt = db.prepare('DELETE FROM plugin_cache WHERE id = ?');
    const transaction = db.transaction(() => {
      for (const entry of unusedEntries) {
        deleteStmt.run(entry.id);
      }
    });
    
    transaction();
    
    return {
      deletedEntries: unusedEntries.length,
      freedBytes,
    };
  }

  /**
   * 清空所有插件缓存
   */
  public async clearAllPluginCache(): Promise<{ deletedEntries: number; freedBytes: number }> {
    const db = this.dbManager.getDatabase();
    
    // 获取统计信息
    const stats = await this.getPluginCacheStats();
    
    // 清空插件缓存表
    const deleteStmt = db.prepare('DELETE FROM plugin_cache');
    deleteStmt.run();
    
    return {
      deletedEntries: stats.entries,
      freedBytes: stats.totalSizeBytes,
    };
  }

  /**
   * 清空翻译缓存（保留手动编辑的中文描述）
   */
  public async clearTranslationCache(): Promise<{ deletedEntries: number }> {
    const db = this.dbManager.getDatabase();
    
    // 获取当前条目数
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM translation_cache');
    const countResult = countStmt.get() as any;
    
    // 清空翻译缓存表
    const deleteStmt = db.prepare('DELETE FROM translation_cache');
    deleteStmt.run();
    
    return {
      deletedEntries: countResult.count || 0,
    };
  }

  /**
   * 获取所有插件缓存条目
   */
  public async getAllPluginCacheEntries(): Promise<any[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM plugin_cache ORDER BY last_accessed_at DESC');
    return stmt.all();
  }

  /**
   * 获取所有翻译缓存条目
   */
  public async getAllTranslationCacheEntries(): Promise<any[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT * FROM translation_cache ORDER BY created_at DESC');
    return stmt.all();
  }

  // ==================== 导入导出 ====================

  /**
   * 导出所有数据
   */
  public async exportAll(): Promise<ExportData> {
    const capabilities = await this.getAllCapabilities();
    const templates = await this.getAllTemplates();
    const projects = await this.getAllProjectsIncludingHidden();
    
    // 获取翻译缓存
    const db = this.dbManager.getDatabase();
    const translationStmt = db.prepare('SELECT hash, translated FROM translation_cache');
    const translationRows = translationStmt.all() as any[];
    
    const translations: Record<string, string> = {};
    translationRows.forEach(row => {
      translations[row.hash] = row.translated;
    });

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      capabilities,
      templates,
      projects,
      translations,
    };
  }

  /**
   * 导入所有数据
   */
  public async importAll(data: ExportData): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    // 使用事务确保数据一致性
    const transaction = db.transaction(() => {
      // 导入能力
      for (const capability of data.capabilities) {
        this.saveCapabilitySync(capability);
      }

      // 导入模板
      for (const template of data.templates) {
        this.saveTemplateSync(template);
      }

      // 导入项目
      for (const project of data.projects) {
        this.saveProjectSync(project);
      }

      // 导入翻译缓存
      const translationStmt = db.prepare(`
        INSERT OR REPLACE INTO translation_cache (hash, original, translated, provider, created_at)
        VALUES (?, '', ?, 'imported', ?)
      `);
      
      for (const [hash, translated] of Object.entries(data.translations)) {
        translationStmt.run(hash, translated, new Date().toISOString());
      }
    });

    transaction();
  }

  // ==================== 私有辅助方法 ====================

  private mapRowToCapability(row: any): Capability {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      originalDescription: row.original_description,
      chineseDescription: row.chinese_description || undefined,
      translationStatus: row.translation_status,
      sourcePlugin: row.source_plugin,
      version: row.version,
      author: row.author,
      content: JSON.parse(row.content_json),
      metadata: JSON.parse(row.metadata_json || '{}'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToTemplate(row: any): ConfigTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      capabilityIds: JSON.parse(row.capability_ids_json),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      hidden: row.hidden === 1,
      lastInjectedAt: row.last_injected_at ? new Date(row.last_injected_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  private saveCapabilitySync(capability: Capability): void {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO capabilities (
        id, type, name, original_description, chinese_description, 
        translation_status, source_plugin, version, author, 
        content_json, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    
    stmt.run(
      capability.id,
      capability.type,
      capability.name,
      capability.originalDescription,
      capability.chineseDescription || null,
      capability.translationStatus,
      capability.sourcePlugin,
      capability.version || null,
      capability.author || null,
      JSON.stringify(capability.content),
      JSON.stringify(capability.metadata),
      capability.createdAt.toISOString(),
      now
    );
  }

  private saveTemplateSync(template: ConfigTemplate): void {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO templates (
        id, name, description, capability_ids_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    
    stmt.run(
      template.id,
      template.name,
      template.description,
      JSON.stringify(template.capabilityIds),
      template.createdAt.toISOString(),
      now
    );
  }

  private saveProjectSync(project: Project): void {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO projects (
        id, name, path, hidden, last_injected_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      project.id,
      project.name,
      project.path,
      project.hidden ? 1 : 0,
      project.lastInjectedAt?.toISOString() || null,
      project.createdAt.toISOString()
    );
  }
}