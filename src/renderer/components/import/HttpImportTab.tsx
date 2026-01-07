import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert, Progress, message } from 'antd';
import { GlobalOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { PluginPackage, ImportProgress } from '@common/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const HttpImportTab: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<PluginPackage | null>(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!url.trim()) {
      message.warning('请输入 HTTP 链接');
      return;
    }

    // 简单的 URL 验证
    try {
      new URL(url.trim());
    } catch {
      message.error('请输入有效的 HTTP 链接');
      return;
    }

    setIsImporting(true);
    setError('');
    setResult(null);
    setImportProgress({
      stage: 'downloading',
      percent: 0,
      message: '开始下载...'
    });

    try {
      const response = await window.electronAPI.importFromHttp(
        url.trim(),
        (progress: ImportProgress) => {
          setImportProgress(progress);
        }
      );
      
      if (response.success && response.result) {
        setResult(response.result);
        setImportProgress({
          stage: 'complete',
          percent: 100,
          message: '导入完成'
        });
        message.success('HTTP 链接导入成功');
      } else {
        setError(response.error || '导入失败');
        setImportProgress({
          stage: 'failed',
          percent: 0,
          message: response.error || '导入失败'
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '导入过程中发生错误';
      setError(errorMsg);
      setImportProgress({
        stage: 'failed',
        percent: 0,
        message: errorMsg
      });
    } finally {
      setIsImporting(false);
    }
  };

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
      {/* URL 输入区域 */}
      <Card title="HTTP 链接导入" className="border-slate-200">
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Paragraph className="text-slate-600 mb-3">
              输入指向 Claude 插件包的 HTTP 直链，支持以下格式：
            </Paragraph>
            <ul className="text-sm text-slate-500 space-y-1 mb-4">
              <li>• ZIP 压缩包：<code className="bg-slate-100 px-2 py-1 rounded">https://example.com/plugin.zip</code></li>
              <li>• TAR.GZ 压缩包：<code className="bg-slate-100 px-2 py-1 rounded">https://example.com/plugin.tar.gz</code></li>
              <li>• GitHub 发布包：<code className="bg-slate-100 px-2 py-1 rounded">https://github.com/owner/repo/archive/main.zip</code></li>
            </ul>
          </div>
          
          <TextArea
            placeholder="请输入 HTTP 链接，例如：https://github.com/owner/repo/archive/main.zip"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            rows={3}
            className="font-mono"
          />
          
          <Button
            type="primary"
            icon={isImporting ? <LoadingOutlined /> : <GlobalOutlined />}
            onClick={handleImport}
            loading={isImporting}
            size="large"
          >
            开始导入
          </Button>
        </Space>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="导入失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {/* 导入进度 */}
      {importProgress && (
        <Card title="导入进度" className="border-slate-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text className="font-medium">
                {importProgress.stage === 'downloading' && '下载中...'}
                {importProgress.stage === 'extracting' && '解压中...'}
                {importProgress.stage === 'parsing' && '解析中...'}
                {importProgress.stage === 'translating' && '翻译中...'}
                {importProgress.stage === 'complete' && '完成'}
                {importProgress.stage === 'failed' && '失败'}
              </Text>
              <Text className="text-slate-500">
                {importProgress.percent}%
              </Text>
            </div>
            <Progress
              percent={importProgress.percent}
              status={getProgressStatus(importProgress.stage)}
              showInfo={false}
            />
            <Text className="text-sm text-slate-500">
              {importProgress.message}
            </Text>
          </div>
        </Card>
      )}

      {/* 导入结果 */}
      {result && (
        <Card title="导入结果" className="border-slate-200">
          <div className="space-y-4">
            <div>
              <Title level={5} className="mb-2">插件信息</Title>
              <div className="bg-slate-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Text className="text-slate-500">名称：</Text>
                    <Text className="font-medium">{result.info.name}</Text>
                  </div>
                  <div>
                    <Text className="text-slate-500">版本：</Text>
                    <Text className="font-medium">{result.info.version}</Text>
                  </div>
                  <div className="col-span-2">
                    <Text className="text-slate-500">描述：</Text>
                    <Text className="font-medium">{result.info.description}</Text>
                  </div>
                  <div className="col-span-2">
                    <Text className="text-slate-500">来源：</Text>
                    <Text className="font-medium font-mono text-xs">{url}</Text>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Title level={5} className="mb-2">提取的能力 ({result.capabilities.length})</Title>
              <div className="space-y-2">
                {result.capabilities.map((capability, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded flex items-center justify-between">
                    <div>
                      <Text className="font-medium">{capability.name}</Text>
                      <Text className="text-sm text-slate-500 ml-2">({capability.type})</Text>
                    </div>
                    <Text className="text-xs text-slate-400">
                      {capability.originalDescription?.substring(0, 50)}...
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 使用说明 */}
      <Card title="使用说明" className="border-slate-200">
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>输入指向 Claude 插件包的 HTTP 直链</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>支持 ZIP、TAR.GZ 等常见压缩格式</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>系统会自动下载、解压并解析插件内容</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>导入过程中会显示实时进度（下载→解压→解析→翻译）</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>导入完成后，所有能力会自动保存到私人市场</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HttpImportTab;