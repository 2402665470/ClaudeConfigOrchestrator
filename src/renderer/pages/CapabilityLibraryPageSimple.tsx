import { useState, useEffect } from 'react';

export default function CapabilityLibraryPageSimple() {
  const [installedPlugins, setInstalledPlugins] = useState<any[]>([]);

  useEffect(() => {
    // 简单加载已安装的插件列表
    const loadPlugins = async () => {
      try {
        const plugins = await window.electronAPI.getInstalledPlugins('user');
        console.log('已安装插件:', plugins);
        setInstalledPlugins(plugins);
      } catch (error) {
        console.error('加载插件失败:', error);
      }
    };

    loadPlugins();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">能力库</h1>
          <p className="mt-2 text-gray-600">查看和管理已安装的所有能力</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 插件列表 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">已安装的插件 ({installedPlugins.length})</h2>

          {installedPlugins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">加载插件列表中...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedPlugins.map((plugin) => {
                const [name] = plugin.id.split('@');
                return (
                  <div key={plugin.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{plugin.id}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        v{plugin.version}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {plugin.scope || 'user'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}