import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Capability, CapabilityType, TranslationStatus } from '@common/types';
import { getDisplayDescription } from '@common/utils';

interface SearchQuery {
  keyword?: string;
  type?: CapabilityType;
  sourcePlugin?: string;
  translationStatus?: TranslationStatus;
}

interface CapabilitiesState {
  // State
  capabilities: Capability[];
  loading: boolean;
  error: string | null;
  searchQuery: SearchQuery;
  selectedCapabilities: string[];

  // Actions
  setCapabilities: (capabilities: Capability[]) => void;
  addCapability: (capability: Capability) => void;
  updateCapability: (id: string, updates: Partial<Capability>) => void;
  removeCapability: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: SearchQuery) => void;
  clearSearch: () => void;
  selectCapability: (id: string) => void;
  deselectCapability: (id: string) => void;
  selectAllCapabilities: () => void;
  clearSelection: () => void;
  
  // Computed
  getFilteredCapabilities: () => Capability[];
  getCapabilityById: (id: string) => Capability | undefined;
  getCapabilitiesByType: (type: CapabilityType) => Capability[];
  getCapabilityTypes: () => CapabilityType[];
  getCapabilityCountByType: () => Record<CapabilityType, number>;
  searchCapabilities: (keyword: string) => void;
  getSearchSuggestions: (keyword: string) => string[];
  updateChineseDescription: (id: string, chineseDescription: string) => Promise<void>;
  clearChineseDescription: (id: string) => Promise<void>;
}

