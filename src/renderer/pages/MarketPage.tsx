import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Empty, 
  Spin, 
  Space,
  Button,
  Tooltip,
  Pagination
} from 'antd';
import { 
  ShopOutlined, 
  ReloadOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useCapabilitiesStore } from '../stores/capabilitiesStore';
import CapabilityCard from '../components/common/CapabilityCard';
import MarketSearchBar from '../components/market/MarketSearchBar';
import CapabilityDetailModal from '../components/market/CapabilityDetailModal';
import type { Capability } from '@common/types';

const { Title, Paragraph } = Typography;

const MarketPage: React.FC = () => {
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const {
    capabilities,
    loading,
    error,
    getFilteredCapabilities,
    setLoading,
    setError,
  } = useCapabilitiesStore();

  const filteredCapabilities = getFilteredCapabilities();

  // 分页数据
  const paginatedCapabilities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredCapabilities.slice(startIndex, endIndex);
  }, [filteredCapabilities, currentPage, pageSize]);

  // 当筛选条件变化时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCapabilities.length]);

  // 模拟加载能力数据
  useEffect(() => {
    // TODO: 实际实现中应该从主进程加载数据
    // loadCapabilities();
  }, []);

  const handleCapabilityClick = (capability: Capability) => {
    setSelectedCapability(capability);
  };

  const handleCapabilityUpdate = (updatedCapability: Capability) => {
    // 更新已在 CapabilityCard 中处理
    console.log('Capability updated:', updatedCapability);
  };

  const handleOpenFolder = (capability: Capability) => {
    // TODO: 调用主进程打开文件夹
    console.log('Open folder for capability:', capability.id);
  };

  const handleRefresh = () => {
    // TODO: 重新加载能力数据
    console.log('Refreshing capabilities...');
  };

  const renderCapabilityGrid = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <Empty
            description={
              <div>
                <p className="text-red-500 mb-2">加载失败</p>
                <p className="text-gray-500">{error}</p>
              </div>
            }
          />
        </div>
      );
    }

    if (filteredCapabilities.length === 0) {
      return (
        <div className="text-center py-12">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              capabilities.length === 0 ? (
                <div>
                  <p className="text-gray-500 mb-2">暂无能力</p>
                  <p className="text-gray-400 text-sm">
                    请先从导入页面导入一些能力到私人市场
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-2">没有找到匹配的能力</p>
                  <p className="text-gray-400 text-sm">
                    尝试调整搜索条件或清除筛选器
                  </p>
                </div>
              )
            }
          />
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <>
          <Row gutter={[16, 16]}>
            {paginatedCapabilities.map((capability) => (
              <Col key={capability.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <CapabilityCard
                  capability={capability}
                  onUpdate={handleCapabilityUpdate}
                  onOpenFolder={handleOpenFolder}
                  className="h-full cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCapabilityClick(capability)}
                />
              </Col>
            ))}
          </Row>
          
          {filteredCapabilities.length > pageSize && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredCapabilities.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                  }
                }}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
                pageSizeOptions={['10', '20', '50', '100']}
              />
            </div>
          )}
        </>
      );
    }

    // List view
    return (
      <>
        <div className="space-y-4">
          {paginatedCapabilities.map((capability) => (
            <CapabilityCard
              key={capability.id}
              capability={capability}
              onUpdate={handleCapabilityUpdate}
              onOpenFolder={handleOpenFolder}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCapabilityClick(capability)}
            />
          ))}
        </div>
        
        {filteredCapabilities.length > pageSize && (
          <div className="flex justify-center mt-6">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredCapabilities.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                }
              }}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }
              pageSizeOptions={['10', '20', '50', '100']}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <Title level={2} className="mb-2 text-slate-800">
          <ShopOutlined className="mr-3 text-primary-600" />
          私人市场
        </Title>
        <Paragraph className="text-slate-600 mb-6">
          浏览和管理已导入的所有能力，支持搜索、筛选和编辑中文描述。所有能力默认显示中文描述。
        </Paragraph>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            <MarketSearchBar />
          </div>
          
          <Space>
            <Tooltip title="刷新">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              />
            </Tooltip>
            
            <Button.Group>
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
              />
              <Button
                icon={<UnorderedListOutlined />}
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              />
            </Button.Group>
          </Space>
        </div>

        {/* 统计信息 */}
        <div className="text-sm text-gray-500">
          共找到 {filteredCapabilities.length} 个能力
          {capabilities.length !== filteredCapabilities.length && (
            <span>（总共 {capabilities.length} 个）</span>
          )}
          {filteredCapabilities.length > pageSize && (
            <span>，当前显示第 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredCapabilities.length)} 个</span>
          )}
        </div>
      </div>

      {/* 能力列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        {renderCapabilityGrid()}
      </div>

      {/* 能力详情弹窗 */}
      <CapabilityDetailModal
        capability={selectedCapability}
        open={!!selectedCapability}
        onClose={() => setSelectedCapability(null)}
        onUpdate={handleCapabilityUpdate}
        onOpenFolder={handleOpenFolder}
      />
    </div>
  );
};

export default MarketPage;