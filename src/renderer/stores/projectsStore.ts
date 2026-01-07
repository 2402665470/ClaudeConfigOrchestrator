import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Project } from '@common/types';

interface ProjectConfig {
  path: string;
  hasClaudeDir: boolean;
  existingCapabilities: Array<{
    type: string;
    name: string;
    path: string;
  }>;
  settingsJson?: Record<string, unknown>;
}

interface ProjectsState {
  // State
  projects: Project[];
  loading: boolean;
  error: string | null;
  selectedProject: string | null;
  projectConfigs: Record<string, ProjectConfig>;

  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  hideProject: (id: string) => void;
  showProject: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectProject: (id: string | null) => void;
  setProjectConfig: (projectId: string, config: ProjectConfig) => void;

  // Computed
  getProjectById: (id: string) => Project | undefined;
  getVisibleProjects: () => Project[];
  getProjectConfig: (id: string) => ProjectConfig | undefined;
}

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      projects: [],
      loading: false,
      error: null,
      selectedProject: null,
      projectConfigs: {},

      // Actions
      setProjects: (projects) =>
        set({ projects }, false, 'setProjects'),

      addProject: (project) =>
        set(
          (state) => ({
            projects: [...state.projects, project],
          }),
          false,
          'addProject'
        ),

      updateProject: (id, updates) =>
        set(
          (state) => ({
            projects: state.projects.map((project) =>
              project.id === id ? { ...project, ...updates } : project
            ),
          }),
          false,
          'updateProject'
        ),

      removeProject: (id) =>
        set(
          (state) => ({
            projects: state.projects.filter((project) => project.id !== id),
            selectedProject: state.selectedProject === id ? null : state.selectedProject,
            projectConfigs: Object.fromEntries(
              Object.entries(state.projectConfigs).filter(([key]) => key !== id)
            ),
          }),
          false,
          'removeProject'
        ),

      hideProject: (id) =>
        set(
          (state) => ({
            projects: state.projects.map((project) =>
              project.id === id ? { ...project, hidden: true } : project
            ),
          }),
          false,
          'hideProject'
        ),

      showProject: (id) =>
        set(
          (state) => ({
            projects: state.projects.map((project) =>
              project.id === id ? { ...project, hidden: false } : project
            ),
          }),
          false,
          'showProject'
        ),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      selectProject: (id) => set({ selectedProject: id }, false, 'selectProject'),

      setProjectConfig: (projectId, config) =>
        set(
          (state) => ({
            projectConfigs: {
              ...state.projectConfigs,
              [projectId]: config,
            },
          }),
          false,
          'setProjectConfig'
        ),

      // Computed getters
      getProjectById: (id) => {
        const { projects } = get();
        return projects.find((project) => project.id === id);
      },

      getVisibleProjects: () => {
        const { projects } = get();
        return projects.filter((project) => !project.hidden);
      },

      getProjectConfig: (id) => {
        const { projectConfigs } = get();
        return projectConfigs[id];
      },
    }),
    {
      name: 'projects-store',
    }
  )
);