import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Row, 
  Col, 
  Card, 
  Typography, 
  Empty,
  Spin,
  message,
  Transfer,
  Tag
} from 'antd';
import { 
  AppstoreOutlined, 
  PlusOutlined, 
  MinusOutlined,
  DragOutlined
} from '@ant-design/icons';
import { useTemplatesStore } from '../../stores/templatesStore';
import { useCapabilitiesStore } from '../../stores/capabilitiesStore';
import CapabilityCard from '../common/CapabilityCard';
import type { ConfigTemplate, Capability } from '@common/types';
import type { UpdateTemplateRequest } from '../../../main/services/TemplateService';

const { Title, Text } = Typography;

interface TemplateEditModalProps {
  visible: boolean;
  template: ConfigTemplate;
  onCancel: () => void;
  onSuccess: () => void;
}

interface TransferItem {
  key: string;
  title: string;
  description: string;
  type: string;
  disabled?: boolean;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  visible,
  template,
  onCancel,
  onSuccess
}) => {
  const { updateTemplate, getTemplateCapabilities, addCapabilitiesToTemplate, removeCapabilityFromTemplate } = useTemplatesStore();
  const { capabilities, loadCapabilities } = useCapabilitiesStore();
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templateCapabilities, setTemplateCapabilities] = useState<Capability[]>([]);
  const [transferVisible, setTransferVisible] = useState(false);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      // 初始化表单
      form.setFieldsValue({
        name: template.name,
        description: template.description
      });

      // 加载模板能力和所有能力
      loadTemplateData();
      loadCapabilities();
    }
  }, [visible, template, form, loadCapabilities]);

  const loadTemplateData = async () => {
    try {
      setLoading(true);
      const caps = await getTemplateCapabilities(template.id);
      setTemplateCapabilities(caps);
      setTargetKeys(caps.map(cap => cap.id));
    } catch (error) {
      message.error('加载模板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async (values: UpdateTemplateRequest) => {
    try {
      setLoading(true);
      await updateTemplate(template.id, values);
      onSuccess();
    } catch (error) {
      message.error('更新模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCapability = async (capabilityId: string) => {
    try {
      await removeCapabilityFromTemplate(template.id, capabilityId);
      setTemplateCapabilities(prev => prev.filter(cap => cap.id !== capabilityId));
      setTargetKeys(prev => prev.filter(id => id !== capabilityId));
      message.success('能力移除成功');
    } catch (error) {
      message.error('移除能力失败');
    }
  };

  const handleTransferChange = async (newTargetKeys: string[]) => {
    const addedKeys = newTargetKeys.filter(key => !targetKeys.includes(key));
    const removedKeys = targetKeys.filter(key => !newTargetKeys.includes(key));

    try {
      // 添加新能力
      if (addedKeys.length > 0) {
        await addCapabilitiesToTemplate(template.id, addedKeys);
      }

      // 移除能力
      for (const removedKey of removedKeys) {
        await removeCapabilityFromTemplate(template.id, removedKey);
      }

      setTargetKeys(newTargetKeys);
      
      // 重新加载模板能力
      const caps = await getTemplateCapabilities(template.id);
      setTemplateCapabilities(caps);
      
      message.success('能力更新成功');
    } catch (error) {
      message.error('更新能力失败');
    }
  };

  const prepareTransferData = (): TransferItem[] => {
    return capabilities.map(cap => ({
      key: cap.id,
      title: cap.chineseDescription || cap.name,
      description: cap.originalDescription || '',
      type: cap.type,
    }));
  };

  const renderTransferItem = (item: TransferItem) => {
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
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Text strong className="truncate">{item.title}</Text>
            <Tag color={typeColors[item.type]} size="small">
              {typeLabels[item.type]}
            </Tag>
          </div>
          {item.description && (
            <Text type="secondary" className="text-xs truncate block">
              {item.description}
            </Text>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        title="编辑配置模板"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <div className="space-y-6">
            {/* 基本信息编辑 */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateTemplate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="模板名称"
                    rules={[
                      { required: true, message: '请输入模板名称' },
                      { max: 100, message: '模板名称不能超过100个字符' }
                    ]}
                  >
                    <Input placeholder="输入模板名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item className="mb-0">
                    <Space className="w-full justify-end pt-8">
                      <Button onClick={onCancel}>
                        取消
                      </Button>
                      <Button type="primary" htmlType="submit">
                        保存基本信息
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="模板描述"
                rules={[
                  { max: 500, message: '模板描述不能超过500个字符' }
                ]}
              >
                <Input.TextArea 
                  placeholder="输入模板描述（可选）" 
                  rows={3}
                />
              </Form.Item>
            </Form>

            {/* 能力管理 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Title level={5} className="mb-0">
                  <AppstoreOutlined className="mr-2" />
                  模板能力 ({templateCapabilities.length})
                </Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setTransferVisible(true)}
                >
                  管理能力
                </Button>
              </div>

              {templateCapabilities.length === 0 ? (
                <Card className="border-dashed border-slate-300">
                  <Empty
                    image={<AppstoreOutlined className="text-4xl text-slate-300" />}
                    description="暂无能力"
                  >
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setTransferVisible(true)}
                    >
                      添加能力
                    </Button>
                  </Empty>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templateCapabilities.map((capability) => (
                    <div key={capability.id} className="relative group">
                      <CapabilityCard
                        capability={capability}
                        showActions={false}
                        compact
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<MinusOutlined />}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveCapability(capability.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Spin>
      </Modal>

      {/* 能力选择对话框 */}
      <Modal
        title="管理模板能力"
        open={transferVisible}
        onCancel={() => setTransferVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Transfer
          dataSource={prepareTransferData()}
          targetKeys={targetKeys}
          onChange={handleTransferChange}
          render={renderTransferItem}
          titles={['可用能力', '已选能力']}
          listStyle={{
            width: 350,
            height: 400,
          }}
          showSearch
          searchPlaceholder="搜索能力"
          filterOption={(inputValue, item) =>
            item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
            item.description.toLowerCase().includes(inputValue.toLowerCase())
          }
        />
        <div className="mt-4 text-center">
          <Button onClick={() => setTransferVisible(false)}>
            完成
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default TemplateEditModal;