import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import * as tar from 'tar';
import AdmZip from 'adm-zip';
import { ParserService } from './ParserService';
import { StorageService } from './StorageService';
import { Capability } from '../../common/types';

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author?: string;
  repository?: string;
}

export interface PluginPackage {
  info: PluginInfo;
  localPath: string;
  capabilities: Capability[];
}

export interface ImportProgress {
  stage: 'downloading' | 'extracting' | 'parsing' | 'translating' | 'complete' | 'failed';
  percent: number;
  message: string;
}

export type ProgressCallback = (progress: ImportProgress) => void;

export interface MarketplaceAddress {
  type: 'claude-command' | 'github-url';
  owner: string;
  repo: string;
  originalAddress: string;
}

export interface CacheEntry {
  id: string;
  name: string;
  version: string;
  sourceUrl: string;
  localPath: string;
  sizeBytes: number;
  lastAccessedAt: Date;
  createdAt: Date;
}

/**
 * Import Service - 负责从各种来源导入插件
 */
export class ImportService {
  private parserService: ParserService;
  private cacheDir: string;
  private storageService?: StorageService;

  constructor(storageService?: StorageService) {
    this.parserService = new ParserService();
    this.cacheDir = path.join(os.homedir(), '.claude-orchestrator', 'cache', 'plugins');
    this.storageService = storageService;
  }

  /**
   * 设置存储服务
   */
  public setStorageService(storageService: StorageService): void {
    this.storageService = storageService;
  }

  /**
   * 解析市场地址，返回插件列表
   */
  public async parseMarketplace(address: string): Promise<PluginInfo[]> {
    const parsedAddress = this.parseMarketplaceAddress(address);
    
    if (!parsedAddress) {
      throw new Error(`无效的市场地址格式: ${address}`);
    }

    // 根据地址类型获取插件列表
    switch (parsedAddress.type) {
      case 'claude-command':
        return await this.getClaudeMarketplacePlugins(parsedAddress);
      case 'github-url':
        return await this.getGitHubRepositoryPlugins(parsedAddress);
      default:
        throw new Error(`不支持的市场地址类型: ${parsedAddress.type}`);
    }
  }

  /**
   * 下载指定插件
   */
  public async downloadPlugin(plugin: PluginInfo, onProgress?: ProgressCallback): Promise<PluginPackage> {
    if (onProgress) {
      onProgress({
        stage: 'downloading',
        percent: 0,
        message: `开始下载插件: ${plugin.name}`
      });
    }

    try {
      // 检查缓存
      const cachedPath = await this.checkCache(plugin);
      if (cachedPath) {
        if (onProgress) {
          onProgress({
            stage: 'parsing',
            percent: 80,
            message: `使用缓存版本: ${plugin.name}`
          });
        }

        // 从缓存解析插件能力
        const capabilities = await this.parserService.parsePlugin(cachedPath);

        if (onProgress) {
          onProgress({
            stage: 'complete',
            percent: 100,
            message: `插件加载完成（来自缓存）: ${plugin.name}`
          });
        }

        return {
          info: plugin,
          localPath: cachedPath,
          capabilities
        };
      }

      // 缓存未命中，执行下载
      const tempDir = path.join(os.tmpdir(), 'claude-orchestrator', 'downloads', uuidv4());
      await fs.ensureDir(tempDir);

      // 构建下载 URL（假设是 GitHub 仓库）
      const downloadUrl = `${plugin.repository}/archive/refs/heads/main.tar.gz`;
      
      if (onProgress) {
        onProgress({
          stage: 'downloading',
          percent: 10,
          message: `正在下载: ${downloadUrl}`
        });
      }

      // 下载文件
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(downloadUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Claude-Config-Orchestrator/1.0.0'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      if (onProgress) {
        onProgress({
          stage: 'extracting',
          percent: 50,
          message: `正在解压插件: ${plugin.name}`
        });
      }

      // 保存并解压文件
      const tarPath = path.join(tempDir, 'plugin.tar.gz');
      const extractDir = path.join(tempDir, 'extracted');
      
      // 写入下载的文件
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(tarPath, buffer);

      // 解压 tar.gz 文件
      await tar.extract({
        file: tarPath,
        cwd: extractDir,
        strip: 1 // 去掉顶层目录
      });

      if (onProgress) {
        onProgress({
          stage: 'parsing',
          percent: 70,
          message: `解析插件能力: ${plugin.name}`
        });
      }

      // 解析插件能力
      const capabilities = await this.parserService.parsePlugin(extractDir);

      // 保存到缓存
      const cachedPluginPath = await this.saveToCache(plugin, extractDir);

      if (onProgress) {
        onProgress({
          stage: 'complete',
          percent: 100,
          message: `插件下载完成: ${plugin.name}`
        });
      }

      return {
        info: plugin,
        localPath: cachedPluginPath,
        capabilities
      };
    } catch (error) {
      if (onProgress) {
        onProgress({
          stage: 'failed',
          percent: 0,
          message: `下载失败: ${error instanceof Error ? error.message : String(error)}`
        });
      }
      throw error;
    }
  }

