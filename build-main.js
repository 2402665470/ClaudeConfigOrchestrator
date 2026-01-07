const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');

async function build() {
  try {
    // 清理输出目录
    console.log('1. 清理输出目录...');
    await fs.remove('dist/main');
    await fs.remove('dist/common');
    await fs.remove('dist/preload.js');
    
    // 构建主进程
    console.log('2. 构建主进程...');
    execSync('npx tsc -p tsconfig.main.json', { stdio: 'inherit' });
    console.log('   主进程构建完成！');
    
    // 构建 preload
    console.log('3. 构建 preload...');
    execSync('npx tsc -p tsconfig.preload.json', { stdio: 'inherit' });
    console.log('   preload 构建完成！');
    
    // 确保 electron 目录存在
    await fs.ensureDir('electron');
    
    // 复制 preload.js 到 electron 目录
    if (await fs.pathExists('dist/main/preload.js')) {
      await fs.copy('dist/main/preload.js', 'electron/preload.js');
      console.log('   preload.js 已复制到 electron 目录');
    }
    
    // 构建渲染进程
    console.log('4. 构建渲染进程...');
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('   渲染进程构建完成！');
    
    console.log('\n✅ 所有构建完成！');
    console.log('运行 "npx electron ." 启动应用');
    
  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
}

build();