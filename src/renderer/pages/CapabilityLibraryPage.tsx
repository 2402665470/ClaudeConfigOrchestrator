import { useState, useEffect, useMemo } from 'react';
import { Plugin } from '@common/types';

// 能力类型配置
const capabilityTypes = [
  { type: 'all', label: '全部', icon: '⚡', color: 'bg-gray-100 text-gray-700' },
  { type: 'agents', label: '智能体', icon: '🤖', color: 'bg-blue-100 text-blue-700' },
  { type: 'skills', label: '技能', icon: '🎯', color: 'bg-green-100 text-green-700' },
  { type: 'commands', label: '命令', icon: '💬', color: 'bg-purple-100 text-purple-700' },
  { type: 'hooks', label: '钩子', icon: '🔗', color: 'bg-orange-100 text-orange-700' },
  { type: 'mcpServers', label: 'MCP服务', icon: '🌐', color: 'bg-pink-100 text-pink-700' },
  { type: 'configs', label: '配置', icon: '⚙️', color: 'bg-cyan-100 text-cyan-700' }
];

export default function CapabilityLibraryPage() {
  const [installedPlugins, setInstalledPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCapability, setSelectedCapability] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 加载已安装的插件及其能力详情
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        setLoading(true);
        console.log('[CapabilityLibrary] 开始加载插件...');
        const plugins = await window.electronAPI.getInstalledPlugins('user');
        console.log('[CapabilityLibrary] 已安装插件 (总数:', plugins.length, '):', plugins);

        // 加载每个插件的详情以获取能力信息
        const pluginsWithDetails = await Promise.all(
          plugins.map(async (plugin, index) => {
            console.log(`[CapabilityLibrary] 正在获取第 ${index + 1} 个插件的详情: ${plugin.id}`);
            try {
              const details = await window.electronAPI.getPluginInfo(plugin.id);
              console.log(`[CapabilityLibrary] 插件 ${plugin.id} 详情:`, details);
              console.log(`[CapabilityLibrary] 插件 ${plugin.id} 包含的能力:`, details?.capabilities);
              return {
                ...plugin,
                details
              };
            } catch (error) {
              console.error(`[CapabilityLibrary] 获取插件 ${plugin.id} 详情失败:`, error);
              return plugin;
            }
          })
        );

        console.log('[CapabilityLibrary] 所有插件详情加载完成');
        setInstalledPlugins(pluginsWithDetails);
      } catch (error) {
        console.error('[CapabilityLibrary] 加载插件失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlugins();
  }, []);

  // 聚合所有能力
  const allCapabilities = useMemo(() => {
    const capabilities: any[] = [];

    installedPlugins.forEach(plugin => {
      if (plugin.details?.capabilities) {
        console.log(`[CapabilityLibrary] 插件 ${plugin.id} 的能力:`, plugin.details.capabilities);
        Object.entries(plugin.details.capabilities).forEach(([type, items]: [string, any]) => {
          console.log(`[CapabilityLibrary] 类型 ${type} 的项目数:`, Array.isArray(items) ? items.length : 0);
          if (Array.isArray(items)) {
            items.forEach(item => {
              capabilities.push({
                ...item,
                type,
                pluginId: plugin.id,
                pluginName: plugin.id.split('@')[0],
                pluginVersion: plugin.version,
                pluginScope: plugin.scope,
                installPath: plugin.installPath
              });
            });
          }
        });
      }
    });

    console.log('[CapabilityLibrary] 聚合后的所有能力:', capabilities);
    console.log('[CapabilityLibrary] 各类型的统计:', {
      total: capabilities.length,
      configs: capabilities.filter(c => c.type === 'configs').length,
      skills: capabilities.filter(c => c.type === 'skills').length,
      hooks: capabilities.filter(c => c.type === 'hooks').length,
      agents: capabilities.filter(c => c.type === 'agents').length,
      commands: capabilities.filter(c => c.type === 'commands').length,
      mcpServers: capabilities.filter(c => c.type === 'mcpServers').length,
    });

    return capabilities;
  }, [installedPlugins]);

  // 过滤能力
  const filteredCapabilities = useMemo(() => {
    return allCapabilities.filter(capability => {
      // 类型筛选
      if (selectedCategory !== 'all' && capability.type !== selectedCategory) {
        return false;
      }

      // 搜索筛选
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!capability.name?.toLowerCase().includes(searchLower) &&
            !capability.description?.toLowerCase().includes(searchLower) &&
            !capability.pluginName?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [allCapabilities, searchTerm, selectedCategory]);

  // 处理能力点击
  const handleCapabilityClick = async (capability: any) => {
    // 获取插件信息
    try {
      const pluginInfo = await window.electronAPI.getPluginInfo(capability.pluginId);
      const fullCapability = {
        ...capability,
        pluginInfo
      };
      setSelectedCapability(fullCapability);
      setShowDetailModal(true);
    } catch (error) {
      console.error('[CapabilityLibrary] 获取插件详情失败:', error);
      // 即使获取失败，也显示基本信息
      setSelectedCapability(capability);
      setShowDetailModal(true);
    }
  };

  // 统计信息
  const stats = useMemo(() => {
    const marketplaceCount = new Set(installedPlugins.map(p => p.id.split('@')[1])).size;
    const capabilityCount = allCapabilities.length;
    const capabilityTypeCount = new Set(allCapabilities.map(c => c.type)).size;

    return {
      total: installedPlugins.length,
      marketplaces: marketplaceCount,
      capabilities: capabilityCount,
      types: capabilityTypeCount
    };
  }, [installedPlugins, allCapabilities]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题和统计 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">能力库</h1>
              <p className="mt-2 text-gray-600">查看和管理已安装的所有插件能力</p>
            </div>
            <div className="flex gap-4 text-center">
              <div className="px-4 py-2 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">已安装插件</div>
              </div>
              <div className="px-4 py-2 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.capabilities}</div>
                <div className="text-sm text-gray-600">可用能力</div>
              </div>
              <div className="px-4 py-2 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.types}</div>
                <div className="text-sm text-gray-600">能力类型</div>
              </div>
              <div className="px-4 py-2 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.marketplaces}</div>
                <div className="text-sm text-gray-600">市场来源</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="搜索能力名称、描述或插件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* 类型筛选 */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {capabilityTypes.map((type) => {
              const config = capabilityTypes.find(t => t.type === type.type);
              const isActive = selectedCategory === type.type;
              const count = type.type === 'all'
                ? allCapabilities.length
                : allCapabilities.filter(c => c.type === type.type).length;

              return (
                <button
                  key={type.type}
                  onClick={() => setSelectedCategory(type.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? config?.color || 'bg-gray-100 text-gray-700'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{config?.icon}</span>
                  <span className="font-medium">{config?.label}</span>
                  <span className="text-xs bg-white bg-opacity-50 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 能力列表 */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-gray-500">加载能力列表中...</div>
          </div>
        ) : filteredCapabilities.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-gray-500">没有找到匹配的能力</div>
            <button
              className="mt-4 text-blue-600 hover:text-blue-700"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCapabilities.map((capability, index) => {
              const typeConfig = capabilityTypes.find(t => t.type === capability.type);
              return (
                <div
                  key={`${capability.pluginId}-${capability.type}-${index}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
                  onClick={() => handleCapabilityClick(capability)}
                >
                  {/* 能力类型标签 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      typeConfig?.color || 'bg-gray-100 text-gray-700'
                    }`}>
                      <span>{typeConfig?.icon}</span>
                      <span>{typeConfig?.label}</span>
                    </span>
                  </div>

                  {/* 能力名称 */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {capability.name}
                  </h3>

                  {/* 能力描述 */}
                  {capability.description && (
                    <p
                      className="text-sm text-gray-600 mb-3 overflow-hidden"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {capability.description}
                    </p>
                  )}

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{capability.pluginName}</span>
                    <span>v{capability.pluginVersion}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 能力详情弹窗 */}
        {showDetailModal && selectedCapability && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                {/* 弹窗头部 */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedCapability.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                        capabilityTypes.find(t => t.type === selectedCapability.type)?.color || 'bg-gray-100 text-gray-700'
                      }`}>
                        <span>{capabilityTypes.find(t => t.type === selectedCapability.type)?.icon}</span>
                        <span>{capabilityTypes.find(t => t.type === selectedCapability.type)?.label}</span>
                      </span>
                      <span className="text-gray-600">
                        来自 {selectedCapability.pluginName} v{selectedCapability.pluginVersion}
                      </span>
                    </div>
                  </div>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    onClick={() => setShowDetailModal(false)}
                  >
                    <span className="text-lg">❌</span>
                  </button>
                </div>

                {/* 能力描述 */}
                {selectedCapability.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">能力描述</h3>
                    <p className="text-gray-700">{selectedCapability.description}</p>
                  </div>
                )}

                {/* 配置预览 */}
                {selectedCapability.type === 'configs' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">配置预览</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {selectedCapability.preview?.env && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">环境变量</h4>
                          <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono">
                            {Object.entries(selectedCapability.preview.env).map(([key, value]) => (
                              <div key={key} className="mb-1">
                                <span className="text-blue-400">{key}</span>
                                <span className="mx-2">=</span>
                                <span className="text-green-400">"{value}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedCapability.preview?.settings && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">其他设置</h4>
                          <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono">
                            {Object.entries(selectedCapability.preview.settings).map(([key, value]) => (
                              <div key={key} className="mb-1">
                                <span className="text-blue-400">{key}</span>
                                <span className="mx-2">:</span>
                                <span className="text-yellow-300">{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 插件信息 */}
                {selectedCapability.pluginInfo && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">插件信息</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">插件名称:</span>
                          <span className="ml-2 font-medium">{selectedCapability.pluginName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">版本:</span>
                          <span className="ml-2 font-medium">{selectedCapability.pluginVersion}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">作用域:</span>
                          <span className="ml-2 font-medium capitalize">{selectedCapability.pluginScope || 'user'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">安装路径:</span>
                          <span className="ml-2 font-medium truncate">{selectedCapability.installPath}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 插件包含的其他能力 */}
                {selectedCapability.pluginInfo?.capabilities && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">插件包含的其他能力</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedCapability.pluginInfo.capabilities).map(([type, items]: [string, any]) => {
                        if (!Array.isArray(items) || items.length === 0) return null;
                        return (
                          <div key={type} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-700 mb-2 capitalize">
                              {type} ({items.length})
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {items.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    • {item.name || item}
                                  </span>
                                  {item.description && (
                                    <span className="text-gray-500 truncate ml-2 max-w-xs">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 安装时间 */}
                {selectedCapability.installedAt && (
                  <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                    安装时间: {new Date(selectedCapability.installedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}