  /**
   * 批量下载插件（并行处理）
   */
  public async downloadPlugins(plugins: PluginInfo[], onProgress?: ProgressCallback, maxConcurrency: number = 3): Promise<PluginPackage[]> {
    const results: PluginPackage[] = [];
    const errors: Array<{ plugin: PluginInfo; error: Error }> = [];
    const total = plugins.length;
    let completed = 0;

    // 创建并行下载的 Promise 池
    const downloadPromises = plugins.map(async (plugin) => {
      try {
        const result = await this.downloadPlugin(plugin, (progress) => {
          // 为每个插件创建独立的进度回调
          if (onProgress) {
            onProgress({
              stage: progress.stage,
              percent: Math.round((completed / total) * 100),
              message: `[${plugin.name}] ${progress.message}`
            });
          }
        });
        
        completed++;
        if (onProgress) {
          onProgress({
            stage: 'downloading',
            percent: Math.round((completed / total) * 100),
            message: `已完成 ${completed}/${total} 个插件下载`
          });
        }
        
        return { success: true as const, result, plugin };
      } catch (error) {
        completed++;
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`下载插件 ${plugin.name} 失败:`, err);
        errors.push({ plugin, error: err });
        
        if (onProgress) {
          onProgress({
            stage: 'downloading',
            percent: Math.round((completed / total) * 100),
            message: `插件 ${plugin.name} 下载失败: ${err.message}`
          });
        }
        
        return { success: false as const, error: err, plugin };
      }
    });

    // 使用 Promise.allSettled 等待所有下载完成，不会因为单个失败而中断
    const settledResults = await Promise.allSettled(downloadPromises);
    
    // 处理结果
    for (const settledResult of settledResults) {
      if (settledResult.status === 'fulfilled' && settledResult.value.success) {
        results.push(settledResult.value.result);
      }
    }

    if (onProgress) {
      const successCount = results.length;
      const failureCount = errors.length;
      
      onProgress({
        stage: 'complete',
        percent: 100,
        message: `批量下载完成，成功 ${successCount} 个，失败 ${failureCount} 个`
      });
    }

