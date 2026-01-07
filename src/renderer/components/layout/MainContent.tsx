import React from 'react';
import { Card, Typography, Space } from 'antd';
import { 
  ImportOutlined, 
  ShopOutlined, 
  FileTextOutlined, 
  ProjectOutlined, 
  DatabaseOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import StoreDemo from '../common/StoreDemo';
import ImportPage from '../../pages/ImportPage';
import MarketPage from '../../pages/MarketPage';
import TemplatePage from '../../pages/TemplatePage';
import { ProjectPage } from '../../pages/ProjectPage';
import { CachePage } from '../../pages/CachePage';

const { Title, Text, Paragraph } = Typography;

interface MainContentProps {
  activeTab: string;
}

const MainContent: React.FC<MainContentProps> = ({ activeTab }) => {

  const renderContent = () => {
    switch (activeTab) {
      case 'import':
        return <ImportPage />;
      case 'market':
        return <MarketPage />;
      case 'templates':
        return <TemplatePage />;
      case 'projects':
        return <ProjectPage />;
      case 'cache':
        return <CachePage />;
      case 'settings':
        return (
          <div className="p-6 space-y-6">
            <div>
              <Title level={2} className="mb-2 text-slate-800">
                <SettingOutlined className="mr-3 text-primary-600" />
                设置
              </Title>
              <Paragraph className="text-slate-600 mb-6">
                配置应用设置，包括翻译服务、存储路径等。
              </Paragraph>
            </div>
            
            <Space direction="vertical" size="large" className="w-full">
              <Card title="翻译设置" className="border-slate-200">
                <Paragraph className="text-slate-600">
                  配置 Google Gemini API 以启用自动翻译功能。
                </Paragraph>
              </Card>
              
              <Card title="存储设置" className="border-slate-200">
                <Paragraph className="text-slate-600">
                  配置数据存储路径和缓存设置。
                </Paragraph>
              </Card>
              
              <Card title="开发者选项" className="border-slate-200">
                <Paragraph className="text-slate-600 mb-4">
                  开发和调试相关的设置选项。
                </Paragraph>
                <StoreDemo />
              </Card>
            </Space>
          </div>
        );
      default:
        return (
          <div className="p-6 space-y-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <Title level={2} className="mb-4 text-slate-800">
                欢迎使用 Claude 配置编排平台
              </Title>
              <Paragraph className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto">
                一个专为 Claude 能力管理而设计的桌面应用，采用能力原子化和配置注入的理念，
                帮助您更好地组织和部署 Claude 插件能力。
              </Paragraph>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center border-slate-200 hover-lift">
                  <div className="text-3xl mb-3">⚡</div>
                  <Title level={4} className="mb-2 text-slate-800">能力原子化</Title>
                  <Text className="text-slate-600">
                    将插件拆解为独立的原子能力，可单独选择和组合
                  </Text>
                </Card>
                
                <Card className="text-center border-slate-200 hover-lift">
                  <div className="text-3xl mb-3">🎯</div>
                  <Title level={4} className="mb-2 text-slate-800">配置注入</Title>
                  <Text className="text-slate-600">
                    直接注入到项目目录，不污染全局环境
                  </Text>
                </Card>
                
                <Card className="text-center border-slate-200 hover-lift">
                  <div className="text-3xl mb-3">🇨🇳</div>
                  <Title level={4} className="mb-2 text-slate-800">中文优先</Title>
                  <Text className="text-slate-600">
                    自动翻译并优先显示中文描述
                  </Text>
                </Card>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {renderContent()}
    </div>
  );
};

export default MainContent;