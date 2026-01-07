import React from 'react';
import { Card, Button, Typography, Tag, Space, Tooltip, message } from 'antd';
import { 
  FolderOpenOutlined, 
  SettingOutlined, 
  EyeInvisibleOutlined,
  DeleteOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { Project, ProjectConfig } from '@common/types';

const { Text, Paragraph } = Typography;

interface ProjectCardProps {
  project: Project;
  config?: ProjectConfig;
  onOpenFolder: (projectPath: string) => void;
  onApplyTemplate: (project: Project) => void;
  onViewHistory: (project: Project) => void;
  onHide: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  config,
  onOpenFolder,
  onApplyTemplate,
  onViewHistory,
  onHide,
  onDelete,
}) => {
  const handleOpenFolder = () => {
    onOpenFolder(project.path);
  };

  const handleApplyTemplate = () => {
    onApplyTemplate(project);
  };

  const handleViewHistory = () => {
    onViewHistory(project);
  };

  const handleHide = () => {
    onHide(project.id);
    message.success('项目已隐藏');
  };

  const handleDelete = () => {
    onDelete(project.id);
    message.success('项目已删除');
  };

  const getCapabilityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      skill: 'blue',
      command: 'green',
      agent: 'purple',
      hook: 'orange',
      mcp: 'red',
      setting: 'cyan',
    };
    return colors[type] || 'default';
  };

  const getCapabilityTypeName = (type: string) => {
    const names: Record<string, string> = {
      skill: '技能',
      command: '命令',
      agent: '代理',
      hook: '钩子',
      mcp: 'MCP',
      setting: '设置',
    };
    return names[type] || type;
  };

  const capabilityStats = config?.existingCapabilities.reduce((acc, cap) => {
    acc[cap.type] = (acc[cap.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text strong>{project.name}</Text>
            {!config?.hasClaudeDir && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                未配置
              </Tag>
            )}
          </div>
          <Space>
            <Tooltip title="打开文件夹">
              <Button
                type="text"
                size="small"
                icon={<FolderOpenOutlined />}
                onClick={handleOpenFolder}
              />
            </Tooltip>
            <Tooltip title="应用模板">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={handleApplyTemplate}
              />
            </Tooltip>
            <Tooltip title="注入历史">
              <Button
                type="text"
                size="small"
                icon={<HistoryOutlined />}
                onClick={handleViewHistory}
              />
            </Tooltip>
            <Tooltip title="隐藏项目">
              <Button
                type="text"
                size="small"
                icon={<EyeInvisibleOutlined />}
                onClick={handleHide}
              />
            </Tooltip>
            <Tooltip title="删除项目">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              />
            </Tooltip>
          </Space>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {project.path}
        </Text>
      </div>

      {config?.hasClaudeDir && config.existingCapabilities.length > 0 && (
        <div>
          <Text strong style={{ fontSize: '13px', marginBottom: 8, display: 'block' }}>
            已启用能力 ({config.existingCapabilities.length})
          </Text>
          <Space wrap>
            {Object.entries(capabilityStats).map(([type, count]) => (
              <Tag
                key={type}
                color={getCapabilityTypeColor(type)}
                style={{ fontSize: '11px' }}
              >
                {getCapabilityTypeName(type)} {count}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {config?.hasClaudeDir && config.existingCapabilities.length === 0 && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          已配置 Claude 目录，但未发现任何能力
        </Text>
      )}

      {!config?.hasClaudeDir && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          该项目尚未配置 Claude 能力
        </Text>
      )}

      {project.lastInjectedAt && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            最后注入: {new Date(project.lastInjectedAt).toLocaleString()}
          </Text>
        </div>
      )}
    </Card>
  );
};