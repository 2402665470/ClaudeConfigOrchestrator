import { ipcMain, dialog } from 'electron';
import type { Project, ProjectConfig, BackupInfo } from '@common/types';
import { ProjectService } from '../services/ProjectService';
import { StorageService } from '../services/StorageService';
import { InjectionService } from '../services/InjectionService';

let projectService: ProjectService;
let injectionService: InjectionService;

export function initializeProjectHandlers(storageService: StorageService, injectionServiceInstance: InjectionService) {
  projectService = new ProjectService(storageService);
  injectionService = injectionServiceInstance;

  // 添加项目
  ipcMain.handle('project:add', async (_, projectPath: string, name?: string): Promise<Project> => {
    try {
      return await projectService.addProject(projectPath, name);
    } catch (error) {
      throw new Error(`添加项目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 选择项目目录
  ipcMain.handle('project:selectDirectory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择项目目录',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // 获取所有项目
  ipcMain.handle('project:getAll', async (): Promise<Project[]> => {
    try {
      return await projectService.getAllProjects();
    } catch (error) {
      throw new Error(`获取项目列表失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取可见项目
  ipcMain.handle('project:getVisible', async (): Promise<Project[]> => {
    try {
      return await projectService.getVisibleProjects();
    } catch (error) {
      throw new Error(`获取可见项目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 更新项目
  ipcMain.handle('project:update', async (_, id: string, updates: Partial<Project>): Promise<void> => {
    try {
      await projectService.updateProject(id, updates);
    } catch (error) {
      throw new Error(`更新项目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 隐藏项目
  ipcMain.handle('project:hide', async (_, id: string): Promise<void> => {
    try {
      await projectService.hideProject(id);
    } catch (error) {
      throw new Error(`隐藏项目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 显示项目
  ipcMain.handle('project:show', async (_, id: string): Promise<void> => {
    try {
      await projectService.showProject(id);
    } catch (error) {
      throw new Error(`显示项目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 删除项目
  ipcMain.handle('project:delete', async (_, id: string): Promise<void> => {
    try {
      await projectService.deleteProject(id);
    } catch (error) {
      throw new Error(`删除项目失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 扫描项目配置
  ipcMain.handle('project:scanConfig', async (_, projectPath: string): Promise<ProjectConfig> => {
    try {
      return await projectService.scanProjectConfig(projectPath);
    } catch (error) {
      throw new Error(`扫描项目配置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 获取项目备份历史
  ipcMain.handle('project:getBackups', async (_, projectPath: string): Promise<BackupInfo[]> => {
    try {
      return await projectService.getProjectBackups(projectPath);
    } catch (error) {
      throw new Error(`获取备份历史失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 打开项目文件夹
  ipcMain.handle('project:openFolder', async (_, projectPath: string): Promise<void> => {
    try {
      await projectService.openProjectFolder(projectPath);
    } catch (error) {
      throw new Error(`打开项目文件夹失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // 回滚项目配置
  ipcMain.handle('project:rollback', async (_, projectPath: string, backupId: string): Promise<void> => {
    try {
      await injectionService.rollback(projectPath, backupId);
    } catch (error) {
      throw new Error(`回滚项目配置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}