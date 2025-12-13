import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import fse from 'fs-extra'
import { spawn } from 'node:child_process'
import merge from 'lodash.merge'

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(process.cwd(), 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const devUrl = 'http://localhost:5173'
  win.loadURL(devUrl)
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const dataPath = path.join(process.cwd(), 'data.json')
const cfgPath = path.join(app.getPath('userData'), 'config.json')

function readConfig() {
  try {
    const raw = fs.readFileSync(cfgPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { library_path: '', editor_path: '', git_path: 'git' }
  }
}

function writeConfig(next) {
  fse.ensureDirSync(path.dirname(cfgPath))
  fs.writeFileSync(cfgPath, JSON.stringify(next, null, 2), 'utf-8')
}

ipcMain.handle('app:getData', async () => {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return { marketPath: '', projects: [] }
  }
})

ipcMain.handle('app:setData', async (_evt, payload) => {
  fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2), 'utf-8')
  return true
})

ipcMain.handle('config:get', async () => {
  return readConfig()
})

ipcMain.handle('config:set', async (_evt, payload) => {
  writeConfig(payload)
  return true
})

ipcMain.handle('app:selectFolder', async () => {
  const parent = BrowserWindow.getFocusedWindow() || win
  console.log('ipc: app:selectFolder')
  const res = await dialog.showOpenDialog(parent ?? undefined, {
    properties: ['openDirectory'],
    title: '选择 Market 目录'
  })
  if (res.canceled || res.filePaths.length === 0) return ''
  console.log('ipc: app:selectFolder selected', res.filePaths[0])
  return res.filePaths[0]
})

ipcMain.handle('app:selectFile', async () => {
  const parent = BrowserWindow.getFocusedWindow() || win
  const res = await dialog.showOpenDialog(parent ?? undefined, {
    properties: ['openFile'],
    title: '选择可执行文件'
  })
  if (res.canceled || res.filePaths.length === 0) return ''
  return res.filePaths[0]
})

ipcMain.handle('market:scan', async (_evt, marketDir) => {
  try {
    const dir = marketDir || JSON.parse(fs.readFileSync(dataPath, 'utf-8')).marketPath
    if (!dir || !fs.existsSync(dir)) return []
    const entries = fs.readdirSync(dir)
    const items = entries
      .map(name => ({ name, full: path.join(dir, name) }))
      .filter(e => fs.existsSync(e.full) && fs.statSync(e.full).isDirectory())
      .map(e => {
        const pluginJson = path.join(e.full, 'plugin.json')
        let capabilities = {}
        if (fs.existsSync(pluginJson)) {
          try { capabilities = JSON.parse(fs.readFileSync(pluginJson, 'utf-8')) } catch {}
        }
        const readmePath = fs.existsSync(path.join(e.full, 'README.md')) ? path.join(e.full, 'README.md') : undefined
        const iconPath = fs.existsSync(path.join(e.full, 'icon.png')) ? path.join(e.full, 'icon.png') : undefined
        return {
          meta: { id: e.name, name: e.name, readmePath, iconPath },
          capabilities,
          rootPath: e.full
        }
      })
    return items
  } catch {
    return []
  }
})

ipcMain.handle('library:list', async () => {
  const cfg = readConfig()
  const root = cfg.library_path
  if (!root || !fs.existsSync(root)) return []
  const dirs = fs.readdirSync(root)
  return dirs.filter(d => fs.statSync(path.join(root, d)).isDirectory()).map(d => {
    const metaPath = path.join(root, d, 'metadata.json')
    let meta = { id: d, name: d }
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) } catch {}
    }
    return { id: d, meta, path: path.join(root, d) }
  })
})

