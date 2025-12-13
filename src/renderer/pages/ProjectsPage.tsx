import React, { useEffect, useState } from 'react';
import { useAppStore } from '@renderer/stores/app';
import { Plus, Folder, ArrowRight, Search, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProjectsPage() {
  const { data, setData } = useAppStore();
  const [search, setSearch] = useState('');
  const [projectConfigs, setProjectConfigs] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  const filtered = data.projects.filter((p) =>
    p.alias.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // 加载所有项目的配置信息
    const loadConfigs = async () => {
      const configs: Record<string, any> = {};
      for (const project of data.projects) {
        try {
          const config = await window.electronAPI.inspectProject(project.path);
          configs[project.id] = config;
        } catch (error) {
          console.error(`加载项目配置失败: ${project.alias}`, error);
        }
      }
      setProjectConfigs(configs);
    };

    if (data.projects.length > 0) {
      loadConfigs();
    }
  }, [data.projects]);

  const handleAdd = async () => {
    const dir = await window.electronAPI.selectFolder();
    if (!dir) return;
    const cfg = await window.electronAPI.inspectProject(dir);
    const alias = cfg?.name || dir.split(/[/\\]/).pop() || '未命名项目';
    const next: typeof data = {
      ...data,
      projects: [
        ...data.projects,
        { id: crypto.randomUUID(), alias, path: dir, description: cfg?.description }
      ]
    };
    await window.electronAPI.setData(next);
    setData(next);
    
    // 加载新项目的配置
    const newConfig = await window.electronAPI.inspectProject(dir);
    setProjectConfigs(prev => ({ ...prev, [next.projects[next.projects.length - 1].id]: newConfig }));
  };

  const handleRemove = async (projectId: string) => {
    if (confirm('确定要删除这个项目吗？')) {
      const next = {
        ...data,
        projects: data.projects.filter(p => p.id !== projectId)
      };
      await window.electronAPI.setData(next);
      setData(next);
      
      // 从配置缓存中移除
      setProjectConfigs(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
    }
  };

  const openProjectFolder = (path: string) => {
    window.electronAPI.selectFolder().then(folder => {
      if (folder) {
        // 这里可以添加打开文件夹的逻辑
        console.log('打开文件夹:', path);
      }
    });
  };

  const getProjectStats = (projectId: string) => {
    const config = projectConfigs[projectId];
    if (!config) return null;
    
    const stats = [];
    if (config.skills) stats.push(`${Object.keys(config.skills).length} 技能`);
    if (config.mcpServers) stats.push(`${Object.keys(config.mcpServers).length} MCP`);
    if (config.hooks) stats.push(`${Object.keys(config.hooks).length} 钩子`);
    if (config.docker?.services) stats.push(`${config.docker.services.length} Docker服务`);
    
    return stats.join(' · ');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">项目列表</h2>
          <p className="text-sm text-gray-500 mt-1">管理您的 Claude 开发项目</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          添加项目
        </button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目别名或路径..."
            className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {search ? '没有找到匹配的项目' : '还没有添加任何项目'}
          </h3>
          <p className="text-gray-500 mb-4">
            {search ? '尝试调整搜索条件' : '点击上方按钮添加您的第一个项目'}
          </p>
          {!search && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              添加项目
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                    {p.alias}
                  </h3>
                  <p className="text-sm text-gray-500 truncate mt-1" title={p.path}>
                    {p.path}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openProjectFolder(p.path);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="打开文件夹"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(p.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除项目"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              {p.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.description}</p>
              )}
              
              {getProjectStats(p.id) && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 mb-3">
                  {getProjectStats(p.id)}
                </div>
              )}
              
              <button
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                管理插件
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}