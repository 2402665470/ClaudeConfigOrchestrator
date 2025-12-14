const path = require('path');
const fs = require('fs-extra');
const os = require('os');

async function getInstalledPlugins() {
  const pluginsPath = path.join(os.homedir(), '.claude/plugins');
  const installedPath = path.join(pluginsPath, 'installed_plugins.json');

  if (!await fs.pathExists(installedPath)) {
    console.log('❌ 没有找到已安装插件的配置文件');
    return [];
  }

  try {
    const installed = await fs.readJSON(installedPath);
    const plugins = [];

    for (const [pluginId, infos] of Object.entries(installed.plugins || {})) {
      for (const info of infos) {
        plugins.push({
          id: pluginId,
          scope: info.scope || 'user',
          installPath: info.installPath,
          version: info.version,
          installedAt: info.installedAt,
          isLocal: info.isLocal || false
        });
      }
    }

    return plugins;
  } catch (error) {
    console.error('❌ 读取已安装插件失败:', error);
    return [];
  }
}

async function scanPluginCapabilities(pluginPath) {
  const capabilities = {
    skills: [],
    commands: [],
    agents: [],
    hooks: [],
    mcpServers: {},
    configs: [],
    prompts: []
  };

  const capabilityDirs = ['skills', 'commands', 'agents', 'hooks', 'prompts'];

  for (const dir of capabilityDirs) {
    const dirPath = path.join(pluginPath, dir);
    if (await fs.pathExists(dirPath)) {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          // 查找描述文件
          const descFiles = [
            path.join(itemPath, `${item}.md`),
            path.join(itemPath, 'README.md'),
            path.join(itemPath, 'index.md')
          ];

          let description = `${item} - ${dir.slice(0, -1)}`;

          for (const descFile of descFiles) {
            if (await fs.pathExists(descFile)) {
              try {
                const content = await fs.readFile(descFile, 'utf-8');
                const match = content.match(/^---\n[\s\S]*?\ndescription:\s*['"]?(.*?)['"]?\s*\n/);
                if (match) {
                  description = match[1];
                } else {
                  // 取第一段落
                  const cleanContent = content.replace(/^---[\s\S]*?---\n/, '');
                  const firstPara = cleanContent.split('\n\n')[0];
                  if (firstPara) {
                    description = firstPara.replace(/^#\s+/, '').trim();
                  }
                }
                break;
              } catch (e) {
                // 忽略错误，使用默认描述
              }
            }
          }

          capabilities[dir].push({
            name: item,
            description,
            type: dir.slice(0, -1)
          });
        } else if (item.endsWith('.md') || item.endsWith('.js') || item.endsWith('.py')) {
          const name = path.basename(item, path.extname(item));
          capabilities[dir].push({
            name,
            description: `${name} - ${dir.slice(0, -1)}`,
            type: dir.slice(0, -1)
          });
        }
      }
    }
  }

  // 检查 MCP 配置
  const mcpPath = path.join(pluginPath, 'mcp.json');
  if (await fs.pathExists(mcpPath)) {
    try {
      const mcpConfig = await fs.readJSON(mcpPath);
      capabilities.mcpServers = mcpConfig.mcpServers || {};
    } catch (e) {
      console.error(`读取 MCP 配置失败: ${e.message}`);
    }
  }

  // 检查配置文件
  const settingsPath = path.join(pluginPath, 'settings');
  if (await fs.pathExists(settingsPath)) {
    const files = await fs.readdir(settingsPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const name = path.basename(file, '.json');
        capabilities.configs.push({
          name,
          description: `${name} - configuration`,
          type: 'config'
        });
      }
    }
  }

  return capabilities;
}

async function main() {
  console.log('🔍 开始获取所有已安装的插件和能力信息...\n');

  // 获取已安装插件
  const plugins = await getInstalledPlugins();
  console.log(`\n📦 找到 ${plugins.length} 个已安装的插件:\n`);

  const pluginDetails = [];

  for (const plugin of plugins) {
    console.log(`\n🔸 处理插件: ${plugin.id}`);

    // 查找插件元数据
    let metadata = {
      name: plugin.id,
      description: 'No description available'
    };

    // 尝试读取插件元数据文件
    const possibleMetaPaths = [
      path.join(plugin.installPath, '.claude-plugin', 'plugin.json'),
      path.join(plugin.installPath, 'plugin.json'),
      path.join(plugin.installPath, 'metadata.json')
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

    // 扫描插件能力
    const capabilities = await scanPluginCapabilities(plugin.installPath);

    pluginDetails.push({
      ...plugin,
      ...metadata,
      capabilities
    });

    console.log(`   ✅ 已处理: ${metadata.name || plugin.id}`);
  }

  // 生成详细报告
  console.log('\n\n📋 详细插件和能力清单:\n');
  console.log('='.repeat(80));

  pluginDetails.forEach((plugin, index) => {
    console.log(`\n${index + 1}. 插件: ${plugin.name || plugin.id}`);
    console.log(`   ID: ${plugin.id}`);
    console.log(`   版本: ${plugin.version}`);
    console.log(`   作用域: ${plugin.scope}`);
    console.log(`   安装路径: ${plugin.installPath}`);
    console.log(`   描述: ${plugin.description}`);

    const caps = plugin.capabilities;

    Object.entries(caps).forEach(([type, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        const icon = {
          skills: '🎯',
          commands: '⚡',
          agents: '🤖',
          hooks: '🔗',
          configs: '⚙️',
          prompts: '💬'
        }[type] || '📄';

        const typeName = {
          skills: '技能',
          commands: '命令',
          agents: '代理',
          hooks: '钩子',
          configs: '配置',
          prompts: '提示词'
        }[type] || type;

        console.log(`\n   ${icon} ${typeName} (${items.length}):`);
        items.forEach(item => {
          console.log(`      - ${item.name}: ${item.description}`);
        });
      } else if (type === 'mcpServers' && Object.keys(items).length > 0) {
        console.log(`\n   🔌 MCP 服务器:`);
        Object.entries(items).forEach(([name, config]) => {
          console.log(`      - ${name}: ${config.description || 'No description'}`);
        });
      }
    });

    console.log('\n' + '-'.repeat(80));
  });

  // 保存到文件
  const outputPath = path.join(process.cwd(), 'all-plugins-and-capabilities.json');
  await fs.writeJSON(outputPath, {
    plugins: pluginDetails,
    summary: {
      totalPlugins: pluginDetails.length,
      timestamp: new Date().toISOString()
    }
  }, { spaces: 2 });

  console.log(`\n\n💾 详细信息已保存到: ${outputPath}`);
  console.log('\n✅ 完成！');
}

main().catch(console.error);