ipcMain.handle('library:import', async (_evt, repo, overwrite = false) => {
  const cfg = readConfig()
  const gitCmd = cfg.git_path || 'git'
  const tmp = path.join(app.getPath('temp'), `lem_${Date.now()}`)
  fse.ensureDirSync(tmp)
  const url = repo.includes('://') ? repo : `https://github.com/${repo}.git`
  await new Promise((resolve, reject) => {
    const p = spawn(gitCmd, ['clone', url, tmp], { stdio: 'inherit' })
    p.on('exit', code => code === 0 ? resolve() : reject(new Error('git clone failed')))
    p.on('error', reject)
  })
  let id = repo
  if (id.endsWith('.git')) id = id.slice(0, -4)
  if (id.includes('/')) id = id.split('/').pop()
  const dest = path.join(cfg.library_path, id)
  if (fs.existsSync(dest) && overwrite) fse.removeSync(dest)
  fse.ensureDirSync(dest)
  const assets = path.join(dest, 'assets')
  fse.ensureDirSync(assets)
  const agentsDir = path.join(assets, 'agents')
  const skillsDir = path.join(assets, 'skills')
  const commandsDir = path.join(assets, 'commands')
  const hooksDir = path.join(assets, 'hooks')
  fse.ensureDirSync(agentsDir)
  fse.ensureDirSync(skillsDir)
  fse.ensureDirSync(commandsDir)
  fse.ensureDirSync(hooksDir)
  const walk = dir => fs.readdirSync(dir).map(n => path.join(dir, n))
  const files = []
  const stack = [tmp]
  while (stack.length) {
    const cur = stack.pop()
    const items = walk(cur)
    for (const pth of items) {
      if (fs.statSync(pth).isDirectory()) { stack.push(pth); continue }
      files.push(pth)
    }
  }
  for (const file of files) {
    const base = path.basename(file).toLowerCase()
    if (base.endsWith('.md')) {
      if (file.toLowerCase().includes('agents') || base.includes('agent')) {
        fse.copySync(file, path.join(agentsDir, path.basename(file)))
      } else if (file.toLowerCase().includes('commands') || base.includes('deploy') || base.includes('fix')) {
        fse.copySync(file, path.join(commandsDir, path.basename(file)))
      }
    }
  }
  const dirs = files.map(f => path.dirname(f))
  const uniqDirs = Array.from(new Set(dirs))
  for (const d of uniqDirs) {
    const skillMd = path.join(d, 'SKILL.md')
    if (fs.existsSync(skillMd)) {
      const name = path.basename(d)
      fse.copySync(d, path.join(skillsDir, name))
    }
  }
  const mcpCandidates = ['claude_desktop_config.json', 'claude.json', 'mcp.json']
  let mcp = {}
  for (const cand of mcpCandidates) {
    const found = files.find(f => path.basename(f) === cand)
    if (found) {
      try {
        const obj = JSON.parse(fs.readFileSync(found, 'utf-8'))
        if (obj.mcpServers) mcp = { mcpServers: obj.mcpServers }
        else mcp = obj
        break
      } catch {}
    }
  }
  if (Object.keys(mcp).length) fs.writeFileSync(path.join(assets, 'mcp.json'), JSON.stringify(mcp, null, 2), 'utf-8')
  const meta = { id, name: id, description: '', capabilities_stats: {} }
  fs.writeFileSync(path.join(dest, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf-8')
  const readmeSrc = path.join(tmp, 'README.md')
  if (fs.existsSync(readmeSrc)) fse.copySync(readmeSrc, path.join(dest, 'README.md'))
  return { id, path: dest }
})

ipcMain.handle('inject:install', async (_evt, payload) => {
  const { pluginId, targetPath, strategy, choices = {} } = payload
  const cfg = readConfig()
  const src = path.join(cfg.library_path, pluginId, 'assets')
  if (!fs.existsSync(src)) return { ok: false, conflicts: [] }
  const targetClaude = path.join(targetPath, '.claude')
  fse.ensureDirSync(targetClaude)
  const copyDir = (from, to) => {
    if (!fs.existsSync(from)) return []
    fse.ensureDirSync(to)
    const conflicts = []
    const entries = fs.readdirSync(from)
    for (const name of entries) {
      const s = path.join(from, name)
      const t = path.join(to, name)
      if (fs.existsSync(t)) {
        conflicts.push(t)
        const decision = choices[t] || strategy
        if (decision === 'overwrite') fse.removeSync(t)
        else continue
      }
      fse.copySync(s, t)
    }
    return conflicts
  }
  const c1 = copyDir(path.join(src, 'agents'), path.join(targetClaude, 'agents'))
  const c2 = copyDir(path.join(src, 'commands'), path.join(targetClaude, 'commands'))
  const c3 = copyDir(path.join(src, 'hooks'), path.join(targetClaude, 'hooks'))
  if (fs.existsSync(path.join(src, 'skills'))) {
    const skillsEntries = fs.readdirSync(path.join(src, 'skills'))
    for (const name of skillsEntries) {
      const sdir = path.join(src, 'skills', name)
      const tdir = path.join(targetClaude, 'skills', name)
      if (fs.existsSync(tdir)) {
        const decisionDir = choices[tdir] || strategy
        if (decisionDir === 'overwrite') {
          fse.removeSync(tdir)
          fse.copySync(sdir, tdir)
          continue
        }
        const walk = (root, base = '') => {
          const out = []
          const abs = path.join(root, base)
          const items = fs.readdirSync(abs)
          for (const it of items) {
            const p = path.join(base, it)
            const full = path.join(root, p)
            if (fs.statSync(full).isDirectory()) out.push(...walk(root, p))
            else out.push(full)
          }
          return out
        }
        const files = walk(sdir).map(p => p.replace(sdir, '').replace(/^[\\/]/, ''))
        for (const rel of files) {
          const sf = path.join(sdir, rel)
          const tf = path.join(tdir, rel)
          fse.ensureDirSync(path.dirname(tf))
          if (fs.existsSync(tf)) {
            const decisionFile = choices[tf] || 'skip'
            if (decisionFile === 'overwrite') {
              fse.removeSync(tf)
              fse.copySync(sf, tf)
            } else {
              // collect conflicts for UI
              c3.push(tf)
            }
          } else {
            fse.copySync(sf, tf)
          }
        }
      } else {
        fse.copySync(sdir, tdir)
      }
    }
  }
  const mcpSrc = path.join(src, 'mcp.json')
  const cfgTarget = ['claude_desktop_config.json', 'claude.json'].map(n => path.join(targetPath, n)).find(p => fs.existsSync(p)) || path.join(targetPath, 'claude.json')
  if (fs.existsSync(mcpSrc)) {
    const mcpObj = JSON.parse(fs.readFileSync(mcpSrc, 'utf-8'))
    let targetObj = {}
    if (fs.existsSync(cfgTarget)) {
      try { targetObj = JSON.parse(fs.readFileSync(cfgTarget, 'utf-8')) } catch {}
    }
    const merged = merge({}, targetObj, mcpObj)
    fs.writeFileSync(cfgTarget, JSON.stringify(merged, null, 2), 'utf-8')
  }
  return { ok: true, conflicts: [...c1, ...c2, ...c3] }
})

ipcMain.handle('merge:preview', async (_evt, targetPath, pluginId) => {
  const cfg = readConfig()
  const mcpSrc = path.join(cfg.library_path, pluginId, 'assets', 'mcp.json')
  const cfgTarget = ['claude_desktop_config.json', 'claude.json'].map(n => path.join(targetPath, n)).find(p => fs.existsSync(p)) || path.join(targetPath, 'claude.json')
  let source = {}
  let before = {}
  if (fs.existsSync(mcpSrc)) {
    try { source = JSON.parse(fs.readFileSync(mcpSrc, 'utf-8')) } catch {}
  }
  if (fs.existsSync(cfgTarget)) {
    try { before = JSON.parse(fs.readFileSync(cfgTarget, 'utf-8')) } catch {}
  }
  const after = merge({}, before, source)
  const keysBefore = Object.keys(before.mcpServers || {})
  const keysSource = Object.keys(source.mcpServers || {})
  const keysAfter = Object.keys(after.mcpServers || {})
  const added = keysAfter.filter(k => !keysBefore.includes(k))
  const changed = keysAfter.filter(k => keysBefore.includes(k) && JSON.stringify((before.mcpServers||{})[k]) !== JSON.stringify((after.mcpServers||{})[k]))
  return { target: cfgTarget, before, source, after, added, changed }
})

ipcMain.handle('library:atoms', async () => {
  const cfg = readConfig()
  const root = cfg.library_path
  if (!root || !fs.existsSync(root)) return { agents: [], skills: [], commands: [], hooks: [], mcps: [] }
  const listFiles = dir => fs.existsSync(dir) ? fs.readdirSync(dir).map(n => path.join(dir, n)) : []
  const pkgs = fs.readdirSync(root).filter(d => fs.statSync(path.join(root, d)).isDirectory())
  const res = { agents: [], skills: [], commands: [], hooks: [], mcps: [] }
  for (const id of pkgs) {
    const assets = path.join(root, id, 'assets')
    res.agents.push(...listFiles(path.join(assets, 'agents')).map(f => ({ id, path: f })))
    const skillsDir = path.join(assets, 'skills')
    if (fs.existsSync(skillsDir)) {
      const names = fs.readdirSync(skillsDir).filter(n => fs.statSync(path.join(skillsDir, n)).isDirectory())
      res.skills.push(...names.map(n => ({ id, path: path.join(skillsDir, n) })))
    }
    res.commands.push(...listFiles(path.join(assets, 'commands')).map(f => ({ id, path: f })))
    res.hooks.push(...listFiles(path.join(assets, 'hooks')).map(f => ({ id, path: f })))
    const mcp = path.join(assets, 'mcp.json')
    if (fs.existsSync(mcp)) res.mcps.push({ id, path: mcp })
  }
  return res
})

ipcMain.handle('editor:open', async (_evt, filePath) => {
  const cfg = readConfig()
  const exe = cfg.editor_path
  if (!exe || !fs.existsSync(exe)) return false
  await new Promise((resolve) => {
    const p = spawn(exe, [filePath], { stdio: 'ignore', detached: true })
    p.unref()
    resolve(true)
  })
  return true
})

ipcMain.handle('projects:scanParent', async (_evt, dir) => {
  if (!dir || !fs.existsSync(dir)) return []
  const found = []
  const walk = d => {
    const list = fs.readdirSync(d)
    for (const n of list) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) {
        if (fs.existsSync(path.join(p, '.claude'))) found.push(p)
        else walk(p)
      }
    }
  }
  walk(dir)
  return found
})

