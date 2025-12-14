import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app';

interface Marketplace {
  name: string;
  source: {
    source: string;
    repo: string;
  };
  lastUpdated: string;
  plugins: Array<{
    name: string;
    source: string;
    description: string;
    version?: string;
  }>;
  metadata: {
    description?: string;
    version?: string;
  };
}

interface PluginDetail {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: {
    agents?: Record<string, string>;
    skills?: Record<string, string>;
    commands?: Record<string, string>;
    hooks?: Record<string, string>;
    mcpServers?: Record<string, any>;
    settings?: Record<string, any>;
    prompts?: Record<string, string>;
  };
  rootPath: string;
}

export default function NewMarketplacePage() {
  const { data, projects } = useAppStore();
  const [commandInput, setCommandInput] = useState('');

  // 调试：组件挂载时检查 electronAPI
  React.useEffect(() => {
    console.log('[NewMarketplacePage] Component mounted');
    console.log('[NewMarketplacePage] window.electronAPI:', window.electronAPI);
    if (window.electronAPI) {
      console.log('[NewMarketplacePage] electronAPI methods:', {
        getMarketplaces: typeof window.electronAPI.getMarketplaces,
        addMarketplace: typeof window.electronAPI.addMarketplace,
        scanMarket: typeof window.electronAPI.scanMarket
      });
    }
  }, []);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [plugins, setPlugins] = useState<PluginDetail[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [installedPlugins, setInstalledPlugins] = useState<string[]>([]);
  const [installingPluginId, setInstallingPluginId] = useState<string | null>(null);

  // 加载已配置的 marketplaces 和已安装的插件
  useEffect(() => {
    loadMarketplaces();
    loadInstalledPlugins();
  }, []);

  const loadMarketplaces = async () => {
    try {
      console.log('[NewMarketplacePage] Loading marketplaces...');
      const marketplacesData = await window.electronAPI.getMarketplaces();
      console.log('[NewMarketplacePage] Marketplaces loaded:', marketplacesData);
      setMarketplaces(marketplacesData);
    } catch (error) {
      console.error('[NewMarketplacePage] Failed to load marketplaces:', error);
      setMarketplaces([]);
    }
  };

  const loadInstalledPlugins = async () => {
    try {
      const installed = await window.electronAPI.getInstalledPlugins('user');
      const pluginIds = installed.map(plugin => plugin.id);
      setInstalledPlugins(pluginIds);
    } catch (error) {
      console.error('[NewMarketplacePage] Failed to load installed plugins:', error);
      setInstalledPlugins([]);
    }
  };

  // 解析并添加 marketplace
  const handleAddMarketplace = async () => {
    const command = commandInput.trim();
    if (!command) {
      alert('请输入命令');
      return;
    }

    // 确保使用 electronAPI
    if (!window.electronAPI) {
      console.error('[NewMarketplacePage] electronAPI is undefined!');
      alert('electronAPI 未加载，请刷新页面或重启应用');
      return;
    }

    if (!window.electronAPI.addMarketplace) {
      console.error('[NewMarketplacePage] addMarketplace not found on electronAPI!');
      console.log('[NewMarketplacePage] Available electronAPI methods:', Object.keys(window.electronAPI));
      return;
    }

    // 解析命令
    const addPattern = /\/plugin marketplace add\s+(.+)$/i;
    const match = command.match(addPattern);

    if (!match) {
      alert('命令格式不正确，请使用: /plugin marketplace add <repo>');
      return;
    }

    const repo = match[1].trim();
    setLoading(true);

    try {
      console.log('[NewMarketplacePage] Adding marketplace:', repo);
      console.log('[NewMarketplacePage] addMarketplace function:', window.electronAPI.addMarketplace);
      console.log('[NewMarketplacePage] typeof addMarketplace:', typeof window.electronAPI.addMarketplace);

      const result = await window.electronAPI.addMarketplace(repo);
      console.log('[NewMarketplacePage] Result from addMarketplace:', result);

      if (result.success) {
        alert('Marketplace 添加成功！');
        setCommandInput('');
        // 重新加载列表
        await loadMarketplaces();
      } else {
        alert(`添加失败: ${result.error}`);
      }
    } catch (error: any) {
      console.error('[NewMarketplacePage] Error adding marketplace:', error);
      alert(`添加失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 浏览 marketplace 中的插件
  const handleBrowseMarketplace = async (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setLoading(true);

    try {
      console.log('[NewMarketplacePage] Scanning plugins from marketplace:', marketplace.name);
      // 获取所有缓存的插件
      const allPlugins = await window.electronAPI.scanMarket();

      // 过滤出属于当前 marketplace 的插件（通过 ID 匹配）
      const marketplacePlugins = allPlugins.filter(plugin =>
        plugin.meta.id && plugin.meta.id.endsWith(`@${marketplace.name}`)
      );

      console.log('[NewMarketplacePage] Found plugins:', marketplacePlugins.length);
      console.log('[NewMarketplacePage] Plugins:', marketplacePlugins.map(p => ({ id: p.meta.id, name: p.meta.name })));
      setPlugins(marketplacePlugins);

      // 重新加载已安装插件列表
      await loadInstalledPlugins();
    } catch (error: any) {
      console.error('[NewMarketplacePage] Error scanning marketplace:', error);
      alert(`扫描插件失败: ${error.message}`);
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取能力类型的显示名称和图标
  const getCapabilityTypeInfo = (type: string) => {
    const types: Record<string, { name: string; icon: string; color: string }> = {
      agents: { name: 'Agents', icon: '🤖', color: 'blue' },
      skills: { name: 'Skills', icon: '⚡', color: 'purple' },
      commands: { name: 'Commands', icon: '💻', color: 'green' },
      hooks: { name: 'Hooks', icon: '🪝', color: 'orange' },
      mcpServers: { name: 'MCP 服务器', icon: '🔌', color: 'red' },
      settings: { name: '配置', icon: '⚙️', color: 'gray' },
      prompts: { name: '提示词', icon: '💬', color: 'indigo' }
    };
    return types[type] || { name: type, icon: '📦', color: 'gray' };
  };

  // 查看插件详情（只显示基本信息）
  const handleViewPluginDetails = (plugin: PluginDetail) => {
    setSelectedPlugin(plugin);
  };

  // 安装插件
  const handleInstallPlugin = async (plugin: PluginDetail) => {
    if (!window.electronAPI?.installPlugin) {
      alert('API 不可用');
      return;
    }

    // 从插件 ID 中解析名称和 marketplace
    const pluginName = plugin.meta.name;
    // 从 ID 中获取 marketplace 名称
    const marketplace = plugin.meta.id.split('@')[1] || 'unknown';

    console.log('[Install] Installing plugin:', {
      id: plugin.meta.id,
      name: pluginName,
      marketplace
    });

    setInstallingPluginId(plugin.meta.id);
    try {
      const result = await window.electronAPI.installPlugin(pluginName, marketplace, 'user');
      if (result.success) {
        // 更新安装状态
        setInstalledPlugins(prev => [...prev, plugin.meta.id]);

        // 更新插件列表中的安装状态
        setPlugins(prev => prev.map(p =>
          p.meta.id === plugin.meta.id
            ? { ...p, installed: true }
            : p
        ));

        // 如果需要，重新加载已安装插件列表
        await loadInstalledPlugins();
      } else {
        alert(`安装失败：${result.error}`);
      }
    } catch (error: any) {
      console.error('安装失败:', error);
      alert('安装失败：' + error.message);
    } finally {
      setInstallingPluginId(null);
    }
  };

  // 下载能力到本地库（安装整个插件）
  const handleDownloadCapability = async (plugin: PluginDetail, type: string, item: string) => {
    if (!window.electronAPI?.installPlugin) {
      alert('API 不可用');
      return;
    }

    // 从插件 ID 中解析名称和 marketplace
    const pluginName = plugin.name;
    // 从 ID 中获取 marketplace 名称
    const marketplace = plugin.meta.id.split('@')[1] || 'unknown';

    const confirmed = confirm(`确定要下载插件 "${pluginName}" 到能力库吗？\n来源：${marketplace}`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.installPlugin(pluginName, marketplace, 'user');
      if (result.success) {
        alert(`"${pluginName}" 已成功下载到能力库！`);
        // 重新加载已安装插件列表
        await loadInstalledPlugins();
      } else {
        alert(`下载失败：${result.error}`);
      }
    } catch (error: any) {
      console.error('下载失败:', error);
      alert('下载失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 渲染市场列表页面
  if (!selectedMarketplace) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Claude 插件市场</h2>

        {/* 命令输入框 */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">添加插件市场</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="输入命令 (例如: /plugin marketplace add udecode/dotai)"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMarketplace()}
              className="flex-1 px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddMarketplace}
              disabled={loading || !commandInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </div>

        {/* Marketplace 列表 */}
        <div>
          <h3 className="text-xl font-semibold mb-4">已添加的市场</h3>
          {marketplaces.length === 0 ? (
            <div className="text-center py-8 bg-white border border-zinc-200 rounded-lg">
              <p className="text-zinc-500">还没有添加任何市场</p>
              <p className="text-sm text-zinc-400 mt-2">使用上方命令添加新的插件市场</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaces.map((marketplace) => (
                <div
                  key={marketplace.name}
                  className="bg-white border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleBrowseMarketplace(marketplace)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{marketplace.name}</h3>
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded">
                      {marketplace.plugins.length} 个插件
                    </span>
                  </div>
                  {marketplace.metadata.description && (
                    <p className="text-sm text-zinc-600 mb-2">{marketplace.metadata.description}</p>
                  )}
                  <p className="text-xs text-zinc-500">
                    来源: {marketplace.source.repo}
                  </p>
                  <p className="text-xs text-zinc-500">
                    更新时间: {new Date(marketplace.lastUpdated).toLocaleDateString()}
                  </p>
                  <div className="mt-3 text-sm text-blue-600">
                    点击浏览插件 →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 渲染插件列表页面
  if (!selectedPlugin) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setSelectedMarketplace(null)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← 返回市场列表
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6">
          {selectedMarketplace.name} - 插件列表
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-sm text-zinc-500">扫描插件中…</div>
          </div>
        ) : plugins.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-500">没有找到插件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins.map((plugin) => (
              <div key={plugin.meta.id} className="bg-white border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{plugin.meta.name}</h4>
                  <div className="flex items-center gap-2">
                    {plugin.installed && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ 已安装
                      </span>
                    )}
                    {plugin.meta.version && (
                      <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded">
                        {plugin.meta.version}
                      </span>
                    )}
                  </div>
                </div>

                {plugin.meta.description && (
                  <p className="text-sm text-zinc-600 mb-3">{plugin.meta.description}</p>
                )}

                {/* 能力类型统计 */}
                <div className="space-y-2 mb-3">
                  {Object.entries(plugin.capabilities).map(([type, items]) => {
                    if (!items || (typeof items === 'object' && Object.keys(items).length === 0)) return null;
                    const typeInfo = getCapabilityTypeInfo(type);
                    const count = typeof items === 'object' ? Object.keys(items).length : 1;

                    return (
                      <div key={type} className="flex items-center gap-2 text-xs">
                        <span>{typeInfo.icon}</span>
                        <span className={`bg-${typeInfo.color}-50 text-${typeInfo.color}-700 px-2 py-1 rounded`}>
                          {typeInfo.name}: {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleViewPluginDetails(plugin)}
                    className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    查看详情
                  </button>
                  <button
                    onClick={() => handleInstallPlugin(plugin)}
                    disabled={plugin.installed || installingPluginId === plugin.meta.id}
                    className={`flex-1 px-3 py-1 text-sm rounded transition-all duration-300 ${
                      plugin.installed
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : installingPluginId === plugin.meta.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                    }`}
                  >
                    {plugin.installed ? '已安装' :
                     installingPluginId === plugin.meta.id ? (
                       <span className="flex items-center justify-center">
                         <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         安装中...
                       </span>
                     ) : '安装'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 渲染插件详情页面
  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => setSelectedPlugin(null)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← 返回插件列表
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{selectedPlugin.meta.name}</h2>
          {selectedPlugin.meta.version && (
            <span className="text-sm bg-zinc-100 text-zinc-600 px-2 py-1 rounded">
              版本 {selectedPlugin.meta.version}
            </span>
          )}
          {selectedPlugin.meta.description && (
            <p className="text-zinc-600 mt-2">{selectedPlugin.meta.description}</p>
          )}
        </div>

        {Object.keys(selectedPlugin.capabilities || {}).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(selectedPlugin.capabilities).map(([type, items]) => {
              if (!items || (typeof items === 'object' && Object.keys(items).length === 0)) return null;
              const typeInfo = getCapabilityTypeInfo(type);

              return (
                <div key={type}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>{typeInfo.icon}</span>
                    {typeInfo.name}
                  </h3>

                  {Array.isArray(items) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item: any) => (
                        <div
                          key={item.name || item}
                          className="flex items-center justify-between p-3 bg-zinc-50 rounded hover:bg-zinc-100"
                        >
                          <div className="font-medium">{item.name || item}</div>
                          <button
                            onClick={() => handleDownloadCapability(selectedPlugin, type, item.name || item)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            下载到能力库
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : typeof items === 'object' && (
                    <div className="space-y-2">
                      {Object.entries(items).map(([name, path]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between p-3 bg-zinc-50 rounded hover:bg-zinc-100"
                        >
                          <div>
                            <div className="font-medium">{name}</div>
                            <div className="text-xs text-zinc-500">{path}</div>
                          </div>
                          <button
                            onClick={() => handleDownloadCapability(selectedPlugin, type, name)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            下载到能力库
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-zinc-500 mb-4">
              📦 安装插件后可查看其包含的能力（Skills、Commands、Agents 等）
            </div>
            <div className="text-sm text-zinc-400">
              插件能力只有在安装到本地后才能查看和使用
            </div>
          </div>
        )}
      </div>
    </div>
  );
}