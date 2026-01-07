import { describe, it, expect, beforeEach } from 'vitest';
import { useCapabilitiesStore } from '../src/renderer/stores/capabilitiesStore';
import type { Capability } from '../src/common/types';

describe('Market Store Functions', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useCapabilitiesStore.getState();
    store.setCapabilities([]);
    store.clearSearch();
  });

  it('should filter capabilities by keyword', () => {
    const capabilities: Capability[] = [
      {
        id: 'test-1',
        type: 'skill',
        name: 'React Component Generator',
        originalDescription: 'Generate React components',
        chineseDescription: '生成 React 组件',
        translationStatus: 'manually_edited',
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
        originalDescription: 'Vue.js helper utilities',
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

    const filtered = store.getFilteredCapabilities();
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('React Component Generator');
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

    const filtered = store.getFilteredCapabilities();
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe('skill');
  });

  it('should get capability types correctly', () => {
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

    const types = store.getCapabilityTypes();
    const counts = store.getCapabilityCountByType();
    
    expect(types).toContain('skill');
    expect(types).toContain('command');
    expect(counts.skill).toBe(1);
    expect(counts.command).toBe(1);
  });

  it('should provide search suggestions', () => {
    const capabilities: Capability[] = [
      {
        id: 'test-1',
        type: 'skill',
        name: 'React Component Generator',
        originalDescription: 'Generate React components',
        translationStatus: 'pending',
        sourcePlugin: 'react-toolkit',
        author: 'React Team',
        content: { type: 'skill', folderPath: 'skills/react', files: [] },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const store = useCapabilitiesStore.getState();
    store.setCapabilities(capabilities);

    const suggestions = store.getSearchSuggestions('react');
    
    expect(suggestions).toContain('React Component Generator');
    expect(suggestions).toContain('react-toolkit');
    expect(suggestions).toContain('React Team');
  });

  it('should clear search correctly', () => {
    const store = useCapabilitiesStore.getState();
    store.setSearchQuery({ keyword: 'test', type: 'skill' });
    
    expect(store.searchQuery.keyword).toBe('test');
    expect(store.searchQuery.type).toBe('skill');
    
    store.clearSearch();
    
    expect(store.searchQuery.keyword).toBeUndefined();
    expect(store.searchQuery.type).toBeUndefined();
  });
});