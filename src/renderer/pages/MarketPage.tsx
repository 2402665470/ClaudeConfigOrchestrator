import React, { useEffect, useState } from 'react';
import { useAppStore } from '@renderer/stores/app';
import { ConflictInfo, InstallationResult, Plugin } from '@common/types';
import { ConflictDialog } from '@renderer/components/ConflictDialog';

export default function MarketPage() {
  const { data, plugins, setPlugins, loading, setLoading } = useAppStore();
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [targetProject, setTargetProject] = useState<string>('');
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [installResult, setInstallResult] = useState<InstallationResult | null>(null);

  useEffect(() => {
    if (!data.marketPath) return;
    setLoading(true);
    window.electronAPI.scanMarket(data.marketPath).then((list) => {
      setPlugins(list);
      setLoading(false);
    });
  }, [data.marketPath]);

  const handleInstallPlugin = async (plugin: Plugin, projectPath: string) => {
    setLoading(true);
    const result = await window.electronAPI.installPlugin(plugin, projectPath);
    
    if (!result.success) {
      if (result.conflicts) {
        setConflicts(result.conflicts);
        setSelectedPlugin(plugin);
        setTargetProject(projectPath);
      } else {
        alert(`安装失败: ${result.error}`);
      }
    } else {
      setInstallResult(result);
      alert(`插件安装成功！安装了 ${result.installedCapabilities?.length || 0} 个功能。`);
    }
    setLoading(false);
  };

  const handleConflictResolution = async (strategy: 'overwrite' | 'skip' | 'cancel') => {
    setConflicts([]);
    
    if (strategy === 'cancel' || !selectedPlugin || !targetProject) {
      setSelectedPlugin(null);
      setTargetProject('');
      return;
    }

    setLoading(true);
    const result = await window.electronAPI.installPlugin(
      selectedPlugin, 
      targetProject, 
      { 
        forceOverwrite: strategy === 'overwrite',
        skipConflicts: strategy === 'skip'
      }
    );

    if (result.success) {
      setInstallResult(result);
      alert(`插件安装成功！安装了 ${result.installedCapabilities?.length || 0} 个功能。`);
    } else {
      alert(`安装失败: ${result.error}`);
    }
    
    setSelectedPlugin(null);
    setTargetProject('');
    setLoading(false);
  };

  if (!data.marketPath) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">插件市场</h2>
        <p className="text-sm text-zinc-500">请先前往「设置」配置本地插件目录。</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">插件市场</h2>
      
      {conflicts.length > 0 && selectedPlugin && (
        <ConflictDialog
          conflicts={conflicts}
          onResolve={handleConflictResolution}
        />
      )}
      
      {loading ? (
        <div className="text-sm text-zinc-500">扫描中…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plugins.map((p) => (
            <div key={p.meta.id} className="bg-white border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{p.meta.name}</h3>
                {p.meta.version && (
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded">{p.meta.version}</span>
                )}
              </div>
              {p.meta.description && (
                <p className="text-sm text-zinc-600 mb-2">{p.meta.description}</p>
              )}
              {p.meta.tags?.length ? (
                <div className="flex gap-2 flex-wrap mb-3">
                  {p.meta.tags.map((t) => (
                    <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  {p.capabilities.skills && Object.keys(p.capabilities.skills).length > 0 && (
                    <div>技能: {Object.keys(p.capabilities.skills).join(', ')}</div>
                  )}
                  {p.capabilities.mcpServers && Object.keys(p.capabilities.mcpServers).length > 0 && (
                    <div>MCP服务器: {Object.keys(p.capabilities.mcpServers).join(', ')}</div>
                  )}
                  {p.capabilities.hooks && Object.keys(p.capabilities.hooks).length > 0 && (
                    <div>钩子: {Object.keys(p.capabilities.hooks).join(', ')}</div>
                  )}
                  {p.capabilities.files && p.capabilities.files.length > 0 && (
                    <div>文件: {p.capabilities.files.length} 个</div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <select
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    onChange={(e) => setTargetProject(e.target.value)}
                    value={targetProject}
                  >
                    <option value="">选择目标项目</option>
                    {data.projects.map((project) => (
                      <option key={project.id} value={project.path}>
                        {project.alias}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => targetProject && handleInstallPlugin(p, targetProject)}
                    disabled={!targetProject || loading}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    安装
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}