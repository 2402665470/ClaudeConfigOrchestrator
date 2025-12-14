const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// 解析 Markdown frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) return {};

  const frontmatter = match[1];
  const result = {};

  let currentKey = null;
  let inMultiline = false;
  let multilineValue = [];

  frontmatter.split('\n').forEach(line => {
    const trimmed = line.trim();

    if (trimmed.includes(':')) {
      if (inMultiline && currentKey) {
        result[currentKey] = multilineValue.join('\n');
        multilineValue = [];
        inMultiline = false;
      }

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      if (value) {
        // 移除引号
        const unquoted = value.replace(/^['"]|['"]$/g, '');
        result[key] = unquoted;
      } else {
        currentKey = key;
        inMultiline = true;
      }
    } else if (inMultiline && trimmed) {
      multilineValue.push(trimmed);
    }
  });

  if (inMultiline && currentKey) {
    result[currentKey] = multilineValue.join('\n');
  }

  return result;
}

// 提取文件内容中的描述
async function extractDescription(filePath) {
  try {
    if (!await fs.pathExists(filePath)) return null;

    const content = await fs.readFile(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (frontmatter.description) {
      return frontmatter.description;
    }

    // 如果没有 frontmatter 描述，取第一个段落
    const cleanContent = content.replace(/^---[\s\S]*?---\n/, '');
    const firstParagraph = cleanContent.split('\n\n')[0];

    if (firstParagraph) {
      return firstParagraph
        .replace(/^#\s+/, '') // 移除标题
        .replace(/\n/g, ' ') // 将换行替换为空格
        .trim();
    }

    return null;
  } catch (error) {
    console.error(`读取文件失败 ${filePath}:`, error.message);
    return null;
  }
}

// 扫描单个能力项的详细信息
async function scanCapabilityItem(itemPath, itemName, itemType) {
  const info = {
    name: itemName,
    type: itemType,
    description: null,
    filePath: itemPath,
    children: []
  };

  // 查找描述文件的可能位置
  const possibleDescFiles = [
    `${itemName}.md`,
    `${itemType.slice(0, -1)}.md`,
    'README.md',
    'index.md',
    'SKILL.md'
  ].map(file => path.join(itemPath, file));

  // 尝试找到描述文件
  for (const descFile of possibleDescFiles) {
    if (await fs.pathExists(descFile)) {
      info.description = await extractDescription(descFile);
      if (info.description) break;
    }
  }

  // 如果是目录，扫描子项
  const stat = await fs.stat(itemPath);
  if (stat.isDirectory()) {
    try {
      const items = await fs.readdir(itemPath);

      for (const item of items) {
        const itemFullPath = path.join(itemPath, item);
        const itemStat = await fs.stat(itemFullPath);

        if (itemStat.isDirectory()) {
          // 递归扫描子目录
          const childInfo = await scanCapabilityItem(itemFullPath, item, itemType);
          info.children.push(childInfo);
        } else if (item.endsWith('.md') && item !== 'README.md') {
          // 扫描 Markdown 文件
          const childName = path.basename(item, '.md');
          const childDesc = await extractDescription(itemFullPath);
          info.children.push({
            name: childName,
            type: 'file',
            description: childDesc,
            filePath: itemFullPath
          });
        }
      }
    } catch (error) {
      console.error(`扫描目录失败 ${itemPath}:`, error.message);
    }
  }

  return info;
}

// 扫描插件的所有能力
async function scanPluginCapabilities(pluginPath) {
  const capabilities = {
    skills: [],
    commands: [],
    agents: [],
    hooks: [],
    mcpServers: null,
    configs: [],
    prompts: []
  };

  // 扫描各种能力目录
  const capabilityTypes = ['skills', 'commands', 'agents', 'hooks', 'prompts'];

  for (const type of capabilityTypes) {
    const typePath = path.join(pluginPath, type);

    if (await fs.pathExists(typePath)) {
      try {
        const items = await fs.readdir(typePath);

        for (const item of items) {
          const itemPath = path.join(typePath, item);
          const itemInfo = await scanCapabilityItem(itemPath, item, type);
          capabilities[type].push(itemInfo);
        }
      } catch (error) {
        console.error(`扫描 ${type} 失败:`, error.message);
      }
    }
  }

  // 处理 MCP 服务器配置
  const mcpPath = path.join(pluginPath, 'mcp.json');
  if (await fs.pathExists(mcpPath)) {
    try {
      capabilities.mcpServers = await fs.readJSON(mcpPath);
    } catch (error) {
      console.error(`读取 MCP 配置失败:`, error.message);
    }
  }

  // 处理配置文件
  const settingsPath = path.join(pluginPath, 'settings');
  if (await fs.pathExists(settingsPath)) {
    try {
      const items = await fs.readdir(settingsPath);

      for (const item of items) {
        if (item.endsWith('.json')) {
          const configPath = path.join(settingsPath, item);
          const configName = path.basename(item, '.json');

          capabilities.configs.push({
            name: configName,
            type: 'config',
            filePath: configPath,
            description: `${configName} - configuration file`,
            content: await fs.readJSON(configPath)
          });
        }
      }
    } catch (error) {
      console.error(`扫描配置文件失败:`, error.message);
    }
  }

  return capabilities;
}

// 主函数
async function main() {
  console.log('🔍 获取详细的插件和能力信息...\n');

  const pluginsPath = path.join(os.homedir(), '.claude/plugins');
  const installedPath = path.join(pluginsPath, 'installed_plugins.json');

  if (!await fs.pathExists(installedPath)) {
    console.error('❌ 没有找到已安装插件的配置文件');
    return;
  }

  const installed = await fs.readJSON(installedPath);
  const results = [];

  // 处理每个插件
  for (const [pluginId, infos] of Object.entries(installed.plugins || {})) {
    for (const info of infos) {
      console.log(`\n🔸 处理插件: ${pluginId}`);

      // 读取插件元数据
      let metadata = {
        name: pluginId,
        description: 'No description available'
      };

      const possibleMetaPaths = [
        path.join(info.installPath, '.claude-plugin', 'plugin.json'),
        path.join(info.installPath, 'plugin.json'),
        path.join(info.installPath, 'metadata.json')
      ];

      for (const metaPath of possibleMetaPaths) {
        if (await fs.pathExists(metaPath)) {
          try {
            metadata = await fs.readJSON(metaPath);
            break;
          } catch (e) {
            // 忽略错误
          }
        }
      }

      // 扫描详细的能力信息
      const capabilities = await scanPluginCapabilities(info.installPath);

      results.push({
        id: pluginId,
        ...info,
        ...metadata,
        capabilities
      });

      console.log(`   ✅ 已处理`);
    }
  }

  // 生成格式化的输出
  console.log('\n\n📋 详细的插件和能力报告:\n');
  console.log('='.repeat(100));

  results.forEach((plugin, index) => {
    console.log(`\n${index + 1}. 【插件】${plugin.name || plugin.id}`);
    console.log(`   📌 ID: ${plugin.id}`);
    console.log(`   📦 版本: ${plugin.version}`);
    console.log(`   📂 作用域: ${plugin.scope}`);
    console.log(`   📝 描述: ${plugin.description}`);

    const caps = plugin.capabilities;

    // 技能
    if (caps.skills && caps.skills.length > 0) {
      console.log(`\n   🎯 技能 (${caps.skills.length}):`);
      caps.skills.forEach(skill => {
        console.log(`      • ${skill.name}`);
        if (skill.description) {
          console.log(`        ${skill.description}`);
        }
        if (skill.children && skill.children.length > 0) {
          skill.children.forEach(child => {
            console.log(`          - ${child.name}${child.description ? ': ' + child.description : ''}`);
          });
        }
      });
    }

    // 命令
    if (caps.commands && caps.commands.length > 0) {
      console.log(`\n   ⚡ 命令 (${caps.commands.length}):`);
      caps.commands.forEach(cmd => {
        console.log(`      • /${cmd.name}`);
        if (cmd.description && !cmd.description.endsWith('command')) {
          console.log(`        ${cmd.description}`);
        }
      });
    }

    // 代理
    if (caps.agents && caps.agents.length > 0) {
      console.log(`\n   🤖 代理 (${caps.agents.length}):`);
      caps.agents.forEach(agent => {
        console.log(`      • ${agent.name}`);
        if (agent.description && !agent.description.endsWith('agent')) {
          console.log(`        ${agent.description}`);
        }
      });
    }

    // 钩子
    if (caps.hooks && caps.hooks.length > 0) {
      console.log(`\n   🔗 钩子 (${caps.hooks.length}):`);
      caps.hooks.forEach(hook => {
        console.log(`      • ${hook.name}`);
        if (hook.description && !hook.description.endsWith('hook')) {
          console.log(`        ${hook.description}`);
        }
      });
    }

    // MCP 服务器
    if (caps.mcpServers) {
      const mcpCount = Object.keys(caps.mcpServers.mcpServers || {}).length;
      if (mcpCount > 0) {
        console.log(`\n   🔌 MCP 服务器 (${mcpCount}):`);
        Object.entries(caps.mcpServers.mcpServers || {}).forEach(([name, config]) => {
          console.log(`      • ${name}: ${config.description || 'No description'}`);
        });
      }
    }

    // 配置
    if (caps.configs && caps.configs.length > 0) {
      console.log(`\n   ⚙️ 配置 (${caps.configs.length}):`);
      caps.configs.forEach(config => {
        console.log(`      • ${config.name}: ${config.description}`);
      });
    }

    // 提示词
    if (caps.prompts && caps.prompts.length > 0) {
      console.log(`\n   💬 提示词 (${caps.prompts.length}):`);
      caps.prompts.forEach(prompt => {
        console.log(`      • ${prompt.name}`);
        if (prompt.description && !prompt.description.endsWith('prompt')) {
          console.log(`        ${prompt.description}`);
        }
      });
    }

    console.log('\n' + '-'.repeat(100));
  });

  // 保存详细结果
  const outputPath = path.join(process.cwd(), 'detailed-plugins-and-capabilities.json');
  await fs.writeJSON(outputPath, {
    generatedAt: new Date().toISOString(),
    totalPlugins: results.length,
    plugins: results
  }, { spaces: 2 });

  console.log(`\n\n💾 详细数据已保存到: ${outputPath}`);
  console.log('\n✅ 完成！');
}

main().catch(console.error);