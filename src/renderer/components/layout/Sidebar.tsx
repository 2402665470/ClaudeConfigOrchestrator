import React, { useState } from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  ImportOutlined,
  ShopOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SettingOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  onMenuSelect?: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuSelect }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'import',
      icon: <ImportOutlined className="text-base" />,
      label: '导入能力',
    },
    {
      key: 'market',
      icon: <ShopOutlined className="text-base" />,
      label: '私人市场',
    },
    {
      key: 'templates',
      icon: <FileTextOutlined className="text-base" />,
      label: '配置模板',
    },
    {
      key: 'projects',
      icon: <ProjectOutlined className="text-base" />,
      label: '项目管理',
    },
    {
      key: 'cache',
      icon: <DatabaseOutlined className="text-base" />,
      label: '缓存管理',
    },
    {
      key: 'settings',
      icon: <SettingOutlined className="text-base" />,
      label: '设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    onMenuSelect?.(key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={240}
      collapsedWidth={64}
      className="bg-white border-r border-slate-200 shadow-sm"
    >
      {/* 头部区域 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <AppstoreOutlined className="text-xl text-primary-600" />
            <div>
              <Text className="text-lg font-semibold text-slate-800 block leading-tight">
                Claude 配置编排
              </Text>
              <Text className="text-xs text-slate-500">
                能力原子化管理平台
              </Text>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center w-full">
            <AppstoreOutlined className="text-xl text-primary-600" />
          </div>
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center text-slate-600 hover:text-primary-600 hover:bg-primary-50"
          size="small"
        />
      </div>
      
      {/* 菜单区域 */}
      <div className="py-2">
        <Menu
          mode="inline"
          defaultSelectedKeys={['import']}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0"
          inlineIndent={16}
        />
      </div>
      
      {/* 底部信息 */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-slate-50">
          <Text className="text-xs text-slate-500 block text-center">
            版本 0.1.0
          </Text>
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;