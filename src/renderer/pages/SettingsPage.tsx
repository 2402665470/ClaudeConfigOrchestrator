import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  message,
  Divider,
  Switch,
  Select,
  InputNumber,
  Row,
  Col,
  Alert,
  Tabs,
  Modal
} from 'antd';
import { 
  SettingOutlined, 
  FolderOutlined, 
  TranslationOutlined,
  DatabaseOutlined,
  ExportOutlined,
  ImportOutlined,
  SaveOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

interface StorageSettings {
  dataDirectory: string;
  cacheDirectory: string;
  maxCacheSize: number; // MB
  autoCleanup: boolean;
  backupRetentionDays: number;
}

interface TranslationSettings {
  enabled: boolean;
  provider: 'gemini';
  apiKey: string;
  model: string;
  batchSize: number;
  rateLimit: number;
}

interface AppSettings {
  storage: StorageSettings;
  translation: TranslationSettings;
}

export const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState('storage');

  // 默认设置
  const defaultSettings: AppSettings = {
    storage: {
      dataDirectory: '~/.claude-orchestrator/data',
      cacheDirectory: '~/.claude-orchestrator/cache',
      maxCacheSize: 1024, // 1GB
      autoCleanup: true,
      backupRetentionDays: 30,
    },
    translation: {
      enabled: false,
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-pro',
      batchSize: 10,
      rateLimit: 60,
    },
  };

  // 加载设置
  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const loadedSettings = await window.electronAPI.settingsService.get();
      
      setSettings(loadedSettings);
      form.setFieldsValue(loadedSettings);
    } catch (error) {
      console.error('加载设置失败:', error);
      message.error('加载设置失败');
      
      // 使用默认设置
      setSettings(defaultSettings);
      form.setFieldsValue(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  // 保存设置
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const values = await form.validateFields();
      
      await window.electronAPI.settingsService.save(values);
      
      setSettings(values);
      message.success('设置保存成功');
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  // 选择目录
  const handleSelectDirectory = async (field: string | string[]) => {
    try {
      const directory = await window.electronAPI.openDirectory();
      if (directory) {
        form.setFieldValue(field, directory);
      }
    } catch (error) {
      message.error('选择目录失败');
    }
  };

  // 重置设置
  const handleReset = () => {
    confirm({
      title: '重置设置',
      content: '确定要重置所有设置到默认值吗？这个操作不可撤销。',
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const resetSettings = await window.electronAPI.settingsService.reset();
          form.setFieldsValue(resetSettings);
          setSettings(resetSettings);
          message.success('设置已重置到默认值');
        } catch (error) {
          console.error('重置设置失败:', error);
          message.error('重置设置失败');
        }
      },
    });
  };

  // 导出设置
  const handleExportSettings = async () => {
    try {
      const values = form.getFieldsValue();
      
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: '导出设置',
        defaultPath: 'claude-orchestrator-settings.json',
        filters: [
          { name: 'JSON 文件', extensions: ['json'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        await window.electronAPI.settingsService.export(result.filePath, values);
        message.success('设置导出成功');
      }
    } catch (error) {
      console.error('导出设置失败:', error);
      message.error('导出设置失败');
    }
  };

  // 导入设置
  const handleImportSettings = async () => {
    try {
      const filePath = await window.electronAPI.openFile([
        { name: 'JSON 文件', extensions: ['json'] }
      ]);

      if (filePath) {
        const importedSettings = await window.electronAPI.settingsService.import(filePath);
        form.setFieldsValue(importedSettings);
        setSettings(importedSettings);
        message.success('设置导入成功');
      }
    } catch (error) {
      console.error('导入设置失败:', error);
      message.error('导入设置失败');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          应用设置
        </Title>
        <Space>
          <Button icon={<ImportOutlined />} onClick={handleImportSettings}>
            导入设置
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExportSettings}>
            导出设置
          </Button>
          <Button onClick={handleReset}>
            重置默认
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存设置
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultSettings}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'storage',
              label: (
                <span>
                  <DatabaseOutlined />
                  存储设置
                </span>
              ),
              children: (
                <Row gutter={[24, 0]}>
                  <Col xs={24} lg={12}>
                    <Card title="目录配置" size="small">
                      <Form.Item
                        label="数据目录"
                        name={['storage', 'dataDirectory']}
                        help="用于存储能力文件、数据库等应用数据"
                        rules={[{ required: true, message: '请设置数据目录' }]}
                      >
                        <Input.Group compact>
                          <Input style={{ width: 'calc(100% - 80px)' }} />
                          <Button 
                            style={{ width: '80px' }}
                            icon={<FolderOutlined />}
                            onClick={() => handleSelectDirectory(['storage', 'dataDirectory'])}
                          >
                            选择
                          </Button>
                        </Input.Group>
                      </Form.Item>

                      <Form.Item
                        label="缓存目录"
                        name={['storage', 'cacheDirectory']}
                        help="用于存储下载的插件文件和翻译缓存"
                        rules={[{ required: true, message: '请设置缓存目录' }]}
                      >
                        <Input.Group compact>
                          <Input style={{ width: 'calc(100% - 80px)' }} />
                          <Button 
                            style={{ width: '80px' }}
                            icon={<FolderOutlined />}
                            onClick={() => handleSelectDirectory(['storage', 'cacheDirectory'])}
                          >
                            选择
                          </Button>
                        </Input.Group>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="缓存管理" size="small">
                      <Form.Item
                        label="最大缓存大小"
                        name={['storage', 'maxCacheSize']}
                        help="超过此大小时会自动清理旧缓存"
                      >
                        <InputNumber
                          min={100}
                          max={10240}
                          step={100}
                          addonAfter="MB"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="自动清理"
                        name={['storage', 'autoCleanup']}
                        valuePropName="checked"
                        help="启用后会定期清理未使用的缓存文件"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="备份保留天数"
                        name={['storage', 'backupRetentionDays']}
                        help="超过此天数的备份会被自动删除"
                      >
                        <InputNumber
                          min={1}
                          max={365}
                          step={1}
                          addonAfter="天"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Alert
                      message="存储设置说明"
                      description={
                        <div>
                          <Paragraph>
                            • <strong>数据目录</strong>：存储应用的核心数据，包括能力文件、数据库、配置等
                          </Paragraph>
                          <Paragraph>
                            • <strong>缓存目录</strong>：存储临时文件，如下载的插件包、翻译缓存等
                          </Paragraph>
                          <Paragraph>
                            • <strong>自动清理</strong>：启用后会在应用启动时检查并清理过期的缓存文件
                          </Paragraph>
                          <Paragraph style={{ marginBottom: 0 }}>
                            • 修改目录设置后需要重启应用才能生效
                          </Paragraph>
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </Col>
                </Row>
              )
            },
            {
              key: 'translation',
              label: (
                <span>
                  <TranslationOutlined />
                  翻译设置
                </span>
              ),
              children: (
                <Row gutter={[24, 0]}>
                  <Col xs={24} lg={12}>
                    <Card title="翻译服务" size="small">
                      <Form.Item
                        label="启用自动翻译"
                        name={['translation', 'enabled']}
                        valuePropName="checked"
                        help="导入能力时自动翻译英文描述为中文"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="翻译服务商"
                        name={['translation', 'provider']}
                        help="目前仅支持 Google Gemini"
                      >
                        <Select disabled>
                          <Select.Option value="gemini">Google Gemini</Select.Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="API Key"
                        name={['translation', 'apiKey']}
                        help="Google Gemini API 密钥"
                        rules={[
                          {
                            validator: (_, value) => {
                              const enabled = form.getFieldValue(['translation', 'enabled']);
                              if (enabled && !value) {
                                return Promise.reject('启用翻译时必须提供 API Key');
                              }
                              return Promise.resolve();
                            }
                          }
                        ]}
                      >
                        <Input.Password placeholder="输入 Gemini API Key" />
                      </Form.Item>

                      <Form.Item
                        label="模型"
                        name={['translation', 'model']}
                        help="使用的 Gemini 模型"
                      >
                        <Select>
                          <Select.Option value="gemini-pro">gemini-pro</Select.Option>
                          <Select.Option value="gemini-pro-latest">gemini-pro-latest</Select.Option>
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="翻译参数" size="small">
                      <Form.Item
                        label="批量大小"
                        name={['translation', 'batchSize']}
                        help="每次批量翻译的条目数量"
                      >
                        <InputNumber
                          min={1}
                          max={50}
                          step={1}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="速率限制"
                        name={['translation', 'rateLimit']}
                        help="每分钟最大请求次数"
                      >
                        <InputNumber
                          min={10}
                          max={300}
                          step={10}
                          addonAfter="次/分钟"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Alert
                      message="翻译设置说明"
                      description={
                        <div>
                          <Paragraph>
                            • <strong>API Key</strong>：需要在 Google AI Studio 中获取 Gemini API 密钥
                          </Paragraph>
                          <Paragraph>
                            • <strong>批量翻译</strong>：为了提高效率，系统会将多个翻译请求合并处理
                          </Paragraph>
                          <Paragraph>
                            • <strong>速率限制</strong>：避免超过 API 的调用限制，建议根据您的配额设置
                          </Paragraph>
                          <Paragraph style={{ marginBottom: 0 }}>
                            • 手动编辑的中文描述不会被自动翻译覆盖
                          </Paragraph>
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Form>
    </div>
  );
};