const scenesPath = path.join(app.getPath('userData'), 'scenes.json')

function readScenes() {
  try { return JSON.parse(fs.readFileSync(scenesPath, 'utf-8')) } catch { return { scenes: [] } }
}

function writeScenes(obj) {
  fse.ensureDirSync(path.dirname(scenesPath))
  fs.writeFileSync(scenesPath, JSON.stringify(obj, null, 2), 'utf-8')
}

ipcMain.handle('scenes:list', async () => {
  return readScenes().scenes
})

ipcMain.handle('scenes:save', async (_evt, scene) => {
  const db = readScenes()
  const id = scene.id || `${Date.now()}`
  const next = { ...scene, id }
  db.scenes = db.scenes.filter(s => s.id !== id).concat(next)
  writeScenes(db)
  return next
})

ipcMain.handle('scenes:apply', async (_evt, sceneId, targetPath, strategy = 'skip') => {
  const db = readScenes()
  const s = db.scenes.find(x => x.id === sceneId)
  if (!s) return false
  const list = Array.isArray(s.plugins) ? s.plugins : []
  for (const pid of list) {
    await ipcMain.emit('inject:install', { sender: _evt.sender }, { pluginId: pid, targetPath, strategy })
  }
  return true
})

ipcMain.handle('project:stats', async (_evt, projectPath) => {
  const root = path.join(projectPath, '.claude')
  const stats = { agents: 0, skills: 0, commands: 0, hooks: 0 }
  if (!fs.existsSync(root)) return stats
  const countFiles = dir => fs.existsSync(dir) ? fs.readdirSync(dir).length : 0
  stats.agents = countFiles(path.join(root, 'agents'))
  stats.commands = countFiles(path.join(root, 'commands'))
  stats.hooks = countFiles(path.join(root, 'hooks'))
  const skillsDir = path.join(root, 'skills')
  stats.skills = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter(n => fs.statSync(path.join(skillsDir, n)).isDirectory()).length : 0
  return stats
})

