const fs = require('fs');

// 读取中文描述
const chineseDesc = JSON.parse(fs.readFileSync('chinese-descriptions.json', 'utf8'));

// 读取当前数据
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// 合并数据
data.customDescriptions = {
  plugins: chineseDesc.plugins || {},
  capabilities: chineseDesc.capabilities || {}
};

// 写回文件
fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');

console.log('成功导入中文描述到 data.json');
console.log(`插件数: ${Object.keys(data.customDescriptions.plugins).length}`);
console.log(`能力数: ${Object.keys(data.customDescriptions.capabilities).length}`);