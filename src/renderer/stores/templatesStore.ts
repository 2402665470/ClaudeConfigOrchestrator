import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ConfigTemplate, Capability, CapabilityType } from '@common/types';
import type { 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  TemplateStats, 
  TemplateExportData, 
  TemplateImportResult 
} from '../../main/services/TemplateService';

interface TemplatesState {
  // State
  templates: ConfigTemplate[];
  loading: boolean;
  error: string | null;
  selectedTemplate: string | null;
  templateStats: Record<string, TemplateStats>;

  // Actions
  loadTemplates: () => Promise<void>;
  createTemplate: (request: CreateTemplateRequest) => Promise<ConfigTemplate>;
  updateTemplate: (id: string, updates: UpdateTemplateRequest) => Promise<ConfigTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  addCapabilityToTemplate: (templateId: string, capabilityId: string) => Promise<ConfigTemplate>;
  removeCapabilityFromTemplate: (templateId: string, capabilityId: string) => Promise<ConfigTemplate>;
  addCapabilitiesToTemplate: (templateId: string, capabilityIds: string[]) => Promise<ConfigTemplate>;
  loadTemplateStats: (templateId: string) => Promise<void>;
  getTemplateCapabilities: (templateId: string) => Promise<Capability[]>;
  exportTemplate: (templateId: string) => Promise<TemplateExportData>;
  exportTemplateToFile: (templateId: string, filePath: string) => Promise<void>;
  importTemplate: (data: TemplateExportData, options?: { overwriteExisting?: boolean; importCapabilities?: boolean }) => Promise<TemplateImportResult>;
  importTemplateFromFile: (filePath: string, options?: { overwriteExisting?: boolean; importCapabilities?: boolean }) => Promise<TemplateImportResult>;
  
  // Internal actions
  setTemplates: (templates: ConfigTemplate[]) => void;
  addTemplate: (template: ConfigTemplate) => void;
  updateTemplateInStore: (id: string, updates: Partial<ConfigTemplate>) => void;
  removeTemplate: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectTemplate: (id: string | null) => void;
  setTemplateStats: (templateId: string, stats: TemplateStats) => void;

  // Computed
  getTemplateById: (id: string) => ConfigTemplate | undefined;
  getTemplateStatsById: (id: string) => TemplateStats | null;
}

