import React from 'react';
import { ConflictInfo } from '@common/types';
import { AlertTriangle, File, Settings, Server, Zap } from 'lucide-react';

interface ConflictDialogProps {
  conflicts: ConflictInfo[];
  onResolve: (strategy: 'overwrite' | 'skip' | 'cancel') => void;
}

const getIcon = (type: ConflictInfo['type']) => {
  switch (type) {
    case 'skill': return <Settings className="w-4 h-4" />;
    case 'mcpServer': return <Server className="w-4 h-4" />;
    case 'hook': return <Zap className="w-4 h-4" />;
    case 'file': return <File className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: ConflictInfo['type']) => {
  switch (type) {
    case 'skill': return '技能';
    case 'mcpServer': return 'MCP服务器';
    case 'hook': return '钩子';
    case 'file': return '文件';
  }
};

export const ConflictDialog: React.FC<ConflictDialogProps> = ({ conflicts, onResolve }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">检测到冲突</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          安装此插件时发现 {conflicts.length} 个冲突，请选择处理方式：
        </p>

        <div className="space-y-3 mb-6">
          {conflicts.map((conflict, index) => (
            <div key={index} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                {getIcon(conflict.type)}
                <span className="font-medium text-gray-900">
                  {getTypeLabel(conflict.type)}: {conflict.key}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="mb-1">
                  <span className="font-medium">现有配置:</span> {JSON.stringify(conflict.existing, null, 2)}
                </div>
                <div>
                  <span className="font-medium">新配置:</span> {JSON.stringify(conflict.incoming, null, 2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onResolve('cancel')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            取消安装
          </button>
          <button
            onClick={() => onResolve('skip')}
            className="px-4 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
          >
            跳过冲突
          </button>
          <button
            onClick={() => onResolve('overwrite')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            覆盖冲突
          </button>
        </div>
      </div>
    </div>
  );
};