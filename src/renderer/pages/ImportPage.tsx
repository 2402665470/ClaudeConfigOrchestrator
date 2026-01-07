import React, { useState } from 'react';
import { Tabs, Typography } from 'antd';
import { 
  ShopOutlined, 
  FolderOpenOutlined, 
  GlobalOutlined, 
  FileZipOutlined, 
  CodeOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import MarketplaceImportTab from '../components/import/MarketplaceImportTab';
import LocalDirectoryImportTab from '../components/import/LocalDirectoryImportTab';
import HttpImportTab from '../components/import/HttpImportTab';
import ZipUploadTab from '../components/import/ZipUploadTab';
import JsonEditorTab from '../components/import/JsonEditorTab';
import ImportProgressTab from '../components/import/ImportProgressTab';

const { Title, Paragraph } = Typography;

const ImportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('marketplace');

  const tabItems = [
    {
      key: 'marketplace',
      label: (
        <span>
          <ShopOutlined />
          市场导入
        </span>
      ),
      children: <MarketplaceImportTab />,
    },
    {
      key: 'local',
      label: (
        <span>
          <FolderOpenOutlined />
          本地目录
        </span>
      ),
      children: <LocalDirectoryImportTab />,
    },
    {
      key: 'http',
      label: (
        <span>
          <GlobalOutlined />
          HTTP 链接
        </span>
      ),
      children: <HttpImportTab />,
    },
    {
      key: 'zip',
      label: (
        <span>
          <FileZipOutlined />
          ZIP 上传
        </span>
      ),
      children: <ZipUploadTab />,
    },
    {
      key: 'json',
      label: (
        <span>
          <CodeOutlined />
          JSON 编辑
        </span>
      ),
      children: <JsonEditorTab />,
    },
    {
      key: 'progress',
      label: (
        <span>
          <BarChartOutlined />
          导入进度
        </span>
      ),
      children: <ImportProgressTab />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <Title level={2} className="mb-2 text-slate-800">
          <ShopOutlined className="mr-3 text-primary-600" />
          导入能力
        </Title>
        <Paragraph className="text-slate-600 mb-6">
          从多种来源导入 Claude 插件能力，系统会自动解析并提取原子能力到私人市场。
        </Paragraph>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        className="bg-white rounded-lg shadow-sm border border-slate-200"
        tabBarStyle={{ 
          margin: 0, 
          padding: '0 24px',
          borderBottom: '1px solid #e2e8f0'
        }}
      />
    </div>
  );
};

export default ImportPage;