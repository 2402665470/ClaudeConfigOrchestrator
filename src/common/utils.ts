// Common utility functions shared between main and renderer processes

import { Capability } from './types';

/**
 * 获取能力的显示描述，优先显示中文描述
 * 根据需求 5.2 和 6.3：有中文显示中文，无则显示原文
 */
export function getDisplayDescription(capability: Capability): string {
  // 如果有中文描述且不为空字符串，返回中文描述
  if (capability.chineseDescription && capability.chineseDescription.trim() !== '') {
    return capability.chineseDescription;
  }
  
  // 否则返回原文描述
  return capability.originalDescription;
}

/**
 * 获取能力的显示名称，优先显示中文名称
 * 注：目前类型定义中只有 name 字段，如果将来需要支持中文名称，可以扩展此函数
 */
export function getDisplayName(capability: Capability): string {
  return capability.name;
}

/**
 * 检查能力是否有中文描述
 */
export function hasChineseDescription(capability: Capability): boolean {
  return !!(capability.chineseDescription && capability.chineseDescription.trim() !== '');
}

/**
 * 检查能力是否需要翻译
 */
export function needsTranslation(capability: Capability): boolean {
  return !hasChineseDescription(capability) && capability.translationStatus === 'pending';
}