import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ClaudeProject {
  id: string;
  alias: string;
  path: string;
  description?: string;
  lastUsed?: string; // 从会话文件中获取最后使用时间
  hasClaudeFolder: boolean;
  isHidden: boolean;
}

export interface ScanResult {
  totalFound: number;
  newProjects: ClaudeProject[];
  hiddenProjects: ClaudeProject[];
}

export class ClaudeProjectScanner {
  private claudeProjectsDir: string;

  constructor() {
    this.claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  }

  /**
   * 解析项目目录名到实际路径
   * 例如: D--MyProject--claude -> D:\MyProject\claude
   */
  private parseProjectPath(dirName: string): string {
    let parsedPath = dirName;

    // 首先替换所有分隔符为路径分隔符
    parsedPath = parsedPath.replace(/--/g, path.sep);

    // 处理 Windows 驱动器 (例如: C\ -> C:\)
    if (/^[A-Z]\\/.test(parsedPath)) {
      parsedPath = parsedPath[0] + ':' + parsedPath.substring(1);
    }

    return parsedPath;
  }

  /**
   * 从项目目录获取最后使用时间
   */
  private async getLastUsedTime(projectDir: string): Promise<string | null> {
    try {
      const files = fs.readdirSync(projectDir);
      let latestTime = 0;

      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const filePath = path.join(projectDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() > latestTime) {
            latestTime = stats.mtime.getTime();
          }
        }
      }

      return latestTime > 0 ? new Date(latestTime).toISOString() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 扫描 Claude 项目目录
   */
  async scanProjects(existingProjects: any[] = []): Promise<ScanResult> {
    const result: ScanResult = {
      totalFound: 0,
      newProjects: [],
      hiddenProjects: []
    };

    try {
      // 检查 ~/.claude/projects/ 目录是否存在
      if (!fs.existsSync(this.claudeProjectsDir)) {
        console.log('Claude projects directory not found:', this.claudeProjectsDir);
        return result;
      }

      const projectDirs = fs.readdirSync(this.claudeProjectsDir);
      result.totalFound = projectDirs.length;

      // 创建已存在项目的映射，方便查找
      const existingMap = new Map(
        existingProjects.map(p => [p.path, { ...p, isHidden: p.isHidden || false }])
      );

      for (const dir of projectDirs) {
        const projectPath = this.parseProjectPath(dir);
        const claudeDir = path.join(projectPath, '.claude');

        // 获取最后使用时间
        const lastUsed = await this.getLastUsedTime(path.join(this.claudeProjectsDir, dir));

        const project: ClaudeProject = {
          id: path.basename(projectPath) + '_' + Date.now(),
          alias: path.basename(projectPath),
          path: projectPath,
          lastUsed,
          hasClaudeFolder: fs.existsSync(claudeDir),
          isHidden: false
        };

        // 检查是否已经存在
        const existing = existingMap.get(projectPath);
        if (existing) {
          // 更新已有项目的信息
          project.isHidden = existing.isHidden;
          project.id = existing.id;
          project.alias = existing.alias || project.alias;
          project.description = existing.description;

          if (existing.isHidden) {
            result.hiddenProjects.push(project);
          }
        } else {
          // 新项目
          result.newProjects.push(project);
        }
      }

      // 按最后使用时间排序
      const sortByLastUsed = (a: ClaudeProject, b: ClaudeProject) => {
        if (!a.lastUsed) return 1;
        if (!b.lastUsed) return -1;
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      };

      result.newProjects.sort(sortByLastUsed);
      result.hiddenProjects.sort(sortByLastUsed);

    } catch (error) {
      console.error('Error scanning Claude projects:', error);
      throw error;
    }

    return result;
  }
}