import { contextBridge, ipcRenderer } from 'electron'

console.log('preload: bridge ready')

contextBridge.exposeInMainWorld('api', {
  getData: () => ipcRenderer.invoke('app:getData'),
  setData: (data) => ipcRenderer.invoke('app:setData', data),
  selectFolder: () => ipcRenderer.invoke('app:selectFolder')
})
contextBridge.exposeInMainWorld('market', {
  scan: (dir) => ipcRenderer.invoke('market:scan', dir)
})
contextBridge.exposeInMainWorld('project', {
  inspect: (projectPath) => ipcRenderer.invoke('project:inspect', projectPath)
})
