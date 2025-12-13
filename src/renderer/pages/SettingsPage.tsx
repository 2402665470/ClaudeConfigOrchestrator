import React, { useEffect, useState } from 'react';
import { useAppStore } from '@renderer/stores/app';
import { FolderOpen, Info } from 'lucide-react';

export default function SettingsPage() {
  const { data, setData } = useAppStore();
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    window.electronAPI.getData().then(setData);
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...data, marketPath: e.target.value };
    setData(next);
    await window.electronAPI.setData(next);
  };

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        const next = { ...data, marketPath: folder };
        setData(next);
        await window.electronAPI.setData(next);
      }
    } catch (error) {
      console.error('选择文件夹失败:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">系统设置</h2>
      
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">插件市场目录</h3>
              <p className="text-sm text-gray-500">配置本地插件模板存储位置</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={data.marketPath}
                onChange={handleChange}
                placeholder="例如：C:/ClaudePlugins 或 /Users/yourname/ClaudePlugins"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSelectFolder}
                disabled={isSelecting}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                浏览
              </button>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">目录结构说明：</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 每个子目录代表一个独立的插件</li>
                  <li>• 插件目录必须包含 plugin.json 文件</li>
                  <li>• 插件文件将按配置复制到目标项目</li>
                  <li>• 支持技能、MCP服务器、钩子、Docker配置</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">系统信息</h3>
              <p className="text-sm text-gray-500">当前系统状态</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">已配置项目</div>
              <div className="font-medium text-gray-900">{data.projects.length} 个</div>
            </div>
            <div>
              <div className="text-gray-500">插件市场状态</div>
              <div className="font-medium text-gray-900">
                {data.marketPath ? '已配置' : '未配置'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}