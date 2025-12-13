import { useEffect, useState } from 'react'
import type { AppData, Project, Plugin } from '@common/types'

declare global {
  interface Window {
    api: {
      getData: () => Promise<AppData>
      setData: (data: AppData) => Promise<boolean>
      selectFolder: () => Promise<string>
    }
    files: {
      selectFile: () => Promise<string>
    }
    market: {
      scan: (dir?: string) => Promise<Plugin[]>
    }
    project: {
      inspect: (path: string) => Promise<any>
      stats: (path: string) => Promise<{ agents: number; skills: number; commands: number; hooks: number }>
      profiles: (path: string) => Promise<Array<{ name: string; path: string }>>
      switchProfile: (path: string, name: string) => Promise<boolean>
      listInstalled: (path: string) => Promise<{ agents: string[]; commands: string[]; hooks: string[]; skills: Array<{ name: string; path: string }> }>
      uninstallAtom: (payload: { projectPath: string; targetPath: string }) => Promise<boolean>
    }
    projects: {
      scanParent: (dir: string) => Promise<string[]>
    }
    scenes: {
      list: () => Promise<Array<{ id: string; name: string; plugins: string[] }>>
      save: (scene: { id?: string; name: string; plugins: string[] }) => Promise<{ id: string; name: string; plugins: string[] }>
      apply: (sceneId: string, targetPath: string, strategy: 'overwrite' | 'skip') => Promise<boolean>
    }
    config: {
      get: () => Promise<{ library_path: string; editor_path: string; git_path: string }>
      set: (cfg: { library_path: string; editor_path: string; git_path: string }) => Promise<boolean>
    }
    library: {
      list: () => Promise<Array<{ id: string; meta: any; path: string }>>
      importLib: (repo: string, overwrite?: boolean) => Promise<{ id: string; path: string }>
    }
    injector: {
      install: (payload: { pluginId: string; targetPath: string; strategy: 'overwrite' | 'skip'; choices?: Record<string, 'overwrite' | 'skip'> }) => Promise<{ ok: boolean; conflicts: string[] }>
    }
    editor: {
      open: (filePath: string) => Promise<boolean>
    }
    prompt: {
      inject: (payload: { pluginId: string; targetPath: string }) => Promise<boolean>
    }
    merge: {
      preview: (targetPath: string, pluginId: string) => Promise<{ target: string; before: any; source: any; after: any; added: string[]; changed: string[] }>
    }
  }
}

