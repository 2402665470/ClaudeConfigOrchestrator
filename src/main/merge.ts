import path from 'path';
import fs from 'fs-extra';
import { Plugin, ClaudeProjectConfig, ConflictInfo, InstallationResult } from '@common/types';

/**
 * 检测插件安装时可能发生的冲突
 */
function detectConflicts(
  existing: ClaudeProjectConfig,
  plugin: Plugin
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  // 检测技能冲突
  if (existing.skills && plugin.capabilities.skills) {
    for (const key of Object.keys(plugin.capabilities.skills)) {
      if (existing.skills[key]) {
        conflicts.push({
          type: 'skill',
          key,
          existing: existing.skills[key],
          incoming: plugin.capabilities.skills[key]
        });
      }
    }
  }

  // 检测MCP服务器冲突
  if (existing.mcpServers && plugin.capabilities.mcpServers) {
    for (const key of Object.keys(plugin.capabilities.mcpServers)) {
      if (existing.mcpServers[key]) {
        conflicts.push({
          type: 'mcpServer',
          key,
          existing: existing.mcpServers[key],
          incoming: plugin.capabilities.mcpServers[key]
        });
      }
    }
  }

  // 检测钩子冲突
  if (existing.hooks && plugin.capabilities.hooks) {
    for (const key of Object.keys(plugin.capabilities.hooks)) {
      if (existing.hooks[key]) {
        conflicts.push({
          type: 'hook',
          key,
          existing: existing.hooks[key],
          incoming: plugin.capabilities.hooks[key]
        });
      }
    }
  }

  // 检测文件冲突
  if (plugin.capabilities.files) {
    for (const fileOp of plugin.capabilities.files) {
      const targetPath = path.resolve(plugin.rootPath, fileOp.target);
      if (fs.existsSync(targetPath)) {
        conflicts.push({
          type: 'file',
          key: fileOp.target,
          existing: '文件已存在',
          incoming: fileOp.source
        });
      }
    }
  }

  return conflicts;
}

/**
 * 验证插件的完整性和有效性
 */
async function validatePlugin(plugin: Plugin): Promise<string[]> {
  const errors: string[] = [];

  // 验证元数据
  if (!plugin.meta.id || !plugin.meta.name) {
    errors.push('插件缺少必要的元数据 (id 或 name)');
  }

  // 验证文件操作
  if (plugin.capabilities.files) {
    for (const fileOp of plugin.capabilities.files) {
      const sourcePath = path.resolve(plugin.rootPath, fileOp.source);
      if (!fs.existsSync(sourcePath)) {
        errors.push(`文件源不存在: ${fileOp.source}`);
      }
    }
  }

  return errors;
}

/**
 * 将插件 capabilities 合并到目标项目 claude.json
 * 规则：
 * 1. skills/mcpServers/hooks：键级合并，冲突时默认覆盖（后续可交互）
 * 2. docker：简单合并 services 数组
 * 3. files：按声明复制/覆盖
 */
export async function installPlugin(
  plugin: Plugin,
  projectPath: string,
  options: {
    forceOverwrite?: boolean;
    skipConflicts?: boolean;
  } = {}
): Promise<InstallationResult> {
  try {
    // 验证插件
    const validationErrors = await validatePlugin(plugin);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `插件验证失败: ${validationErrors.join(', ')}`
      };
    }

    const targetConfigPath = path.join(projectPath, 'claude.json');
    let existing: ClaudeProjectConfig = {};
    if (await fs.pathExists(targetConfigPath)) {
      existing = await fs.readJSON(targetConfigPath);
    }

    // 检测冲突
    const conflicts = detectConflicts(existing, plugin);
    if (conflicts.length > 0 && !options.forceOverwrite && !options.skipConflicts) {
      return {
        success: false,
        conflicts
      };
    }

    // 1. 合并配置对象
    const merged: ClaudeProjectConfig = {
      skills: { ...existing.skills, ...plugin.capabilities.skills },
      mcpServers: { ...existing.mcpServers, ...plugin.capabilities.mcpServers },
      hooks: { ...existing.hooks, ...plugin.capabilities.hooks },
      docker: {
        services: [
          ...(existing.docker?.services ?? []),
          ...(plugin.capabilities.docker?.services ?? [])
        ]
      }
    };

    await fs.writeJSON(targetConfigPath, merged, { spaces: 2 });

    // 2. 复制文件
    const installedCapabilities: string[] = [];
    if (plugin.capabilities.files) {
      for (const op of plugin.capabilities.files) {
        const src = path.resolve(plugin.rootPath, op.source);
        const dst = path.resolve(projectPath, op.target);
        if (!(await fs.pathExists(src))) continue;
        
        // 检查文件冲突
        if (await fs.pathExists(dst) && !options.forceOverwrite) {
          continue;
        }
        
        await fs.ensureDir(path.dirname(dst));
        await fs.copy(src, dst, { overwrite: op.overwrite !== false });
        installedCapabilities.push(`file:${op.target}`);
      }
    }

    // 记录安装的功能
    if (plugin.capabilities.skills) {
      installedCapabilities.push(...Object.keys(plugin.capabilities.skills).map(k => `skill:${k}`));
    }
    if (plugin.capabilities.mcpServers) {
      installedCapabilities.push(...Object.keys(plugin.capabilities.mcpServers).map(k => `mcp:${k}`));
    }
    if (plugin.capabilities.hooks) {
      installedCapabilities.push(...Object.keys(plugin.capabilities.hooks).map(k => `hook:${k}`));
    }
    if (plugin.capabilities.docker?.services) {
      installedCapabilities.push(...plugin.capabilities.docker.services.map(s => `docker:${s.name}`));
    }

    return {
      success: true,
      installedCapabilities
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}