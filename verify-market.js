// 简单的验证脚本，检查私人市场页面的实现
const fs = require('fs');
const path = require('path');

console.log('验证私人市场页面实现...\n');

// 检查文件是否存在
const filesToCheck = [
  'src/renderer/pages/MarketPage.tsx',
  'src/renderer/components/market/MarketSearchBar.tsx',
  'src/renderer/components/market/CapabilityDetailModal.tsx',
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - 存在`);
  } else {
    console.log(`❌ ${file} - 不存在`);
    allFilesExist = false;
  }
});

// 检查关键功能是否实现
const marketPageContent = fs.readFileSync('src/renderer/pages/MarketPage.tsx', 'utf8');
const searchBarContent = fs.readFileSync('src/renderer/components/market/MarketSearchBar.tsx', 'utf8');
const detailModalContent = fs.readFileSync('src/renderer/components/market/CapabilityDetailModal.tsx', 'utf8');

console.log('\n检查关键功能实现:');

// 检查私人市场页面功能
const marketFeatures = [
  { name: '能力卡片展示', pattern: /CapabilityCard/ },
  { name: '搜索筛选栏', pattern: /MarketSearchBar/ },
  { name: '详情弹窗', pattern: /CapabilityDetailModal/ },
  { name: '网格/列表视图切换', pattern: /viewMode/ },
  { name: '空状态处理', pattern: /Empty/ },
];

marketFeatures.forEach(feature => {
  if (feature.pattern.test(marketPageContent)) {
    console.log(`✅ 私人市场页面 - ${feature.name}`);
  } else {
    console.log(`❌ 私人市场页面 - ${feature.name}`);
  }
});

// 检查搜索筛选栏功能
const searchFeatures = [
  { name: '关键词搜索', pattern: /AutoComplete|Input/ },
  { name: '类型筛选', pattern: /type.*Select/ },
  { name: '来源筛选', pattern: /sourcePlugin/ },
  { name: '翻译状态筛选', pattern: /translationStatus/ },
  { name: '清除筛选', pattern: /clearSearch|ClearOutlined/ },
];

searchFeatures.forEach(feature => {
  if (feature.pattern.test(searchBarContent)) {
    console.log(`✅ 搜索筛选栏 - ${feature.name}`);
  } else {
    console.log(`❌ 搜索筛选栏 - ${feature.name}`);
  }
});

// 检查详情弹窗功能
const detailFeatures = [
  { name: '基本信息展示', pattern: /capability\.name|capability\.type/ },
  { name: '描述显示', pattern: /getDisplayDescription/ },
  { name: '内容预览', pattern: /renderContentPreview/ },
  { name: '编辑中文描述', pattern: /ChineseDescriptionEditor/ },
  { name: '打开文件夹', pattern: /onOpenFolder/ },
];

detailFeatures.forEach(feature => {
  if (feature.pattern.test(detailModalContent)) {
    console.log(`✅ 详情弹窗 - ${feature.name}`);
  } else {
    console.log(`❌ 详情弹窗 - ${feature.name}`);
  }
});

// 检查能力卡片组件更新
const cardContent = fs.readFileSync('src/renderer/components/common/CapabilityCard.tsx', 'utf8');
if (cardContent.includes('onClick?: (capability: Capability) => void')) {
  console.log('✅ 能力卡片组件 - 支持点击事件');
} else {
  console.log('❌ 能力卡片组件 - 缺少点击事件支持');
}

// 检查主内容组件更新
const mainContentContent = fs.readFileSync('src/renderer/components/layout/MainContent.tsx', 'utf8');
if (mainContentContent.includes('import MarketPage')) {
  console.log('✅ 主内容组件 - 已集成私人市场页面');
} else {
  console.log('❌ 主内容组件 - 未集成私人市场页面');
}

console.log('\n验证完成!');

if (allFilesExist) {
  console.log('🎉 所有必需文件都已创建');
} else {
  console.log('⚠️  部分文件缺失');
}