    return results;
  }

  /**
   * 批量下载插件（带并发控制）
   */
  public async downloadPluginsWithConcurrencyControl(
    plugins: PluginInfo[], 
    onProgress?: ProgressCallback, 
    maxConcurrency: number = 3
  ): Promise<PluginPackage[]> {
    const results: PluginPackage[] = [];
    const errors: Array<{ plugin: PluginInfo; error: Error }> = [];
    const total = plugins.length;
    let completed = 0;
    let running = 0;
    let index = 0;

    return new Promise((resolve) => {
      const processNext = async () => {
        if (index >= plugins.length) {
          // 所有任务都已启动，等待完成
          if (running === 0) {
            if (onProgress) {
              onProgress({
                stage: 'complete',
                percent: 100,
                message: `批量下载完成，成功 ${results.length} 个，失败 ${errors.length} 个`
              });
            }
            resolve(results);
          }
          return;
        }

        if (running >= maxConcurrency) {
          // 已达到最大并发数，等待
          return;
        }

        const plugin = plugins[index++];
        running++;

        try {
          const result = await this.downloadPlugin(plugin, (progress) => {
            if (onProgress) {
              onProgress({
                stage: progress.stage,
                percent: Math.round((completed / total) * 100),
                message: `[${plugin.name}] ${progress.message}`
              });
            }
          });
          
          results.push(result);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error(`下载插件 ${plugin.name} 失败:`, err);
          errors.push({ plugin, error: err });
        } finally {
          completed++;
          running--;
          
          if (onProgress) {
            onProgress({
              stage: 'downloading',
              percent: Math.round((completed / total) * 100),
              message: `已完成 ${completed}/${total} 个插件下载`
            });
          }
          
          // 启动下一个任务
          processNext();
          processNext(); // 可能需要启动多个任务来填满并发槽
        }
      };

      // 启动初始任务
      for (let i = 0; i < Math.min(maxConcurrency, plugins.length); i++) {
        processNext();
      }
    });
  }

  /**
   * 从本地目录导入
   */
  public async importFromLocal(dirPath: string): Promise<PluginPackage> {
    if (!await fs.pathExists(dirPath)) {
      throw new Error(`本地目录不存在: ${dirPath}`);
    }

    // 检查是否是有效的插件目录
    const claudeDir = path.join(dirPath, '.claude');
    if (!await fs.pathExists(claudeDir)) {
      throw new Error(`目录中未找到 .claude 配置目录: ${dirPath}`);
    }

    // 解析插件信息
    const pluginInfo = await this.extractPluginInfo(dirPath);
    
    // 解析插件能力
    const capabilities = await this.parserService.parsePlugin(dirPath);

    return {
      info: pluginInfo,
      localPath: dirPath,
      capabilities
    };
  }

  /**
   * 从 HTTP 链接导入
   */
  public async importFromHttp(url: string, onProgress?: ProgressCallback): Promise<PluginPackage> {
    // 验证 URL 格式
    if (!this.isValidHttpUrl(url)) {
      throw new Error(`无效的 HTTP 链接格式: ${url}`);
    }

    if (onProgress) {
      onProgress({
        stage: 'downloading',
        percent: 0,
        message: `开始下载: ${url}`
      });
    }

    try {
      // 创建临时目录
      const tempDir = path.join(os.tmpdir(), 'claude-orchestrator', 'http-imports', uuidv4());
      await fs.ensureDir(tempDir);

      // 下载文件
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Claude-Config-Orchestrator/1.0.0'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP 下载失败: ${response.status} ${response.statusText}`);
      }

      if (onProgress) {
        onProgress({
          stage: 'extracting',
          percent: 50,
          message: `正在处理下载的文件`
        });
      }

      // 根据 URL 和 Content-Type 判断文件类型
      const contentType = response.headers.get('content-type') || '';
      const urlPath = new URL(url).pathname;
      
      let extractDir: string;

      if (contentType.includes('application/gzip') || urlPath.endsWith('.tar.gz') || urlPath.endsWith('.tgz')) {
        // 处理 tar.gz 文件
        const tarPath = path.join(tempDir, 'download.tar.gz');
        extractDir = path.join(tempDir, 'extracted');
        
        const buffer = await response.buffer();
        await fs.writeFile(tarPath, buffer);
        
        await tar.extract({
          file: tarPath,
          cwd: extractDir,
          strip: 1 // 去掉顶层目录
        });
      } else if (contentType.includes('application/zip') || urlPath.endsWith('.zip')) {
        // 处理 ZIP 文件
        throw new Error('ZIP 文件支持尚未实现，请使用 importFromZip 方法');
      } else {
        // 假设是直接的插件目录或文件
        extractDir = tempDir;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 尝试根据 URL 推断文件名
        const fileName = path.basename(urlPath) || 'downloaded-file';
        await fs.writeFile(path.join(extractDir, fileName), buffer);
      }

      if (onProgress) {
        onProgress({
          stage: 'parsing',
          percent: 80,
          message: `解析插件能力`
        });
      }

      // 检查是否是有效的插件目录
      const claudeDir = path.join(extractDir, '.claude');
      if (!await fs.pathExists(claudeDir)) {
        throw new Error(`下载的内容不是有效的 Claude 插件（未找到 .claude 目录）`);
      }

      // 解析插件信息和能力
      const pluginInfo = await this.extractPluginInfo(extractDir);
      const capabilities = await this.parserService.parsePlugin(extractDir);

      if (onProgress) {
        onProgress({
          stage: 'complete',
          percent: 100,
          message: `HTTP 导入完成: ${pluginInfo.name}`
        });
      }

      return {
        info: pluginInfo,
        localPath: extractDir,
        capabilities
      };
    } catch (error) {
      if (onProgress) {
        onProgress({
          stage: 'failed',
          percent: 0,
          message: `HTTP 导入失败: ${error instanceof Error ? error.message : String(error)}`
        });
      }
      throw error;
    }
  }

  /**
   * 从 ZIP 文件导入
   */
  public async importFromZip(zipPath: string): Promise<PluginPackage> {
    // 检查 ZIP 文件是否存在
    if (!await fs.pathExists(zipPath)) {
      throw new Error(`ZIP 文件不存在: ${zipPath}`);
    }

    try {
      // 创建临时解压目录
      const tempDir = path.join(os.tmpdir(), 'claude-orchestrator', 'zip-imports', uuidv4());
      const extractDir = path.join(tempDir, 'extracted');
      await fs.ensureDir(extractDir);

      // 解压 ZIP 文件
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);

      // 查找插件根目录（可能在子目录中）
      let pluginDir = extractDir;
      const entries = await fs.readdir(extractDir);

      // 如果解压后只有一个目录，可能插件在子目录中
      if (entries.length === 1) {
        const singleEntry = path.join(extractDir, entries[0]);
        const stat = await fs.stat(singleEntry);
        if (stat.isDirectory()) {
          // 检查子目录中是否有 .claude 目录或 SKILL.md 文件
          const claudeDir = path.join(singleEntry, '.claude');
          const skillMdPath = path.join(singleEntry, 'SKILL.md');

          if (await fs.pathExists(claudeDir) || await fs.pathExists(skillMdPath)) {
            pluginDir = singleEntry;
          }
        }
      }

      // 检查是否是有效的插件目录
      const claudeDir = path.join(pluginDir, '.claude');
      if (!await fs.pathExists(claudeDir)) {
        // 如果没有 .claude 目录，可能是 Skill 文件夹
        // 检查是否有 SKILL.md 文件
        const skillMdPath = path.join(pluginDir, 'SKILL.md');
        if (await fs.pathExists(skillMdPath)) {
          // 创建一个临时的插件结构来包装这个 Skill
          const wrapperDir = path.join(tempDir, 'skill-wrapper');
          const skillsDir = path.join(wrapperDir, '.claude', 'skills');
          const skillName = path.basename(zipPath, '.zip');
          const targetSkillDir = path.join(skillsDir, skillName);
          
          await fs.ensureDir(skillsDir);
          await fs.copy(pluginDir, targetSkillDir);
          
          // 创建一个基本的 package.json
          await fs.writeJson(path.join(wrapperDir, 'package.json'), {
            name: skillName,
            version: '1.0.0',
            description: `Skill imported from ZIP: ${skillName}`
          });
          
          pluginDir = wrapperDir;
        } else {
          throw new Error(`ZIP 文件中未找到有效的 Claude 插件结构（无 .claude 目录或 SKILL.md 文件）`);
        }
      }

      // 解析插件信息和能力
      const pluginInfo = await this.extractPluginInfo(pluginDir);
      const capabilities = await this.parserService.parsePlugin(pluginDir);

      // 如果有 storageService，保存能力到数据库
      if (this.storageService) {
        for (const capability of capabilities) {
          await this.storageService.saveCapability(capability);
        }
      }

      return {
        info: pluginInfo,
        localPath: pluginDir,
        capabilities
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`ZIP 导入失败: ${String(error)}`);
    }
  }

  // ==================== 缓存管理方法 ====================

  /**
   * 生成缓存键
   */
  private generateCacheKey(plugin: PluginInfo): string {
    // 清理文件名中的无效字符
    const cleanName = plugin.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanVersion = plugin.version.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanRepo = (plugin.repository || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
    
    return `${cleanName}-${cleanVersion}-${cleanRepo}`;
  }

  /**
   * 检查缓存是否存在
   */
  private async checkCache(plugin: PluginInfo): Promise<string | null> {
    const cacheKey = this.generateCacheKey(plugin);
    const cachePath = path.join(this.cacheDir, cacheKey);
    
    if (await fs.pathExists(cachePath)) {
      // 更新最后访问时间
      const metadataPath = path.join(cachePath, '.cache-metadata.json');
      if (await fs.pathExists(metadataPath)) {
        try {
          const metadata = await fs.readJson(metadataPath);
          metadata.lastAccessedAt = new Date().toISOString();
          await fs.writeJson(metadataPath, metadata);
        } catch (error) {
          console.warn('更新缓存元数据失败:', error);
        }
      }
      return cachePath;
    }
    
    return null;
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(plugin: PluginInfo, sourcePath: string): Promise<string> {
    const cacheKey = this.generateCacheKey(plugin);
    const cachePath = path.join(this.cacheDir, cacheKey);
    
    await fs.ensureDir(this.cacheDir);
    
    // 复制插件文件到缓存目录
    await fs.copy(sourcePath, cachePath);
    
    // 计算缓存大小
    const stats = await this.calculateDirectorySize(cachePath);
    
    // 保存缓存元数据
    const metadata: CacheEntry = {
      id: uuidv4(),
      name: plugin.name,
      version: plugin.version,
      sourceUrl: plugin.repository || '',
      localPath: cachePath,
      sizeBytes: stats.size,
      lastAccessedAt: new Date(),
      createdAt: new Date()
    };
    
    await fs.writeJson(path.join(cachePath, '.cache-metadata.json'), metadata);
    
    return cachePath;
  }

  /**
   * 计算目录大小
   */
  private async calculateDirectorySize(dirPath: string): Promise<{ size: number; files: number }> {
    let totalSize = 0;
    let fileCount = 0;
    
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        const subStats = await this.calculateDirectorySize(itemPath);
        totalSize += subStats.size;
        fileCount += subStats.files;
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }
    
    return { size: totalSize, files: fileCount };
  }

  /**
   * 获取所有缓存条目
   */
  public async getCacheEntries(): Promise<CacheEntry[]> {
    const entries: CacheEntry[] = [];
    
    if (!await fs.pathExists(this.cacheDir)) {
      return entries;
    }
    
    const cacheItems = await fs.readdir(this.cacheDir);
    
    for (const item of cacheItems) {
      const itemPath = path.join(this.cacheDir, item);
      const metadataPath = path.join(itemPath, '.cache-metadata.json');
      
      if (await fs.pathExists(metadataPath)) {
        try {
          const metadata = await fs.readJson(metadataPath);
          entries.push({
            ...metadata,
            lastAccessedAt: new Date(metadata.lastAccessedAt),
            createdAt: new Date(metadata.createdAt)
          });
        } catch (error) {
          console.warn(`读取缓存元数据失败: ${metadataPath}`, error);
        }
      }
    }
    
    return entries;
  }

  /**
   * 清理缓存
   */
  public async clearCache(olderThanDays?: number): Promise<void> {
    if (!await fs.pathExists(this.cacheDir)) {
      return;
    }
    
    const entries = await this.getCacheEntries();
    const cutoffDate = olderThanDays ? new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000) : null;
    
    for (const entry of entries) {
      const shouldDelete = !cutoffDate || entry.lastAccessedAt < cutoffDate;
      
      if (shouldDelete) {
        try {
          await fs.remove(entry.localPath);
        } catch (error) {
          console.warn(`删除缓存条目失败: ${entry.localPath}`, error);
        }
      }
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 验证 HTTP URL 格式
   */
  private isValidHttpUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 解析市场地址格式
   */
  private parseMarketplaceAddress(address: string): MarketplaceAddress | null {
    // Claude 命令格式: owner/repo (允许点号、下划线、连字符)
    const claudeCommandMatch = address.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (claudeCommandMatch) {
      return {
        type: 'claude-command',
        owner: claudeCommandMatch[1],
        repo: claudeCommandMatch[2],
        originalAddress: address
      };
    }

    // GitHub URL 格式: https://github.com/owner/repo (允许点号、下划线、连字符)
    const githubUrlMatch = address.match(/^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\.git)?(?:\/.*)?$/);
    if (githubUrlMatch) {
      return {
        type: 'github-url',
        owner: githubUrlMatch[1],
        repo: githubUrlMatch[2],
        originalAddress: address
      };
    }

    return null;
  }

  /**
   * 获取 Claude 市场中的插件列表
   */
  private async getClaudeMarketplacePlugins(address: MarketplaceAddress): Promise<PluginInfo[]> {
    try {
      // Claude 命令格式通常指向 GitHub 仓库
      // 我们将其转换为 GitHub API 调用
      const apiUrl = `https://api.github.com/repos/${address.owner}/${address.repo}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Claude-Config-Orchestrator/1.0.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        switch (response.status) {
          case 404:
            throw new Error(`仓库不存在: ${address.owner}/${address.repo}`);
          case 403:
            throw new Error(`访问被拒绝，可能是 API 速率限制: ${address.owner}/${address.repo}`);
          case 401:
            throw new Error(`未授权访问: ${address.owner}/${address.repo}`);
          case 500:
          case 502:
          case 503:
          case 504:
            throw new Error(`GitHub 服务器错误 (${response.status})，请稍后重试`);
          default:
            throw new Error(`获取仓库信息失败: ${response.status} ${response.statusText}`);
        }
      }
      
      const repoData = await response.json() as any;
      
      return [
        {
          name: repoData.name,
          version: '1.0.0', // GitHub API 不直接提供版本信息，可能需要查看 releases
          description: repoData.description || `Claude plugin: ${address.owner}/${address.repo}`,
          author: repoData.owner?.login || address.owner,
          repository: repoData.html_url
        }
      ];
    } catch (error) {
      if (error instanceof Error) {
        // 检查是否是网络错误
        if (error.message.includes('fetch')) {
          throw new Error(`网络连接失败，请检查网络连接: ${error.message}`);
        }
        throw error;
      }
      throw new Error(`获取 Claude 市场插件失败: ${String(error)}`);
    }
  }

  /**
   * 获取 GitHub 仓库中的插件列表
   */
  private async getGitHubRepositoryPlugins(address: MarketplaceAddress): Promise<PluginInfo[]> {
    try {
      const apiUrl = `https://api.github.com/repos/${address.owner}/${address.repo}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Claude-Config-Orchestrator/1.0.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        switch (response.status) {
          case 404:
            throw new Error(`GitHub 仓库不存在: ${address.owner}/${address.repo}`);
          case 403:
            throw new Error(`访问被拒绝，可能是 API 速率限制: ${address.owner}/${address.repo}`);
          case 401:
            throw new Error(`未授权访问: ${address.owner}/${address.repo}`);
          case 500:
          case 502:
          case 503:
          case 504:
            throw new Error(`GitHub 服务器错误 (${response.status})，请稍后重试`);
          default:
            throw new Error(`获取 GitHub 仓库信息失败: ${response.status} ${response.statusText}`);
        }
      }
      
      const repoData = await response.json() as any;
      
      // 尝试获取最新的 release 版本
      let version = '1.0.0';
      try {
        const releasesUrl = `https://api.github.com/repos/${address.owner}/${address.repo}/releases/latest`;
        const releaseController = new AbortController();
        const releaseTimeoutId = setTimeout(() => releaseController.abort(), 5000);
        
        const releaseResponse = await fetch(releasesUrl, {
          signal: releaseController.signal,
          headers: {
            'User-Agent': 'Claude-Config-Orchestrator/1.0.0'
          }
        });
        
        clearTimeout(releaseTimeoutId);
        
        if (releaseResponse.ok) {
          const releaseData = await releaseResponse.json() as any;
          version = releaseData.tag_name || version;
        }
      } catch {
        // 如果获取 release 失败，使用默认版本
      }
      
      return [
        {
          name: repoData.name,
          version: version,
          description: repoData.description || `GitHub repository: ${address.owner}/${address.repo}`,
          author: repoData.owner?.login || address.owner,
          repository: repoData.html_url
        }
      ];
    } catch (error) {
      if (error instanceof Error) {
        // 检查是否是网络错误
        if (error.message.includes('fetch')) {
          throw new Error(`网络连接失败，请检查网络连接: ${error.message}`);
        }
        throw error;
      }
      throw new Error(`获取 GitHub 仓库插件失败: ${String(error)}`);
    }
  }

  /**
   * 从插件目录提取插件信息
   */
  private async extractPluginInfo(pluginPath: string): Promise<PluginInfo> {
    const packageJsonPath = path.join(pluginPath, 'package.json');
    
    // 尝试从 package.json 读取信息
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        return {
          name: packageJson.name || path.basename(pluginPath),
          version: packageJson.version || '1.0.0',
          description: packageJson.description || '',
          author: packageJson.author || undefined,
          repository: packageJson.repository?.url || undefined
        };
      } catch (error) {
        console.warn('读取 package.json 失败:', error);
      }
    }

    // 如果没有 package.json，使用目录名作为插件名
    return {
      name: path.basename(pluginPath),
      version: '1.0.0',
      description: `本地插件: ${path.basename(pluginPath)}`,
    };
  }
}