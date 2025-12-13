<!-- Source: https://code.claude.com/docs/zh-CN/troubleshooting -->

Title: 故障排除 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/troubleshooting

Markdown Content:
常见安装问题
------

### Windows 安装问题：WSL 中的错误

您可能会在 WSL 中遇到以下问题：**操作系统/平台检测问题**：如果您在安装过程中收到错误，WSL 可能正在使用 Windows `npm`。请尝试：

*   在安装前运行 `npm config set os linux`
*   使用 `npm install -g @anthropic-ai/claude-code --force --no-os-check` 安装（不要使用 `sudo`）

**找不到 Node 错误**：如果在运行 `claude` 时看到 `exec: node: not found`，您的 WSL 环境可能正在使用 Windows 安装的 Node.js。您可以使用 `which npm` 和 `which node` 确认这一点，它们应该指向以 `/usr/` 开头的 Linux 路径，而不是 `/mnt/c/`。要解决此问题，请尝试通过 Linux 发行版的包管理器或通过 [`nvm`](https://github.com/nvm-sh/nvm) 安装 Node。**nvm 版本冲突**：如果您在 WSL 和 Windows 中都安装了 nvm，在 WSL 中切换 Node 版本时可能会遇到版本冲突。这是因为 WSL 默认导入 Windows PATH，导致 Windows nvm/npm 优先于 WSL 安装。您可以通过以下方式识别此问题：

*   运行 `which npm` 和 `which node` - 如果它们指向 Windows 路径（以 `/mnt/c/` 开头），则正在使用 Windows 版本
*   在 WSL 中使用 nvm 切换 Node 版本后出现功能损坏

要解决此问题，请修复您的 Linux PATH 以确保 Linux node/npm 版本优先：**主要解决方案：确保 nvm 在您的 shell 中正确加载**最常见的原因是 nvm 在非交互式 shell 中未加载。将以下内容添加到您的 shell 配置文件（`~/.bashrc`、`~/.zshrc` 等）：

```
# Load nvm if it exists
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

或在您的当前会话中直接运行：

```
source ~/.nvm/nvm.sh
```

**替代方案：调整 PATH 顺序**如果 nvm 已正确加载但 Windows 路径仍然优先，您可以在 shell 配置中显式地将 Linux 路径添加到 PATH 的前面：

```
export PATH="$HOME/.nvm/versions/node/$(node -v)/bin:$PATH"
```

### Linux 和 Mac 安装问题：权限或命令未找到错误

使用 npm 安装 Claude Code 时，`PATH` 问题可能会阻止访问 `claude`。 如果您的 npm 全局前缀不是用户可写的（例如 `/usr` 或 `/usr/local`），您也可能会遇到权限错误。

#### 推荐解决方案：原生 Claude Code 安装

Claude Code 有一个原生安装，不依赖于 npm 或 Node.js。

使用以下命令运行原生安装程序。**macOS、Linux、WSL：**

```
# 安装稳定版本（默认）
curl -fsSL https://claude.ai/install.sh | bash

# 安装最新版本
curl -fsSL https://claude.ai/install.sh | bash -s latest

# 安装特定版本号
curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58
```

**Windows PowerShell：**

```
# 安装稳定版本（默认）
irm https://claude.ai/install.ps1 | iex

# 安装最新版本
& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) latest

# 安装特定版本号
& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) 1.0.58
```

此命令为您的操作系统和架构安装适当的 Claude Code 构建，并在 `~/.local/bin/claude` 处添加一个符号链接到安装。

验证安装：

```
claude doctor # 检查安装健康状况
```

权限和身份验证
-------

### 重复的权限提示

如果您发现自己反复批准相同的命令，您可以使用 `/permissions` 命令允许特定工具在没有批准的情况下运行。请参阅[权限文档](https://code.claude.com/docs/zh-CN/iam#configuring-permissions)。

### 身份验证问题

如果您遇到身份验证问题：

1.   运行 `/logout` 完全登出
2.   关闭 Claude Code
3.   使用 `claude` 重新启动并再次完成身份验证过程

如果问题仍然存在，请尝试：

```
rm -rf ~/.config/claude-code/auth.json
claude
```

这会删除您存储的身份验证信息并强制进行干净登录。

性能和稳定性
------

### 高 CPU 或内存使用率

Claude Code 设计用于大多数开发环境，但在处理大型代码库时可能会消耗大量资源。如果您遇到性能问题：

1.   定期使用 `/compact` 来减少上下文大小
2.   在主要任务之间关闭并重新启动 Claude Code
3.   考虑将大型构建目录添加到您的 `.gitignore` 文件中

### 命令挂起或冻结

如果 Claude Code 似乎无响应：

1.   按 Ctrl+C 尝试取消当前操作
2.   如果无响应，您可能需要关闭终端并重新启动

### 搜索和发现问题

如果搜索工具、`@file` 提及、自定义代理和自定义斜杠命令不起作用，请安装系统 `ripgrep`：

```
# macOS (Homebrew)  
brew install ripgrep

# Windows (winget)
winget install BurntSushi.ripgrep.MSVC

# Ubuntu/Debian
sudo apt install ripgrep

# Alpine Linux
apk add ripgrep

