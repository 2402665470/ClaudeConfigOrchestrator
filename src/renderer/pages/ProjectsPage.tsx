import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData } from '@common/types';

interface Project {
  id: string;
  alias: string;
  path: string;
  description?: string;
  pluginCount?: number;
  lastScanned?: string;
}

interface Plugin {
  id: string;
  name: string;
  marketplace?: string;
  description?: string;
}

interface ScanResult {
  totalFound: number;
  newProjects: Project[];
  hiddenProjects: Project[];
}

export default function ProjectsPage() {
  const [data, setData] = useState<AppData>({ marketPath: '', projects: [], hiddenProjects: [] });
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectPlugins, setProjectPlugins] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showHiddenProjects, setShowHiddenProjects] = useState(false);

  useEffect(() => {
    loadData();
    loadPlugins();
  }, []);

  const loadData = async () => {
    try {
      const appData = await window.electronAPI.getData();
      // 确保 hiddenProjects 数组存在
      setData({
        marketPath: appData.marketPath || '',
        projects: appData.projects || [],
        hiddenProjects: appData.hiddenProjects || []
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadPlugins = async () => {
    try {
      const installedPlugins = await window.electronAPI.getInstalledPlugins('user');
      const pluginList: Plugin[] = installedPlugins.map(plugin => {
        const [name, marketplace] = plugin.id.split('@');
        return {
          id: plugin.id,
          name,
          marketplace,
          description: `${name} - ${marketplace || 'local'} plugin`
        };
      });
      setPlugins(pluginList);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  };

  const handleScanProjects = async () => {
    setShowScanModal(false);
    setScanning(true);

    try {
      // 调用扫描 API - 不再需要传入路径
      const result: ScanResult = await window.electronAPI.scanProjects();

      // 更新项目数据
      const updatedProjects = [
        ...data.projects,
        ...result.newProjects
      ];
      const updatedHiddenProjects = [
        ...(data.hiddenProjects || []),
        ...result.hiddenProjects
      ];

      await window.electronAPI.setData({
        ...data,
        projects: updatedProjects,
        hiddenProjects: updatedHiddenProjects
      });
      setData({
        ...data,
        projects: updatedProjects,
        hiddenProjects: updatedHiddenProjects
      });

      // 显示扫描结果
      alert(`扫描完成！发现 ${result.totalFound} 个 Claude 项目\n新增 ${result.newProjects.length} 个项目`);
    } catch (error) {
      console.error('Failed to scan projects:', error);
      alert('扫描失败：' + error);
    } finally {
      setScanning(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    try {
      const enabledPlugins = await window.electronAPI.getProjectPlugins(project.path);
      setProjectPlugins(enabledPlugins);
    } catch (error) {
      console.error('Failed to load project plugins:', error);
      setProjectPlugins([]);
    }
  };

  const handleHideProject = async (projectId: string) => {
    if (!confirm('确定要隐藏这个项目吗？（可以在设置中恢复显示）')) {
      return;
    }

    const result = await window.electronAPI.hideProject(projectId);
    if (result.success) {
      // 重新加载数据
      loadData();
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setProjectPlugins([]);
      }
    } else {
      alert('隐藏失败：' + result.error);
    }
  };

  const handleUnhideProject = async (projectId: string) => {
    const result = await window.electronAPI.unhideProject(projectId);
    if (result.success) {
      // 重新加载数据
      loadData();
    } else {
      alert('恢复失败：' + result.error);
    }
  };

  const handleOpenFolder = async (projectPath: string) => {
    const result = await window.electronAPI.openProjectFolder(projectPath);
    if (!result.success) {
      alert('打开文件夹失败：' + result.error);
    }
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      let result;
      if (enabled) {
        result = await window.electronAPI.enableProjectPlugin(selectedProject.path, pluginId);
      } else {
        result = await window.electronAPI.disableProjectPlugin(selectedProject.path, pluginId);
      }

      if (result.success) {
        // 更新本地状态
        if (enabled) {
          setProjectPlugins([...projectPlugins, pluginId]);
        } else {
          setProjectPlugins(projectPlugins.filter(id => id !== pluginId));
        }
      } else {
        alert(`操作失败: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleAddFolder = async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      const projects = [...data.projects];
      const newProject = {
        id: Date.now().toString(),
        alias: folder.split('\\').pop() || folder.split('/').pop() || '未命名项目',
        path: folder,
        description: ''
      };
      projects.push(newProject);
      await window.electronAPI.setData({ ...data, projects });
      setData({ ...data, projects });
    }
  };

  return (
    <div className="h-full">
      {/* 扫描进度弹窗 */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">扫描项目中...</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">正在查找包含 .claude 文件夹的项目...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 项目详情弹窗 */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProject.alias}</h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">{selectedProject.path}</p>
                    {selectedProject.description && (
                      <p className="text-gray-600 mt-2">{selectedProject.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* 插件统计 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3">插件统计</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{projectPlugins.length}</p>
                      <p className="text-sm text-gray-600">已启用</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-600">{plugins.length - projectPlugins.length}</p>
                      <p className="text-sm text-gray-600">可用但未启用</p>
                    </div>
                  </div>
                </div>

                {/* 已启用的插件 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3">已启用插件 ({projectPlugins.length})</h4>
                  {projectPlugins.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">还没有启用任何插件</p>
                  ) : (
                    <div className="space-y-2">
                      {projectPlugins.map(pluginId => {
                        const plugin = plugins.find(p => p.id === pluginId);
                        return (
                          <motion.div
                            key={pluginId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{plugin?.name || pluginId.split('@')[0]}</span>
                              {plugin?.marketplace && (
                                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                                  {plugin.marketplace}
                                </span>
                              )}
                            </div>
                            <button
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              onClick={() => handleTogglePlugin(pluginId, false)}
                              disabled={loading}
                            >
                              移除
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 可用插件 */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">可添加的插件</h4>
                  {plugins.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">能力库中还没有插件</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {plugins
                        .filter(plugin => !projectPlugins.includes(plugin.id))
                        .map(plugin => (
                          <motion.div
                            key={plugin.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{plugin.name}</span>
                              {plugin.marketplace && (
                                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {plugin.marketplace}
                                </span>
                              )}
                            </div>
                            <button
                              className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
                              onClick={() => handleTogglePlugin(plugin.id, true)}
                              disabled={loading}
                            >
                              添加
                            </button>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区 */}
      <div className="h-full flex flex-col">
        {/* 顶部操作栏 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">项目管理</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowScanModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16M4 12h8m-8 6h8m-8 6l8-8m-8 0l8-8" />
              </svg>
              扫描项目
            </button>
            <button
              onClick={handleAddFolder}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              手动添加
            </button>
          </div>
        </div>

        {/* 项目列表 */}
        <div className="flex-1 overflow-y-auto">
          {data.projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-24 h-24 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h6z" />
              </svg>
              <p className="text-lg font-medium">还没有项目</p>
              <p className="text-sm mt-2">点击"扫描项目"自动发现您使用过 Claude 的项目</p>
              <p className="text-sm mt-1">或点击"手动添加"选择项目文件夹</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all relative group"
                  onClick={() => handleSelectProject(project)}
                >
                  {/* 操作按钮组 */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 打开文件夹按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFolder(project.path);
                      }}
                      className="p-1.5 bg-white rounded-lg shadow-md hover:bg-blue-50"
                      title="打开文件夹"
                    >
                      <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </button>
                    {/* 隐藏项目按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHideProject(project.id);
                      }}
                      className="p-1.5 bg-white rounded-lg shadow-md hover:bg-yellow-50"
                      title="隐藏项目"
                    >
                      <svg className="w-4 h-4 text-gray-500 hover:text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">{project.alias}</h3>
                      <p className="text-sm text-gray-500 truncate mt-1">{project.path}</p>
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {projectPlugins.find(p => p.id === project.id)?.pluginCount || 0}
                      </span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{project.lastScanned ? `扫描于 ${formatDate(project.lastScanned)}` : '未扫描'}</span>
                    {project.pluginCount !== undefined && (
                      <span>{project.pluginCount} 个插件</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 隐藏项目切换 */}
          {data.hiddenProjects && data.hiddenProjects.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowHiddenProjects(!showHiddenProjects)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${showHiddenProjects ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>显示隐藏项目 ({data.hiddenProjects.length})</span>
              </button>

              <AnimatePresence>
                {showHiddenProjects && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.hiddenProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-5 opacity-75"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-gray-700 truncate">{project.alias}</h3>
                              <p className="text-sm text-gray-500 truncate mt-1">{project.path}</p>
                            </div>
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                              已隐藏
                            </span>
                          </div>

                          {/* 恢复按钮 */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleUnhideProject(project.id)}
                              className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              恢复显示
                            </button>
                            <button
                              onClick={() => handleOpenFolder(project.path)}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              打开
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* 扫描确认弹窗 */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">扫描 Claude 项目</h3>
              <p className="text-gray-600 mb-6">
                程序将自动扫描您使用过 Claude 的项目目录（<code>~/.claude/projects/</code>），
                找出所有包含 <code>.claude</code> 文件夹的项目。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowScanModal(false);
                    handleScanProjects();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  开始扫描
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}