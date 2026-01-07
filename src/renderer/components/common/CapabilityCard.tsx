import React, { useState } from 'react';
import { Card, Tag, Button, Space, Typography, Tooltip } from 'antd';
import { 
  EditOutlined, 
  FolderOpenOutlined, 
  SwapOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { Capability } from '@common/types';
import { getDisplayDescription, hasChineseDescription } from '@common/utils';
import ChineseDescriptionEditor from './ChineseDescriptionEditor';

const { Text, Paragraph } = Typography;

interface CapabilityCardProps {
  capability: Capability;
  onUpdate?: (capability: Capability) => void;
  onOpenFolder?: (capability: Capability) => void;
  onClick?: (capability: Capability) => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
}

/**
 * 能力卡片组件
 * 显示能力信息，支持中文描述优先显示、切换原文、编辑中文描述等功能
 */
const CapabilityCard: React.FC<CapabilityCardProps> = ({
  capability,
  onUpdate,
  onOpenFolder,
  onClick,
  className,
  compact = false,
  showActions = true,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentCapability, setCurrentCapability] = useState(capability);

  // 获取显示的描述
  const getDescriptionToShow = () => {
    if (showOriginal) {
      return currentCapability.originalDescription;
    }
    return getDisplayDescription(currentCapability);
  };

  // 获取类型标签颜色
  const getTypeColor = (type: string) => {
    const colors = {
      skill: 'blue',
      command: 'green',
      hook: 'orange',
      mcp: 'purple',
      setting: 'red',
      agent: 'cyan',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  // 获取翻译状态图标
  const getTranslationStatusIcon = () => {
    switch (currentCapability.translationStatus) {
      case 'manually_edited':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'auto_translated':
        return <TranslationOutlined style={{ color: '#1890ff' }} />;
      case 'translating':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  // 获取翻译状态提示文本
  const getTranslationStatusText = () => {
    switch (currentCapability.translationStatus) {
      case 'manually_edited':
        return '已人工编辑';
      case 'auto_translated':
        return '自动翻译';
      case 'translating':
        return '翻译中';
      case 'failed':
        return '翻译失败';
      case 'pending':
        return '待翻译';
      default:
        return '';
    }
  };

  const handleCapabilityUpdate = (updatedCapability: Capability) => {
    setCurrentCapability(updatedCapability);
    if (onUpdate) {
      onUpdate(updatedCapability);
    }
  };

  const handleOpenFolder = () => {
    if (onOpenFolder) {
      onOpenFolder(currentCapability);
    }
  };

  const handleToggleDescription = () => {
    setShowOriginal(!showOriginal);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(currentCapability);
    }
  };

  const cardActions = showActions ? [
    <ChineseDescriptionEditor
      key="edit"
      capability={currentCapability}
      onUpdate={handleCapabilityUpdate}
      trigger={
        <Button type="text" icon={<EditOutlined />} size="small">
          编辑
        </Button>
      }
    />,
    <Button
      key="toggle"
      type="text"
      icon={<SwapOutlined />}
      size="small"
      onClick={handleToggleDescription}
      title={showOriginal ? '显示中文描述' : '显示原文描述'}
    >
      {showOriginal ? '中文' : '原文'}
    </Button>,
    <Button
      key="folder"
      type="text"
      icon={<FolderOpenOutlined />}
      size="small"
      onClick={handleOpenFolder}
      title="打开文件夹"
    >
      文件夹
    </Button>,
  ] : undefined;

  return (
    <Card
      className={className}
      size={compact ? "small" : "default"}
      hoverable
      onClick={handleCardClick}
      actions={cardActions}
    >
      <div className="space-y-3">
        {/* 标题和类型标签 */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Text strong className="text-base block truncate" title={currentCapability.name}>
              {currentCapability.name}
            </Text>
            <Text type="secondary" className="text-xs">
              {currentCapability.sourcePlugin}
            </Text>
          </div>
          <Tag color={getTypeColor(currentCapability.type)} className="ml-2">
            {currentCapability.type.toUpperCase()}
          </Tag>
        </div>

        {/* 描述 */}
        <div className="min-h-[3rem]">
          <Paragraph
            className="text-sm text-gray-700 mb-0"
            ellipsis={{ rows: 2, tooltip: getDescriptionToShow() }}
          >
            {getDescriptionToShow()}
          </Paragraph>
        </div>

        {/* 状态信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {hasChineseDescription(currentCapability) && (
              <Tooltip title={getTranslationStatusText()}>
                <Space size={4}>
                  {getTranslationStatusIcon()}
                  <span>{showOriginal ? '原文' : '中文'}</span>
                </Space>
              </Tooltip>
            )}
            {!hasChineseDescription(currentCapability) && (
              <Text type="secondary">仅原文</Text>
            )}
          </div>
          
          {currentCapability.author && (
            <Text type="secondary" className="truncate max-w-[100px]" title={currentCapability.author}>
              {currentCapability.author}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CapabilityCard;