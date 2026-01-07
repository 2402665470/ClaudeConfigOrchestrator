import React, { useState } from 'react';
import { 
  Modal, 
  Typography, 
  Space, 
  Button, 
  Tag, 
  Divider, 
  Tabs, 
  Card,
  Tooltip,
  message
} from 'antd';
import { 
  EditOutlined, 
  FolderOpenOutlined, 
  CopyOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  CodeOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
// import ReactMarkdown from 'react-markdown';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Capability } from '@common/types';
import { getDisplayDescription, hasChineseDescription } from '@common/utils';
import ChineseDescriptionEditor from '../common/ChineseDescriptionEditor';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface CapabilityDetailModalProps {
  capability: Capability | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (capability: Capability) => void;
  onOpenFolder?: (capability: Capability) => void;
}

/**
 * 能力详情弹窗组件
 * 显示能力的完整信息，支持 Markdown/JSON 预览和各种操作
 */
const CapabilityDetailModal: React.FC<CapabilityDetailModalProps> = ({
  capability,
  open,
  onClose,
  onUpdate,
  onOpenFolder,
}) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!capability) {
    return null;
  }

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

  // 获取翻译状态图标和文本
  const getTranslationStatusInfo = () => {
    switch (capability.translationStatus) {
      case 'manually_edited':
        return {
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          text: '已人工编辑',
          color: '#52c41a',
        };
      case 'auto_translated':
        return {
          icon: <TranslationOutlined style={{ color: '#1890ff' }} />,
          text: '自动翻译',
          color: '#1890ff',
        };
      case 'translating':
        return {
          icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
          text: '翻译中',
          color: '#faad14',
        };
      case 'failed':
        return {
          icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
          text: '翻译失败',
          color: '#ff4d4f',
        };
      default:
        return {
          icon: null,
          text: '待翻译',
          color: '#8c8c8c',
        };
    }
  };

  // 复制内容到剪贴板
  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success(`${type}已复制到剪贴板`);
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 处理打开文件夹
  const handleOpenFolder = () => {
    if (onOpenFolder) {
      onOpenFolder(capability);
    }
  };

  // 处理能力更新
  const handleCapabilityUpdate = (updatedCapability: Capability) => {
    if (onUpdate) {
      onUpdate(updatedCapability);
    }
  };

  // 渲染内容预览
  const renderContentPreview = () => {
    const { content } = capability;

    switch (content.type) {
      case 'skill':
      case 'command':
      case 'agent':
        // Markdown 内容
        const markdownContent = content.type === 'skill' 
          ? '# Skill 文件夹\n\n此能力包含完整的文件夹结构，请点击"打开文件夹"查看详细内容。'
          : (content as any).markdown || '暂无内容';
        
        return (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {markdownContent}
            </pre>
          </div>
        );

      case 'hook':
      case 'mcp':
      case 'setting':
        // JSON 内容
        const jsonContent = JSON.stringify(
          content.type === 'mcp' 
            ? { [content.serverName]: content.config }
            : content.type === 'setting'
            ? { [content.key]: content.config }
            : content.config,
          null,
          2
        );
        
        return (
          <div className="bg-gray-900 p-4 rounded-lg">
            <pre className="text-green-400 text-sm font-mono overflow-auto">
              {jsonContent}
            </pre>
          </div>
        );

      default:
        return <Text type="secondary">暂无预览内容</Text>;
    }
  };

  const translationStatus = getTranslationStatusInfo();

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <Space>
            <InfoCircleOutlined />
            <span>能力详情</span>
          </Space>
          <Space>
            <ChineseDescriptionEditor
              capability={capability}
              onUpdate={handleCapabilityUpdate}
              trigger={
                <Button type="text" icon={<EditOutlined />} size="small">
                  编辑描述
                </Button>
              }
            />
            <Button
              type="text"
              icon={<FolderOpenOutlined />}
              size="small"
              onClick={handleOpenFolder}
            >
              打开文件夹
            </Button>
          </Space>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      className="capability-detail-modal"
    >
      <div className="space-y-6">
        {/* 基本信息 */}
        <Card size="small" className="bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Title level={4} className="mb-0">
                  {capability.name}
                </Title>
                <Tag color={getTypeColor(capability.type)}>
                  {capability.type.toUpperCase()}
                </Tag>
              </div>
              
              <div className="space-y-1 text-sm">
                <div>
                  <Text type="secondary">来源插件：</Text>
                  <Text>{capability.sourcePlugin}</Text>
                </div>
                
                {capability.author && (
                  <div>
                    <Text type="secondary">作者：</Text>
                    <Text>{capability.author}</Text>
                  </div>
                )}
                
                {capability.version && (
                  <div>
                    <Text type="secondary">版本：</Text>
                    <Text>{capability.version}</Text>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <div>
                  <Text type="secondary" className="text-xs">创建时间：</Text>
                  <br />
                  <Text className="text-sm">
                    {new Date(capability.createdAt).toLocaleString()}
                  </Text>
                </div>
                
                <div>
                  <Text type="secondary" className="text-xs">更新时间：</Text>
                  <br />
                  <Text className="text-sm">
                    {new Date(capability.updatedAt).toLocaleString()}
                  </Text>
                </div>

                {hasChineseDescription(capability) && (
                  <div className="flex items-center space-x-1">
                    <Text type="secondary" className="text-xs">翻译状态：</Text>
                    <Tooltip title={translationStatus.text}>
                      <Space size={4}>
                        {translationStatus.icon}
                        <Text 
                          className="text-sm" 
                          style={{ color: translationStatus.color }}
                        >
                          {translationStatus.text}
                        </Text>
                      </Space>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 描述信息 */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Title level={5} className="mb-0">
                显示描述
              </Title>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(getDisplayDescription(capability), '描述')}
              >
                复制
              </Button>
            </div>
            <Card size="small" className="bg-blue-50 border-blue-200">
              <Paragraph className="mb-0">
                {getDisplayDescription(capability)}
              </Paragraph>
            </Card>
          </div>

          {hasChineseDescription(capability) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Title level={5} className="mb-0">
                  原文描述
                </Title>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(capability.originalDescription, '原文描述')}
                >
                  复制
                </Button>
              </div>
              <Card size="small" className="bg-gray-50">
                <Paragraph className="mb-0 text-gray-600">
                  {capability.originalDescription}
                </Paragraph>
              </Card>
            </div>
          )}
        </div>

        {/* 内容预览 */}
        <div>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  内容预览
                </span>
              }
              key="preview"
            >
              <div className="max-h-96 overflow-auto">
                {renderContentPreview()}
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CodeOutlined />
                  原始数据
                </span>
              }
              key="raw"
            >
              <div className="relative">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(JSON.stringify(capability, null, 2), '原始数据')}
                  className="absolute top-2 right-2 z-10"
                >
                  复制
                </Button>
                <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    {JSON.stringify(capability, null, 2)}
                  </pre>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </Modal>
  );
};

export default CapabilityDetailModal;