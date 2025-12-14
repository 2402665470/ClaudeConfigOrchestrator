import React, { useState, useEffect } from 'react';
import DescriptionToggle from './DescriptionToggle';
import DescriptionEditor from './DescriptionEditor';

// 可展开文本组件
const ExpandableText = ({
  children,
  maxLines = 3,
  className = ""
}: {
  children: React.ReactNode;
  maxLines?: number;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={className}>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? '' : `line-clamp-${maxLines}`
        }`}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : maxLines,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {children}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-flex items-center"
      >
        {isExpanded ? '收起' : '展开'}
        <svg
          className={`ml-1 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
};

// 代码块组件（带复制功能）
const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code className="text-sm font-mono">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? '已复制!' : '复制'}
      </button>
    </div>
  );
};

interface PluginDetail {
  id: string;
  name: string;
  marketplace: string;
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

interface Props {
  plugin: PluginDetail;
  onClose: () => void;
  getCapabilityStyle: (type: string) => { icon: string; color: string };
  pluginCustomDescription?: string | null;
}

export default function ImprovedPluginDetailModal({
  plugin,
  onClose,
  getCapabilityStyle,
  pluginCustomDescription: initialCustomDescription
}: Props) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [pluginCustomDescription, setPluginCustomDescription] = useState<string | null>(initialCustomDescription || null);
  const [isEditingPluginDesc, setIsEditingPluginDesc] = useState(false);
  const [capabilityCustomDescriptions, setCapabilityCustomDescriptions] = useState<Record<string, string | null>>({});
  const [editingCapability, setEditingCapability] = useState<{ id: string; name: string; type: string; description: string } | null>(null);

  // 加载插件自定义描述
  useEffect(() => {
    const loadPluginDescription = async () => {
      try {
        // 优先使用传入的自定义描述，如果没有则从API加载
        const customDesc = initialCustomDescription || await window.electronAPI.getPluginDescription?.(plugin.id);
        setPluginCustomDescription(customDesc);
      } catch (error) {
        console.error('Failed to load plugin custom description:', error);
      }
    };
    loadPluginDescription();
  }, [plugin.id, initialCustomDescription]);

  // 加载能力的自定义描述
  useEffect(() => {
    const loadCapabilityDescriptions = async () => {
      try {
        // 收集所有能力的ID
        const allCapabilityIds: string[] = [];

        Object.entries(plugin.capabilities).forEach(([type, items]) => {
          if (items && items.length > 0) {
            items.forEach((item: any) => {
              // 生成能力ID：pluginId:type:name
              const capabilityId = `${plugin.id}:${type}:${item.name}`;
              allCapabilityIds.push(capabilityId);
            });
          }
        });

        if (allCapabilityIds.length > 0) {
          // 批量获取自定义描述
          const descriptions = await window.electronAPI.getBatchDescriptions?.(allCapabilityIds, 'capability');
          setCapabilityCustomDescriptions(descriptions || {});
        }
      } catch (error) {
        console.error('Failed to load capability custom descriptions:', error);
      }
    };
    loadCapabilityDescriptions();
  }, [plugin.id, plugin.capabilities]);

  // 保存插件自定义描述
  const handleSavePluginDescription = async (description: string) => {
    try {
      const result = await window.electronAPI.setPluginDescription?.(plugin.id, description);
      if (result?.success) {
        setPluginCustomDescription(description);
        setIsEditingPluginDesc(false);
      } else {
        alert('保存失败: ' + result?.error);
      }
    } catch (error) {
      console.error('Failed to save plugin description:', error);
      alert('保存失败');
    }
  };

  // 删除插件自定义描述
  const handleDeletePluginDescription = async () => {
    try {
      const result = await window.electronAPI.deletePluginDescription?.(plugin.id);
      if (result?.success) {
        setPluginCustomDescription(null);
        setIsEditingPluginDesc(false);
      } else {
        alert('删除失败: ' + result?.error);
      }
    } catch (error) {
      console.error('Failed to delete plugin description:', error);
      alert('删除失败');
    }
  };

  // 开始编辑能力描述
  const handleEditCapability = (type: string, item: any) => {
    const capabilityId = `${plugin.id}:${type}:${item.name}`;
    setEditingCapability({
      id: capabilityId,
      name: item.name,
      type: type,
      description: item.description || ''
    });
  };

  // 保存能力自定义描述
  const handleSaveCapabilityDescription = async (capabilityId: string, description: string) => {
    try {
      const result = await window.electronAPI.setCapabilityDescription?.(capabilityId, description);
      if (result?.success) {
        setCapabilityCustomDescriptions(prev => ({
          ...prev,
          [capabilityId]: description
        }));
        setEditingCapability(null);
      } else {
        alert('保存失败: ' + result?.error);
      }
    } catch (error) {
      console.error('Failed to save capability description:', error);
      alert('保存失败');
    }
  };

  // 删除能力自定义描述
  const handleDeleteCapabilityDescription = async (capabilityId: string) => {
    try {
      const result = await window.electronAPI.deleteCapabilityDescription?.(capabilityId);
      if (result?.success) {
        setCapabilityCustomDescriptions(prev => {
          const newDesc = { ...prev };
          delete newDesc[capabilityId];
          return newDesc;
        });
        setEditingCapability(null);
      } else {
        alert('删除失败: ' + result?.error);
      }
    } catch (error) {
      console.error('Failed to delete capability description:', error);
      alert('删除失败');
    }
  };

  // 过滤有内容的类型
  const availableTypes = Object.entries(plugin.capabilities)
    .filter(([_, items]) => items && items.length > 0)
    .map(([type, items]) => ({ type, count: items.length }));

