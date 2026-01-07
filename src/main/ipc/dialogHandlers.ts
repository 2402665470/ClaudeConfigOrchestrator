import { ipcMain, dialog } from 'electron';

export function registerDialogHandlers() {
  // 显示保存对话框
  ipcMain.handle('dialog:showSaveDialog', async (_, options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => {
    const result = await dialog.showSaveDialog(options);
    return {
      canceled: result.canceled,
      filePath: result.filePath
    };
  });

  // 显示打开目录对话框
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  // 显示打开文件对话框
  ipcMain.handle('dialog:openFile', async (_, filters?: { name: string; extensions: string[] }[]) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || []
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  // 在文件管理器中显示文件
  ipcMain.handle('shell:showItemInFolder', async (_, path: string) => {
    const { shell } = await import('electron');
    shell.showItemInFolder(path);
  });
}