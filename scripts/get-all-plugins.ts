import path from 'path';
import fs from 'fs-extra';
import os from 'os';

// 导入项目中的服务类
import { ConfigReaderService } from '../src/main/services/ConfigReaderService';

interface PluginInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  scope: 'user' | 'project' | 'local';
  installPath: string;
  installedAt: string;
  isLocal: boolean;
  capabilities?: PluginCapabilities;
}

interface PluginCapabilities {
  skills?: CapabilityItem[];
  commands?: CapabilityItem[];
  agents?: CapabilityItem[];
  hooks?: CapabilityItem[];
  mcpServers?: any;
  configs?: CapabilityItem[];
  prompts?: CapabilityItem[];
}

interface CapabilityItem {
  name: string;
  description: string;
  type: string;
  preview?: any;
}

async function getAllPluginsAndCapabilities(): Promise<void> {
  console.log('🔍 开始获取所有已安装的插件和能力信息...\n');

  // 初始化服务
  const configReader = new ConfigReaderService();

  // 1. 获取所有已安装的插件
  const installedPlugins = await configReader.getInstalledPlugins();
  console.log(`\n📦 找到 ${installedPlugins.length} 个已安装的插件:\n`);

  const pluginDetails: PluginInfo[] = [];

  // 2. 获取每个插件的详细信息
  for (const plugin of installedPlugins) {
    console.log(`\n🔸 正在处理插件: ${plugin.id}`);

    try {
      // 获取插件详细信息
      const pluginInfo = await configReader.getPluginInfo(plugin.id);

      const fullPluginInfo: PluginInfo = {
        id: plugin.id,
        name: pluginInfo?.name || plugin.id,
        description: pluginInfo?.description || 'No description available',
        version: plugin.version,
        scope: plugin.scope,
        installPath: plugin.installPath,
        installedAt: plugin.installedAt,
        isLocal: plugin.isLocal,
        capabilities: pluginInfo?.capabilities || {}
      };

      pluginDetails.push(fullPluginInfo);
      console.log(`   ✅ 成功获取插件信息`);
    } catch (error) {
      console.error(`   ❌ 获取插件 ${plugin.id} 信息失败:`, error);

      // 即使失败也保存基本信息
      pluginDetails.push({
        ...plugin,
        name: plugin.id,
        description: 'Failed to load plugin info',
        capabilities: {}
      });
    }
  }

  // 3. 生成详细的插件和能力清单
  console.log('\n\n📋 插件和能力清单:\n');
  console.log('=' * 80);

  const allCapabilities = {
    skills: [] as CapabilityItem[],
    commands: [] as CapabilityItem[],
    agents: [] as CapabilityItem[],
    hooks: [] as CapabilityItem[],
    mcpServers: [],
    configs: [] as CapabilityItem[],
    prompts: [] as CapabilityItem[]
  };

  // 输出每个插件的详细信息
  pluginDetails.forEach((plugin, index) => {
    console.log(`\n${index + 1}. 插件: ${plugin.name}`);
    console.log(`   ID: ${plugin.id}`);
    console.log(`   版本: ${plugin.version}`);
    console.log(`   作用域: ${plugin.scope}`);
    console.log(`   安装路径: ${plugin.installPath}`);
    console.log(`   安装时间: ${plugin.installedAt}`);
    console.log(`   描述: ${plugin.description}`);

    // 输出能力信息
    const capabilities = plugin.capabilities || {};

    if (capabilities.skills && capabilities.skills.length > 0) {
      console.log(`\n   🎯 技能 (Skills):`);
      capabilities.skills.forEach((skill: any) => {
        console.log(`      - ${skill.name}: ${skill.description}`);
        allCapabilities.skills.push({
          ...skill,
          pluginId: plugin.id,
          pluginName: plugin.name
        });
      });
    }

    if (capabilities.commands && capabilities.commands.length > 0) {
      console.log(`\n   ⚡ 命令 (Commands):`);
      capabilities.commands.forEach((command: any) => {
        console.log(`      - ${command.name}: ${command.description}`);
        allCapabilities.commands.push({
          ...command,
          pluginId: plugin.id,
          pluginName: plugin.name
        });
      });
    }

    if (capabilities.agents && capabilities.agents.length > 0) {
      console.log(`\n   🤖 代理 (Agents):`);
      capabilities.agents.forEach((agent: any) => {
        console.log(`      - ${agent.name}: ${agent.description}`);
        allCapabilities.agents.push({
          ...agent,
          pluginId: plugin.id,
          pluginName: plugin.name
        });
      });
    }

    if (capabilities.hooks && capabilities.hooks.length > 0) {
      console.log(`\n   🔗 钩子 (Hooks):`);
      capabilities.hooks.forEach((hook: any) => {
        console.log(`      - ${hook.name}: ${hook.description}`);
        allCapabilities.hooks.push({
          ...hook,
          pluginId: plugin.id,
          pluginName: plugin.name
        });
      });
    }

    if (capabilities.mcpServers && Object.keys(capabilities.mcpServers).length > 0) {
      console.log(`\n   🔌 MCP 服务器:`);
      Object.entries(capabilities.mcpServers).forEach(([name, config]: [string, any]) => {
        console.log(`      - ${name}: ${config.description || 'No description'}`);
        allCapabilities.mcpServers.push({
          name,
          config,
          pluginId: plugin.id,
          pluginName: plugin.name
        });
      });
    }

    if (capabilities.configs && capabilities.configs.length > 0) {
      console.log(`\n   ⚙️ 配置 (Configs):`);
      capabilities.configs.forEach((config: any) => {
        console.log(`      - ${config.name}: ${config.description}`);
        if (config.preview) {
          console.log(`        预览: ${JSON.stringify(config.preview, null, 6)}`);
        }
        allCapabilities.configs.push({
          ...config,
          pluginId: plugin.id,
          pluginName: plugin.name
        });
      });
    }

    if (capabilities.prompts && capabilities.prompts.length > 0) {
      console.log(`\n   💬 提示词 (Prompts):`);
      capabilities.prompts.forEach((prompt: any) => {
        console.log(`      - ${prompt.name}: ${prompt.description}`);
        allCapabilities.prompts.push({
          ...prompt,
          pluginId: plugin.id,
          pluginName: plugin.name
        });
      });
    }

    console.log('\n' + '-'.repeat(80));
  });

  // 4. 生成能力汇总
  console.log('\n\n📊 能力汇总统计:\n');
  console.log(`   🎯 技能总数: ${allCapabilities.skills.length}`);
  console.log(`   ⚡ 命令总数: ${allCapabilities.commands.length}`);
  console.log(`   🤖 代理总数: ${allCapabilities.agents.length}`);
  console.log(`   🔗 钩子总数: ${allCapabilities.hooks.length}`);
  console.log(`   🔌 MCP 服务器总数: ${allCapabilities.mcpServers.length}`);
  console.log(`   ⚙️ 配置总数: ${allCapabilities.configs.length}`);
  console.log(`   💬 提示词总数: ${allCapabilities.prompts.length}`);

  // 5. 保存详细信息到 JSON 文件
  const outputPath = path.join(process.cwd(), 'all-plugins-and-capabilities.json');
  await fs.writeJSON(outputPath, {
    summary: {
      totalPlugins: pluginDetails.length,
      totalCapabilities: {
        skills: allCapabilities.skills.length,
        commands: allCapabilities.commands.length,
        agents: allCapabilities.agents.length,
        hooks: allCapabilities.hooks.length,
        mcpServers: allCapabilities.mcpServers.length,
        configs: allCapabilities.configs.length,
        prompts: allCapabilities.prompts.length
      }
    },
    plugins: pluginDetails,
    allCapabilities
  }, { spaces: 2 });

  console.log(`\n\n💾 详细信息已保存到: ${outputPath}`);
  console.log('\n✅ 插件和能力信息获取完成！');
}

// 运行脚本
if (require.main === module) {
  getAllPluginsAndCapabilities().catch(console.error);
}

export { getAllPluginsAndCapabilities };