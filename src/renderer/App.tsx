import { useEffect, useState } from 'react'
import type { AppData, Project, Plugin } from '@common/types'
import NewMarketplacePage from './pages/NewMarketplacePage'
import CapabilityLibraryPage from './pages/CapabilityLibraryPage'
import ScenesPage from './pages/ScenesPage'
import ProjectsPage from './pages/ProjectsPage'
import PluginPanelPage from './pages/PluginPanelPage'

declare global {
  interface Window {
    electronAPI: {
      // 数据管理
      getData: () => Promise<AppData>
      setData: (data: AppData) => Promise<boolean>

      // 文件/文件夹选择
      selectFolder: () => Promise<string>

      // Marketplace 管理
      getMarketplaces: () => Promise<any[]>
      addMarketplace: (repo: string) => Promise<{ success: boolean; error?: string }>
      updateMarketplace: (name?: string) => Promise<{ success: boolean; error?: string }>

      // 插件管理
      scanMarket: () => Promise<Plugin[]>
      installPlugin: (pluginId: string, marketplace: string, scope: 'user' | 'project' | 'local', projectPath?: string) => Promise<{ success: boolean; error?: string }>
      getInstalledPlugins: (scope?: 'user' | 'project' | 'local') => Promise<Array<{ id: string; scope: string; installPath: string; version: string; installedAt: string; isLocal: boolean }>>
      getPluginInfo: (pluginId: string) => Promise<{ installPath?: string; version: string; capabilities: any; source?: string } | null>

      // 项目管理
      inspectProject: (path: string) => Promise<any>
      scanProjects: (basePath: string) => Promise<Project[]>
      getProjectDetails: (path: string) => Promise<any>
      getProjectPlugins: (path: string) => Promise<string[]>
      enableProjectPlugin: (projectPath: string, pluginId: string) => Promise<{ success: boolean; error?: string }>
      disableProjectPlugin: (projectPath: string, pluginId: string) => Promise<{ success: boolean; error?: string }>

      // 场景管理
      listScenes: () => Promise<Array<{ id: string; name: string; plugins: string[] }>>
      saveScene: (scene: { id?: string; name: string; plugins: string[] }) => Promise<{ id: string; name: string; plugins: string[] }>
      applyScene: (sceneId: string, targetPath: string, strategy: 'overwrite' | 'skip') => Promise<boolean>

      // 编辑器
      openInEditor: (filePath: string) => Promise<boolean>

      // 自定义描述管理
      getPluginDescription: (pluginId: string) => Promise<string | null>
      setPluginDescription: (pluginId: string, description: string) => Promise<{ success: boolean; error?: string } | null>
      deletePluginDescription: (pluginId: string) => Promise<{ success: boolean; error?: string } | null>
      getCapabilityDescription: (capabilityId: string) => Promise<string | null>
      setCapabilityDescription: (capabilityId: string, description: string) => Promise<{ success: boolean; error?: string } | null>
      deleteCapabilityDescription: (capabilityId: string) => Promise<{ success: boolean; error?: string } | null>
    }
  }
}

export default function App() {
  const [tab, setTab] = useState('markets')
  const [data, setData] = useState<AppData>({ marketPath: '', projects: [] })
  const [marketplaces, setMarketplaces] = useState<any[]>([])
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (window.electronAPI) {
      // 加载数据
      window.electronAPI.getData().then(setData)

      // 加载 marketplaces
      window.electronAPI.getMarketplaces().then(setMarketplaces)

      // 加载插件列表
      window.electronAPI.scanMarket().then(setPlugins)
    }
  }, [])

  // 通用错误处理
  const handleError = (error: any, message: string) => {
    console.error(message, error)
    alert(`${message}: ${error.message || error}`)
  }

  const handleAddMarketplace = async (repo: string) => {
    if (!repo.trim()) {
      alert('请输入仓库地址')
      return
    }

    setLoading(true)
    try {
      const result = await window.electronAPI.addMarketplace(repo)
      if (result.success) {
        alert('Marketplace 添加成功')
        // 重新加载
        window.electronAPI.getMarketplaces().then(setMarketplaces)
      } else {
        alert(`添加失败: ${result.error}`)
      }
    } catch (error) {
      handleError(error, '添加 Marketplace 失败')
    } finally {
      setLoading(false)
    }
  }

  const handleInstallPlugin = async (pluginId: string, marketplace: string) => {
    // 这里可以添加选择项目和作用域的逻辑
    setLoading(true)
    try {
      const result = await window.electronAPI.installPlugin(pluginId, marketplace, 'user')
      if (result.success) {
        alert('插件安装成功')
        // 重新加载插件列表
        window.electronAPI.scanMarket().then(setPlugins)
      } else {
        alert(`安装失败: ${result.error}`)
      }
    } catch (error) {
      handleError(error, '安装插件失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧导航 */}
      <aside className="w-60 border-r bg-white p-4">
        <div className="font-semibold mb-4">Claude 配置管理</div>
        <nav className="space-y-2">
          <button
            className={`block w-full text-left px-3 py-2 rounded ${tab === 'markets' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('markets')}
          >
            市场
          </button>
          <button
            className={`block w-full text-left px-3 py-2 rounded ${tab === 'plugins' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('plugins')}
          >
            插件
          </button>
          <button
            className={`block w-full text-left px-3 py-2 rounded ${tab === 'library' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('library')}
          >
            技能
          </button>
          <button
            className={`block w-full text-left px-3 py-2 rounded ${tab === 'scenes' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('scenes')}
          >
            场景
          </button>
          <button
            className={`block w-full text-left px-3 py-2 rounded ${tab === 'projects' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('projects')}
          >
            项目
          </button>
          <button
            className={`block w-full text-left px-3 py-2 rounded ${tab === 'settings' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setTab('settings')}
          >
            设置
          </button>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-6">
        {tab === 'markets' && <NewMarketplacePage />}
        {tab === 'library' && <CapabilityLibraryPage />}

        {tab === 'projects' && <ProjectsPage />}
        {tab === 'scenes' && <ScenesPage />}
        {tab === 'plugins' && <PluginPanelPage />}

        {tab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">设置</h2>
            <p className="text-gray-600">设置功能即将推出...</p>
          </div>
        )}
      </main>
    </div>
  )
}