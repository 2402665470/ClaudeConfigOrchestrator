const fs = require('fs');
const path = require('path');

// 读取中文描述文件
const descriptionsPath = path.join(__dirname, '../chinese-descriptions.json');
const descriptions = JSON.parse(fs.readFileSync(descriptionsPath, 'utf8'));

// 读取 data.json
const dataPath = path.join(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 确保自定义描述字段存在
if (!data.customDescriptions) {
  data.customDescriptions = {};
}
if (!data.customDescriptions.plugins) {
  data.customDescriptions.plugins = {};
}
if (!data.customDescriptions.capabilities) {
  data.customDescriptions.capabilities = {};
}

// 合并插件描述
Object.assign(data.customDescriptions.plugins, descriptions.plugins);

// 合并能力描述
Object.assign(data.customDescriptions.capabilities, descriptions.capabilities);

// 保存更新后的 data.json
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');

console.log('中文描述导入成功！');
console.log(`导入了 ${Object.keys(descriptions.plugins).length} 个插件描述`);
console.log(`导入了 ${Object.keys(descriptions.capabilities).length} 个能力描述`);