export default function App() {
  const [data, setData] = useState<AppData>({ marketPath: '', projects: [] })
  const [tab, setTab] = useState<'library' | 'projects' | 'settings' | 'scenes'>('settings')
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const isBridgeAvailable = typeof window !== 'undefined' && !!(window as any).api?.selectFolder
  const [selecting, setSelecting] = useState(false)
  const [cfg, setCfg] = useState<{ library_path: string; editor_path: string; git_path: string }>({ library_path: '', editor_path: '', git_path: 'git' })
  const [libs, setLibs] = useState<Array<{ id: string; meta: any; path: string }>>([])
  const [importRepo, setImportRepo] = useState('')
  const [showConflict, setShowConflict] = useState<{ files: string[]; pluginId?: string; target?: string } | null>(null)
  const [confChoices, setConfChoices] = useState<Record<string, 'overwrite' | 'skip'>>({})
  const [atomsTab, setAtomsTab] = useState<'plugins' | 'agents' | 'skills' | 'commands' | 'hooks' | 'mcps'>('plugins')
  const [atoms, setAtoms] = useState<{ agents: Array<{ id: string; path: string }>; skills: Array<{ id: string; path: string }>; commands: Array<{ id: string; path: string }>; hooks: Array<{ id: string; path: string }>; mcps: Array<{ id: string; path: string }>; } | null>(null)
  const [scenes, setScenes] = useState<Array<{ id: string; name: string; plugins: string[] }>>([])
  const [newSceneName, setNewSceneName] = useState('')
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([])
  const [projectDetail, setProjectDetail] = useState<{ project: Project; installed: { agents: string[]; commands: string[]; hooks: string[]; skills: Array<{ name: string; path: string }> } } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).api?.getData) {
      window.api.getData().then(setData)
    }
  }, [])

  useEffect(() => {
    if ((window as any).config?.get) window.config.get().then(setCfg)
  }, [])

  useEffect(() => {
    if (tab === 'library' && (window as any).library?.list) window.library.list().then(setLibs)
    if (tab === 'library' && (window as any).atoms?.list) (window as any).atoms.list().then(setAtoms)
    if (tab === 'scenes' && (window as any).scenes?.list) window.scenes.list().then(setScenes)
  }, [tab])

  useEffect(() => {
    if (showConflict?.files) {
      const init = {} as Record<string, 'overwrite' | 'skip'>
      showConflict.files.forEach(f => { init[f] = 'skip' })
      setConfChoices(init)
    }
  }, [showConflict])

  return (
    <div className="h-full bg-gray-50 text-gray-900">
      <div className="flex h-full">
        <aside className="w-60 border-r bg-white p-4">
          <div className="font-semibold mb-4">Claude 配置分发</div>
          <nav className="space-y-2">
            <button className={`block w-full text-left px-3 py-2 rounded ${tab==='library'?'bg-black text-white':'hover:bg-gray-100'}`} onClick={()=>setTab('library')}>能力库</button>
            <button className={`block w-full text-left px-3 py-2 rounded ${tab==='projects'?'bg-black text-white':'hover:bg-gray-100'}`} onClick={()=>setTab('projects')}>项目列表</button>
            <button className={`block w-full text-left px-3 py-2 rounded ${tab==='scenes'?'bg-black text-white':'hover:bg-gray-100'}`} onClick={()=>setTab('scenes')}>场景</button>
            <button className={`block w-full text-left px-3 py-2 rounded ${tab==='settings'?'bg-black text-white':'hover:bg-gray-100'}`} onClick={()=>setTab('settings')}>设置</button>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {tab === 'library' && (
            <div>
              <h2 className="text-lg font-semibold">本地能力库</h2>
              <div className="mt-4 flex gap-2">
                <input className="border px-2 py-1 rounded flex-1" placeholder="输入 Git 仓库 (如 wshobson/agents 或 https://...)" value={importRepo} onChange={e=>setImportRepo(e.target.value)} />
                <button className="px-3 py-1 rounded bg-black text-white" onClick={async()=>{
                  if (!(window as any).library?.importLib) return
                  const res = await window.library.importLib(importRepo)
                  setImportRepo('')
                  if ((window as any).library?.list) setLibs(await window.library.list())
                }}>导入/下载</button>
              </div>
              <div className="mt-4 flex gap-2">
                {(['plugins','agents','skills','commands','hooks','mcps'] as const).map(k => (
                  <button key={k} className={`px-3 py-1 rounded ${atomsTab===k?'bg-black text-white':'bg-gray-200'}`} onClick={()=>setAtomsTab(k)}>{k}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {atomsTab==='plugins' && libs.map(item => (
                  <div key={item.id} className="border rounded p-4 bg-white">
                    <div className="font-semibold">{item.meta.name || item.id}</div>
                    <div className="text-xs text-gray-500 break-all">{item.path}</div>
                    <button className="mt-2 px-3 py-1 rounded bg-black text-white disabled:bg-gray-300" disabled={data.projects.length===0} onClick={()=>setTab('projects')}>安装到项目</button>
                  </div>
                ))}
                {atomsTab==='plugins' && libs.length===0 && (
                  <div className="text-sm text-gray-600">库为空，请先导入</div>
                )}
                {atoms && atomsTab!=='plugins' && (atoms[atomsTab] as any[]).map(item => (
                  <div key={item.path} className="border rounded p-4 bg-white">
                    <div className="font-semibold">{item.path.split(/[/\\]/).pop()}</div>
                    <div className="text-xs text-gray-500 break-all">{item.path}</div>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 rounded bg-gray-800 text-white" onClick={async()=>{
                        if (!(window as any).editor?.open) return
                        await (window as any).editor.open(item.path)
                      }}>预览/编辑</button>
                      <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>setTab('projects')}>安装到项目</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'projects' && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">项目列表</h2>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-black text-white"
                    onClick={async () => {
                      if (!(window as any).api?.selectFolder) return
                      const dir = await window.api.selectFolder()
                      if (!dir) return
                      const proj: Project = { id: crypto.randomUUID(), alias: dir.split(/[/\\]/).pop() || dir, path: dir }
                      const next = { ...data, projects: [...data.projects, proj] }
                      if ((window as any).api?.setData) await window.api.setData(next)
                      setData(next)
                    }}
                  >添加项目</button>
                  <button
                    className="px-3 py-1 rounded bg-gray-200"
                    onClick={async()=>{
                      if (!(window as any).projects?.scanParent || !(window as any).api?.selectFolder) return
                      const dir = await window.api.selectFolder()
                      if (!dir) return
                      const found: string[] = await (window as any).projects.scanParent(dir)
                      const added = found.map(p => ({ id: crypto.randomUUID(), alias: p.split(/[/\\]/).pop() || p, path: p }))
                      const next = { ...data, projects: [...data.projects, ...added] }
                      if ((window as any).api?.setData) await window.api.setData(next)
                      setData(next)
                    }}
                  >扫描项目</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {data.projects.map(p => (
                  <div key={p.id} className="border rounded p-4 bg-white">
                    <div className="font-semibold">{p.alias}</div>
                    <div className="text-xs text-gray-500 break-all">{p.path}</div>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-gray-800 text-white"
                        onClick={async () => {
                          if (!(window as any).project?.inspect) return
                          const cfgObj = await window.project.inspect(p.path)
                          alert(JSON.stringify(cfgObj))
                        }}
                      >查看配置</button>
                      <button
                        className="px-3 py-1 rounded bg-gray-600 text-white"
                        onClick={async()=>{
                          if (!(window as any).project?.listInstalled) return
                          const installed = await (window as any).project.listInstalled(p.path)
                          setProjectDetail({ project: p, installed })
                        }}
                      >进入配置</button>
                      <button
                        className="px-3 py-1 rounded bg-gray-700 text-white"
                        onClick={async()=>{
                          if (!(window as any).project?.stats) return
                          const stats = await (window as any).project.stats(p.path)
                          alert(JSON.stringify(stats))
                        }}
                      >查看状态</button>
                      <button
                        className="px-3 py-1 rounded bg-gray-900 text-white"
                        onClick={async()=>{
                          if (!(window as any).project?.profiles || !(window as any).project?.switchProfile) return
                          const list = await (window as any).project.profiles(p.path)
                          if (!list.length) { alert('未发现 profiles'); return }
                          const name = list[0].name
                          const ok = await (window as any).project.switchProfile(p.path, name)
                          alert(ok ? `已切换为 ${name}` : '切换失败')
                        }}
                      >角色切换</button>
                      <button
                        className="px-3 py-1 rounded bg-black text-white"
                        onClick={async () => {
                          if (!(window as any).injector?.install) return
                          if (libs.length===0) return
                          const pluginId = libs[0].id
                          const res = await window.injector.install({ pluginId, targetPath: p.path, strategy: 'skip' })
                          if (res.conflicts.length) setShowConflict({ files: res.conflicts, pluginId, target: p.path })
                        }}
                      >安装示例</button>
                    </div>
                  </div>
                ))}
                {data.projects.length===0 && (
                  <div className="text-sm text-gray-600">尚未添加项目</div>
                )}
              </div>
              {showConflict && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
                  <div className="bg-white p-4 rounded w-[540px]">
                    <div className="font-semibold">安装冲突检测</div>
                    <div className="text-sm text-gray-600 mt-2">检测到以下已存在文件：</div>
                    <div className="mt-2 max-h-60 overflow-auto text-xs bg-gray-100 rounded p-2">
                      {showConflict.files.map(f=> (
                        <div key={f} className="flex items-center justify-between gap-2">
                          <span className="break-all">{f}</span>
                          <div className="flex gap-1">
                            <button className={`px-2 py-0.5 rounded ${confChoices[f]==='skip'?'bg-gray-800 text-white':'bg-gray-200'}`} onClick={()=>setConfChoices(prev=>({ ...prev, [f]:'skip' }))}>跳过</button>
                            <button className={`px-2 py-0.5 rounded ${confChoices[f]==='overwrite'?'bg-black text-white':'bg-gray-200'}`} onClick={()=>setConfChoices(prev=>({ ...prev, [f]:'overwrite' }))}>覆盖</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2 justify-end">
                      <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setShowConflict(null)}>取消</button>
                      <button className="px-3 py-1 rounded bg-gray-800 text-white" onClick={async()=>{
                        if (!(window as any).injector?.install) return
                        if (!showConflict?.pluginId || !showConflict?.target) return
                        await window.injector.install({ pluginId: showConflict.pluginId, targetPath: showConflict.target, strategy: 'overwrite' })
                        setShowConflict(null)
                      }}>覆盖并安装</button>
                      <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>setShowConflict(null)}>跳过冲突</button>
                      <button className="px-3 py-1 rounded bg-black text-white" onClick={async()=>{
                        if (!(window as any).injector?.install) return
                        if (!showConflict?.pluginId || !showConflict?.target) return
                        await window.injector.install({ pluginId: showConflict.pluginId, targetPath: showConflict.target, strategy: 'skip', choices: confChoices })
                        setShowConflict(null)
                      }}>按选择执行</button>
                    </div>
                  </div>
                </div>
              )}
              {projectDetail && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-white rounded w-[900px] h-[600px] flex">
                    <div className="w-1/2 border-r p-4 overflow-auto">
                      <div className="font-semibold">已安装</div>
                      <div className="mt-3">
                        <div className="text-sm font-semibold">Agents</div>
                        {projectDetail.installed.agents.map(a => (
                          <div key={a} className="flex items-center justify-between text-xs mt-1">
                            <span className="break-all">{a}</span>
                            <button className="px-2 py-0.5 rounded bg-gray-200" onClick={async()=>{
                              if (!(window as any).project?.uninstallAtom) return
                              const ok = await (window as any).project.uninstallAtom({ projectPath: projectDetail.project.path, targetPath: a })
                              if (ok) {
                                const installed = await (window as any).project.listInstalled(projectDetail.project.path)
                                setProjectDetail({ project: projectDetail.project, installed })
                              }
                            }}>卸载</button>
                          </div>
                        ))}
                        <div className="text-sm font-semibold mt-3">Skills</div>
                        {projectDetail.installed.skills.map(s => (
                          <div key={s.path} className="flex items-center justify-between text-xs mt-1">
                            <span className="break-all">{s.path}</span>
                            <button className="px-2 py-0.5 rounded bg-gray-200" onClick={async()=>{
                              if (!(window as any).project?.uninstallAtom) return
                              const ok = await (window as any).project.uninstallAtom({ projectPath: projectDetail.project.path, targetPath: s.path })
                              if (ok) {
                                const installed = await (window as any).project.listInstalled(projectDetail.project.path)
                                setProjectDetail({ project: projectDetail.project, installed })
                              }
                            }}>卸载</button>
                          </div>
                        ))}
                        <div className="text-sm font-semibold mt-3">Commands</div>
                        {projectDetail.installed.commands.map(c => (
                          <div key={c} className="flex items-center justify-between text-xs mt-1">
                            <span className="break-all">{c}</span>
                            <button className="px-2 py-0.5 rounded bg-gray-200" onClick={async()=>{
                              if (!(window as any).project?.uninstallAtom) return
                              const ok = await (window as any).project.uninstallAtom({ projectPath: projectDetail.project.path, targetPath: c })
                              if (ok) {
                                const installed = await (window as any).project.listInstalled(projectDetail.project.path)
                                setProjectDetail({ project: projectDetail.project, installed })
                              }
                            }}>卸载</button>
                          </div>
                        ))}
                        <div className="text-sm font-semibold mt-3">Hooks</div>
                        {projectDetail.installed.hooks.map(h => (
                          <div key={h} className="flex items-center justify-between text-xs mt-1">
                            <span className="break-all">{h}</span>
                            <button className="px-2 py-0.5 rounded bg-gray-200" onClick={async()=>{
                              if (!(window as any).project?.uninstallAtom) return
                              const ok = await (window as any).project.uninstallAtom({ projectPath: projectDetail.project.path, targetPath: h })
                              if (ok) {
                                const installed = await (window as any).project.listInstalled(projectDetail.project.path)
                                setProjectDetail({ project: projectDetail.project, installed })
                              }
                            }}>卸载</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 p-4 overflow-auto">
                      <div className="font-semibold">库插件</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {libs.map(item => (
                          <div key={item.id} className="border rounded p-3">
                            <div className="text-sm font-semibold">{item.meta.name || item.id}</div>
                            <div className="text-xs text-gray-500 break-all">{item.path}</div>
                            <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 rounded bg-gray-800 text-white" onClick={async()=>{
                        if (!(window as any).injector?.install) return
                        const res = await window.injector.install({ pluginId: item.id, targetPath: projectDetail.project.path, strategy: 'skip' })
                        if (res.conflicts.length) setShowConflict({ files: res.conflicts, pluginId: item.id, target: projectDetail.project.path })
                      }}>安装</button>
                      <button className="px-3 py-1 rounded bg-gray-700 text-white" onClick={async()=>{
                        if (!(window as any).merge?.preview) return
                        const pv = await (window as any).merge.preview(projectDetail.project.path, item.id)
                        alert(JSON.stringify({ added: pv.added, changed: pv.changed }))
                      }}>预览MCP合并</button>
                      <button className="px-3 py-1 rounded bg-gray-800 text-white" onClick={async()=>{
                        if (!(window as any).prompt?.inject) return
                        await (window as any).prompt.inject({ pluginId: item.id, targetPath: projectDetail.project.path })
                        alert('Prompt 已注入')
                      }}>注入Prompt</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2 justify-end">
                        <input className="border px-2 py-1 rounded" placeholder="搜索已安装..." onChange={async (e)=>{
                          const q = e.target.value.toLowerCase()
                          if (!projectDetail) return
                          const installed = await (window as any).project.listInstalled(projectDetail.project.path)
                          const filter = (arr) => arr.filter(x => (typeof x === 'string' ? x : x.path).toLowerCase().includes(q))
                          setProjectDetail({ project: projectDetail.project, installed: {
                            agents: filter(installed.agents),
                            commands: filter(installed.commands),
                            hooks: filter(installed.hooks),
                            skills: filter(installed.skills)
                          }})
                        }} />
                        <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setProjectDetail(null)}>关闭</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'scenes' && (
            <div>
              <h2 className="text-lg font-semibold">场景</h2>
              <div className="mt-4">
                <div className="flex gap-2 items-center">
                  <input className="border px-2 py-1 rounded flex-1" placeholder="场景名称" value={newSceneName} onChange={e=>setNewSceneName(e.target.value)} />
                  <button className="px-3 py-1 rounded bg-black text-white" onClick={async()=>{
                    if (!newSceneName || selectedPlugins.length===0) return
                    if (!(window as any).scenes?.save) return
                    const saved = await window.scenes.save({ name: newSceneName, plugins: selectedPlugins })
                    setNewSceneName('')
                    setSelectedPlugins([])
                    if ((window as any).scenes?.list) setScenes(await window.scenes.list())
                  }}>保存场景</button>
                  <button className="px-3 py-1 rounded bg-gray-200" onClick={async()=>{
                    if (!(window as any).api?.selectFolder || !(window as any).sceneTools?.snapshotFromProject) return
                    const dir = await window.api.selectFolder()
                    if (!dir) return
                    const plugins: string[] = await (window as any).sceneTools.snapshotFromProject(dir)
                    setSelectedPlugins(plugins)
                    setNewSceneName('从项目快照')
                  }}>从项目生成</button>
                </div>
                <div className="mt-3 text-sm">选择包含的插件：</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {libs.map(item => (
                    <label key={item.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={selectedPlugins.includes(item.id)} onChange={e=>{
                        const v = e.target.checked
                        setSelectedPlugins(prev => v ? [...prev, item.id] : prev.filter(x=>x!==item.id))
                      }} />
                      <span>{item.meta.name || item.id}</span>
                    </label>
                  ))}
                  {libs.length===0 && (<div className="text-xs text-gray-600">库为空，请先导入</div>)}
                </div>
                <div className="mt-6">
                  <div className="font-semibold">已保存场景</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {scenes.map(s => (
                      <div key={s.id} className="border rounded p-3 bg-white">
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="text-xs text-gray-500">插件数 {s.plugins.length}</div>
                        <div className="mt-2 flex gap-2">
                          <button className="px-3 py-1 rounded bg-black text-white" onClick={async()=>{
                            if (!(window as any).api?.selectFolder) return
                            const dir = await window.api.selectFolder()
                            if (!dir) return
                            if (!(window as any).scenes?.apply) return
                            await window.scenes.apply(s.id, dir, 'skip')
                            alert('场景已应用')
                          }}>应用到目录</button>
                        </div>
                      </div>
                    ))}
                    {scenes.length===0 && (<div className="text-xs text-gray-600">暂无场景</div>)}
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'settings' && (
            <div>
              <h2 className="text-lg font-semibold">设置</h2>
              <div className="mt-4 space-y-4 max-w-xl">
                <div>
                  <div className="text-sm text-gray-600">Library 路径</div>
                  <div className="text-xs break-all">{cfg.library_path || '未配置'}</div>
                  <button
                    className={`mt-3 px-3 py-1 rounded ${isBridgeAvailable ? 'bg-black text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                    onClick={async () => {
                      if (!(window as any).api?.selectFolder) return
                      const dir = await window.api.selectFolder()
                      if (!dir) return
                      const next = { ...cfg, library_path: dir }
                      if ((window as any).config?.set) await window.config.set(next)
                      setCfg(next)
                    }}
                  >选择库目录</button>
                </div>
                <div className="text-sm text-gray-600">Market 路径</div>
                <div className="text-xs break-all">{data.marketPath || '未配置'}</div>
                <button
                  className={`mt-3 px-3 py-1 rounded ${isBridgeAvailable ? 'bg-black text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                  onClick={async () => {
                    if (!(window as any).api?.selectFolder) {
                      alert('此功能需在 Electron 桌面应用中使用')
                      return
                    }
                    try {
                      setSelecting(true)
                      const dir = await window.api.selectFolder()
                      if (!dir) {
                        setSelecting(false)
                        return
                      }
                      const next = { ...data, marketPath: dir }
                      if ((window as any).api?.setData) await window.api.setData(next)
                      setData(next)
                    } finally {
                      setSelecting(false)
                    }
                  }}
                >{selecting ? '正在打开…' : '选择 Market 目录'}</button>
                <div>
                  <div className="text-sm text-gray-600">Editor 路径</div>
                  <div className="text-xs break-all">{cfg.editor_path || '未配置'}</div>
                  <button className={`mt-3 px-3 py-1 rounded ${isBridgeAvailable ? 'bg-black text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`} onClick={async()=>{
                    if (!(window as any).files?.selectFile) return
                    const f = await (window as any).files.selectFile()
                    if (!f) return
                    const next = { ...cfg, editor_path: f }
                    if ((window as any).config?.set) await window.config.set(next)
                    setCfg(next)
                  }}>选择编辑器</button>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Git 路径</div>
                  <div className="text-xs break-all">{cfg.git_path || 'git'}</div>
                  <button className={`mt-3 px-3 py-1 rounded ${isBridgeAvailable ? 'bg-black text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`} onClick={async()=>{
                    const next = { ...cfg, git_path: 'git' }
                    if ((window as any).config?.set) await window.config.set(next)
                    setCfg(next)
                  }}>使用系统 git</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
