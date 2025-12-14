import { useState, useEffect } from 'react';
import { FileText, Edit } from 'lucide-react';

interface DescriptionToggleProps {
  originalDescription: string;
  customDescription?: string | null;
  onEdit?: () => void;
}

export default function DescriptionToggle({
  originalDescription,
  customDescription,
  onEdit
}: DescriptionToggleProps) {
  // 如果有自定义描述，默认显示自定义描述
  const [showCustom, setShowCustom] = useState(!!customDescription);

  // 当自定义描述加载后，更新显示状态
  useEffect(() => {
    if (customDescription) {
      setShowCustom(true);
    }
  }, [customDescription]);

  const displayText = (showCustom && customDescription) ? customDescription : originalDescription;
  const hasCustom = !!customDescription;

  return (
    <div className="group relative">
      <div className="text-sm text-gray-600 line-clamp-2">
        {displayText || <span className="text-gray-400">无描述</span>}
      </div>

      {/* 切换和编辑按钮 */}
      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasCustom && (
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            title={showCustom ? '显示原始描述' : '显示自定义描述'}
          >
            <FileText className="w-3 h-3" />
            {showCustom ? '原始' : '自定义'}
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-700"
            title="编辑描述"
          >
            <Edit className="w-3 h-3" />
            编辑
          </button>
        )}
      </div>

      {/* 标记是否有自定义描述 */}
      {hasCustom && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>
  );
}