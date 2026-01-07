import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert, Select, Form, message } from 'antd';
import { CodeOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { CapabilityType } from '@common/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface JsonEditorTabProps {}

const JsonEditorTab: React.FC<JsonEditorTabProps> = () => {
  const [form] = Form.useForm();
  const [jsonContent, setJsonContent] = useState('');
  const [capabilityType, setCapabilityType] = useState<CapabilityType>('setting');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // JSON 模板
  const jsonTemplates = {
    setting: {
      name: 'permissions-example',
      description: '权限配置示例',
      content: JSON.stringify({
        permissions: {
          allow: [
            "Bash(npm run lint)",
            "Read(~/.zshrc)"
          ],
          deny: [
            "Bash(curl:*)",
            "Read(./.env)"
          ]
        }
      }, null, 2)
    },
    hook: {
      name: 'auto-test-hook',
      description: '自动测试钩子示例',
      content: JSON.stringify({
        name: "Auto Test on Save",
        description: "Run tests when files are saved",
        trigger: {
          event: "file:save",
          pattern: "**/*.{js,ts,jsx,tsx}"
        },
        action: {
          type: "command",
          command: "npm test"
        }
      }, null, 2)
    },
    mcp: {
      name: 'n8n-remote-server',
      description: 'N8N 远程服务器示例',
      content: JSON.stringify({
        "n8n-remote": {
          command: "npx",
          args: ["-y", "mcp-remote@latest", "connect", "http://localhost:3003/mcp"],
          env: {
            MCP_AUTH_TOKEN: "your-auth-token-here"
          }
        }
      }, null, 2)
    }
  };

  const handleTypeChange = (type: CapabilityType) => {
    setCapabilityType(type);
    const template = jsonTemplates[type as keyof typeof jsonTemplates];
    if (template) {
      setJsonContent(template.content);
      form.setFieldsValue({
        name: template.name,
        description: template.description
      });
    }
    setError('');
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证 JSON 格式
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonContent);
      } catch (err) {
        setError('JSON 格式无效，请检查语法');
        return;
      }

      // 根据类型进行特定验证
      if (capabilityType === 'mcp') {
        // 验证 MCP 配置必须包含 command 字段
        const servers = Object.values(parsedJson);
        for (const server of servers) {
          if (typeof server === 'object' && server !== null) {
            const serverConfig = server as any;
            if (!serverConfig.command) {
              setError('MCP 配置必须包含 command 字段');
              return;
            }
          }
        }
      }

      setIsSaving(true);
      setError('');

      // 调用主进程保存自定义能力
      const result = await window.electronAPI.invoke('capability:createCustom', {
        type: capabilityType,
        name: values.name,
        description: values.description,
        content: parsedJson
      });

      if (result.success) {
        setSuccess(true);
        message.success('自定义能力已保存到私人市场');
        
        // 清空表单
        form.resetFields();
        setJsonContent('');
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'Validation failed') {
        setError(err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (err) {
      message.error('JSON 格式无效，无法格式化');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 类型选择和基本信息 */}
      <Card title="创建自定义能力" className="border-slate-200">
        <Form form={form} layout="vertical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              label="能力类型"
              name="type"
              initialValue={capabilityType}
            >
              <Select
                value={capabilityType}
                onChange={handleTypeChange}
                size="large"
              >
                <Option value="setting">Setting (设置)</Option>
                <Option value="hook">Hook (钩子)</Option>
                <Option value="mcp">MCP Server</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label="能力名称"
              name="name"
              rules={[{ required: true, message: '请输入能力名称' }]}
            >
              <Input placeholder="例如：permissions-config" size="large" />
            </Form.Item>
            
            <Form.Item
              label="中文描述"
              name="description"
              rules={[{ required: true, message: '请输入中文描述' }]}
            >
              <Input placeholder="例如：权限配置" size="large" />
            </Form.Item>
          </div>
        </Form>
      </Card>

      {/* JSON 编辑器 */}
      <Card 
        title="JSON 配置编辑器" 
        extra={
          <Space>
            <Button onClick={formatJson} size="small">
              格式化
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={isSaving}
            >
              保存到私人市场
            </Button>
          </Space>
        }
        className="border-slate-200"
      >
        <Space direction="vertical" className="w-full" size="middle">
          <div className="bg-slate-50 p-3 rounded text-sm text-slate-600">
            <Text className="font-medium">当前类型：{capabilityType}</Text>
            <div className="mt-2">
              {capabilityType === 'setting' && '配置 Claude 的权限、环境变量等设置'}
              {capabilityType === 'hook' && '定义文件保存、消息发送等事件的自动化钩子'}
              {capabilityType === 'mcp' && '配置 Model Context Protocol 服务器连接'}
            </div>
          </div>
          
          <TextArea
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            placeholder="请输入 JSON 配置..."
            rows={16}
            className="font-mono text-sm"
            style={{ resize: 'vertical' }}
          />
        </Space>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="保存失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {/* 成功提示 */}
      {success && (
        <Alert
          message="保存成功"
          description="自定义能力已成功保存到私人市场，您可以在私人市场页面查看和管理。"
          type="success"
          showIcon
          closable
          onClose={() => setSuccess(false)}
        />
      )}

      {/* 配置说明 */}
      <Card title="配置说明" className="border-slate-200">
        <div className="space-y-4">
          <div>
            <Title level={5} className="mb-2">Setting 类型</Title>
            <div className="bg-slate-50 p-3 rounded text-sm space-y-2">
              <div>• <code>permissions</code>: 配置允许和禁止的操作</div>
              <div>• <code>env</code>: 设置环境变量</div>
              <div>• <code>companyAnnouncements</code>: 公司公告配置</div>
            </div>
          </div>
          
          <div>
            <Title level={5} className="mb-2">Hook 类型</Title>
            <div className="bg-slate-50 p-3 rounded text-sm space-y-2">
              <div>• <code>trigger</code>: 定义触发条件（事件类型、文件模式等）</div>
              <div>• <code>action</code>: 定义执行动作（命令、消息等）</div>
            </div>
          </div>
          
          <div>
            <Title level={5} className="mb-2">MCP Server 类型</Title>
            <div className="bg-slate-50 p-3 rounded text-sm space-y-2">
              <div>• <code>command</code>: 必需，服务器启动命令</div>
              <div>• <code>args</code>: 可选，命令参数数组</div>
              <div>• <code>env</code>: 可选，环境变量对象</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明" className="border-slate-200">
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>选择能力类型后会自动加载对应的 JSON 模板</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>在编辑器中修改 JSON 配置，点击"格式化"可以美化代码</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>系统会自动验证 JSON 格式和必需字段</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>保存成功后，能力会出现在私人市场中，可以应用到项目</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JsonEditorTab;