ipcMain.handle('project:profiles', async (_evt, projectPath) => {
  const dir = path.join(projectPath, 'profiles')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(n => n.endsWith('.md')).map(n => ({ name: n, path: path.join(dir, n) }))
})

ipcMain.handle('project:switchProfile', async (_evt, projectPath, name) => {
  const src = path.join(projectPath, 'profiles', name)
  const dst = path.join(projectPath, 'CLAUDE.md')
  if (!fs.existsSync(src)) return false
  fse.copySync(src, dst, { overwrite: true })
  return true
})

ipcMain.handle('project:listInstalled', async (_evt, projectPath) => {
  const root = path.join(projectPath, '.claude')
  const res = { agents: [], commands: [], hooks: [], skills: [] }
  const list = dir => fs.existsSync(dir) ? fs.readdirSync(dir) : []
  const agentsDir = path.join(root, 'agents')
  res.agents = list(agentsDir).map(n => path.join(agentsDir, n))
  const commandsDir = path.join(root, 'commands')
  res.commands = list(commandsDir).map(n => path.join(commandsDir, n))
  const hooksDir = path.join(root, 'hooks')
  res.hooks = list(hooksDir).map(n => path.join(hooksDir, n))
  const skillsDir = path.join(root, 'skills')
  if (fs.existsSync(skillsDir)) {
    const names = fs.readdirSync(skillsDir).filter(n => fs.statSync(path.join(skillsDir, n)).isDirectory())
    res.skills = names.map(n => ({ name: n, path: path.join(skillsDir, n) }))
  }
  return res
})

