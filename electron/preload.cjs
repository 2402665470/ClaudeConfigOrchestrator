const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getData: () => ipcRenderer.invoke('app:getData'),
  setData: (data) => ipcRenderer.invoke('app:setData', data),
  selectFolder: () => ipcRenderer.invoke('app:selectFolder')
})
contextBridge.exposeInMainWorld('files', {
  selectFile: () => ipcRenderer.invoke('app:selectFile')
})

contextBridge.exposeInMainWorld('market', {
  scan: (dir) => ipcRenderer.invoke('market:scan', dir)
})

contextBridge.exposeInMainWorld('project', {
  inspect: (projectPath) => ipcRenderer.invoke('project:inspect', projectPath),
  stats: (projectPath) => ipcRenderer.invoke('project:stats', projectPath),
  profiles: (projectPath) => ipcRenderer.invoke('project:profiles', projectPath),
  switchProfile: (projectPath, name) => ipcRenderer.invoke('project:switchProfile', projectPath, name),
  listInstalled: (projectPath) => ipcRenderer.invoke('project:listInstalled', projectPath),
  uninstallAtom: (payload) => ipcRenderer.invoke('project:uninstallAtom', payload)
})
contextBridge.exposeInMainWorld('config', {
  get: () => ipcRenderer.invoke('config:get'),
  set: (cfg) => ipcRenderer.invoke('config:set', cfg)
})
contextBridge.exposeInMainWorld('privateMarket', {
  clone: () => ipcRenderer.invoke('privateMarket:clone'),
  pull: () => ipcRenderer.invoke('privateMarket:pull'),
  push: (message) => ipcRenderer.invoke('privateMarket:push', message)
})
contextBridge.exposeInMainWorld('external', {
  addSource: (text) => ipcRenderer.invoke('external:addSource', text),
  listSources: () => ipcRenderer.invoke('external:listSources'),
  probeSource: (text) => ipcRenderer.invoke('external:probeSource', text)
})
contextBridge.exposeInMainWorld('externalAPI', {
  addSource: (text) => ipcRenderer.invoke('external:addSource', text),
  listSources: () => ipcRenderer.invoke('external:listSources'),
  probeSource: (text) => ipcRenderer.invoke('external:probeSource', text)
})
contextBridge.exposeInMainWorld('library', {
  list: () => ipcRenderer.invoke('library:list'),
  importLib: (repo, overwrite) => ipcRenderer.invoke('library:import', repo, overwrite)
})
contextBridge.exposeInMainWorld('injector', {
  install: (payload) => ipcRenderer.invoke('inject:install', payload)
})
contextBridge.exposeInMainWorld('prompt', {
  inject: (payload) => ipcRenderer.invoke('inject:prompt', payload)
})
contextBridge.exposeInMainWorld('merge', {
  preview: (targetPath, pluginId) => ipcRenderer.invoke('merge:preview', targetPath, pluginId)
})
contextBridge.exposeInMainWorld('editor', {
  open: (filePath) => ipcRenderer.invoke('editor:open', filePath)
})
contextBridge.exposeInMainWorld('atoms', {
  list: () => ipcRenderer.invoke('library:atoms')
})
contextBridge.exposeInMainWorld('projects', {
  scanParent: (dir) => ipcRenderer.invoke('projects:scanParent', dir)
})
contextBridge.exposeInMainWorld('scenes', {
  list: () => ipcRenderer.invoke('scenes:list'),
  save: (scene) => ipcRenderer.invoke('scenes:save', scene),
  apply: (sceneId, targetPath, strategy) => ipcRenderer.invoke('scenes:apply', sceneId, targetPath, strategy)
})
contextBridge.exposeInMainWorld('sceneTools', {
  snapshotFromProject: (projectPath) => ipcRenderer.invoke('scenes:snapshotFromProject', projectPath)
})
