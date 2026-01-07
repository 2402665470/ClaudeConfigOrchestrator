import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Space, 
  Typography, 
  message,
  Spin,
  Modal,
  Progress,
  Table,
  Tag,
  Tabs
} from 'antd';
import { 
  DatabaseOutlined, 
  TranslationOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  ClearOutlined,
  UnorderedListOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { TabPane } = Tabs;

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

interface PluginCacheEntry {
  id: string;
  name: string;
  version: string;
  source_url?: string;
  local_path: string;
  size_bytes: number;
  last_accessed_at: string;
  created_at: string;
}

interface TranslationCacheEntry {
  hash: string;
  original: string;
  translated: string;
  provider: string;
  created_at: string;
}

export const CachePage: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [pluginEntries, setPluginEntries] = useState<PluginCacheEntry[]>([]);
  const [translationEntries, setTranslationEntries] = useState<TranslationCacheEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // 加载缓存统计
  const loadCacheStats = async () => {
    try {
      setLoading(true);
      
      const pluginStats = await window.electronAPI.cacheService.getPluginStats();
      const translationStats = await window.electronAPI.cacheService.getTranslationStats();
      
      const cacheStats: CacheStats = {
        pluginCache: pluginStats,
        translationCache: translationStats
      };
      
      setStats(cacheStats);
    } catch (error) {
      console.error('加载缓存统计失败:', error);
      message.error('加载缓存统计失败');
    } finally {
      setLoading(false);
    }
  };

  // 清理未使用的插件缓存
  const handleClearUnusedPluginCache = () => {
    confirm({
      title: '清理未使用的插件缓存',
      content: '这将删除未被任何能力使用的插件缓存文件，但会保留已导入能力的信息和中文描述。确定继续吗？',
      okText: '确认清理',
      cancelText: '取消',
      onOk: async () => {
        try {
          setClearing('plugin-unused');
          
          const result = await window.electronAPI.cacheService.clearUnusedPlugin();
          
          message.success(`清理完成！删除了 ${result.deletedEntries} 个缓存条目，释放了 ${formatBytes(result.freedBytes)} 空间`);
          
          // 重新加载统计
          await loadCacheStats();
        } catch (error) {
          console.error('清理缓存失败:', error);
          message.error('清理缓存失败');
        } finally {
          setClearing(null);
        }
      },
    });
  };

  // 清空所有插件缓存
  const handleClearAllPluginCache = () => {
    confirm({
      title: '清空所有插件缓存',
      content: '这将删除所有插件缓存文件。已导入的能力信息和中文描述会被保留，但下次导入相同插件时需要重新下载。确定继续吗？',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setClearing('plugin-all');
          
          const result = await window.electronAPI.cacheService.clearAllPlugin();
          
          message.success(`清空完成！删除了 ${result.deletedEntries} 个缓存条目，释放了 ${formatBytes(result.freedBytes)} 空间`);
          
          // 重新加载统计
          await loadCacheStats();
        } catch (error) {
          console.error('清空缓存失败:', error);
          message.error('清空缓存失败');
        } finally {
          setClearing(null);
        }
      },
    });
  };

  // 清空翻译缓存
  const handleClearTranslationCache = () => {
    confirm({
      title: '清空翻译缓存',
      content: '这将删除所有自动翻译的缓存。手动编辑的中文描述会被保留，但自动翻译的内容需要重新翻译。确定继续吗？',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setClearing('translation');
          
          const result = await window.electronAPI.cacheService.clearTranslation();
          
          message.success(`清空完成！删除了 ${result.deletedEntries} 个翻译缓存条目`);
          
          // 重新加载统计
          await loadCacheStats();
        } catch (error) {
          console.error('清空翻译缓存失败:', error);
          message.error('清空翻译缓存失败');
        } finally {
          setClearing(null);
        }
      },
    });
  };

  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化百分比
  const formatPercent = (rate: number): string => {
    return (rate * 100).toFixed(1) + '%';
  };

  // 加载缓存条目
  const loadCacheEntries = async () => {
    try {
      setEntriesLoading(true);
      
      const [pluginData, translationData] = await Promise.all([
        window.electronAPI.cacheService.getAllPluginEntries(),
        window.electronAPI.cacheService.getAllTranslationEntries()
      ]);
      
      setPluginEntries(pluginData);
      setTranslationEntries(translationData);
    } catch (error) {
      console.error('加载缓存条目失败:', error);
      message.error('加载缓存条目失败');
    } finally {
      setEntriesLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 插件缓存表格列定义
  const pluginColumns = [
    {
      title: '插件名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PluginCacheEntry) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>v{record.version}</div>
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size_bytes',
      key: 'size',
      render: (size: number) => formatBytes(size),
      sorter: (a: PluginCacheEntry, b: PluginCacheEntry) => a.size_bytes - b.size_bytes,
    },
    {
      title: '来源',
      dataIndex: 'source_url',
      key: 'source',
      render: (url?: string) => url ? (
        <Tag color="blue" style={{ fontSize: '11px' }}>
          {url.includes('github.com') ? 'GitHub' : 'HTTP'}
        </Tag>
      ) : (
        <Tag color="default" style={{ fontSize: '11px' }}>本地</Tag>
      ),
    },
    {
      title: '最后访问',
      dataIndex: 'last_accessed_at',
      key: 'lastAccessed',
      render: (date: string) => formatDate(date),
      sorter: (a: PluginCacheEntry, b: PluginCacheEntry) => 
        new Date(a.last_accessed_at).getTime() - new Date(b.last_accessed_at).getTime(),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created',
      render: (date: string) => formatDate(date),
      sorter: (a: PluginCacheEntry, b: PluginCacheEntry) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
  ];

  // 翻译缓存表格列定义
  const translationColumns = [
    {
      title: '原文',
      dataIndex: 'original',
      key: 'original',
      ellipsis: true,
      width: '40%',
    },
    {
      title: '译文',
      dataIndex: 'translated',
      key: 'translated',
      ellipsis: true,
      width: '40%',
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color={provider === 'gemini' ? 'blue' : 'default'}>
          {provider === 'gemini' ? 'Gemini' : provider}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created',
      render: (date: string) => formatDate(date),
      sorter: (a: TranslationCacheEntry, b: TranslationCacheEntry) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
  ];

  useEffect(() => {
    loadCacheStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'entries') {
      loadCacheEntries();
    }
  }, [activeTab]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          缓存管理
        </Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadCacheStats}
          loading={loading}
        >
          刷新统计
        </Button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && stats && (
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'stats',
              label: (
                <span>
                  <BarChartOutlined />
                  缓存统计
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  {/* 插件缓存统计 */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <DatabaseOutlined />
                          <span>插件缓存</span>
                        </Space>
                      }
                      extra={
                        <Space>
                          <Button
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={handleClearUnusedPluginCache}
                            loading={clearing === 'plugin-unused'}
                          >
                            清理未使用
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<ClearOutlined />}
                            onClick={handleClearAllPluginCache}
                            loading={clearing === 'plugin-all'}
                          >
                            清空所有
                          </Button>
                        </Space>
                      }
                    >
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="缓存条目"
                            value={stats.pluginCache.entries}
                            suffix="个"
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="占用空间"
                            value={formatBytes(stats.pluginCache.totalSizeBytes)}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="命中率"
                            value={formatPercent(stats.pluginCache.hitRate)}
                          />
                        </Col>
                      </Row>
                      
                      <div style={{ marginTop: '16px' }}>
                        <Text type="secondary">
                          插件缓存用于存储已下载的插件文件，避免重复下载。清理未使用的缓存可以释放磁盘空间。
                        </Text>
                      </div>
                    </Card>
                  </Col>

                  {/* 翻译缓存统计 */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <TranslationOutlined />
                          <span>翻译缓存</span>
                        </Space>
                      }
                      extra={
                        <Button
                          size="small"
                          danger
                          icon={<ClearOutlined />}
                          onClick={handleClearTranslationCache}
                          loading={clearing === 'translation'}
                        >
                          清空缓存
                        </Button>
                      }
                    >
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="缓存条目"
                            value={stats.translationCache.entries}
                            suffix="个"
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="占用空间"
                            value={formatBytes(stats.translationCache.sizeBytes)}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="命中率"
                            value={formatPercent(stats.translationCache.hitRate)}
                          />
                        </Col>
                      </Row>
                      
                      <div style={{ marginTop: '16px' }}>
                        <Text type="secondary">
                          翻译缓存用于存储自动翻译的结果，避免重复翻译相同内容。手动编辑的中文描述不会被清除。
                        </Text>
                      </div>
                    </Card>
                  </Col>

                  {/* 总体统计 */}
                  <Col span={24}>
                    <Card title="总体统计">
                      <Row gutter={16}>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="总缓存条目"
                            value={stats.pluginCache.entries + stats.translationCache.entries}
                            suffix="个"
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="总占用空间"
                            value={formatBytes(stats.pluginCache.totalSizeBytes + stats.translationCache.sizeBytes)}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="平均命中率"
                            value={formatPercent((stats.pluginCache.hitRate + stats.translationCache.hitRate) / 2)}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: 'entries',
              label: (
                <span>
                  <UnorderedListOutlined />
                  缓存条目
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  {/* 插件缓存条目 */}
                  <Col span={24}>
                    <Card
                      title={
                        <Space>
                          <DatabaseOutlined />
                          <span>插件缓存条目 ({pluginEntries.length})</span>
                        </Space>
                      }
                      extra={
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={loadCacheEntries}
                          loading={entriesLoading}
                          size="small"
                        >
                          刷新
                        </Button>
                      }
                    >
                      <Table
                        columns={pluginColumns}
                        dataSource={pluginEntries}
                        rowKey="id"
                        loading={entriesLoading}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        }}
                        size="small"
                      />
                    </Card>
                  </Col>

                  {/* 翻译缓存条目 */}
                  <Col span={24}>
                    <Card
                      title={
                        <Space>
                          <TranslationOutlined />
                          <span>翻译缓存条目 ({translationEntries.length})</span>
                        </Space>
                      }
                    >
                      <Table
                        columns={translationColumns}
                        dataSource={translationEntries}
                        rowKey="hash"
                        loading={entriesLoading}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        }}
                        size="small"
                      />
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      )}
    </div>
  );
};