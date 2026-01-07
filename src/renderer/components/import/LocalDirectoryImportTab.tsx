import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, Progress, message } from 'antd';
import { FolderOpenOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { PluginPackage, ImportProgress } from '@common/types';

const { Title, Text, Paragraph } = Typography;

const LocalDirectoryImportTab: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<PluginPackage | null>(null);
  const [error, setError] = useState('');

  const handleSelectDirectory = async () => {
    try {
      const path = await window.electronAPI.openDirectory();
      if (path) {
        setSelectedPath(path);
        setError('');
        setResult(null);
      }
    } catch (err) {
      message.error('选择目录失败');
    }
  };

  const handleImport = async () => {
    if (!selectedPath) {
      message.warning('请先选择目录');
      return;
    }

    setIsImporting(true);
    setError('');
    setResult(null);
    setImportProgress({
      stage: 'parsing',
      percent: 0,
      message: '开始解析目录...'
    });

    try {
      const response = await window.electronAPI.importFromLocal(selectedPath);
      
      if (response.success && response.result) {
        setResult(response.result);
        setImportProgress({
          stage: 'complete',
          percent: 100,
          message: '导入完成'
        });
        message.success('本地目录导入成功');
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
      {/* 目录选择区域 */}
      <Card title="选择本地目录" className="border-slate-200">
        <Space direction="vertical" className="w-full" size="middle">
          <Paragraph className="text-slate-600">
            选择包含 Claude 插件的本地目录，系统会自动扫描并解析其中的能力配置。
          </Paragraph>
          
          <div className="flex items-center space-x-4">
            <Button
              type="primary"
              icon={<FolderOpenOutlined />}
              onClick={handleSelectDirectory}
              size="large"
            >
              选择目录
            </Button>
            
            {selectedPath && (
              <div className="flex-1">
                <Text className="text-sm text-slate-500">已选择目录：</Text>
                <div className="bg-slate-100 p-2 rounded mt-1 font-mono text-sm">
                  {selectedPath}
                </div>
              </div>
            )}
          </div>
          
          {selectedPath && (
            <Button
              type="primary"
              icon={isImporting ? <LoadingOutlined /> : <CheckCircleOutlined />}
              onClick={handleImport}
              loading={isImporting}
              size="large"
            >
              开始导入
            </Button>
          )}
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
            <span>点击"选择目录"按钮，选择包含 Claude 插件的本地目录</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>系统会自动扫描目录中的 .claude/ 结构，识别所有能力类型</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>支持的能力类型：Skills、Commands、Agents、Hooks、MCP Servers、Settings</span>
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

export default LocalDirectoryImportTab;