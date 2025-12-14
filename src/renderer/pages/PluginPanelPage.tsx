import { useState, useEffect } from 'react';
import ImprovedPluginDetailModal from '../components/ImprovedPluginDetailModal';

// 插件类型定义
interface PluginLibrary {
  plugins: PluginDetail[];
  totalPlugins: number;
  totalCapabilities: {
    agents: number;
    commands: number;
    hooks: number;
    skills: number;
    mcpServers: number;
  };
}

interface PluginDetail {
  id: string;              // feature-dev@claude-code-plugins
  name: string;            // feature-dev
  marketplace: string;     // claude-code-plugins
  version: string;
  scope: 'user' | 'project';
  installPath: string;
  installedAt: string;
  metadata?: {
    name: string;
    version: string;
    description: string;
    author?: {
      name: string;
      email: string;
    };
    homepage?: string;
    repository?: string;
  };
  capabilities: {
    agents?: Array<{
      name: string;
      description: string;
      content?: string;
      type: string;
    }>;
    commands?: Array<{
      name: string;
      description: string;
      content?: string;
      examples?: string[];
    }>;
    hooks?: Array<{
      name: string;
      description: string;
      events: string[];
    }>;
    skills?: Array<{
      name: string;
      description: string;
      triggers: string[];
    }>;
    mcpServers?: Array<{
      name: string;
      description: string;
      config: any;
    }>;
  };
  stats: {
    totalCapabilities: number;
    capabilitiesByType: Record<string, number>;
  };
}

// 能力类型图标
const capabilityIcons = {
  agents: '🤖',
  commands: '💬',
  hooks: '🔗',
  skills: '🎯',
  mcpServers: '🌐'
};

export default function PluginPanelPage() {
  const [pluginLibrary, setPluginLibrary] = useState<PluginLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPluginLibrary();
  }, []);

  const loadPluginLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PluginPanel] 开始加载插件库...');
      const library = await window.electronAPI.getPluginLibrary();
      console.log('[PluginPanel] 插件库加载成功:', library);
      setPluginLibrary(library);
    } catch (error: any) {
      console.error('[PluginPanel] 加载插件库失败:', error);
      setError(error.message || '加载插件库失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤插件
  const filteredPlugins = pluginLibrary?.plugins.filter(plugin => {
    const searchLower = searchTerm.toLowerCase();
    return (
      plugin.name.toLowerCase().includes(searchLower) ||
      plugin.metadata?.description?.toLowerCase().includes(searchLower) ||
      plugin.marketplace.toLowerCase().includes(searchLower)
    );
  }) || [];

  // 获取能力图标和颜色
  const getCapabilityStyle = (type: string) => {
    const styles: Record<string, { icon: string; color: string }> = {
      agents: { icon: '🤖', color: 'bg-blue-100 text-blue-700' },
      commands: { icon: '💬', color: 'bg-purple-100 text-purple-700' },
      hooks: { icon: '🔗', color: 'bg-orange-100 text-orange-700' },
      skills: { icon: '🎯', color: 'bg-green-100 text-green-700' },
      mcpServers: { icon: '🌐', color: 'bg-pink-100 text-pink-700' }
    };
    return styles[type] || { icon: '⚡', color: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>正在加载插件库...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">加载失败: {error}</p>
          <button
            onClick={loadPluginLibrary}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="plugin-panel h-full">
      {/* 头部统计 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">插件面板</h1>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-3xl font-bold text-black">{pluginLibrary?.totalPlugins}</span>
                <p className="text-gray-600 text-sm mt-1">总插件数</p>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div className="flex items-center space-x-4">
                {Object.entries(pluginLibrary?.totalCapabilities || {}).map(([type, count]) => {
                  const style = getCapabilityStyle(type);
                  return (
                    <div key={type} className="flex items-center space-x-2">
                      <span className="text-2xl">{style.icon}</span>
                      <div>
                        <span className="font-semibold">{count}</span>
                        <p className="text-xs text-gray-600 capitalize">{type}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索插件名称或描述..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* 插件网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            onClick={() => setSelectedPlugin(plugin)}
          />
        ))}
      </div>

      {/* 插件详情模态框 */}
      {selectedPlugin && (
        <ImprovedPluginDetailModal
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          getCapabilityStyle={getCapabilityStyle}
        />
      )}
    </div>
  );
}

// 插件卡片组件
function PluginCard({ plugin, onClick }: { plugin: PluginDetail; onClick: () => void }) {
  return (
    <div
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{plugin.name}</h3>
          <p className="text-sm text-gray-500">{plugin.marketplace}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          plugin.scope === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {plugin.scope}
        </span>
      </div>

      {plugin.metadata?.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {plugin.metadata.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>v{plugin.version}</span>
        <span>{plugin.stats.totalCapabilities} 个能力</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(plugin.stats.capabilitiesByType).map(([type, count]) => {
          const icons = {
            agents: '🤖',
            commands: '💬',
            hooks: '🔗',
            skills: '🎯',
            mcpServers: '🌐'
          };
          return (
            <span
              key={type}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              {icons[type as keyof typeof icons]} {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// 原始的 PluginDetailModal 组件已被 ImprovedPluginDetailModal 替代