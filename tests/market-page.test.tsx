/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useCapabilitiesStore } from '../src/renderer/stores/capabilitiesStore';
import MarketPage from '../src/renderer/pages/MarketPage';
import type { Capability } from '../src/common/types';

// Mock Ant Design components that might cause issues in tests
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

// Mock the market components to avoid complex rendering issues
vi.mock('../src/renderer/components/market/MarketSearchBar', () => ({
  default: () => React.createElement('div', { 'data-testid': 'search-bar' }, 'Search Bar'),
}));

vi.mock('../src/renderer/components/market/CapabilityDetailModal', () => ({
  default: () => React.createElement('div', { 'data-testid': 'detail-modal' }, 'Detail Modal'),
}));

vi.mock('../src/renderer/components/common/CapabilityCard', () => ({
  default: ({ capability }: { capability: Capability }) => 
    React.createElement('div', { 'data-testid': 'capability-card' }, capability.name),
}));

describe('MarketPage', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useCapabilitiesStore.getState();
    store.setCapabilities([]);
    store.clearSearch();
  });

  it('should render empty state when no capabilities', () => {
    render(<MarketPage />);
    
    expect(screen.getByText('私人市场')).toBeInTheDocument();
    expect(screen.getByText('暂无能力')).toBeInTheDocument();
  });

  it('should display capabilities when available', () => {
    const sampleCapability: Capability = {
      id: 'test-1',
      type: 'skill',
      name: 'Test Skill',
      originalDescription: 'A test skill for demonstration',
      chineseDescription: '用于演示的测试技能',
      translationStatus: 'manually_edited',
      sourcePlugin: 'test-plugin',
      content: {
        type: 'skill',
        folderPath: 'skills/test',
        files: ['SKILL.md'],
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const store = useCapabilitiesStore.getState();
    store.setCapabilities([sampleCapability]);

    render(<MarketPage />);
    
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.getByText('用于演示的测试技能')).toBeInTheDocument();
  });

  it('should filter capabilities by search query', () => {
    const capabilities: Capability[] = [
      {
        id: 'test-1',
        type: 'skill',
        name: 'React Component',
        originalDescription: 'React component generator',
        translationStatus: 'pending',
        sourcePlugin: 'react-tools',
        content: { type: 'skill', folderPath: 'skills/react', files: [] },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'test-2',
        type: 'command',
        name: 'Vue Helper',
        originalDescription: 'Vue.js helper command',
        translationStatus: 'pending',
        sourcePlugin: 'vue-tools',
        content: { type: 'command', filePath: 'commands/vue.md', markdown: '' },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const store = useCapabilitiesStore.getState();
    store.setCapabilities(capabilities);
    store.setSearchQuery({ keyword: 'react' });

    render(<MarketPage />);
    
    expect(screen.getByText('React Component')).toBeInTheDocument();
    expect(screen.queryByText('Vue Helper')).not.toBeInTheDocument();
  });

  it('should filter capabilities by type', () => {
    const capabilities: Capability[] = [
      {
        id: 'test-1',
        type: 'skill',
        name: 'Test Skill',
        originalDescription: 'A skill',
        translationStatus: 'pending',
        sourcePlugin: 'test',
        content: { type: 'skill', folderPath: 'skills/test', files: [] },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'test-2',
        type: 'command',
        name: 'Test Command',
        originalDescription: 'A command',
        translationStatus: 'pending',
        sourcePlugin: 'test',
        content: { type: 'command', filePath: 'commands/test.md', markdown: '' },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const store = useCapabilitiesStore.getState();
    store.setCapabilities(capabilities);
    store.setSearchQuery({ type: 'skill' });

    render(<MarketPage />);
    
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.queryByText('Test Command')).not.toBeInTheDocument();
  });
});