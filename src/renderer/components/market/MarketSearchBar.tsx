import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Select, 
  Space, 
  Button, 
  Tag, 
  AutoComplete,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { useCapabilitiesStore } from '../../stores/capabilitiesStore';
import type { CapabilityType, TranslationStatus } from '@common/types';

const { Option } = Select;

interface SearchQuery {
  keyword?: string;
  type?: CapabilityType;
  sourcePlugin?: string;
  translationStatus?: TranslationStatus;
}

/**
 * 私人市场搜索和筛选栏组件
 * 支持关键词搜索、类型筛选、来源筛选、翻译状态筛选
 */
const MarketSearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<{ value: string }[]>([]);
  
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    getCapabilityTypes,
    getCapabilityCountByType,
    getSearchSuggestions,
    capabilities,
  } = useCapabilitiesStore();

  // 获取所有来源插件
  const getSourcePlugins = () => {
    const sources = new Set(capabilities.map(cap => cap.sourcePlugin));
    return Array.from(sources).sort();
  };

  // 获取类型选项
  const getTypeOptions = () => {
    const counts = getCapabilityCountByType();
    const types = getCapabilityTypes();
    
    return types.map(type => ({
      label: `${type.toUpperCase()} (${counts[type]})`,
      value: type,
    }));
  };

  // 获取翻译状态选项
  const getTranslationStatusOptions = () => {
    const statusCounts: Record<TranslationStatus, number> = {
      pending: 0,
      translating: 0,
      auto_translated: 0,
      manually_edited: 0,
      failed: 0,
    };

    capabilities.forEach(cap => {
      statusCounts[cap.translationStatus]++;
    });

    return [
      { label: `待翻译 (${statusCounts.pending})`, value: 'pending' },
      { label: `翻译中 (${statusCounts.translating})`, value: 'translating' },
      { label: `自动翻译 (${statusCounts.auto_translated})`, value: 'auto_translated' },
      { label: `人工编辑 (${statusCounts.manually_edited})`, value: 'manually_edited' },
      { label: `翻译失败 (${statusCounts.failed})`, value: 'failed' },
    ].filter(option => option.value === 'pending' || statusCounts[option.value as TranslationStatus] > 0);
  };

  // 处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    
    // 获取搜索建议
    if (value && value.trim().length >= 2) {
      const suggestions = getSearchSuggestions(value);
      setSearchOptions(suggestions.map(s => ({ value: s })));
    } else {
      setSearchOptions([]);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    const keyword = value.trim();
    setSearchQuery({
      ...searchQuery,
      keyword: keyword || undefined,
    });
  };

  // 处理类型筛选
  const handleTypeChange = (type: CapabilityType | undefined) => {
    setSearchQuery({
      ...searchQuery,
      type,
    });
  };

  // 处理来源筛选
  const handleSourceChange = (sourcePlugin: string | undefined) => {
    setSearchQuery({
      ...searchQuery,
      sourcePlugin,
    });
  };

  // 处理翻译状态筛选
  const handleTranslationStatusChange = (translationStatus: TranslationStatus | undefined) => {
    setSearchQuery({
      ...searchQuery,
      translationStatus,
    });
  };

  // 清除所有筛选
  const handleClearAll = () => {
    setSearchValue('');
    setSearchOptions([]);
    clearSearch();
  };

  // 同步搜索框值
  useEffect(() => {
    if (searchQuery.keyword !== searchValue) {
      setSearchValue(searchQuery.keyword || '');
    }
  }, [searchQuery.keyword]);

  // 检查是否有活动的筛选条件
  const hasActiveFilters = () => {
    return !!(
      searchQuery.keyword ||
      searchQuery.type ||
      searchQuery.sourcePlugin ||
      searchQuery.translationStatus
    );
  };

  return (
    <div className="space-y-4">
      {/* 主搜索栏 */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <AutoComplete
            value={searchValue}
            options={searchOptions}
            onSearch={handleSearchChange}
            onSelect={handleSearch}
            placeholder="搜索能力名称、描述、来源或作者..."
            allowClear
            size="large"
          >
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              onPressEnter={(e) => handleSearch(e.currentTarget.value)}
              className="rounded-lg"
            />
          </AutoComplete>
        </div>
        
        <Button
          type="primary"
          icon={<SearchOutlined />}
          size="large"
          onClick={() => handleSearch(searchValue)}
          className="rounded-lg"
        >
          搜索
        </Button>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <div className="flex items-center space-x-2">
          <FilterOutlined className="text-gray-500" />
          <span className="text-sm text-gray-600">筛选：</span>
        </div>

        <Select
          placeholder="类型"
          allowClear
          value={searchQuery.type}
          onChange={handleTypeChange}
          style={{ minWidth: 120 }}
          options={getTypeOptions()}
        />

        <Select
          placeholder="来源插件"
          allowClear
          value={searchQuery.sourcePlugin}
          onChange={handleSourceChange}
          style={{ minWidth: 150 }}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {getSourcePlugins().map(source => (
            <Option key={source} value={source}>
              {source}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="翻译状态"
          allowClear
          value={searchQuery.translationStatus}
          onChange={handleTranslationStatusChange}
          style={{ minWidth: 120 }}
          options={getTranslationStatusOptions()}
        />

        {hasActiveFilters() && (
          <Tooltip title="清除所有筛选条件">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearAll}
              type="text"
              className="text-gray-500 hover:text-gray-700"
            >
              清除
            </Button>
          </Tooltip>
        )}
      </div>

      {/* 活动筛选标签 */}
      {hasActiveFilters() && (
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <TagsOutlined className="text-gray-400" />
          
          {searchQuery.keyword && (
            <Tag
              closable
              onClose={() => handleSearch('')}
              className="bg-blue-50 border-blue-200 text-blue-700"
            >
              关键词: {searchQuery.keyword}
            </Tag>
          )}
          
          {searchQuery.type && (
            <Tag
              closable
              onClose={() => handleTypeChange(undefined)}
              className="bg-green-50 border-green-200 text-green-700"
            >
              类型: {searchQuery.type.toUpperCase()}
            </Tag>
          )}
          
          {searchQuery.sourcePlugin && (
            <Tag
              closable
              onClose={() => handleSourceChange(undefined)}
              className="bg-purple-50 border-purple-200 text-purple-700"
            >
              来源: {searchQuery.sourcePlugin}
            </Tag>
          )}
          
          {searchQuery.translationStatus && (
            <Tag
              closable
              onClose={() => handleTranslationStatusChange(undefined)}
              className="bg-orange-50 border-orange-200 text-orange-700"
            >
              状态: {searchQuery.translationStatus}
            </Tag>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketSearchBar;