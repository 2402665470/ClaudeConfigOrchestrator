import { useState, useEffect } from 'react';

interface Marketplace {
  name: string;
  source: {
    source: string;
    repo: string;
  };
  installLocation: string;
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

interface Plugin {
  meta: {
    id: string;
    name: string;
    description?: string;
    version?: string;
  };
}

export default function MarketplacePage() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMarketplace, setNewMarketplace] = useState('');

  useEffect(() => {
    loadMarketplaces();
    loadPlugins();
  }, []);

  const loadMarketplaces = async () => {
    try {
      const result = await window.electronAPI.getMarketplaces();
      setMarketplaces(result);
    } catch (error) {
      console.error('Failed to load marketplaces:', error);
    }
  };

  const loadPlugins = async () => {
    try {
      const result = await window.electronAPI.scanMarket();
      setPlugins(result);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  };

  const handleAddMarketplace = async () => {
    if (!newMarketplace.trim()) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.addMarketplace(newMarketplace);
      if (result.success) {
        alert('Marketplace 添加成功！');
        setNewMarketplace('');
        loadMarketplaces();
      } else {
        alert(`添加失败: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to add marketplace:', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallPlugin = async (plugin: Plugin) => {
    // 从插件 ID 中解析名称和 marketplace
    const [name, marketplace] = plugin.meta.id.split('@');

    if (!confirm(`确定要安装插件 "${name}" 吗？`)) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.installPlugin(name, marketplace || 'default', 'user');
      if (result.success) {
        alert('插件安装成功！');
        loadPlugins(); // 重新加载插件列表
      } else {
        alert(`安装失败: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
      alert('安装失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMarketplace = async (marketplaceName?: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.updateMarketplace(marketplaceName);
      if (result.success) {
        alert('Marketplace 更新成功！');
        loadMarketplaces();
        loadPlugins();
      } else {
        alert(`更新失败: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to update marketplace:', error);
      alert('更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">插件市场</h1>

      {/* 添加新的 Marketplace */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">添加 Marketplace</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border px-3 py-2 rounded"
            placeholder="输入仓库地址 (如: udecode/dotai)"
            value={newMarketplace}
            onChange={(e) => setNewMarketplace(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            onClick={handleAddMarketplace}
            disabled={loading || !newMarketplace.trim()}
          >
            添加
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          支持 GitHub 仓库格式: owner/repo 或完整的 URL
        </p>
      </div>

      {/* Marketplaces 列表 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">已配置的 Marketplaces</h2>
          <button
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => handleUpdateMarketplace()}
            disabled={loading}
          >
            全部更新
          </button>
        </div>
        <div className="grid gap-3">
          {marketplaces.map((marketplace) => (
            <div key={marketplace.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{marketplace.name}</h3>
                <p className="text-sm text-gray-600">{marketplace.source.repo}</p>
                <p className="text-xs text-gray-500">
                  {marketplace.plugins.length} 个插件 · 最后更新: {new Date(marketplace.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <button
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => handleUpdateMarketplace(marketplace.name)}
                disabled={loading}
              >
                更新
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 插件列表 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">可用插件</h2>
        {plugins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>暂无可用的插件</p>
            <p className="text-sm">请先添加并更新 Marketplace</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plugins.map((plugin) => (
              <div key={plugin.meta.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{plugin.meta.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{plugin.meta.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">v{plugin.meta.version || 'N/A'}</span>
                    {plugin.installed && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ 已安装
                      </span>
                    )}
                  </div>
                  <button
                    className={`px-3 py-1 text-sm rounded ${
                      plugin.installed
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                    onClick={() => handleInstallPlugin(plugin)}
                    disabled={loading || plugin.installed}
                  >
                    {plugin.installed ? '已安装' : '安装'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}