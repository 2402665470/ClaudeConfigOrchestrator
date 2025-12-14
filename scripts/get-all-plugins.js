const { exec } = require('child_process');
const path = require('path');

console.log('🚀 正在编译并运行插件信息获取脚本...\n');

// 编译并运行 TypeScript
const command = `npx ts-node scripts/get-all-plugins.ts`;

const child = exec(command, { cwd: path.join(__dirname, '..') });

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ 脚本执行成功！');
  } else {
    console.error(`\n❌ 脚本执行失败，退出码: ${code}`);
  }
});