import { useState, useEffect } from 'react';

interface Scene {
  id: string;
  name: string;
  description?: string;
  pluginIds: string[];
  defaultMode: 'exclusive' | 'additive';  // 默认应用模式
  createdAt: string;
  updatedAt: string;
}

interface Plugin {
  id: string;
  name: string;
}

interface Project {
  id: string;
  alias: string;
  path: string;
  description?: string;
}

export default function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // 创建场景的表单
  const [newScene, setNewScene] = useState({
    name: '',
    description: '',
    pluginIds: [] as string[],
    defaultMode: 'additive' as 'exclusive' | 'additive'
  });

  // 应用场景的选项
  const [applyOptions, setApplyOptions] = useState({
    sceneId: '',
    projectId: '',
    mode: 'additive' as 'exclusive' | 'additive'
  });

  useEffect(() => {
    loadScenes();
    loadProjects();
    loadPlugins();
  }, []);

  const loadScenes = async () => {
    try {
      const scenesData = await window.electronAPI.listScenes();
      setScenes(scenesData);
    } catch (error) {
      console.error('Failed to load scenes:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await window.electronAPI.getData();
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadPlugins = async () => {
    try {
      const installedPlugins = await window.electronAPI.getInstalledPlugins('user');
      const pluginList: Plugin[] = installedPlugins.map(plugin => {
        const [name] = plugin.id.split('@');
        return {
          id: plugin.id,
          name
        };
      });
      setPlugins(pluginList);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  };

  const handleCreateScene = async () => {
    if (!newScene.name.trim()) {
      alert('请输入场景名称');
      return;
    }

    if (newScene.pluginIds.length === 0) {
      alert('请至少选择一个插件');
      return;
    }

    setLoading(true);
    try {
      const scene = {
        id: Date.now().toString(),
        name: newScene.name,
        description: newScene.description,
        pluginIds: newScene.pluginIds,
        defaultMode: newScene.defaultMode
      };

      await window.electronAPI.saveScene(scene);
      alert('场景创建成功！');

      // 重置表单
      setNewScene({
        name: '',
        description: '',
        pluginIds: [],
        defaultMode: 'additive'
      });
      setShowCreateDialog(false);
      loadScenes();
    } catch (error) {
      console.error('Failed to create scene:', error);
      alert('创建场景失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScene = async () => {
    if (!applyOptions.sceneId) {
      alert('请选择场景');
      return;
    }

    if (!applyOptions.projectId) {
      alert('请选择项目');
      return;
    }

    const project = projects.find(p => p.id === applyOptions.projectId);
    if (!project) {
      alert('项目不存在');
      return;
    }

    setLoading(true);
    try {
      // 这里需要实现场景应用逻辑
      const success = await window.electronAPI.applyScene(
        applyOptions.sceneId,
        project.path,
        applyOptions.mode
      );

      if (success) {
        alert(`场景已${applyOptions.mode === 'exclusive' ? '独占' : '叠加'}应用到项目！`);
        setShowApplyDialog(false);
        setApplyOptions({
          sceneId: '',
          projectId: '',
          mode: 'additive'
        });
      } else {
        alert('应用场景失败');
      }
    } catch (error) {
      console.error('Failed to apply scene:', error);
      alert('应用场景失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('确定要删除这个场景吗？')) return;

    setLoading(true);
    try {
      // TODO: 实现删除场景的 API
      alert('删除功能待实现');
    } catch (error) {
      console.error('Failed to delete scene:', error);
      alert('删除场景失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">场景管理</h1>
        <button
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          onClick={() => setShowCreateDialog(true)}
        >
          创建新场景
        </button>
      </div>

      {/* 场景列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenes.map(scene => (
          <div key={scene.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{scene.name}</h3>
            {scene.description && (
              <p className="text-sm text-gray-600 mt-1">{scene.description}</p>
            )}
            <div className="mt-3">
              <div className="text-sm text-gray-500">
                包含 {scene.pluginIds.length} 个插件
              </div>
              <div className="text-xs text-gray-400">
                默认模式：{scene.defaultMode === 'exclusive' ? '独占' : '叠加'}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  setSelectedScene(scene);
                  setShowApplyDialog(true);
                  setApplyOptions(prev => ({
                    ...prev,
                    sceneId: scene.id,
                    mode: scene.defaultMode
                  }));
                }}
              >
                应用到项目
              </button>
              <button
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => handleDeleteScene(scene.id)}
                disabled={loading}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 创建场景对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">创建新场景</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">场景名称 *</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={newScene.name}
                  onChange={(e) => setNewScene({ ...newScene, name: e.target.value })}
                  placeholder="输入场景名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  className="w-full border px-3 py-2 rounded"
                  rows={3}
                  value={newScene.description}
                  onChange={(e) => setNewScene({ ...newScene, description: e.target.value })}
                  placeholder="输入场景描述（可选）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">默认应用模式</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={newScene.defaultMode}
                  onChange={(e) => setNewScene({ ...newScene, defaultMode: e.target.value as 'exclusive' | 'additive' })}
                >
                  <option value="additive">叠加模式（添加到现有插件）</option>
                  <option value="exclusive">独占模式（替换所有插件）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">选择插件</label>
                <div className="border rounded p-3 max-h-40 overflow-y-auto">
                  {plugins.map(plugin => (
                    <label key={plugin.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={newScene.pluginIds.includes(plugin.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewScene({
                              ...newScene,
                              pluginIds: [...newScene.pluginIds, plugin.id]
                            });
                          } else {
                            setNewScene({
                              ...newScene,
                              pluginIds: newScene.pluginIds.filter(id => id !== plugin.id)
                            });
                          }
                        }}
                      />
                      <span>{plugin.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border rounded hover:bg-gray-50"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewScene({
                    name: '',
                    description: '',
                    pluginIds: [],
                    defaultMode: 'additive'
                  });
                }}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                onClick={handleCreateScene}
                disabled={loading}
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 应用场景对话框 */}
      {showApplyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              应用场景：{selectedScene?.name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">选择项目</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={applyOptions.projectId}
                  onChange={(e) => setApplyOptions({ ...applyOptions, projectId: e.target.value })}
                >
                  <option value="">请选择项目</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.alias}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">应用模式</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="mr-2"
                      checked={applyOptions.mode === 'additive'}
                      onChange={() => setApplyOptions({ ...applyOptions, mode: 'additive' })}
                    />
                    <div>
                      <div className="font-medium">叠加模式</div>
                      <div className="text-sm text-gray-500">在项目现有插件基础上添加场景中的插件</div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="mr-2"
                      checked={applyOptions.mode === 'exclusive'}
                      onChange={() => setApplyOptions({ ...applyOptions, mode: 'exclusive' })}
                    />
                    <div>
                      <div className="font-medium">独占模式</div>
                      <div className="text-sm text-gray-500">清除所有插件，只使用场景中的插件</div>
                    </div>
                  </label>
                </div>
              </div>

              {applyOptions.mode === 'exclusive' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 独占模式将移除项目当前的所有插件，只应用场景中的插件。
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border rounded hover:bg-gray-50"
                onClick={() => setShowApplyDialog(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                onClick={handleApplyScene}
                disabled={loading || !applyOptions.projectId}
              >
                {loading ? '应用中...' : '应用场景'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}