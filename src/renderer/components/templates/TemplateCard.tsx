import React, { useEffect } from 'react';
import { Card, Typography, Button, Space, Tag, Tooltip, Dropdown } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ExportOutlined, 
  PlayCircleOutlined,
  MoreOutlined,
  FileTextOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useTemplatesStore } from '../../stores/templatesStore';
import type { ConfigTemplate } from '@common/types';

const { Title, Text, Paragraph } = Typography;

interface TemplateCardProps {
  template: ConfigTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
  onApply: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onExport,
  onApply
}) => {
  const { loadTemplateStats, getTemplateStatsById } = useTemplatesStore();
  const stats = getTemplateStatsById(template.id);

  useEffect(() => {
    if (!stats) {
      loadTemplateStats(template.id);
    }
  }, [template.id, stats, loadTemplateStats]);

  const menuItems = [
    {
      key: 'edit',
      label: '编辑模板',
      icon: <EditOutlined />,
      onClick: onEdit,
    },
    {
      key: 'export',
      label: '导出模板',
      icon: <ExportOutlined />,
      onClick: onExport,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: '删除模板',
      icon: <DeleteOutlined />,
      onClick: onDelete,
      danger: true,
    },
  ];

  const renderTypeStats = () => {
    if (!stats?.typeStats) return null;

    const typeLabels: Record<string, string> = {
      skill: '技能',
      command: '命令',
      hook: '钩子',
      mcp: 'MCP',
      setting: '设置',
      agent: '代理'
    };

    const typeColors: Record<string, string> = {
      skill: 'blue',
      command: 'green',
      hook: 'orange',
      mcp: 'purple',
      setting: 'cyan',
      agent: 'magenta'
    };

    return (
      <Space wrap size={[4, 4]}>
        {Object.entries(stats.typeStats).map(([type, count]) => (
          <Tag 
            key={type} 
            color={typeColors[type] || 'default'}
            className="text-xs"
          >
            {typeLabels[type] || type} {count}
          </Tag>
        ))}
      </Space>
    );
  };

  return (
    <Card
      className="border-slate-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
      actions={[
        <Tooltip title="应用到项目" key="apply">
          <Button 
            type="text" 
            icon={<PlayCircleOutlined />} 
            onClick={onApply}
            className="text-primary-600 hover:text-primary-700"
          />
        </Tooltip>,
        <Tooltip title="编辑模板" key="edit">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={onEdit}
            className="text-slate-600 hover:text-slate-700"
          />
        </Tooltip>,
        <Dropdown menu={{ items: menuItems }} trigger={['click']} key="more">
          <Button 
            type="text" 
            icon={<MoreOutlined />}
            className="text-slate-600 hover:text-slate-700"
          />
        </Dropdown>
      ]}
    >
      <div className="space-y-3">
        {/* 模板标题 */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Title level={5} className="mb-1 text-slate-800 truncate">
              <FileTextOutlined className="mr-2 text-primary-600" />
              {template.name}
            </Title>
            {template.description && (
              <Paragraph 
                className="text-slate-600 text-sm mb-0 line-clamp-2"
                ellipsis={{ rows: 2, tooltip: template.description }}
              >
                {template.description}
              </Paragraph>
            )}
          </div>
        </div>

        {/* 能力统计 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text className="text-slate-500 text-sm">
              <AppstoreOutlined className="mr-1" />
              能力数量
            </Text>
            <Text className="font-medium text-slate-700">
              {stats?.totalCapabilities || 0}
            </Text>
          </div>
          
          {stats?.typeStats && Object.keys(stats.typeStats).length > 0 && (
            <div className="pt-1">
              {renderTypeStats()}
            </div>
          )}
        </div>

        {/* 时间信息 */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-400">
            <span>创建于 {new Date(template.createdAt).toLocaleDateString()}</span>
            {template.updatedAt !== template.createdAt && (
              <span>更新于 {new Date(template.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;