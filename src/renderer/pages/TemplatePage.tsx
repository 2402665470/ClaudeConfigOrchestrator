import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  message,
  Spin,
  Empty
} from 'antd';
import { 
  FileTextOutlined, 
  PlusOutlined,
  EditOutlined,
  ExportOutlined,
  DeleteOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useTemplatesStore } from '../stores/templatesStore';
import TemplateCard from '../components/templates/TemplateCard';
import TemplateEditModal from '../components/templates/TemplateEditModal';
import type { ConfigTemplate } from '@common/types';
import type { CreateTemplateRequest } from '../../main/services/TemplateService';

const { Title, Paragraph } = Typography;

const TemplatePage: React.FC = () => {
  const {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    deleteTemplate,
    exportTemplateToFile,
    setError
  } = useTemplatesStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigTemplate | null>(null);
  const [createForm] = Form.useForm();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = async (values: CreateTemplateRequest) => {
    try {
      await createTemplate(values);
      setCreateModalVisible(false);
      createForm.resetFields();
      message.success('模板创建成功');
    } catch (error) {
      message.error('创建模板失败');
    }
  };

  const handleEditTemplate = (template: ConfigTemplate) => {
    setSelectedTemplate(template);
    setEditModalVisible(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteTemplate(templateId);
          message.success('模板删除成功');
        } catch (error) {
          message.error('删除模板失败');
        }
      },
    });
  };

  const handleExportTemplate = async (templateId: string, templateName: string) => {
    try {
      // 使用 Electron 的文件对话框选择保存位置
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: '导出模板',
        defaultPath: `${templateName}.json`,
        filters: [
          { name: 'JSON 文件', extensions: ['json'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        await exportTemplateToFile(templateId, result.filePath);
        message.success('模板导出成功');
      }
    } catch (error) {
      message.error('导出模板失败');
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    // TODO: 实现应用模板到项目的功能
    message.info('应用模板功能即将推出');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Title level={4} className="text-red-500 mb-2">加载失败</Title>
          <Paragraph className="text-slate-600 mb-4">{error}</Paragraph>
          <Button onClick={() => {
            setError(null);
            loadTemplates();
          }}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-start">
        <div>
          <Title level={2} className="mb-2 text-slate-800">
            <FileTextOutlined className="mr-3 text-primary-600" />
            配置模板
          </Title>
          <Paragraph className="text-slate-600 mb-0">
            创建和管理配置模板，将多个能力组合成一键部署的配置包。
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          创建模板
        </Button>
      </div>

      {/* 模板列表 */}
      <Spin spinning={loading}>
        {templates.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12">
            <Empty
              image={<AppstoreOutlined className="text-6xl text-slate-300" />}
              description={
                <div>
                  <Title level={4} className="text-slate-500 mb-2">暂无模板</Title>
                  <Paragraph className="text-slate-400 mb-4">
                    创建您的第一个配置模板，组合多个能力
                  </Paragraph>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                  >
                    创建模板
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
                onExport={() => handleExportTemplate(template.id, template.name)}
                onApply={() => handleApplyTemplate(template.id)}
              />
            ))}
          </div>
        )}
      </Spin>

      {/* 创建模板对话框 */}
      <Modal
        title="创建配置模板"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTemplate}
        >
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

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模板对话框 */}
      {selectedTemplate && (
        <TemplateEditModal
          visible={editModalVisible}
          template={selectedTemplate}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedTemplate(null);
          }}
          onSuccess={() => {
            setEditModalVisible(false);
            setSelectedTemplate(null);
            message.success('模板更新成功');
          }}
        />
      )}
    </div>
  );
};

export default TemplatePage;