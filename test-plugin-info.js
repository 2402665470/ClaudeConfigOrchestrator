const path = require('path');
const fs = require('fs-extra');

async function testGetPluginInfo() {
  const { ConfigReaderService } = require('./dist/main/services/ConfigReaderService');
  const configReader = new ConfigReaderService();

  console.log('测试 getPluginInfo...');

  try {
    const pluginInfo = await configReader.getPluginInfo('claude-code-settings@claude-code-settings');

    console.log('\n插件信息:');
    console.log('- name:', pluginInfo?.name);
    console.log('- version:', pluginInfo?.version);
    console.log('- source:', pluginInfo?.source);

    if (pluginInfo?.capabilities) {
      console.log('\n能力类型:');
      Object.keys(pluginInfo.capabilities).forEach(type => {
        const items = pluginInfo.capabilities[type];
        console.log(`- ${type}: ${Array.isArray(items) ? items.length : 0} 项`);

        if (type === 'configs' && Array.isArray(items)) {
          console.log('  配置项:');
          items.forEach(item => {
            console.log(`    - ${item.name}`);
          });
        }
      });
    }

    // 检查路径
    if (pluginInfo?.marketplacePath) {
      const settingsPath = path.join(pluginInfo.marketplacePath, 'settings');
      console.log('\nSettings 目录路径:', settingsPath);
      console.log('Settings 目录存在:', await fs.pathExists(settingsPath));

      if (await fs.pathExists(settingsPath)) {
        const files = await fs.readdir(settingsPath);
        console.log('Settings 目录内容:', files.filter(f => f.endsWith('.json')));
      }
    }

  } catch (error) {
    console.error('错误:', error);
  }
}

testGetPluginInfo();