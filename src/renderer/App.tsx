import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './components/layout/Sidebar';
import MainContent from './components/layout/MainContent';

const { Content } = Layout;

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('import');

  const handleMenuSelect = (key: string) => {
    setActiveMenu(key);
  };

  return (
    <Layout className="min-h-screen">
      <Sidebar onMenuSelect={handleMenuSelect} />
      <Layout>
        <Content className="bg-gray-50">
          <MainContent activeTab={activeMenu} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;