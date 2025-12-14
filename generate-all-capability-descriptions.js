const fs = require('fs');
const path = require('path');

// 读取现有数据
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const detailedData = JSON.parse(fs.readFileSync('detailed-plugins-and-capabilities.json', 'utf8'));

// 现有的自定义描述
const existingPluginDesc = data.customDescriptions?.plugins || {};
const existingCapabilityDesc = data.customDescriptions?.capabilities || {};

// 生成能力描述
function generateCapabilityDescription(pluginName, capabilityType, capabilityName) {
  // 移除文件扩展名
  const cleanName = capabilityName.replace(/\.(md|json|yml|yaml)$/, '');

  // 根据类型和名称生成描述
  const typeMap = {
    'agent': '代理',
    'command': '命令',
    'skill': '技能',
    'hook': '钩子',
    'config': '配置',
    'mcpServer': 'MCP服务器'
  };

  const typeText = typeMap[capabilityType] || capabilityType;

  // 根据名称生成具体描述
  const nameLower = cleanName.toLowerCase();

  // Agent 描述
  if (capabilityType === 'agent') {
    if (nameLower.includes('review')) {
      return `${cleanName} - 专业代码审查代理，深入分析代码质量、架构设计和最佳实践`;
    } else if (nameLower.includes('architect')) {
      return `${cleanName} - 系统架构设计师，负责架构设计和技术选型决策`;
    } else if (nameLower.includes('explorer')) {
      return `${cleanName} - 代码库探索专家，快速理解和分析复杂代码结构`;
    } else if (nameLower.includes('debugger') || nameLower.includes('debug')) {
      return `${cleanName} - 调试专家，快速定位和解决代码问题`;
    } else if (nameLower.includes('optimiz')) {
      return `${cleanName} - 性能优化专家，提升代码运行效率和资源利用率`;
    } else if (nameLower.includes('test')) {
      return `${cleanName} - 测试专家，确保代码质量和测试覆盖率`;
    } else if (nameLower.includes('security') || nameLower.includes('secur')) {
      return `${cleanName} - 安全专家，识别和修复安全漏洞`;
    } else if (nameLower.includes('deploy')) {
      return `${cleanName} - 部署专家，自动化应用部署和发布流程`;
    } else {
      return `${cleanName} - 智能代理，提供专业的${cleanName}相关服务`;
    }
  }

  // Command 描述
  if (capabilityType === 'command') {
    if (nameLower.includes('review')) {
      return `${cleanName} - 执行代码审查命令，提供详细的代码质量分析报告`;
    } else if (nameLower.includes('commit')) {
      return `${cleanName} - Git提交命令，自动化代码提交和版本管理`;
    } else if (nameLower.includes('push')) {
      return `${cleanName} - Git推送命令，将本地更改同步到远程仓库`;
    } else if (nameLower.includes('create') || nameLower.includes('new')) {
      return `${cleanName} - 创建命令，快速生成新的项目或组件`;
    } else if (nameLower.includes('build')) {
      return `${cleanName} - 构建命令，编译和打包应用程序`;
    } else if (nameLower.includes('test')) {
      return `${cleanName} - 测试命令，运行单元测试和集成测试`;
    } else if (nameLower.includes('deploy')) {
      return `${cleanName} - 部署命令，将应用部署到目标环境`;
    } else if (nameLower.includes('install')) {
      return `${cleanName} - 安装命令，安装依赖包或插件`;
    } else {
      return `${cleanName} - 执行${cleanName}命令，完成相应的操作任务`;
    }
  }

  // Skill 描述
  if (capabilityType === 'skill') {
    if (nameLower.includes('pdf')) {
      return `${cleanName} - PDF文档处理技能，支持文档解析、编辑和转换`;
    } else if (nameLower.includes('excel') || nameLower.includes('xlsx')) {
      return `${cleanName} - Excel表格处理技能，支持数据分析和格式转换`;
    } else if (nameLower.includes('image') || nameLower.includes('img')) {
      return `${cleanName} - 图像处理技能，支持图像编辑、格式转换和分析`;
    } else if (nameLower.includes('video')) {
      return `${cleanName} - 视频处理技能，支持视频编辑和格式转换`;
    } else if (nameLower.includes('web') || nameLower.includes('http')) {
      return `${cleanName} - Web交互技能，支持网页抓取和API调用`;
    } else if (nameLower.includes('code') || nameLower.includes('coding')) {
      return `${cleanName} - 代码生成技能，自动生成高质量代码`;
    } else {
      return `${cleanName} - 专业技能，提供${cleanName}相关的功能支持`;
    }
  }

  // Hook 描述
  if (capabilityType === 'hook') {
    return `${cleanName} - 事件钩子，在特定时机触发自定义操作`;
  }

  // Config 描述
  if (capabilityType === 'config') {
    return `${cleanName} - 配置文件，定义${cleanName}相关的系统设置`;
  }

  // MCP Server 描述
  if (capabilityType === 'mcpServer') {
    return `${cleanName} - MCP服务器，提供${cleanName}相关的服务能力`;
  }

  // 默认描述
  return `${cleanName} - ${typeText}，提供${cleanName}相关的功能支持`;
}

// 生成所有能力的描述
const newCapabilityDescriptions = {};
let addedCount = 0;

detailedData.plugins.forEach(plugin => {
  const pluginId = plugin.id;

  // 处理各种类型的能力
  ['skills', 'commands', 'agents', 'hooks', 'configs', 'mcpServers'].forEach(type => {
    const capabilities = plugin.capabilities[type];
    if (capabilities && capabilities.length > 0) {
      capabilities.forEach(cap => {
        // 生成能力ID：pluginId:type:name
        const capabilityId = `${pluginId}:${type}:${cap.name}`;

        // 如果没有自定义描述，生成一个
        if (!existingCapabilityDesc[capabilityId]) {
          newCapabilityDescriptions[capabilityId] = generateCapabilityDescription(
            plugin.name,
            type.slice(0, -1), // 去掉复数形式的s
            cap.name
          );
          addedCount++;
        }
      });
    }
  });
});

// 更新data.json
data.customDescriptions = data.customDescriptions || {};
data.customDescriptions.capabilities = {
  ...data.customDescriptions.capabilities,
  ...newCapabilityDescriptions
};

// 保存更新后的data.json
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

console.log(`\n✅ 成功生成 ${addedCount} 个新的能力描述！`);
console.log(`📊 总能力描述数量：${Object.keys(data.customDescriptions.capabilities).length}`);