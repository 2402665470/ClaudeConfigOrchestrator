const fs = require('fs-extra');

async function clean() {
  console.log('清理 dist 目录...');
  
  // 删除整个 dist 目录
  try {
    await fs.remove('dist');
    console.log('dist 目录已删除');
  } catch (err) {
    console.log('删除 dist 目录失败:', err.message);
  }
  
  // 重新创建必要的目录
  await fs.ensureDir('dist');
  await fs.ensureDir('electron');
  
  console.log('清理完成！');
}

clean();