// 示例数据用于演示
const sampleCapabilities: Capability[] = [
  {
    id: 'sample-1',
    type: 'skill',
    name: 'React 组件生成器',
    originalDescription: 'A powerful React component generator that creates modern, accessible components with TypeScript support.',
    chineseDescription: '一个强大的 React 组件生成器，可以创建现代化、可访问的 TypeScript 组件。',
    translationStatus: 'manually_edited',
    sourcePlugin: 'react-toolkit',
    version: '1.2.0',
    author: 'React Team',
    content: {
      type: 'skill',
      folderPath: 'skills/react-generator',
      files: ['SKILL.md', 'templates/', 'utils/'],
    },
    metadata: {
      tags: ['react', 'typescript', 'components'],
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'sample-2',
    type: 'command',
    name: 'API 文档生成',
    originalDescription: 'Generate comprehensive API documentation from your code comments and type definitions.',
    chineseDescription: '从代码注释和类型定义生成全面的 API 文档。',
    translationStatus: 'auto_translated',
    sourcePlugin: 'docs-generator',
    author: 'Docs Team',
    content: {
      type: 'command',
      filePath: 'commands/api-docs.md',
      markdown: '# API Documentation Generator\n\nThis command generates API docs...',
    },
    metadata: {},
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'sample-3',
    type: 'mcp',
    name: 'Database Connection',
    originalDescription: 'MCP server for database operations with support for multiple database types.',
    translationStatus: 'pending',
    sourcePlugin: 'database-toolkit',
    content: {
      type: 'mcp',
      serverName: 'database-server',
      config: {
        command: 'npx',
        args: ['database-mcp-server'],
        env: {
          DB_TYPE: 'postgresql',
          DB_HOST: 'localhost',
        },
      },
    },
    metadata: {},
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

export const useCapabilitiesStore = create<CapabilitiesState>()(
  devtools(
    (set, get) => ({
      // Initial state with sample data
      capabilities: sampleCapabilities,
      loading: false,
      error: null,
      searchQuery: {},
      selectedCapabilities: [],

      // Actions
      setCapabilities: (capabilities) =>
        set({ capabilities }, false, 'setCapabilities'),

      addCapability: (capability) =>
        set(
          (state) => ({
            capabilities: [...state.capabilities, capability],
          }),
          false,
          'addCapability'
        ),

      updateCapability: (id, updates) =>
        set(
          (state) => ({
            capabilities: state.capabilities.map((cap) =>
              cap.id === id ? { ...cap, ...updates } : cap
            ),
          }),
          false,
          'updateCapability'
        ),

      removeCapability: (id) =>
        set(
          (state) => ({
            capabilities: state.capabilities.filter((cap) => cap.id !== id),
            selectedCapabilities: state.selectedCapabilities.filter(
              (capId) => capId !== id
            ),
          }),
          false,
          'removeCapability'
        ),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, 'setSearchQuery'),

      clearSearch: () => set({ searchQuery: {} }, false, 'clearSearch'),

      selectCapability: (id) =>
        set(
          (state) => ({
            selectedCapabilities: state.selectedCapabilities.includes(id)
              ? state.selectedCapabilities
              : [...state.selectedCapabilities, id],
          }),
          false,
          'selectCapability'
        ),

      deselectCapability: (id) =>
        set(
          (state) => ({
            selectedCapabilities: state.selectedCapabilities.filter(
              (capId) => capId !== id
            ),
          }),
          false,
          'deselectCapability'
        ),

      selectAllCapabilities: () =>
        set(
          (state) => ({
            selectedCapabilities: state.capabilities.map((cap) => cap.id),
          }),
          false,
          'selectAllCapabilities'
        ),

      clearSelection: () =>
        set({ selectedCapabilities: [] }, false, 'clearSelection'),

      // Computed getters
      getFilteredCapabilities: () => {
        const { capabilities, searchQuery } = get();
        let filtered = capabilities;

        if (searchQuery.keyword) {
          const keyword = searchQuery.keyword.toLowerCase().trim();
          if (keyword) {
            filtered = filtered.filter(
              (cap) =>
                cap.name.toLowerCase().includes(keyword) ||
                getDisplayDescription(cap).toLowerCase().includes(keyword) ||
                cap.originalDescription.toLowerCase().includes(keyword) ||
                cap.sourcePlugin.toLowerCase().includes(keyword) ||
                cap.author?.toLowerCase().includes(keyword)
            );
          }
        }

        if (searchQuery.type) {
          filtered = filtered.filter((cap) => cap.type === searchQuery.type);
        }

        if (searchQuery.sourcePlugin) {
          filtered = filtered.filter(
            (cap) => cap.sourcePlugin === searchQuery.sourcePlugin
          );
        }

        if (searchQuery.translationStatus) {
          filtered = filtered.filter(
            (cap) => cap.translationStatus === searchQuery.translationStatus
          );
        }

        return filtered;
      },

      getCapabilityById: (id) => {
        const { capabilities } = get();
        return capabilities.find((cap) => cap.id === id);
      },

      getCapabilitiesByType: (type) => {
        const { capabilities } = get();
        return capabilities.filter((cap) => cap.type === type);
      },

      // Additional type filtering utilities
      getCapabilityTypes: () => {
        const { capabilities } = get();
        const types = new Set(capabilities.map(cap => cap.type));
        return Array.from(types).sort();
      },

      getCapabilityCountByType: () => {
        const { capabilities } = get();
        const counts: Record<CapabilityType, number> = {
          skill: 0,
          command: 0,
          hook: 0,
          mcp: 0,
          setting: 0,
          agent: 0,
        };
        
        capabilities.forEach(cap => {
          counts[cap.type]++;
        });
        
        return counts;
      },

      // Search utilities
      searchCapabilities: (keyword: string) => {
        const { setSearchQuery } = get();
        setSearchQuery({ keyword });
      },

      getSearchSuggestions: (keyword: string) => {
        const { capabilities } = get();
        if (!keyword || keyword.trim().length < 2) {
          return [];
        }

        const lowerKeyword = keyword.toLowerCase();
        const suggestions = new Set<string>();

        capabilities.forEach(cap => {
          // Add matching names
          if (cap.name.toLowerCase().includes(lowerKeyword)) {
            suggestions.add(cap.name);
          }
          
          // Add matching source plugins
          if (cap.sourcePlugin.toLowerCase().includes(lowerKeyword)) {
            suggestions.add(cap.sourcePlugin);
          }
          
          // Add matching authors
          if (cap.author && cap.author.toLowerCase().includes(lowerKeyword)) {
            suggestions.add(cap.author);
          }
        });

        return Array.from(suggestions).slice(0, 10); // Limit to 10 suggestions
      },

      // Chinese description editing
      updateChineseDescription: async (id: string, chineseDescription: string) => {
        const { updateCapability } = get();
        
        // Update local state
        updateCapability(id, { 
          chineseDescription,
          translationStatus: 'manually_edited',
          updatedAt: new Date()
        });

        // TODO: Call main process to persist to database
        // This will be implemented when IPC is set up
        try {
          // await window.electronAPI.updateCapabilityChineseDescription(id, chineseDescription);
          console.log('Chinese description updated locally for capability:', id);
        } catch (error) {
          console.error('Failed to persist Chinese description:', error);
          // Optionally revert local changes on error
        }
      },

      clearChineseDescription: async (id: string) => {
        const { updateCapability } = get();
        
        // Update local state
        updateCapability(id, { 
          chineseDescription: undefined,
          translationStatus: 'pending',
          updatedAt: new Date()
        });

        // TODO: Call main process to persist to database
        try {
          // await window.electronAPI.updateCapabilityChineseDescription(id, '');
          console.log('Chinese description cleared for capability:', id);
        } catch (error) {
          console.error('Failed to clear Chinese description:', error);
        }
      },
    }),
    {
      name: 'capabilities-store',
    }
  )
);