const path = require('path');
const fs = require('fs-extra');

const pluginsPath = 'C:/Users/Administrator/.claude/plugins';

async function debugPlugin(pluginId) {
  console.log(`\n=== 调试插件: ${pluginId} ===`);

  const [name, marketplace] = pluginId.split('@');
  const cachePath = path.join(pluginsPath, 'cache', marketplace, name);

  console.log(`缓存路径: ${cachePath}`);
  console.log(`路径存在: ${await fs.pathExists(cachePath)}`);

  if (await fs.pathExists(cachePath)) {
    const entries = await fs.readdir(cachePath);
    const versions = entries.filter(entry => {
      const fullPath = path.join(cachePath, entry);
      return fs.statSync(fullPath).isDirectory();
    });

    console.log(`版本: ${versions.join(', ')}`);

    if (versions.length > 0) {
      const latestVersion = versions.sort().pop();
      const versionPath = path.join(cachePath, latestVersion);

      console.log(`最新版本路径: ${versionPath}`);

      // 检查各个能力类型
      const capabilityTypes = ['skills', 'commands', 'agents', 'hooks', 'mcpServers', 'settings'];

      for (const type of capabilityTypes) {
        const typePath = path.join(versionPath, type);
        const exists = await fs.pathExists(typePath);
        console.log(`${type}: ${exists ? '✓' : '✗'}`);

        if (exists) {
          const items = await fs.readdir(typePath);
          console.log(`  - 包含 ${items.length} 个项目: ${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}`);
        }
      }
    }
  }
}

async function main() {
  const testPlugins = [
    'feature-dev@claude-code-plugins',
    'autonomous-skill@claude-code-settings',
    'commit-commands@claude-code-plugins',
    'hookify@claude-code-plugins',
    'pr-review-toolkit@claude-code-plugins'
  ];

  for (const plugin of testPlugins) {
    await debugPlugin(plugin);
  }
}

main().catch(console.error);