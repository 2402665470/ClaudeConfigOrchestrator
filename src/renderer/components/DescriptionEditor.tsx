import { useState, useEffect } from 'react';
import { X, Edit2, Save, Trash2 } from 'lucide-react';

interface DescriptionEditorProps {
  type: 'plugin' | 'capability';
  id: string;
  originalDescription: string;
  customDescription?: string | null;
  onSave: (description: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export default function DescriptionEditor({
  type,
  id,
  originalDescription,
  customDescription,
  onSave,
  onDelete,
  onCancel
}: DescriptionEditorProps) {
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDescription(customDescription || '');
    setIsEditing(!!customDescription);
  }, [customDescription]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(description);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save description:', error);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('确定要删除自定义描述吗？')) {
      setIsLoading(true);
      try {
        await onDelete();
        setDescription('');
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to delete description:', error);
      }
      setIsLoading(false);
    }
  };

  const toggleEdit = () => {
    if (!isEditing) {
      // 开始编辑，使用原始描述作为默认值
      setDescription(customDescription || '');
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {type === 'plugin' ? '插件' : '能力'}自定义描述
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 原始描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原始描述
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
              {originalDescription || '无描述'}
            </div>
          </div>

          {/* 编辑/查看切换 */}
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              自定义描述
            </label>
            <button
              onClick={toggleEdit}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              disabled={isLoading}
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? '取消编辑' : '编辑'}
            </button>
          </div>

          {/* 自定义描述内容 */}
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入自定义描述..."
              disabled={isLoading}
            />
          ) : (
            <div className="p-3 bg-blue-50 rounded-md text-sm">
              {description || <span className="text-gray-400">暂无自定义描述</span>}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between mt-6">
          <div>
            {customDescription && !isEditing && onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isLoading}
            >
              {isEditing ? '取消' : '关闭'}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                <Save className="w-4 h-4" />
                {isLoading ? '保存中...' : '保存'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}