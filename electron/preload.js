"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose the API to the renderer process
const electronAPI = {
    openDirectory: () => electron_1.ipcRenderer.invoke('dialog:openDirectory'),
    openFile: (filters) => electron_1.ipcRenderer.invoke('dialog:openFile', filters),
    showItemInFolder: (path) => electron_1.ipcRenderer.invoke('shell:showItemInFolder', path),
    invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
    on: (channel, callback) => electron_1.ipcRenderer.on(channel, callback),
    removeAllListeners: (channel) => electron_1.ipcRenderer.removeAllListeners(channel),
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
