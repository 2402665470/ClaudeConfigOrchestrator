import { ipcMain } from 'electron';
import { TemplateService } from '../services/TemplateService';
import { StorageService } from '../services/StorageService';
import { databaseManager } from '../services/database';
import type { CreateTemplateRequest, UpdateTemplateRequest } from '../services/TemplateService';

let templateService: TemplateService;

export function registerTemplateHandlers() {
  // Initialize template service
  const storageService = new StorageService(databaseManager);
  templateService = new TemplateService(storageService);

  // Template CRUD operations
  ipcMain.handle('template:create', async (_, request: CreateTemplateRequest) => {
    return await templateService.createTemplate(request);
  });

  ipcMain.handle('template:update', async (_, id: string, updates: UpdateTemplateRequest) => {
    return await templateService.updateTemplate(id, updates);
  });

  ipcMain.handle('template:delete', async (_, id: string) => {
    return await templateService.deleteTemplate(id);
  });

  ipcMain.handle('template:getAll', async () => {
    return await templateService.getAllTemplates();
  });

  ipcMain.handle('template:getById', async (_, id: string) => {
    return await templateService.getTemplate(id);
  });

  // Template capability management
  ipcMain.handle('template:addCapability', async (_, templateId: string, capabilityId: string) => {
    return await templateService.addCapabilityToTemplate(templateId, capabilityId);
  });

  ipcMain.handle('template:removeCapability', async (_, templateId: string, capabilityId: string) => {
    return await templateService.removeCapabilityFromTemplate(templateId, capabilityId);
  });

  ipcMain.handle('template:addCapabilities', async (_, templateId: string, capabilityIds: string[]) => {
    return await templateService.addCapabilitiesToTemplate(templateId, capabilityIds);
  });

  // Template statistics and capabilities
  ipcMain.handle('template:getStats', async (_, templateId: string) => {
    return await templateService.getTemplateStats(templateId);
  });

  ipcMain.handle('template:getCapabilities', async (_, templateId: string) => {
    return await templateService.getTemplateCapabilities(templateId);
  });

  // Template export/import
  ipcMain.handle('template:export', async (_, templateId: string) => {
    return await templateService.exportTemplate(templateId);
  });

  ipcMain.handle('template:exportToFile', async (_, templateId: string, filePath: string) => {
    return await templateService.exportTemplateToFile(templateId, filePath);
  });

  ipcMain.handle('template:import', async (_, data: any, options?: any) => {
    return await templateService.importTemplate(data, options);
  });

  ipcMain.handle('template:importFromFile', async (_, filePath: string, options?: any) => {
    return await templateService.importTemplateFromFile(filePath, options);
  });
}