# 快速上手 Playbook

## 1. 启动开发环境

```bash
npm run dev
```

- 主进程自动监听 `src/main` 并重启 Electron
- 渲染层 Vite devServer 端口 3000，支持热重载

## 2. 验证完整插件安装流程

### Step A：设置市场目录

1. 在「设置」页填入本地插件目录，例如：
   ```
   C:/MyProject/claude/external/example-plugin
   ```

### Step B：浏览插件市场

2. 切到「插件市场」→ 应看到「Hello World 示例插件」卡片

### Step C：添加目标项目

3. 进入「项目列表」→ 点击「添加项目」→ 选择：
   ```
   C:/MyProject/claude/external/example-project
   ```
   系统会自动读取 `claude.json` 中的 name 作为别名

### Step D：安装插件

4. 点击刚添加的项目卡片 → 进入详情页
5. 右侧选择「Hello World 示例插件」→ 点击「安装」
6. 安装完成后查看 `example-project/claude.json`，应新增：
   ```json
   "skills": {
     "existing": { ... },
     "hello": {
       "name": "hello",
       "enabled": true,
       "config": { "greeting": "Hi from plugin!" }
     }
   }
   ```
7. 同时 `example-project/docs/hello.md` 已被复制生成

## 3. 构建与分发

```bash
npm run build   # 生产编译
npm run dist    # 打包安装包（输出到 release/）
```

## 4. 下一步可扩展

- 冲突提示/覆盖选择 UI
- 插件卸载与版本管理
- Git 拉取远程市场
- 多语言国际化
- 自动更新（electron-updater）