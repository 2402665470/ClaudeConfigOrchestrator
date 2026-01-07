import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PluginCacheEntry {
  id: string;
  name: string;
  version: string;
  sourceUrl?: string;
  localPath: string;
  sizeBytes: number;
  lastAccessedAt: Date;
  createdAt: Date;
}

interface TranslationCacheEntry {
  hash: string;
  original: string;
  translated: string;
  provider: string;
  createdAt: Date;
}

interface CacheStats {
  pluginCache: {
    entries: number;
    totalSizeBytes: number;
    hitRate: number;
  };
  translationCache: {
    entries: number;
    sizeBytes: number;
    hitRate: number;
  };
}

interface CacheState {
  // State
  pluginCache: PluginCacheEntry[];
  translationCache: TranslationCacheEntry[];
  stats: CacheStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  setPluginCache: (entries: PluginCacheEntry[]) => void;
  addPluginCacheEntry: (entry: PluginCacheEntry) => void;
  removePluginCacheEntry: (id: string) => void;
  updatePluginCacheAccess: (id: string) => void;
  
  setTranslationCache: (entries: TranslationCacheEntry[]) => void;
  addTranslationCacheEntry: (entry: TranslationCacheEntry) => void;
  removeTranslationCacheEntry: (hash: string) => void;
  
  setStats: (stats: CacheStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  clearPluginCache: () => void;
  clearTranslationCache: () => void;
  clearUnusedCache: () => Promise<void>;

  // Computed
  getTotalCacheSize: () => number;
  getPluginCacheEntry: (id: string) => PluginCacheEntry | undefined;
  getTranslationCacheEntry: (hash: string) => TranslationCacheEntry | undefined;
  getUnusedPluginCacheEntries: () => PluginCacheEntry[];
  getOldestCacheEntries: (limit?: number) => PluginCacheEntry[];
  getLargestCacheEntries: (limit?: number) => PluginCacheEntry[];
  getCacheStatsSummary: () => {
    plugin: { count: number; totalSize: number; averageSize: number };
    translation: { count: number; totalSize: number; averageSize: number };
    total: { count: number; size: number };
  };
}

export const useCacheStore = create<CacheState>()(
  devtools(
    (set, get) => ({
      // Initial state
      pluginCache: [],
      translationCache: [],
      stats: null,
      loading: false,
      error: null,

      // Actions
      setPluginCache: (entries) =>
        set({ pluginCache: entries }, false, 'setPluginCache'),

      addPluginCacheEntry: (entry) =>
        set(
          (state) => ({
            pluginCache: [...state.pluginCache, entry],
          }),
          false,
          'addPluginCacheEntry'
        ),

      removePluginCacheEntry: (id) =>
        set(
          (state) => ({
            pluginCache: state.pluginCache.filter((entry) => entry.id !== id),
          }),
          false,
          'removePluginCacheEntry'
        ),

      updatePluginCacheAccess: (id) =>
        set(
          (state) => ({
            pluginCache: state.pluginCache.map((entry) =>
              entry.id === id
                ? { ...entry, lastAccessedAt: new Date() }
                : entry
            ),
          }),
          false,
          'updatePluginCacheAccess'
        ),

      setTranslationCache: (entries) =>
        set({ translationCache: entries }, false, 'setTranslationCache'),

      addTranslationCacheEntry: (entry) =>
        set(
          (state) => ({
            translationCache: [...state.translationCache, entry],
          }),
          false,
          'addTranslationCacheEntry'
        ),

      removeTranslationCacheEntry: (hash) =>
        set(
          (state) => ({
            translationCache: state.translationCache.filter(
              (entry) => entry.hash !== hash
            ),
          }),
          false,
          'removeTranslationCacheEntry'
        ),

      setStats: (stats) => set({ stats }, false, 'setStats'),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      clearPluginCache: () =>
        set({ pluginCache: [] }, false, 'clearPluginCache'),

      clearTranslationCache: () =>
        set({ translationCache: [] }, false, 'clearTranslationCache'),

      clearUnusedCache: async () => {
        const { setLoading, setError } = get();
        
        setLoading(true);
        setError(null);
        
        try {
          // TODO: Call main process to clear unused cache
          // const result = await window.electronAPI.clearUnusedPluginCache();
          
          // For now, simulate clearing unused entries
          // In real implementation, this would be based on which plugins are actually used
          const { pluginCache } = get();
          const cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 1); // Keep entries accessed in last month
          
          const usedEntries = pluginCache.filter(entry => 
            entry.lastAccessedAt > cutoffDate
          );
          
          set({ pluginCache: usedEntries }, false, 'clearUnusedCache');
          
          console.log(`Cleared ${pluginCache.length - usedEntries.length} unused cache entries`);
        } catch (error) {
          console.error('Failed to clear unused cache:', error);
          setError('清理缓存失败');
        } finally {
          setLoading(false);
        }
      },

      // Computed getters
      getTotalCacheSize: () => {
        const { pluginCache, translationCache } = get();
        const pluginSize = pluginCache.reduce(
          (total, entry) => total + entry.sizeBytes,
          0
        );
        const translationSize = translationCache.reduce(
          (total, entry) => total + entry.original.length + entry.translated.length,
          0
        );
        return pluginSize + translationSize;
      },

      getPluginCacheEntry: (id) => {
        const { pluginCache } = get();
        return pluginCache.find((entry) => entry.id === id);
      },

      getTranslationCacheEntry: (hash) => {
        const { translationCache } = get();
        return translationCache.find((entry) => entry.hash === hash);
      },

      // Cache management utilities
      getUnusedPluginCacheEntries: () => {
        const { pluginCache } = get();
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 1); // Consider unused if not accessed in last month
        
        return pluginCache.filter(entry => entry.lastAccessedAt < cutoffDate);
      },

      getOldestCacheEntries: (limit: number = 10) => {
        const { pluginCache } = get();
        return [...pluginCache]
          .sort((a, b) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime())
          .slice(0, limit);
      },

      getLargestCacheEntries: (limit: number = 10) => {
        const { pluginCache } = get();
        return [...pluginCache]
          .sort((a, b) => b.sizeBytes - a.sizeBytes)
          .slice(0, limit);
      },

      getCacheStatsSummary: () => {
        const { pluginCache, translationCache } = get();
        
        const pluginStats = {
          count: pluginCache.length,
          totalSize: pluginCache.reduce((sum, entry) => sum + entry.sizeBytes, 0),
          averageSize: pluginCache.length > 0 ? 
            pluginCache.reduce((sum, entry) => sum + entry.sizeBytes, 0) / pluginCache.length : 0,
        };

        const translationStats = {
          count: translationCache.length,
          totalSize: translationCache.reduce((sum, entry) => 
            sum + entry.original.length + entry.translated.length, 0),
          averageSize: translationCache.length > 0 ?
            translationCache.reduce((sum, entry) => 
              sum + entry.original.length + entry.translated.length, 0) / translationCache.length : 0,
        };

        return {
          plugin: pluginStats,
          translation: translationStats,
          total: {
            count: pluginStats.count + translationStats.count,
            size: pluginStats.totalSize + translationStats.totalSize,
          },
        };
      },
    }),
    {
      name: 'cache-store',
    }
  )
);