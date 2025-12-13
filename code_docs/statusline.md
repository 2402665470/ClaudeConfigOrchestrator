<!-- Source: https://code.claude.com/docs/zh-CN/statusline -->

Title: 状态行配置 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/statusline

Markdown Content:
使用自定义状态行自定义 Claude Code，该状态行显示在 Claude Code 界面的底部，类似于 Oh-my-zsh 等 shell 中的终端提示符 (PS1) 的工作方式。

创建自定义状态行
--------

您可以：

*   运行 `/statusline` 让 Claude Code 帮助您设置自定义状态行。默认情况下，它会尝试重现您终端的提示符，但您可以向 Claude Code 提供有关所需行为的其他说明，例如 `/statusline show the model name in orange`
*   直接将 `statusLine` 命令添加到您的 `.claude/settings.json`：

```
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 0 // 可选：设置为 0 以让状态行延伸到边缘
  }
}
```

工作原理
----

*   状态行在对话消息更新时更新
*   更新最多每 300 毫秒运行一次
*   您命令的 stdout 的第一行成为状态行文本
*   支持 ANSI 颜色代码来设置状态行的样式
*   Claude Code 通过 stdin 将有关当前会话的上下文信息（模型、目录等）作为 JSON 传递给您的脚本

JSON 输入结构
---------

您的状态行命令通过 stdin 以 JSON 格式接收结构化数据：

```
{
  "hook_event_name": "Status",
  "session_id": "abc123...",
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/current/working/directory",
  "model": {
    "id": "claude-opus-4-1",
    "display_name": "Opus"
  },
  "workspace": {
    "current_dir": "/current/working/directory",
    "project_dir": "/original/project/directory"
  },
  "version": "1.0.80",
  "output_style": {
    "name": "default"
  },
  "cost": {
    "total_cost_usd": 0.01234,
    "total_duration_ms": 45000,
    "total_api_duration_ms": 2300,
    "total_lines_added": 156,
    "total_lines_removed": 23
  }
}
```

示例脚本
----

### 简单状态行

```
#!/bin/bash
# 从 stdin 读取 JSON 输入
input=$(cat)

# 使用 jq 提取值
MODEL_DISPLAY=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')

echo "[$MODEL_DISPLAY] 📁 ${CURRENT_DIR##*/}"
```

### Git 感知状态行

```
#!/bin/bash
# 从 stdin 读取 JSON 输入
input=$(cat)

# 使用 jq 提取值
MODEL_DISPLAY=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')

# 如果在 git 仓库中，显示 git 分支
GIT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ -n "$BRANCH" ]; then
        GIT_BRANCH=" | 🌿 $BRANCH"
    fi
fi

echo "[$MODEL_DISPLAY] 📁 ${CURRENT_DIR##*/}$GIT_BRANCH"
```

### Python 示例

```
#!/usr/bin/env python3
import json
import sys
import os

# 从 stdin 读取 JSON
data = json.load(sys.stdin)

# 提取值
model = data['model']['display_name']
current_dir = os.path.basename(data['workspace']['current_dir'])

# 检查 git 分支
git_branch = ""
if os.path.exists('.git'):
    try:
        with open('.git/HEAD', 'r') as f:
            ref = f.read().strip()
            if ref.startswith('ref: refs/heads/'):
                git_branch = f" | 🌿 {ref.replace('ref: refs/heads/', '')}"
    except:
        pass

print(f"[{model}] 📁 {current_dir}{git_branch}")
```

### Node.js 示例

```
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 从 stdin 读取 JSON
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    
    // 提取值
    const model = data.model.display_name;
    const currentDir = path.basename(data.workspace.current_dir);
    
    // 检查 git 分支
    let gitBranch = '';
    try {
        const headContent = fs.readFileSync('.git/HEAD', 'utf8').trim();
        if (headContent.startsWith('ref: refs/heads/')) {
            gitBranch = ` | 🌿 ${headContent.replace('ref: refs/heads/', '')}`;
        }
    } catch (e) {
        // 不是 git 仓库或无法读取 HEAD
    }
    
    console.log(`[${model}] 📁 ${currentDir}${gitBranch}`);
});
```

### 辅助函数方法

对于更复杂的 bash 脚本，您可以创建辅助函数：

```
#!/bin/bash
# 一次性读取 JSON 输入
input=$(cat)

# 用于常见提取的辅助函数
get_model_name() { echo "$input" | jq -r '.model.display_name'; }
get_current_dir() { echo "$input" | jq -r '.workspace.current_dir'; }
get_project_dir() { echo "$input" | jq -r '.workspace.project_dir'; }
get_version() { echo "$input" | jq -r '.version'; }
get_cost() { echo "$input" | jq -r '.cost.total_cost_usd'; }
get_duration() { echo "$input" | jq -r '.cost.total_duration_ms'; }
get_lines_added() { echo "$input" | jq -r '.cost.total_lines_added'; }
get_lines_removed() { echo "$input" | jq -r '.cost.total_lines_removed'; }

# 使用辅助函数
MODEL=$(get_model_name)
DIR=$(get_current_dir)
echo "[$MODEL] 📁 ${DIR##*/}"
```

提示
--

*   保持状态行简洁 - 它应该适应一行
*   使用表情符号（如果您的终端支持）和颜色使信息易于扫描
*   在 Bash 中使用 `jq` 进行 JSON 解析（参见上面的示例）
*   通过使用模拟 JSON 输入手动运行脚本来测试您的脚本：`echo '{"model":{"display_name":"Test"},"workspace":{"current_dir":"/test"}}' | ./statusline.sh`
*   如果需要，考虑缓存昂贵的操作（如 git 状态）

故障排除
----

*   如果您的状态行没有出现，请检查您的脚本是否可执行（`chmod +x`）
*   确保您的脚本输出到 stdout（而不是 stderr）