ipcMain.handle('project:uninstallAtom', async (_evt, payload) => {
  const { projectPath, targetPath } = payload
  if (!projectPath || !targetPath) return false
  if (!fs.existsSync(targetPath)) return false
  try { fse.removeSync(targetPath); return true } catch { return false }
})

ipcMain.handle('inject:prompt', async (_evt, payload) => {
  const { pluginId, targetPath } = payload
  const cfg = readConfig()
  const assets = path.join(cfg.library_path, pluginId, 'assets')
  const promptPaths = [path.join(assets, 'prompt.xml'), path.join(assets, 'prompt.md')]
  let text = ''
  for (const p of promptPaths) {
    if (fs.existsSync(p)) { text = fs.readFileSync(p, 'utf-8'); break }
  }
  const claudeMd = path.join(targetPath, 'CLAUDE.md')
  let md = ''
  if (fs.existsSync(claudeMd)) md = fs.readFileSync(claudeMd, 'utf-8')
  const openTag = '<rolePrompt>'
  const closeTag = '</rolePrompt>'
  if (md.includes(openTag) && md.includes(closeTag)) {
    const before = md.split(openTag)[0]
    const after = md.split(closeTag).slice(1).join(closeTag)
    md = `${before}${openTag}${text}${closeTag}${after}`
  } else {
    md = `${md}\n${openTag}${text}${closeTag}\n`
  }
  fs.writeFileSync(claudeMd, md, 'utf-8')
  return true
})

ipcMain.handle('scenes:snapshotFromProject', async (_evt, projectPath) => {
  const cfg = readConfig()
  const root = cfg.library_path
  if (!root || !fs.existsSync(root)) return []
  const pkgs = fs.readdirSync(root).filter(d => fs.statSync(path.join(root, d)).isDirectory())
  const projClaude = path.join(projectPath, '.claude')
  const hasAnyFromPlugin = (pid) => {
    const assets = path.join(root, pid, 'assets')
    const checkDir = (sub) => {
      const d = path.join(assets, sub)
      if (!fs.existsSync(d)) return false
      const target = path.join(projClaude, sub)
      if (!fs.existsSync(target)) return false
      const names = fs.readdirSync(d)
      const projNames = fs.existsSync(target) ? fs.readdirSync(target) : []
      return names.some(n => projNames.includes(n))
    }
    return ['agents','commands','hooks','skills'].some(checkDir)
  }
  return pkgs.filter(pid => hasAnyFromPlugin(pid))
})

ipcMain.handle('project:inspect', async (_evt, projectPath) => {
  try {
    const cfgPath = path.join(projectPath, 'claude.json')
    if (!fs.existsSync(cfgPath)) return {}
    return JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
  } catch {
    return {}
  }
})
