import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Select, 
  Typography, 
  Space, 
  Card, 
  Tag, 
  Alert, 
  Divider,
  List,
  Button,
  Checkbox,
  message
} from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import type { Project, ConfigTemplate, Capability, InjectionPreview, Conflict } from '@common/types';
import { useTemplatesStore } from '../../stores/templatesStore';
import { useCapabilitiesStore } from '../../stores/capabilitiesStore';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ApplyTemplateModalProps {
  visible: boolean;
  project: Project | null;
  onCancel: () => void;
  onApply: (templateId: string, conflictResolutions: Record<string, 'overwrite' | 'skip'>) => void;
}

export const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({
  visible,
  project,
  onCancel,
  onApply,
}) => {
  const { templates, getAllTemplates } = useTemplatesStore();
  const { capabilities, getAllCapabilities } = useCapabilitiesStore();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateCapabilities, setTemplateCapabilities] = useState<Capability[]>([]);
  const [preview, setPreview] = useState<InjectionPreview | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, 'overwrite' | 'skip'>>({});
  const [loading, setLoading] = useState(false);

  // 加载模板列表
  useEffect(() => {
    if (visible) {
      getAllTemplates();
      getAllCapabilities();
    }
  }, [visible]);

  // 当选择模板时，加载模板能力
  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateCapabilities(selectedTemplateId);
    } else {
      setTemplateCapabilities([]);
      setPreview(null);
    }
  }, [selectedTemplateId, capabilities]);

  const loadTemplateCapabilities = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const templateCaps = template.capabilityIds
        .map(id => capabilities.find(cap => cap.id === id))
        .filter(Boolean) as Capability[];
      
      setTemplateCapabilities(templateCaps);

      // 如果有项目，预览注入结果
      if (project) {
        await previewInjection(project, templateCaps);
      }
    } catch (error) {
      console.error('加载模板能力失败:', error);
    }
  };

  const previewInjection = async (project: Project, capabilities: Capability[]) => {
    try {
      setLoading(true);
      // TODO: 调用注入服务预览功能
      // const preview = await window.electronAPI.injectionService.preview(project.path, capabilities);
      // setPreview(preview);
      
      // 模拟预览结果
      const mockPreview: InjectionPreview = {
        toCreate: capabilities.map(cap => ({
          capability: cap,
          targetPath: getTargetPath(project.path, cap),
          action: 'create' as const,
        })),
        toUpdate: [],
        conflicts: [],
      };
      setPreview(mockPreview);
    } catch (error) {
      console.error('预览注入失败:', error);
      message.error('预览注入失败');
    } finally {
      setLoading(false);
    }
  };

  const getTargetPath = (projectPath: string, capability: Capability): string => {
    switch (capability.type) {
      case 'skill':
        return `${projectPath}/.claude/skills/${capability.name}`;
      case 'command':
        return `${projectPath}/.claude/commands/${capability.name}.md`;
      case 'agent':
        return `${projectPath}/.claude/agents/${capability.name}.md`;
      case 'hook':
      case 'mcp':
      case 'setting':
        return `${projectPath}/.claude/settings.json`;
      default:
        return projectPath;
    }
  };

  const handleConflictResolutionChange = (conflictId: string, resolution: 'overwrite' | 'skip') => {
    setConflictResolutions(prev => ({
      ...prev,
      [conflictId]: resolution,
    }));
  };

  const handleApply = () => {
    if (!selectedTemplateId) {
      message.error('请选择要应用的模板');
      return;
    }

    onApply(selectedTemplateId, conflictResolutions);
  };

  const handleCancel = () => {
    setSelectedTemplateId(null);
    setTemplateCapabilities([]);
    setPreview(null);
    setConflictResolutions({});
    onCancel();
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

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

  return (
    <Modal
      title={`应用模板到项目: ${project?.name}`}
      open={visible}
      onCancel={handleCancel}
      onOk={handleApply}
      okText="应用模板"
      cancelText="取消"
      width={800}
      okButtonProps={{ 
        disabled: !selectedTemplateId || loading,
        loading: loading 
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 模板选择 */}
        <div>
          <Title level={5}>选择配置模板</Title>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择要应用的配置模板"
            value={selectedTemplateId}
            onChange={setSelectedTemplateId}
            showSearch
            optionFilterProp="children"
          >
            {templates.map(template => (
              <Option key={template.id} value={template.id}>
                <div>
                  <Text strong>{template.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {template.description || '无描述'}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {template.capabilityIds.length} 个能力
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {/* 模板详情 */}
        {selectedTemplate && (
          <Card size="small" title="模板详情">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>描述: </Text>
                <Text>{selectedTemplate.description || '无描述'}</Text>
              </div>
              <div>
                <Text strong>包含能力: </Text>
                <Space wrap>
                  {templateCapabilities.map(cap => (
                    <Tag key={cap.id} color={getCapabilityTypeColor(cap.type)}>
                      {getCapabilityTypeName(cap.type)}: {cap.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>
        )}

        {/* 配置预览 */}
        {preview && (
          <div>
            <Title level={5}>配置预览</Title>
            
            {preview.toCreate.length > 0 && (
              <Card size="small" title={`将创建 ${preview.toCreate.length} 个能力`} style={{ marginBottom: 16 }}>
                <List
                  size="small"
                  dataSource={preview.toCreate}
                  renderItem={item => (
                    <List.Item>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Tag color={getCapabilityTypeColor(item.capability.type)}>
                          {getCapabilityTypeName(item.capability.type)}
                        </Tag>
                        <Text>{item.capability.name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          → {item.targetPath}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {preview.toUpdate.length > 0 && (
              <Card size="small" title={`将更新 ${preview.toUpdate.length} 个能力`} style={{ marginBottom: 16 }}>
                <List
                  size="small"
                  dataSource={preview.toUpdate}
                  renderItem={item => (
                    <List.Item>
                      <Space>
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                        <Tag color={getCapabilityTypeColor(item.capability.type)}>
                          {getCapabilityTypeName(item.capability.type)}
                        </Tag>
                        <Text>{item.capability.name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          → {item.targetPath}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {preview.conflicts.length > 0 && (
              <Card size="small" title={`发现 ${preview.conflicts.length} 个冲突`} style={{ marginBottom: 16 }}>
                <Alert
                  message="配置冲突"
                  description="以下能力与现有配置存在冲突，请选择处理方式："
                  type="warning"
                  icon={<WarningOutlined />}
                  style={{ marginBottom: 16 }}
                />
                <List
                  size="small"
                  dataSource={preview.conflicts}
                  renderItem={conflict => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            <WarningOutlined style={{ color: '#faad14' }} />
                            <Tag color={getCapabilityTypeColor(conflict.capability.type)}>
                              {getCapabilityTypeName(conflict.capability.type)}
                            </Tag>
                            <Text>{conflict.capability.name}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              冲突: {conflict.conflictType === 'file_exists' ? '文件已存在' : '配置键已存在'}
                            </Text>
                          </Space>
                          <Space>
                            <Checkbox
                              checked={conflictResolutions[conflict.capability.id] === 'overwrite'}
                              onChange={(e) => 
                                handleConflictResolutionChange(
                                  conflict.capability.id, 
                                  e.target.checked ? 'overwrite' : 'skip'
                                )
                              }
                            >
                              覆盖
                            </Checkbox>
                            <Checkbox
                              checked={conflictResolutions[conflict.capability.id] === 'skip'}
                              onChange={(e) => 
                                handleConflictResolutionChange(
                                  conflict.capability.id, 
                                  e.target.checked ? 'skip' : 'overwrite'
                                )
                              }
                            >
                              跳过
                            </Checkbox>
                          </Space>
                        </Space>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
};