import React, { useState } from 'react';
import { Card, Upload, Button, Typography, Space, Alert, Progress, message } from 'antd';
import { InboxOutlined, FileZipOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import type { PluginPackage } from '@common/types';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const ZipUploadTab: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<PluginPackage | null>(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择 ZIP 文件');
      return;
    }

    const file = fileList[0];
    if (!file.originFileObj) {
      message.error('文件对象无效');
      return;
    }

    setIsImporting(true);
    setError('');
    setResult(null);

    try {
      // 将文件保存到临时位置
      const tempPath = await saveFileToTemp(file.originFileObj);
      
      const response = await window.electronAPI.importFromZip(tempPath);
      
      if (response.success && response.result) {
        setResult(response.result);
        message.success('ZIP 文件导入成功');
      } else {
        setError(response.error || '导入失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '导入过程中发生错误';
      setError(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  // 将文件保存到临时位置
  const saveFileToTemp = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(buffer);
          
          // 通过 IPC 保存文件到临时位置
          const tempPath = await window.electronAPI.invoke('file:saveToTemp', {
            filename: file.name,
            data: Array.from(uint8Array)
          });
          
          resolve(tempPath);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip,.tar.gz,.tgz',
    fileList,
    beforeUpload: (file) => {
      // 检查文件类型
      const isValidType = file.type === 'application/zip' ||
                         file.type === 'application/x-zip-compressed' ||
                         file.type === 'application/gzip' ||
                         file.name.endsWith('.zip') ||
                         file.name.endsWith('.tar.gz') ||
                         file.name.endsWith('.tgz');

      if (!isValidType) {
        message.error('只支持 ZIP、TAR.GZ 格式的文件');
        return false;
      }

      // 检查文件大小（限制为 100MB）
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('文件大小不能超过 100MB');
        return false;
      }

      // 确保 originFileObj 存在
      const uploadFile: UploadFile = {
        uid: file.uid || String(Date.now()),
        name: file.name,
        status: 'done',
        originFileObj: file,
      };

      setFileList([uploadFile]);
      setError('');
      setResult(null);
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setFileList([]);
      setError('');
      setResult(null);
    },
    showUploadList: {
      showRemoveIcon: true,
      showPreviewIcon: false,
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* 文件上传区域 */}
      <Card title="上传 ZIP 文件" className="border-slate-200">
        <Space direction="vertical" className="w-full" size="middle">
          <Paragraph className="text-slate-600">
            上传包含 Claude 插件的 ZIP 压缩包，系统会自动解压并解析其中的能力配置。
          </Paragraph>
          
          <Dragger {...uploadProps} className="border-dashed border-slate-300 hover:border-primary-400">
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-4xl text-slate-400" />
            </p>
            <p className="ant-upload-text text-slate-600">
              点击或拖拽文件到此区域上传
            </p>
            <p className="ant-upload-hint text-slate-500">
              支持 ZIP、TAR.GZ 格式，文件大小限制 100MB
            </p>
          </Dragger>
          
          {fileList.length > 0 && (
            <Button
              type="primary"
              icon={<FileZipOutlined />}
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
      {isImporting && (
        <Card title="导入进度" className="border-slate-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text className="font-medium">解析中...</Text>
            </div>
            <Progress percent={50} status="active" showInfo={false} />
            <Text className="text-sm text-slate-500">
              正在解压并解析 ZIP 文件内容...
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
                    <Text className="text-slate-500">文件：</Text>
                    <Text className="font-medium">{fileList[0]?.name}</Text>
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
            <span>支持拖拽上传或点击选择 ZIP、TAR.GZ 格式的压缩包</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>文件大小限制为 100MB，确保压缩包包含完整的插件结构</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>系统会自动解压并扫描其中的 .claude/ 目录结构</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>特别适合导入从其他地方下载的插件包或自己打包的能力集合</span>
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

export default ZipUploadTab;