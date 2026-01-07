import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { useCapabilitiesStore, useTemplatesStore, useProjectsStore, useCacheStore } from '../../stores';
import { getDisplayDescription } from '@common/utils';

const { Text } = Typography;

/**
 * Demo component to show that all stores are working correctly
 * This can be removed once actual components are implemented
 */
const StoreDemo: React.FC = () => {
  const capabilitiesCount = useCapabilitiesStore(state => state.capabilities.length);
  const templatesCount = useTemplatesStore(state => state.templates.length);
  const projectsCount = useProjectsStore(state => state.projects.length);
  const cacheSize = useCacheStore(state => state.getTotalCacheSize());

  const addSampleCapability = useCapabilitiesStore(state => state.addCapability);
  const addSampleTemplate = useTemplatesStore(state => state.addTemplate);
  const addSampleProject = useProjectsStore(state => state.addProject);

  const handleAddSampleData = () => {
    // Add sample capability
    addSampleCapability({
      id: `cap-${Date.now()}`,
      type: 'command',
      name: '示例命令',
      originalDescription: 'Sample command description',
      chineseDescription: '示例命令描述',
      translationStatus: 'manually_edited',
      sourcePlugin: 'sample-plugin',
      content: {
        type: 'command',
        filePath: '/path/to/command.md',
        markdown: '# Sample Command\n\nThis is a sample command.',
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add sample template
    addSampleTemplate({
      id: `template-${Date.now()}`,
      name: '示例模板',
      description: '这是一个示例配置模板',
      capabilityIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add sample project
    addSampleProject({
      id: `project-${Date.now()}`,
      name: '示例项目',
      path: '/path/to/project',
      hidden: false,
      createdAt: new Date(),
    });
  };

  return (
    <Card title="状态管理演示" className="m-4">
      <Space direction="vertical" size="middle" className="w-full">
        <div>
          <Text strong>当前状态统计：</Text>
          <ul className="mt-2 ml-4">
            <li>能力数量: {capabilitiesCount}</li>
            <li>模板数量: {templatesCount}</li>
            <li>项目数量: {projectsCount}</li>
            <li>缓存大小: {cacheSize} bytes</li>
          </ul>
        </div>
        
        <Button type="primary" onClick={handleAddSampleData}>
          添加示例数据
        </Button>
        
        <Text type="secondary">
          点击按钮添加示例数据，观察状态变化。这个组件仅用于演示状态管理功能。
        </Text>
      </Space>
    </Card>
  );
};

export default StoreDemo;