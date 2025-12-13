import { create } from 'zustand';
import { AppData, Project, Plugin } from '@common/types';

interface AppState {
  data: AppData;
  plugins: Plugin[];
  loading: boolean;
  setData: (d: AppData) => void;
  setPlugins: (p: Plugin[]) => void;
  setLoading: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  data: { marketPath: '', projects: [] },
  plugins: [],
  loading: false,
  setData: (d) => set({ data: d }),
  setPlugins: (p) => set({ plugins: p }),
  setLoading: (v) => set({ loading: v })
}));