  const tabs = [
    { id: 'all', label: '全部', count: plugin.stats.totalCapabilities },
    ...availableTypes.map(({ type, count }) => ({
      id: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count
    }))
  ];

  // 过滤内容
  const filteredCapabilities = activeTab === 'all'
    ? plugin.capabilities
    : { [activeTab]: plugin.capabilities[activeTab as keyof typeof plugin.capabilities] };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* 固定头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-start justify-between bg-gradient-to-b from-white to-gray-50">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
              {plugin.name}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                plugin.scope === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {plugin.scope === 'user' ? '用户级' : '项目级'}
              </span>
            </h2>
            <p className="text-gray-500 text-sm font-mono bg-gray-100 px-3 py-1 rounded inline-block">
              {plugin.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            {/* 插件基本信息卡片 */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl p-8 mb-8 border border-gray-200 shadow-sm">
              {/* 插件描述部分 */}
              <div className="mb-8">
                {isEditingPluginDesc ? (
                  <DescriptionEditor
                    type="plugin"
                    id={plugin.id}
                    originalDescription={plugin.metadata?.description || ''}
                    customDescription={pluginCustomDescription}
                    onSave={handleSavePluginDescription}
                    onCancel={() => setIsEditingPluginDesc(false)}
                    onDelete={pluginCustomDescription ? handleDeletePluginDescription : undefined}
                  />
                ) : (
                  <>
                    {plugin.metadata?.description || pluginCustomDescription ? (
                      <DescriptionToggle
                        originalDescription={plugin.metadata?.description || ''}
                        customDescription={pluginCustomDescription}
                        onEdit={() => setIsEditingPluginDesc(true)}
                      />
                    ) : (
                      <div className="text-gray-500 italic mb-4">
                        <span>暂无描述</span>
                        <button
                          onClick={() => setIsEditingPluginDesc(true)}
                          className="ml-2 text-blue-600 hover:text-blue-700"
                        >
                          添加自定义描述
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">版本</p>
                  <p className="text-2xl font-black text-gray-900">{plugin.version}</p>
                </div>
                <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">市场</p>
                  <p className="text-lg font-bold text-gray-900">{plugin.marketplace}</p>
                </div>
                <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">能力数量</p>
                  <p className="text-2xl font-black text-gray-900">{plugin.stats.totalCapabilities}</p>
                </div>
                <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">安装时间</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(plugin.installedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* 能力统计概览 */}
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">能力分布</h3>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(plugin.stats.capabilitiesByType).map(([type, count]) => {
                    const style = getCapabilityStyle(type);
                    return (
                      <div key={type} className={`${style.color} px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm`}>
                        <span className="text-xl">{style.icon}</span>
                        <div>
                          <span className="font-black text-lg">{count}</span>
                          <span className="text-sm ml-1 capitalize">{type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 标签导航 */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* 详细能力列表 */}
            <div className="space-y-6">
              {Object.entries(filteredCapabilities).map(([type, items]) => {
                if (!items || items.length === 0) return null;
                const style = getCapabilityStyle(type);
                const itemsArray = Array.isArray(items) ? items : [];

                return (
                  <div key={type}>
                    <div className="flex items-center mb-6">
                      <span className="text-3xl mr-3">{style.icon}</span>
                      <h3 className="text-2xl font-black text-gray-900 capitalize">{type}</h3>
                      <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {itemsArray.length} 项
                      </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {itemsArray.map((item: any, index: number) => (
                        <div key={index} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <h4 className="font-black text-xl text-gray-900">{item.name}</h4>
                              {(item as any).type && (
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                  {(item as any).type}
                                </span>
                              )}
                            </div>

                            <DescriptionToggle
                              originalDescription={item.description || ''}
                              customDescription={capabilityCustomDescriptions[`${plugin.id}:${type}:${item.name}`]}
                              onEdit={() => handleEditCapability(type, item)}
                            />

                            {/* 示例命令 */}
                            {(item as any).examples && (item as any).examples.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">示例命令</p>
                                <div className="space-y-3">
                                  {(item as any).examples.slice(0, 2).map((example: string, idx: number) => (
                                    <CodeBlock key={idx} code={example} />
                                  ))}
                                  {(item as any).examples.length > 2 && (
                                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                      查看更多示例 ({(item as any).examples.length - 2} 个)
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 触发短语 */}
                            {(item as any).triggers && (item as any).triggers.length > 0 && (
                              <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">触发短语</p>
                                <div className="flex flex-wrap gap-2">
                                  {(item as any).triggers.map((trigger: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                                    >
                                      "{trigger}"
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 事件列表 */}
                            {(item as any).events && (item as any).events.length > 0 && (
                              <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">触发事件</p>
                                <div className="space-y-2">
                                  {(item as any).events.map((event: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      <span className="text-sm font-mono text-gray-700">{event}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 能力描述编辑模态框 */}
        {editingCapability && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">
                编辑能力描述 - {editingCapability.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                类型: {editingCapability.type} | ID: {editingCapability.id}
              </p>
              <DescriptionEditor
                type="capability"
                id={editingCapability.id}
                originalDescription={editingCapability.description}
                customDescription={capabilityCustomDescriptions[editingCapability.id]}
                onSave={(desc) => handleSaveCapabilityDescription(editingCapability.id, desc)}
                onCancel={() => setEditingCapability(null)}
                onDelete={capabilityCustomDescriptions[editingCapability.id]
                  ? () => handleDeleteCapabilityDescription(editingCapability.id)
                  : undefined
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}