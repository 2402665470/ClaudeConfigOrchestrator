import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Checkbox, 
  Typography, 
  Space, 
  Alert, 
  Progress,
  Tag,
  Divider,
  message
} from 'antd';
import { 
  SearchOutlined, 
  DownloadOutlined, 
  GithubOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { PluginInfo, ImportProgress } from '@common/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface MarketplaceImportTabProps {}

const MarketplaceImportTab: React.FC<MarketplaceImportTabProps> = () => {
  const [marketAddress, setMarketAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, ImportProgress>>({});
  const [error, setError] = useState<string>('');

  // 解析市场地址
  const handleParseMarketplace = async () => {
    if (!marketAddress.trim()) {
      message.warning('请输入市场地址');
      return;
    }

    setIsLoading(true);
    setError('');
    setPlugins([]);
    setSelectedPlugins([]);

    try {
      // 调用主进程的导入服务
      const result = await window.electronAPI.parseMarketplace(marketAddress.trim());
      
      if (result.success && result.plugins) {
        setPlugins(result.plugins);
        message.success(`成功解析到 ${result.plugins.length} 个插件`);
      } else {
        setError(result.error || '解析失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 选择/取消选择插件
  const handlePluginSelect = (pluginName: string, checked: boolean) => {
    if (checked) {
      setSelectedPlugins(prev => [...prev, pluginName]);
    } else {
      setSelectedPlugins(prev => prev.filter(name => name !== pluginName));
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlugins(plugins.map(p => p.name));
    } else {
      setSelectedPlugins([]);
    }
  };

  // 批量下载选中的插件
  const handleBatchDownload = async () => {
    if (selectedPlugins.length === 0) {
      message.warning('请选择要下载的插件');
      return;
    }

    const selectedPluginInfos = plugins.filter(p => selectedPlugins.includes(p.name));
    
    for (const plugin of selectedPluginInfos) {
      try {
        // 初始化进度
        setDownloadProgress(prev => ({
          ...prev,
          [plugin.name]: {
            stage: 'downloading',
            percent: 0,
            message: '开始下载...'
          }
        }));

        // 调用主进程下载插件
        const result = await window.electronAPI.downloadPlugin(
          plugin,
          (progress: ImportProgress) => {
            setDownloadProgress(prev => ({
              ...prev,
              [plugin.name]: progress
            }));
          }
        );

        if (result.success) {
          setDownloadProgress(prev => ({
            ...prev,
            [plugin.name]: {
              stage: 'complete',
              percent: 100,
              message: '下载完成'
            }
          }));
          message.success(`${plugin.name} 下载完成`);
        } else {
          setDownloadProgress(prev => ({
            ...prev,
            [plugin.name]: {
              stage: 'failed',
              percent: 0,
              message: result.error || '下载失败'
            }
          }));
          message.error(`${plugin.name} 下载失败: ${result.error}`);
        }
      } catch (err) {
        setDownloadProgress(prev => ({
          ...prev,
          [plugin.name]: {
            stage: 'failed',
            percent: 0,
            message: err instanceof Error ? err.message : '下载过程中发生错误'
          }
        }));
        message.error(`${plugin.name} 下载失败`);
      }
    }
  };

  // 获取进度状态颜色
  const getProgressStatus = (stage: string) => {
    switch (stage) {
      case 'downloading':
      case 'extracting':
      case 'parsing':
      case 'translating':
        return 'active';
      case 'complete':
        return 'success';
      case 'failed':
        return 'exception';
      default:
        return 'normal';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 地址输入区域 */}
      <Card title="市场地址" className="border-slate-200">
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Paragraph className="text-slate-600 mb-3">
              支持以下格式的市场地址：
            </Paragraph>
            <ul className="text-sm text-slate-500 space-y-1 mb-4">
              <li>• Claude 命令格式：<code className="bg-slate-100 px-2 py-1 rounded">anthropics/claude-code</code></li>
              <li>• GitHub URL：<code className="bg-slate-100 px-2 py-1 rounded">https://github.com/anthropics/claude-code</code></li>
            </ul>
          </div>
          
          <TextArea
            placeholder="请输入市场地址，例如：anthropics/claude-code 或 https://github.com/anthropics/claude-code"
            value={marketAddress}
            onChange={(e) => setMarketAddress(e.target.value)}
            rows={3}
            className="font-mono"
          />
          
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleParseMarketplace}
            loading={isLoading}
            size="large"
          >
            解析市场
          </Button>
        </Space>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="解析失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {/* 插件列表 */}
      {plugins.length > 0 && (
        <Card 
          title={
            <Space>
              <span>发现的插件 ({plugins.length})</span>
              <Checkbox
                checked={selectedPlugins.length === plugins.length}
                indeterminate={selectedPlugins.length > 0 && selectedPlugins.length < plugins.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选
              </Checkbox>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleBatchDownload}
              disabled={selectedPlugins.length === 0}
            >
              批量下载 ({selectedPlugins.length})
            </Button>
          }
          className="border-slate-200"
        >
          <List
            dataSource={plugins}
            renderItem={(plugin) => {
              const progress = downloadProgress[plugin.name];
              const isSelected = selectedPlugins.includes(plugin.name);
              
              return (
                <List.Item
                  className={`border-b border-slate-100 last:border-b-0 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handlePluginSelect(plugin.name, e.target.checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Title level={5} className="mb-0">
                              {plugin.name}
                            </Title>
                            {plugin.version && (
                              <Tag color="blue">{plugin.version}</Tag>
                            )}
                          </div>
                          <Paragraph className="text-slate-600 mb-2">
                            {plugin.description || '暂无描述'}
                          </Paragraph>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            {plugin.author && (
                              <span>
                                <InfoCircleOutlined className="mr-1" />
                                作者: {plugin.author}
                              </span>
                            )}
                            {plugin.repository && (
                              <span>
                                <GithubOutlined className="mr-1" />
                                仓库
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 下载进度 */}
                    {progress && (
                      <div className="mt-3 p-3 bg-slate-50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <Text className="text-sm font-medium">
                            {progress.stage === 'downloading' && '下载中...'}
                            {progress.stage === 'extracting' && '解压中...'}
                            {progress.stage === 'parsing' && '解析中...'}
                            {progress.stage === 'translating' && '翻译中...'}
                            {progress.stage === 'complete' && '完成'}
                            {progress.stage === 'failed' && '失败'}
                          </Text>
                          <Text className="text-sm text-slate-500">
                            {progress.percent}%
                          </Text>
                        </div>
                        <Progress
                          percent={progress.percent}
                          status={getProgressStatus(progress.stage)}
                          size="small"
                          showInfo={false}
                        />
                        <Text className="text-xs text-slate-500 mt-1 block">
                          {progress.message}
                        </Text>
                      </div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      {/* 使用说明 */}
      <Card title="使用说明" className="border-slate-200">
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>输入市场地址后点击"解析市场"按钮，系统会自动获取该市场中的所有插件</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>选择需要的插件后点击"批量下载"，系统会依次下载、解析并翻译每个插件</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>下载完成的插件会自动解析为原子能力并保存到私人市场</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>如果配置了翻译服务，系统会自动为能力生成中文描述</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarketplaceImportTab;