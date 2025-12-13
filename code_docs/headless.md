<!-- Source: https://code.claude.com/docs/zh-CN/headless -->

Title: 无头模式 - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/headless

Markdown Content:
概述
--

无头模式允许您从命令行脚本和自动化工具以编程方式运行 Claude Code，无需任何交互式 UI。

基本用法
----

Claude Code 的主要命令行界面是 `claude` 命令。使用 `--print`（或 `-p`）标志以非交互模式运行并打印最终结果：

```
claude -p "Stage my changes and write a set of commits for them" \
  --allowedTools "Bash,Read" \
  --permission-mode acceptEdits
```

配置选项
----

无头模式利用 Claude Code 中可用的所有 CLI 选项。以下是用于自动化和脚本编写的关键选项：

| 标志 | 描述 | 示例 |
| --- | --- | --- |
| `--print`, `-p` | 以非交互模式运行 | `claude -p "query"` |
| `--output-format` | 指定输出格式（`text`、`json`、`stream-json`） | `claude -p --output-format json` |
| `--resume`, `-r` | 按会话 ID 恢复对话 | `claude --resume abc123` |
| `--continue`, `-c` | 继续最近的对话 | `claude --continue` |
| `--verbose` | 启用详细日志记录 | `claude --verbose` |
| `--append-system-prompt` | 附加到系统提示（仅与 `--print` 一起使用） | `claude --append-system-prompt "Custom instruction"` |
| `--allowedTools` | 空格分隔的允许工具列表，或 逗号分隔的允许工具列表字符串 | `claude --allowedTools mcp__slack mcp__filesystem` `claude --allowedTools "Bash(npm install),mcp__filesystem"` |
| `--disallowedTools` | 空格分隔的拒绝工具列表，或 逗号分隔的拒绝工具列表字符串 | `claude --disallowedTools mcp__splunk mcp__github` `claude --disallowedTools "Bash(git commit),mcp__github"` |
| `--mcp-config` | 从 JSON 文件加载 MCP 服务器 | `claude --mcp-config servers.json` |
| `--permission-prompt-tool` | 用于处理权限提示的 MCP 工具（仅与 `--print` 一起使用） | `claude --permission-prompt-tool mcp__auth__prompt` |

有关 CLI 选项和功能的完整列表，请参阅 [CLI 参考](https://code.claude.com/docs/zh-CN/cli-reference) 文档。

多轮对话
----

对于多轮对话，您可以恢复对话或从最近的会话继续：

```
# 继续最近的对话
claude --continue "Now refactor this for better performance"

# 按会话 ID 恢复特定对话
claude --resume 550e8400-e29b-41d4-a716-446655440000 "Update the tests"

# 以非交互模式恢复
claude --resume 550e8400-e29b-41d4-a716-446655440000 "Fix all linting issues" --no-interactive
```

输出格式
----

### 文本输出（默认）

```
claude -p "Explain file src/components/Header.tsx"
# 输出：This is a React component showing...
```

### JSON 输出

返回包含元数据的结构化数据：

```
claude -p "How does the data layer work?" --output-format json
```

响应格式：

```
{
  "type": "result",
  "subtype": "success",
  "total_cost_usd": 0.003,
  "is_error": false,
  "duration_ms": 1234,
  "duration_api_ms": 800,
  "num_turns": 6,
  "result": "The response text here...",
  "session_id": "abc123"
}
```

### 流式 JSON 输出

在接收到每条消息时流式传输：

```
claude -p "Build an application" --output-format stream-json
```

每个对话以初始 `init` 系统消息开始，然后是用户和助手消息列表，最后是带有统计信息的最终 `result` 系统消息。每条消息都作为单独的 JSON 对象发出。

输入格式
----

### 文本输入（默认）

```
# 直接参数
claude -p "Explain this code"

# 从 stdin
echo "Explain this code" | claude -p
```

### 流式 JSON 输入

通过 `stdin` 提供的消息流，其中每条消息代表用户的一个轮次。这允许在不重新启动 `claude` 二进制文件的情况下进行多轮对话，并允许在模型处理请求时向其提供指导。每条消息都是一个 JSON”用户消息”对象，遵循与输出消息架构相同的格式。消息使用 [jsonl](https://jsonlines.org/) 格式进行格式化，其中输入的每一行都是一个完整的 JSON 对象。流式 JSON 输入需要 `-p` 和 `--output-format stream-json`。

```
echo '{"type":"user","message":{"role":"user","content":[{"type":"text","text":"Explain this code"}]}}' | claude -p --output-format=stream-json --input-format=stream-json --verbose
```

代理集成示例
------

### SRE 事件响应机器人

```
#!/bin/bash

# 自动化事件响应代理
investigate_incident() {
    local incident_description="$1"
    local severity="${2:-medium}"

    claude -p "Incident: $incident_description (Severity: $severity)" \
      --append-system-prompt "You are an SRE expert. Diagnose the issue, assess impact, and provide immediate action items." \
      --output-format json \
      --allowedTools "Bash,Read,WebSearch,mcp__datadog" \
      --mcp-config monitoring-tools.json
}

# 用法
investigate_incident "Payment API returning 500 errors" "high"
```

### 自动化安全审查

```
# 拉取请求的安全审计代理
audit_pr() {
    local pr_number="$1"

    gh pr diff "$pr_number" | claude -p \
      --append-system-prompt "You are a security engineer. Review this PR for vulnerabilities, insecure patterns, and compliance issues." \
      --output-format json \
      --allowedTools "Read,Grep,WebSearch"
}

# 用法并保存到文件
audit_pr 123 > security-report.json
```

### 多轮法律助手

```
# 具有会话持久性的法律文件审查
session_id=$(claude -p "Start legal review session" --output-format json | jq -r '.session_id')

# 分多个步骤审查合同
claude -p --resume "$session_id" "Review contract.pdf for liability clauses"
claude -p --resume "$session_id" "Check compliance with GDPR requirements"
claude -p --resume "$session_id" "Generate executive summary of risks"
```

最佳实践
----

*   **使用 JSON 输出格式**以便以编程方式解析响应：```
# 使用 jq 解析 JSON 响应
result=$(claude -p "Generate code" --output-format json)
code=$(echo "$result" | jq -r '.result')
cost=$(echo "$result" | jq -r '.cost_usd')
``` 
*   **优雅地处理错误** - 检查退出代码和 stderr：```
if ! claude -p "$prompt" 2>error.log; then
    echo "Error occurred:" >&2
    cat error.log >&2
    exit 1
fi
``` 
*   **使用会话管理**以在多轮对话中维护上下文
*   **考虑超时**以处理长时间运行的操作：```
timeout 300 claude -p "$complex_prompt" || echo "Timed out after 5 minutes"
``` 
*   **尊重速率限制**，在多个请求之间添加延迟

相关资源
----

*   [CLI 使用和控制](https://code.claude.com/docs/zh-CN/cli-reference) - 完整的 CLI 文档
*   [常见工作流](https://code.claude.com/docs/zh-CN/common-workflows) - 常见用例的分步指南
