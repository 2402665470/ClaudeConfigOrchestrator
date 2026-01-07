import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { DatabaseManager } from './database';
import { CapabilityType, TranslationStatus } from '../../common/types';

export interface TranslationContext {
  capabilityType: CapabilityType;
  capabilityName: string;
}

export interface TranslationItem {
  id: string;
  text: string;
  context: TranslationContext;
}

export interface TranslationResult {
  id: string;
  original: string;
  translated: string;
  success: boolean;
  error?: string;
}

export interface TranslationConfig {
  enabled: boolean;
  provider: 'gemini';
  apiKey: string;
  model: string;
  batchSize: number;
  rateLimit: number;
}

export interface TranslationConfigStatus {
  configured: boolean;
  enabled: boolean;
  provider?: string;
  error?: string;
}

export interface TranslationError {
  code: 'API_KEY_MISSING' | 'API_KEY_INVALID' | 'API_UNAVAILABLE' | 'RATE_LIMIT_EXCEEDED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: string;
}

export interface TranslationCacheStats {
  entries: number;
  sizeBytes: number;
  hitRate: number;
}

/**
 * Translation Service - 负责自动翻译能力描述
 */
export class TranslationService {
  private dbManager: DatabaseManager;
  private config: TranslationConfig;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private requestTimes: number[] = []; // 记录最近的请求时间
  private cacheHits: number = 0; // 缓存命中次数
  private cacheMisses: number = 0; // 缓存未命中次数

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.config = {
      enabled: false,
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-pro',
      batchSize: 10,
      rateLimit: 60 // 每分钟请求数
    };
  }

  /**
   * 翻译单个描述
   */
  public async translate(text: string, context: TranslationContext): Promise<string> {
    return this.safeTranslate(async () => {
      // 检查缓存
      const cacheKey = this.generateCacheKey(text);
      const cached = await this.getCachedTranslation(cacheKey);
      if (cached) {
        return cached;
      }

      // 检查速率限制
      await this.checkRateLimit();

      // 调用翻译 API
      const translated = await this.callTranslationAPI(text, context);
      
      // 缓存结果
      await this.cacheTranslation(cacheKey, text, translated);
      
      return translated;
    });
  }

  /**
   * 翻译能力描述（带状态管理）
   */
  public async translateCapability(capabilityId: string, text: string, context: TranslationContext): Promise<string> {
    // 检查是否可以自动翻译
    const canTranslate = await this.canAutoTranslate(capabilityId);
    if (!canTranslate) {
      throw this.createTranslationError('UNKNOWN_ERROR', '该能力已被人工编辑，不能自动翻译', '人工编辑的内容受到保护');
    }

    try {
      // 标记为翻译中
      await this.updateTranslationStatus(capabilityId, 'translating');
      
      // 执行翻译
      const translated = await this.translate(text, context);
      
      // 标记为自动翻译完成
      await this.updateTranslationStatus(capabilityId, 'auto_translated');
      
      return translated;
    } catch (error) {
      // 标记为翻译失败
      await this.updateTranslationStatus(capabilityId, 'failed');
      throw error;
    }
  }

  /**
   * 批量翻译
   */
  public async translateBatch(items: TranslationItem[]): Promise<TranslationResult[]> {
    try {
      this.validateConfig();
    } catch (error) {
      const translationError = error as any;
      return items.map(item => ({
        id: item.id,
        original: item.text,
        translated: item.text,
        success: false,
        error: translationError.message || '翻译服务未配置或未启用'
      }));
    }

    const results: TranslationResult[] = [];
    
    // 分批处理，每批之间添加延迟以遵守速率限制
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      const batch = items.slice(i, i + this.config.batchSize);
      
      // 如果不是第一批，添加延迟以避免速率限制
      if (i > 0) {
        const delayMs = Math.ceil((60 * 1000) / this.config.rateLimit) * this.config.batchSize;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      const batchResults = await this.processBatchWithRetry(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 批量翻译能力（带状态管理）
   */
  public async translateCapabilitiesBatch(items: Array<TranslationItem & { capabilityId: string }>): Promise<TranslationResult[]> {
    try {
      this.validateConfig();
    } catch (error) {
      const translationError = error as any;
      return items.map(item => ({
        id: item.id,
        original: item.text,
        translated: item.text,
        success: false,
        error: translationError.message || '翻译服务未配置或未启用'
      }));
    }

    // 过滤出可以翻译的能力
    const translatableItems: Array<TranslationItem & { capabilityId: string }> = [];
    const results: TranslationResult[] = [];

    for (const item of items) {
      const canTranslate = await this.canAutoTranslate(item.capabilityId);
      if (!canTranslate) {
        results.push({
          id: item.id,
          original: item.text,
          translated: item.text,
          success: false,
          error: '该能力已被人工编辑，不能自动翻译'
        });
      } else {
        translatableItems.push(item);
      }
    }

    if (translatableItems.length === 0) {
      return results;
    }

    // 批量标记为翻译中
    await this.updateTranslationStatusBatch(
      translatableItems.map(item => ({ id: item.capabilityId, status: 'translating' as TranslationStatus }))
    );

    // 执行翻译
    const translationResults = await this.translateBatch(translatableItems);
    
    // 更新状态
    const statusUpdates: Array<{ id: string; status: TranslationStatus }> = [];
    
    for (const result of translationResults) {
      const item = translatableItems.find(i => i.id === result.id);
      if (item) {
        statusUpdates.push({
          id: item.capabilityId,
          status: result.success ? 'auto_translated' : 'failed'
        });
      }
    }
    
    await this.updateTranslationStatusBatch(statusUpdates);
    
    results.push(...translationResults);
    return results;
  }

  /**
   * 检查配置状态
   */
  public async checkConfig(): Promise<TranslationConfigStatus> {
    if (!this.config.apiKey) {
      return {
        configured: false,
        enabled: false,
        error: '未配置 API Key'
      };
    }

    if (!this.config.enabled) {
      return {
        configured: true,
        enabled: false,
        provider: this.config.provider
      };
    }

    // 测试 API 连接
    try {
      await this.testAPIConnection();
      return {
        configured: true,
        enabled: true,
        provider: this.config.provider
      };
    } catch (error) {
      return {
        configured: true,
        enabled: false,
        provider: this.config.provider,
        error: error instanceof Error ? error.message : 'API 连接测试失败'
      };
    }
  }

  /**
   * 获取缓存统计
   */
  public async getCacheStats(): Promise<TranslationCacheStats> {
    const db = this.dbManager.getDatabase();
    
    const countResult = db.prepare('SELECT COUNT(*) as count FROM translation_cache').get() as { count: number };
    const sizeResult = db.prepare('SELECT SUM(LENGTH(original) + LENGTH(translated)) as size FROM translation_cache').get() as { size: number | null };
    
    // 计算命中率
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    
    return {
      entries: countResult.count,
      sizeBytes: sizeResult.size || 0,
      hitRate: Math.round(hitRate * 100) / 100 // 保留两位小数
    };
  }

  /**
   * 清除缓存
   */
  public async clearCache(): Promise<void> {
    const db = this.dbManager.getDatabase();
    db.prepare('DELETE FROM translation_cache').run();
    
    // 重置统计
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * 清除过期缓存
   */
  public async clearExpiredCache(daysOld: number = 30): Promise<number> {
    const db = this.dbManager.getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const stmt = db.prepare('DELETE FROM translation_cache WHERE created_at < ?');
    const result = stmt.run(cutoffDate.toISOString());
    
    return result.changes || 0;
  }

  /**
   * 获取缓存大小限制并清理
   */
  public async cleanupCache(maxEntries: number = 10000): Promise<number> {
    const db = this.dbManager.getDatabase();
    
    // 获取当前条目数
    const countResult = db.prepare('SELECT COUNT(*) as count FROM translation_cache').get() as { count: number };
    
    if (countResult.count <= maxEntries) {
      return 0;
    }
    
    // 删除最旧的条目
    const deleteCount = countResult.count - maxEntries;
    const stmt = db.prepare(`
      DELETE FROM translation_cache 
      WHERE hash IN (
        SELECT hash FROM translation_cache 
        ORDER BY created_at ASC 
        LIMIT ?
      )
    `);
    
    const result = stmt.run(deleteCount);
    return result.changes || 0;
  }

  // ==================== 翻译状态管理 ====================

  /**
   * 更新能力的翻译状态
   */
  public async updateTranslationStatus(capabilityId: string, status: TranslationStatus): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      UPDATE capabilities 
      SET translation_status = ?, updated_at = ? 
      WHERE id = ?
    `);
    
    stmt.run(status, new Date().toISOString(), capabilityId);
  }

  /**
   * 批量更新翻译状态
   */
  public async updateTranslationStatusBatch(updates: Array<{ id: string; status: TranslationStatus }>): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      UPDATE capabilities 
      SET translation_status = ?, updated_at = ? 
      WHERE id = ?
    `);
    
    const transaction = db.transaction(() => {
      for (const update of updates) {
        stmt.run(update.status, new Date().toISOString(), update.id);
      }
    });
    
    transaction();
  }

  /**
   * 获取指定状态的能力列表
   */
  public async getCapabilitiesByTranslationStatus(status: TranslationStatus): Promise<string[]> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT id FROM capabilities WHERE translation_status = ?');
    const results = stmt.all(status) as Array<{ id: string }>;
    
    return results.map(r => r.id);
  }

  /**
   * 获取翻译状态统计
   */
  public async getTranslationStatusStats(): Promise<Record<TranslationStatus, number>> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      SELECT translation_status, COUNT(*) as count 
      FROM capabilities 
      GROUP BY translation_status
    `);
    
    const results = stmt.all() as Array<{ translation_status: TranslationStatus; count: number }>;
    
    const stats: Record<TranslationStatus, number> = {
      pending: 0,
      translating: 0,
      auto_translated: 0,
      manually_edited: 0,
      failed: 0
    };
    
    for (const result of results) {
      stats[result.translation_status] = result.count;
    }
    
    return stats;
  }

  /**
   * 标记能力为人工编辑状态（防止自动覆盖）
   */
  public async markAsManuallyEdited(capabilityId: string): Promise<void> {
    await this.updateTranslationStatus(capabilityId, 'manually_edited');
  }

  /**
   * 检查能力是否可以自动翻译（不是人工编辑状态）
   */
  public async canAutoTranslate(capabilityId: string): Promise<boolean> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT translation_status FROM capabilities WHERE id = ?');
    const result = stmt.get(capabilityId) as { translation_status: TranslationStatus } | undefined;
    
    if (!result) {
      return false;
    }
    
    // 人工编辑的内容不能自动翻译
    return result.translation_status !== 'manually_edited';
  }

  /**
   * 重置翻译状态（用于重新翻译）
   */
  public async resetTranslationStatus(capabilityId: string): Promise<void> {
    await this.updateTranslationStatus(capabilityId, 'pending');
  }

  /**
   * 批量重置翻译状态
   */
  public async resetTranslationStatusBatch(capabilityIds: string[]): Promise<void> {
    const updates = capabilityIds.map(id => ({ id, status: 'pending' as TranslationStatus }));
    await this.updateTranslationStatusBatch(updates);
  }

  // ==================== 错误处理 ====================

  /**
   * 创建翻译错误
   */
  private createTranslationError(code: TranslationError['code'], message: string, details?: string): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).details = details;
    return error;
  }

  /**
   * 处理API错误
   */
  private handleAPIError(error: any): Error {
    if (error.name === 'AbortError') {
      return this.createTranslationError('NETWORK_ERROR', '翻译请求超时', '网络连接超时或API响应过慢');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return this.createTranslationError('API_UNAVAILABLE', 'Gemini API 服务不可用', '无法连接到翻译服务，请检查网络连接');
    }

    if (error.message && error.message.includes('401')) {
      return this.createTranslationError('API_KEY_INVALID', 'API Key 无效', '请检查您的 Gemini API Key 是否正确');
    }

    if (error.message && error.message.includes('403')) {
      return this.createTranslationError('API_KEY_INVALID', 'API Key 权限不足', '您的 API Key 没有访问 Gemini API 的权限');
    }

    if (error.message && error.message.includes('429')) {
      return this.createTranslationError('RATE_LIMIT_EXCEEDED', '翻译请求过于频繁', '已超过API速率限制，请稍后再试');
    }

    if (error.message && error.message.includes('翻译请求过于频繁')) {
      return this.createTranslationError('RATE_LIMIT_EXCEEDED', error.message, '本地速率限制保护');
    }

    return this.createTranslationError('UNKNOWN_ERROR', `翻译失败: ${error.message}`, error.stack);
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw this.createTranslationError('API_KEY_MISSING', '未配置 Gemini API Key', '请在设置中配置您的 API Key');
    }

    if (!this.config.enabled) {
      throw this.createTranslationError('API_UNAVAILABLE', '翻译服务未启用', '请在设置中启用自动翻译功能');
    }

    if (this.config.apiKey.length < 10 && this.config.apiKey !== 'test-api-key') {
      throw this.createTranslationError('API_KEY_INVALID', 'API Key 格式不正确', 'API Key 长度过短，请检查是否完整');
    }
  }

  /**
   * 安全地执行翻译操作
   */
  private async safeTranslate<T>(operation: () => Promise<T>): Promise<T> {
    try {
      this.validateConfig();
      return await operation();
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * 获取错误的详细信息
   */
  public getErrorDetails(error: Error): TranslationError {
    const code = (error as any).code || 'UNKNOWN_ERROR';
    const details = (error as any).details;
    
    return {
      code,
      message: error.message,
      details
    };
  }

  /**
   * 检查服务健康状态
   */
  public async checkServiceHealth(): Promise<{ healthy: boolean; error?: TranslationError }> {
    try {
      await this.checkConfig();
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        error: this.getErrorDetails(error as Error)
      };
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<TranslationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): TranslationConfig {
    return { ...this.config };
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 生成缓存键
   */
  private generateCacheKey(text: string): string {
    return createHash('md5').update(text).digest('hex');
  }

  /**
   * 获取缓存的翻译
   */
  private async getCachedTranslation(cacheKey: string): Promise<string | null> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare('SELECT translated FROM translation_cache WHERE hash = ?');
    const result = stmt.get(cacheKey) as { translated: string } | undefined;
    
    if (result) {
      this.cacheHits++;
      return result.translated;
    } else {
      this.cacheMisses++;
      return null;
    }
  }

  /**
   * 缓存翻译结果
   */
  private async cacheTranslation(cacheKey: string, original: string, translated: string): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO translation_cache (hash, original, translated, provider, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(cacheKey, original, translated, this.config.provider, new Date().toISOString());
  }

  /**
   * 检查速率限制
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    // 清理超过一分钟的请求记录
    this.requestTimes = this.requestTimes.filter(time => now - time < oneMinute);
    
    // 检查是否超过限制
    if (this.requestTimes.length >= this.config.rateLimit) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = oneMinute - (now - oldestRequest);
      
      if (waitTime > 0) {
        throw new Error(`翻译请求过于频繁，请等待 ${Math.ceil(waitTime / 1000)} 秒`);
      }
    }
    
    // 记录当前请求时间
    this.requestTimes.push(now);
    this.lastRequestTime = now;
  }

  /**
   * 调用翻译 API
   */
  private async callTranslationAPI(text: string, context: TranslationContext): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('未配置 Gemini API Key');
    }

    // 在测试环境中使用模拟翻译
    if (process.env.NODE_ENV === 'test' || this.config.apiKey === 'test-api-key') {
      return this.mockTranslation(text, context);
    }

    const prompt = this.buildTranslationPrompt(text, context);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(`Gemini API 错误: ${response.status} - ${errorData.error?.message || '未知错误'}`);
      }

      const data = await response.json() as any;
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API 未返回翻译结果');
      }

      const translatedText = data.candidates[0]?.content?.parts?.[0]?.text;
      if (!translatedText) {
        throw new Error('Gemini API 返回的数据格式不正确');
      }

      // 清理翻译结果（移除可能的前缀和后缀）
      return this.cleanTranslationResult(translatedText.trim());
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`翻译失败: ${error.message}`);
      }
      throw new Error('翻译过程中发生未知错误');
    }
  }

  /**
   * 模拟翻译（用于测试）
   */
  private mockTranslation(text: string, context: TranslationContext): string {
    // 模拟 API 延迟
    // await new Promise(resolve => setTimeout(resolve, 100));
    
    // 简单的模拟翻译
    if (text.toLowerCase().includes('command')) {
      return text.replace(/command/gi, '命令');
    } else if (text.toLowerCase().includes('skill')) {
      return text.replace(/skill/gi, '技能');
    } else if (text.toLowerCase().includes('agent')) {
      return text.replace(/agent/gi, '代理');
    } else {
      return `翻译: ${text}`;
    }
  }

  /**
   * 构建翻译提示词
   */
  private buildTranslationPrompt(text: string, context: TranslationContext): string {
    return `你是一个专业的技术文档翻译助手。请将以下 Claude 插件能力的描述翻译成简洁的中文。

要求：
1. 保持技术术语的准确性
2. 翻译要简洁明了，适合在 UI 卡片中显示
3. 不要添加额外的解释或说明
4. 如果原文已经是中文，直接返回原文

能力类型: ${context.capabilityType}
能力名称: ${context.capabilityName}
原文描述: ${text}

请只返回翻译后的中文描述，不要包含其他内容。`;
  }

  /**
   * 测试 API 连接
   */
  private async testAPIConnection(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('未配置 API Key');
    }

    // 在测试环境中跳过真实的API调用
    if (process.env.NODE_ENV === 'test' || this.config.apiKey === 'test-api-key') {
      return; // 测试环境直接返回成功
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello'
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 10,
          }
        }),
        // 设置较短的超时时间用于连接测试
        signal: AbortSignal.timeout(10000) // 10秒超时
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        if (response.status === 401) {
          throw new Error('API Key 无效');
        } else if (response.status === 403) {
          throw new Error('API Key 权限不足');
        } else {
          throw new Error(`API 连接失败: ${response.status} - ${errorData.error?.message || '未知错误'}`);
        }
      }

      // 连接成功
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('API 连接超时');
        }
        throw error;
      }
      throw new Error('API 连接测试失败');
    }
  }

  /**
   * 清理翻译结果
   */
  private cleanTranslationResult(text: string): string {
    // 移除可能的引号
    let cleaned = text.replace(/^["']|["']$/g, '');
    
    // 移除可能的前缀（如 "翻译："、"中文："等）
    cleaned = cleaned.replace(/^(翻译[:：]|中文[:：]|译文[:：])\s*/i, '');
    
    // 移除多余的空白字符
    cleaned = cleaned.trim();
    
    // 如果结果为空或者看起来不像翻译结果，返回原文
    if (!cleaned || cleaned.length < 2) {
      throw new Error('翻译结果为空或过短');
    }
    
    return cleaned;
  }

  /**
   * 处理批量翻译（带重试机制）
   */
  private async processBatchWithRetry(items: TranslationItem[], maxRetries: number = 3): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    for (const item of items) {
      let lastError: Error | null = null;
      let success = false;
      let translated = item.text;
      
      // 重试机制
      for (let attempt = 0; attempt < maxRetries && !success; attempt++) {
        try {
          // 如果是重试，添加延迟
          if (attempt > 0) {
            const delay = Math.pow(2, attempt) * 1000; // 指数退避
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          translated = await this.translate(item.text, item.context);
          success = true;
        } catch (error) {
          const handledError = this.handleAPIError(error);
          lastError = handledError;
          
          // 根据错误类型决定等待时间
          const errorCode = (handledError as any).code;
          if (errorCode === 'RATE_LIMIT_EXCEEDED') {
            await new Promise(resolve => setTimeout(resolve, 60000)); // 等待1分钟
          } else if (errorCode === 'NETWORK_ERROR') {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
          } else if (errorCode === 'API_UNAVAILABLE') {
            // API不可用时不再重试
            break;
          }
        }
      }
      
      results.push({
        id: item.id,
        original: item.text,
        translated,
        success,
        error: success ? undefined : (lastError?.message || '翻译失败')
      });
    }
    
    return results;
  }

  /**
   * 处理批量翻译（原始方法，保持向后兼容）
   */
  private async processBatch(items: TranslationItem[]): Promise<TranslationResult[]> {
    return this.processBatchWithRetry(items, 1); // 不重试的版本
  }
}