export const useTemplatesStore = create<TemplatesState>()(
  devtools(
    (set, get) => ({
      // Initial state
      templates: [],
      loading: false,
      error: null,
      selectedTemplate: null,
      templateStats: {},

      // API Actions
      loadTemplates: async () => {
        set({ loading: true, error: null });
        try {
          const templates = await window.electronAPI.templateService.getAllTemplates();
          set({ templates, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load templates',
            loading: false 
          });
        }
      },

      createTemplate: async (request) => {
        set({ loading: true, error: null });
        try {
          const template = await window.electronAPI.templateService.createTemplate(request);
          set((state) => ({
            templates: [...state.templates, template],
            loading: false,
          }));
          return template;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create template',
            loading: false 
          });
          throw error;
        }
      },

      updateTemplate: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const template = await window.electronAPI.templateService.updateTemplate(id, updates);
          set((state) => ({
            templates: state.templates.map((t) => t.id === id ? template : t),
            loading: false,
          }));
          return template;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update template',
            loading: false 
          });
          throw error;
        }
      },

      deleteTemplate: async (id) => {
        set({ loading: true, error: null });
        try {
          await window.electronAPI.templateService.deleteTemplate(id);
          set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
            selectedTemplate: state.selectedTemplate === id ? null : state.selectedTemplate,
            templateStats: Object.fromEntries(
              Object.entries(state.templateStats).filter(([key]) => key !== id)
            ),
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete template',
            loading: false 
          });
          throw error;
        }
      },

      addCapabilityToTemplate: async (templateId, capabilityId) => {
        set({ loading: true, error: null });
        try {
          const template = await window.electronAPI.templateService.addCapabilityToTemplate(templateId, capabilityId);
          set((state) => ({
            templates: state.templates.map((t) => t.id === templateId ? template : t),
            loading: false,
          }));
          // Reload stats for this template
          get().loadTemplateStats(templateId);
          return template;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add capability to template',
            loading: false 
          });
          throw error;
        }
      },

      removeCapabilityFromTemplate: async (templateId, capabilityId) => {
        set({ loading: true, error: null });
        try {
          const template = await window.electronAPI.templateService.removeCapabilityFromTemplate(templateId, capabilityId);
          set((state) => ({
            templates: state.templates.map((t) => t.id === templateId ? template : t),
            loading: false,
          }));
          // Reload stats for this template
          get().loadTemplateStats(templateId);
          return template;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove capability from template',
            loading: false 
          });
          throw error;
        }
      },

      addCapabilitiesToTemplate: async (templateId, capabilityIds) => {
        set({ loading: true, error: null });
        try {
          const template = await window.electronAPI.templateService.addCapabilitiesToTemplate(templateId, capabilityIds);
          set((state) => ({
            templates: state.templates.map((t) => t.id === templateId ? template : t),
            loading: false,
          }));
          // Reload stats for this template
          get().loadTemplateStats(templateId);
          return template;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add capabilities to template',
            loading: false 
          });
          throw error;
        }
      },

      loadTemplateStats: async (templateId) => {
        try {
          const stats = await window.electronAPI.templateService.getTemplateStats(templateId);
          set((state) => ({
            templateStats: {
              ...state.templateStats,
              [templateId]: stats,
            },
          }));
        } catch (error) {
          console.error('Failed to load template stats:', error);
        }
      },

      getTemplateCapabilities: async (templateId) => {
        try {
          return await window.electronAPI.templateService.getTemplateCapabilities(templateId);
        } catch (error) {
          console.error('Failed to get template capabilities:', error);
          return [];
        }
      },

      exportTemplate: async (templateId) => {
        set({ loading: true, error: null });
        try {
          const exportData = await window.electronAPI.templateService.exportTemplate(templateId);
          set({ loading: false });
          return exportData;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export template',
            loading: false 
          });
          throw error;
        }
      },

      exportTemplateToFile: async (templateId, filePath) => {
        set({ loading: true, error: null });
        try {
          await window.electronAPI.templateService.exportTemplateToFile(templateId, filePath);
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export template to file',
            loading: false 
          });
          throw error;
        }
      },

      importTemplate: async (data, options) => {
        set({ loading: true, error: null });
        try {
          const result = await window.electronAPI.templateService.importTemplate(data, options);
          // Reload templates to include the imported one
          await get().loadTemplates();
          set({ loading: false });
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to import template',
            loading: false 
          });
          throw error;
        }
      },

      importTemplateFromFile: async (filePath, options) => {
        set({ loading: true, error: null });
        try {
          const result = await window.electronAPI.templateService.importTemplateFromFile(filePath, options);
          // Reload templates to include the imported one
          await get().loadTemplates();
          set({ loading: false });
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to import template from file',
            loading: false 
          });
          throw error;
        }
      },

      // Internal actions
      setTemplates: (templates) =>
        set({ templates }, false, 'setTemplates'),

      addTemplate: (template) =>
        set(
          (state) => ({
            templates: [...state.templates, template],
          }),
          false,
          'addTemplate'
        ),

      updateTemplateInStore: (id, updates) =>
        set(
          (state) => ({
            templates: state.templates.map((template) =>
              template.id === id ? { ...template, ...updates } : template
            ),
          }),
          false,
          'updateTemplateInStore'
        ),

      removeTemplate: (id) =>
        set(
          (state) => ({
            templates: state.templates.filter((template) => template.id !== id),
            selectedTemplate: state.selectedTemplate === id ? null : state.selectedTemplate,
          }),
          false,
          'removeTemplate'
        ),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      selectTemplate: (id) => set({ selectedTemplate: id }, false, 'selectTemplate'),

      setTemplateStats: (templateId, stats) =>
        set(
          (state) => ({
            templateStats: {
              ...state.templateStats,
              [templateId]: stats,
            },
          }),
          false,
          'setTemplateStats'
        ),

      // Computed getters
      getTemplateById: (id) => {
        const { templates } = get();
        return templates.find((template) => template.id === id);
      },

      getTemplateStatsById: (id) => {
        const { templateStats } = get();
        return templateStats[id] || null;
      },
    }),
    {
      name: 'templates-store',
    }
  )
);