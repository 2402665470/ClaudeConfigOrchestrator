/**
 * **Feature: claude-config-orchestrator, Import Page Tests**
 * 
 * 测试导入页面的基本功能和组件渲染
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportPage from '../src/renderer/pages/ImportPage';

// Mock electron API
const mockElectronAPI = {
  parseMarketplace: jest.fn(),
  downloadPlugin: jest.fn(),
  importFromLocal: jest.fn(),
  importFromHttp: jest.fn(),
  importFromZip: jest.fn(),
  openDirectory: jest.fn(),
  invoke: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('ImportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders import page with all tabs', () => {
    render(<ImportPage />);
    
    // 检查页面标题
    expect(screen.getByText('导入能力')).toBeInTheDocument();
    
    // 检查所有标签页
    expect(screen.getByText('市场导入')).toBeInTheDocument();
    expect(screen.getByText('本地目录')).toBeInTheDocument();
    expect(screen.getByText('HTTP 链接')).toBeInTheDocument();
    expect(screen.getByText('ZIP 上传')).toBeInTheDocument();
    expect(screen.getByText('JSON 编辑')).toBeInTheDocument();
    expect(screen.getByText('导入进度')).toBeInTheDocument();
  });

  test('displays correct description', () => {
    render(<ImportPage />);
    
    expect(screen.getByText(/从多种来源导入 Claude 插件能力/)).toBeInTheDocument();
  });

  test('has proper tab structure', () => {
    render(<ImportPage />);
    
    // 检查 Tabs 组件是否存在
    const tabsContainer = document.querySelector('.ant-tabs');
    expect(tabsContainer).toBeInTheDocument();
    
    // 检查默认选中的标签页
    const activeTab = document.querySelector('.ant-tabs-tab-active');
    expect(activeTab).toBeInTheDocument();
  });
});