# Arch Linux
pacman -S ripgrep
```

然后在您的[环境](https://code.claude.com/docs/zh-CN/settings#environment-variables)中设置 `USE_BUILTIN_RIPGREP=0`。

### WSL 上搜索结果缓慢或不完整

在 WSL 上[跨文件系统工作](https://learn.microsoft.com/en-us/windows/wsl/filesystems)时的磁盘读取性能损失可能会导致在 WSL 上使用 Claude Code 时匹配数量少于预期（但不是完全缺乏搜索功能）。

**解决方案：**

1.   **提交更具体的搜索**：通过指定目录或文件类型来减少搜索的文件数量：“在 auth-service 包中搜索 JWT 验证逻辑”或”在 JS 文件中查找 md5 哈希的使用”。
2.   **将项目移动到 Linux 文件系统**：如果可能，确保您的项目位于 Linux 文件系统（`/home/`）而不是 Windows 文件系统（`/mnt/c/`）。
3.   **使用原生 Windows**：考虑在 Windows 上本地运行 Claude Code 而不是通过 WSL，以获得更好的文件系统性能。

IDE 集成问题
--------

### WSL2 上未检测到 JetBrains IDE

如果您在 WSL2 上使用 Claude Code 和 JetBrains IDE，并收到”未检测到可用的 IDE”错误，这可能是由于 WSL2 的网络配置或 Windows 防火墙阻止连接。

#### WSL2 网络模式

WSL2 默认使用 NAT 网络，这可能会阻止 IDE 检测。您有两个选项：**选项 1：配置 Windows 防火墙**（推荐）

1.   查找您的 WSL2 IP 地址：```
wsl hostname -I
# 示例输出：172.21.123.456
``` 
2.   以管理员身份打开 PowerShell 并创建防火墙规则：```
New-NetFirewallRule -DisplayName "Allow WSL2 Internal Traffic" -Direction Inbound -Protocol TCP -Action Allow -RemoteAddress 172.21.0.0/16 -LocalAddress 172.21.0.0/16
``` （根据步骤 1 中的 WSL2 子网调整 IP 范围）
3.   重新启动您的 IDE 和 Claude Code

**选项 2：切换到镜像网络**添加到 Windows 用户目录中的 `.wslconfig`：

```
[wsl2]
networkingMode=mirrored
```

然后从 PowerShell 使用 `wsl --shutdown` 重新启动 WSL。

有关其他 JetBrains 配置提示，请参阅我们的 [IDE 集成指南](https://code.claude.com/docs/zh-CN/vs-code#jetbrains-plugin-settings)。

### 报告 Windows IDE 集成问题（原生和 WSL）

如果您在 Windows 上遇到 IDE 集成问题，请[创建一个问题](https://github.com/anthropics/claude-code/issues)，并提供以下信息：您是原生（git bash）还是 WSL1/WSL2、WSL 网络模式（NAT 或镜像）、IDE 名称/版本、Claude Code 扩展/插件版本和 shell 类型（bash/zsh/等）

### JetBrains（IntelliJ、PyCharm 等）终端中 ESC 键不起作用

如果您在 JetBrains 终端中使用 Claude Code，ESC 键无法按预期中断代理，这可能是由于与 JetBrains 默认快捷键的键绑定冲突。要解决此问题：

1.   转到设置 → 工具 → 终端
2.   要么： 
    *   取消选中”使用 Escape 将焦点移动到编辑器”，或
    *   单击”配置终端键绑定”并删除”切换焦点到编辑器”快捷键

3.   应用更改

这允许 ESC 键正确中断 Claude Code 操作。

Markdown 格式问题
-------------

Claude Code 有时会生成缺少代码围栏上语言标签的 markdown 文件，这可能会影响 GitHub、编辑器和文档工具中的语法突出显示和可读性。

### 代码块中缺少语言标签

如果您在生成的 markdown 中注意到这样的代码块：

```
```
function example() {
  return "hello";
}
```
```

而不是正确标记的块，如：

```
```javascript
function example() {
  return "hello";
}
```
```

**解决方案：**

1.   **要求 Claude 添加语言标签**：只需请求”请为此 markdown 文件中的所有代码块添加适当的语言标签。”
2.   **使用后处理钩子**：设置自动格式化钩子以检测和添加缺少的语言标签。有关实现详情，请参阅 [markdown 格式化钩子示例](https://code.claude.com/docs/zh-CN/hooks-guide#markdown-formatting-hook)。
3.   **手动验证**：生成 markdown 文件后，查看它们以确保正确的代码块格式，如果需要，请求更正。

### 不一致的间距和格式

如果生成的 markdown 有过多的空行或不一致的间距：**解决方案：**

1.   **请求格式更正**：要求 Claude”修复此 markdown 文件中的间距和格式问题。”
2.   **使用格式化工具**：设置钩子以在生成的 markdown 文件上运行 markdown 格式化程序（如 `prettier`）或自定义格式化脚本。
3.   **指定格式偏好**：在您的提示或项目[内存](https://code.claude.com/docs/zh-CN/memory)文件中包含格式要求。

### Markdown 生成的最佳实践

要最小化格式问题：

*   **在请求中明确说明**：要求”格式正确的 markdown，带有语言标记的代码块”
*   **使用项目约定**：在 [CLAUDE.md](https://code.claude.com/docs/zh-CN/memory) 中记录您首选的 markdown 样式
*   **设置验证钩子**：使用后处理钩子自动验证和修复常见格式问题

获取更多帮助
------

如果您遇到此处未涵盖的问题：

1.   在 Claude Code 中使用 `/bug` 命令直接向 Anthropic 报告问题
2.   检查 [GitHub 存储库](https://github.com/anthropics/claude-code)以了解已知问题
3.   运行 `/doctor` 检查 Claude Code 安装的健康状况
4.   直接向 Claude 询问其功能和特性 - Claude 内置了对其文档的访问权限
