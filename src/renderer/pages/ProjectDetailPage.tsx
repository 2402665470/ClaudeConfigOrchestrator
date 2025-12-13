import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '@renderer/stores/app';
import { Plugin, ConflictInfo, InstallationResult } from '@common/types';
import { ConflictDialog } from '@renderer/components/ConflictDialog';
import { Settings, Server, Zap, File } from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, plugins } = useAppStore();
  const project = data.projects.find((p) => p.id === id);
  const [installed, setInstalled] = useState<any>(null);
  const [selected, setSelected] = useState<Plugin | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [installResult, setInstallResult] = useState<InstallationResult | null>(null);

  useEffect(() => {
    if (!project) return;
    window.electronAPI.inspectProject(project.path).then(setInstalled);
  }, [project]);

  if (!project) return <div className="p-6">项目不存在</div>;

  const handleInstall = async () => {
    if (!selected || !project) return;
    
    const result = await window.electronAPI.installPlugin(selected, project.path);
    
    if (!result.success) {
      if (result.conflicts) {
        setConflicts(result.conflicts);
      } else {
        alert(`安装失败: ${result.error}`);
      }
    } else {
      setInstallResult(result);
      alert(`插件安装成功！安装了 ${result.installedCapabilities?.length || 0} 个功能。`);
      // 刷新项目配置
      window.electronAPI.inspectProject(project.path).then(setInstalled);
    }
  };

  const handleConflictResolution = async (strategy: 'overwrite' | 'skip' | 'cancel') => {
    setConflicts([]);
    
    if (strategy === 'cancel' || !selected || !project) {
      setSelected(null);
      return;
    }

    const result = await window.electronAPI.installPlugin(
      selected, 
      project.path, 
      { 
        forceOverwrite: strategy === 'overwrite',
        skipConflicts: strategy === 'skip'
      }
    );

    if (result.success) {
      setInstallResult(result);
      alert(`插件安装成功！安装了 ${result.installedCapabilities?.length || 0} 个功能。`);
      // 刷新项目配置
      window.electronAPI.inspectProject(project.path).then(setInstalled);
    } else {
      alert(`安装失败: ${result.error}`);
    }
    
    setSelected(null);
  };

  const renderCapabilitySection = (title: string, capabilities: Record<string, any>, icon: React.ReactNode) => {
    if (!capabilities || Object.keys(capabilities).length === 0) return null;
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <div className="space-y-1">
          {Object.entries(capabilities).map(([key, config]) => (
            <div key={key} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <div className="font-medium">{key}</div>
              <div className="text-xs text-gray-500">
                {config.enabled !== undefined && `启用: ${config.enabled ? '是' : '否'}`}
                {config.command && `命令: ${config.command}`}
                {config.entry && `入口: ${config.entry}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {conflicts.length > 0 && selected && (
        <ConflictDialog
          conflicts={conflicts}
          onResolve={handleConflictResolution}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h3 className="text-lg font-semibold mb-3">当前配置</h3>
          {installed ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-4">
              {renderCapabilitySection('技能', installed.skills, <Settings className="w-4 h-4" />)}
              {renderCapabilitySection('MCP服务器', installed.mcpServers, <Server className="w-4 h-4" />)}
              {renderCapabilitySection('钩子', installed.hooks, <Zap className="w-4 h-4" />)}
              {installed.docker?.services && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 text-blue-500">🐳</div>
                    <h4 className="font-medium text-gray-900">Docker服务</h4>
                  </div>
                  <div className="space-y-1">
                    {installed.docker.services.map((service: any) => (
                      <div key={service.name} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <div className="font-medium">{service.name}</div>
                        <div className="text-xs text-gray-500">
                          {service.image && `镜像: ${service.image}`}
                          {service.build && `构建: ${service.build}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!installed.skills && !installed.mcpServers && !installed.hooks && !installed.docker?.services && (
                <div className="text-sm text-gray-500 text-center py-8">
                  暂无配置
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">加载中...</div>
          )}
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-3">选择插件</h3>
          <div className="space-y-2 max-h-96 overflow-auto">
            {plugins.map((p) => (
              <div
                key={p.meta.id}
                onClick={() => setSelected(p)}
                className={`p-3 border rounded cursor-pointer ${
                  selected?.meta.id === p.meta.id ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="font-medium">{p.meta.name}</div>
                <div className="text-sm text-zinc-500">{p.meta.description}</div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {p.capabilities.skills && Object.keys(p.capabilities.skills).length > 0 && (
                    <div>技能: {Object.keys(p.capabilities.skills).join(', ')}</div>
                  )}
                  {p.capabilities.mcpServers && Object.keys(p.capabilities.mcpServers).length > 0 && (
                    <div>MCP: {Object.keys(p.capabilities.mcpServers).join(', ')}</div>
                  )}
                  {p.capabilities.hooks && Object.keys(p.capabilities.hooks).length > 0 && (
                    <div>钩子: {Object.keys(p.capabilities.hooks).join(', ')}</div>
                  )}
                  {p.capabilities.files && p.capabilities.files.length > 0 && (
                    <div>文件: {p.capabilities.files.length} 个</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleInstall}
            disabled={!selected}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700"
          >
            安装
          </button>
          
          {installResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="text-sm text-green-800 font-medium">安装成功</div>
              <div className="text-xs text-green-600">
                安装了 {installResult.installedCapabilities?.length || 0} 个功能
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}