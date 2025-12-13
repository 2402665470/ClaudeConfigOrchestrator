<!-- Source: https://code.claude.com/docs/zh-CN/claude-code-on-the-web -->

Title: Claude Code on the web - Claude Code Docs

URL Source: https://code.claude.com/docs/zh-CN/claude-code-on-the-web

Markdown Content:
Claude Code on the web 目前处于研究预览阶段。

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#claude-code-on-the-web-%E6%98%AF%E4%BB%80%E4%B9%88%EF%BC%9F)

Claude Code on the web 是什么？
-------------------------------------------------------------------------------------------------------------------------------------------------------

Claude Code on the web 让开发者可以从 Claude 应用启动 Claude Code。这非常适合：

*   **回答问题**：询问代码架构和功能实现方式
*   **错误修复和日常任务**：定义明确的任务，不需要频繁调整
*   **并行工作**：同时处理多个错误修复
*   **本地机器上没有的存储库**：处理你本地没有检出的代码
*   **后端更改**：Claude Code 可以编写测试，然后编写代码来通过这些测试

Claude Code 也可在 Claude iOS 应用上使用。这非常适合：

*   **随时随地**：在通勤或离开笔记本电脑时启动任务
*   **监控**：观察代理工作的轨迹并指导其工作

开发者还可以将 Claude Code 会话从 Claude 应用移到他们的终端，以继续本地任务。

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E8%B0%81%E5%8F%AF%E4%BB%A5%E4%BD%BF%E7%94%A8-claude-code-on-the-web%EF%BC%9F)

谁可以使用 Claude Code on the web？
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Claude Code on the web 在研究预览中可供以下用户使用：

*   **Pro 用户**
*   **Max 用户**

即将推出给团队和企业高级席位用户。

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%85%A5%E9%97%A8)

入门
-------------------------------------------------------------------------------------

1.   访问 [claude.ai/code](https://claude.ai/code)
2.   连接你的 GitHub 账户
3.   在你的存储库中安装 Claude GitHub 应用
4.   选择你的默认环境
5.   提交你的编码任务
6.   审查更改并在 GitHub 中创建拉取请求

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86)

工作原理
---------------------------------------------------------------------------------------------------------

当你在 Claude Code on the web 上启动任务时：

1.   **存储库克隆**：你的存储库被克隆到 Anthropic 管理的虚拟机
2.   **环境设置**：Claude 准备一个安全的云环境，其中包含你的代码
3.   **网络配置**：根据你的设置配置互联网访问
4.   **任务执行**：Claude 分析代码、进行更改、运行测试并检查其工作
5.   **完成**：完成后你会收到通知，可以使用更改创建 PR
6.   **结果**：更改被推送到一个分支，准备好创建拉取请求

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%9C%A8%E7%BD%91%E7%BB%9C%E5%92%8C%E7%BB%88%E7%AB%AF%E4%B9%8B%E9%97%B4%E7%A7%BB%E5%8A%A8%E4%BB%BB%E5%8A%A1)

在网络和终端之间移动任务
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E4%BB%8E%E7%BD%91%E7%BB%9C%E5%88%B0%E7%BB%88%E7%AB%AF)

从网络到终端

在网络上启动任务后：

1.   点击”在 CLI 中打开”按钮
2.   在存储库检出的终端中粘贴并运行命令
3.   任何现有的本地更改将被隐藏，远程会话将被加载
4.   继续本地工作

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E4%BA%91%E7%8E%AF%E5%A2%83)

云环境
-----------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E9%BB%98%E8%AE%A4%E9%95%9C%E5%83%8F)

默认镜像

我们构建并维护一个通用镜像，其中预装了常见的工具链和语言生态系统。此镜像包括：

*   流行的编程语言和运行时
*   常见的构建工具和包管理器
*   测试框架和代码检查工具

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E6%A3%80%E6%9F%A5%E5%8F%AF%E7%94%A8%E5%B7%A5%E5%85%B7)

检查可用工具

要查看环境中预装的内容，请要求 Claude Code 运行：

```
check-tools
```

此命令显示：

*   编程语言及其版本
*   可用的包管理器
*   已安装的开发工具

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E7%89%B9%E5%AE%9A%E8%AF%AD%E8%A8%80%E7%9A%84%E8%AE%BE%E7%BD%AE)

特定语言的设置

通用镜像包括以下预配置的环境：

*   **Python**：Python 3.x，带有 pip、poetry 和常见的科学库
*   **Node.js**：最新的 LTS 版本，带有 npm、yarn 和 pnpm
*   **Java**：OpenJDK，带有 Maven 和 Gradle
*   **Go**：最新稳定版本，带有模块支持
*   **Rust**：Rust 工具链和 cargo
*   **C++**：GCC 和 Clang 编译器

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE)

环境配置

当你在 Claude Code on the web 中启动会话时，以下是幕后发生的情况：

1.   **环境准备**：我们克隆你的存储库并运行任何为初始化配置的 Claude 钩子。存储库将使用 GitHub 存储库上的默认分支进行克隆。如果你想检出特定分支，可以在提示中指定。
2.   **网络配置**：我们为代理配置互联网访问。默认情况下互联网访问受限，但你可以根据需要将环境配置为无互联网或完全互联网访问。
3.   **Claude Code 执行**：Claude Code 运行以完成你的任务，编写代码、运行测试并检查其工作。你可以通过网络界面在整个会话中指导和调整 Claude。Claude 尊重你在 `CLAUDE.md` 中定义的上下文。
4.   **结果**：当 Claude 完成其工作时，它将把分支推送到远程。你将能够为该分支创建 PR。

Claude 完全通过环境中可用的终端和 CLI 工具运行。它使用通用镜像中预装的工具和通过钩子或依赖管理安装的任何其他工具。

**添加新环境**：选择当前环境以打开环境选择器，然后选择”添加环境”。这将打开一个对话框，你可以在其中指定环境名称、网络访问级别和任何要设置的环境变量。**更新现有环境**：选择当前环境，在环境名称的右侧，然后选择设置按钮。这将打开一个对话框，你可以在其中更新环境名称、网络访问和环境变量。

环境变量必须指定为键值对，采用 [`.env` 格式](https://www.dotenv.org/)。例如：

```
API_KEY=your_api_key
DEBUG=true
```

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E4%BE%9D%E8%B5%96%E7%AE%A1%E7%90%86)

依赖管理

使用 [SessionStart 钩子](https://code.claude.com/docs/zh-CN/hooks#sessionstart) 配置自动依赖安装。这可以在你的存储库的 `.claude/settings.json` 文件中配置：

```
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/install_pkgs.sh"
          }
        ]
      }
    ]
  }
}
```

在 `scripts/install_pkgs.sh` 创建相应的脚本：

```
#!/bin/bash
npm install
pip install -r requirements.txt
exit 0
```

使其可执行：`chmod +x scripts/install_pkgs.sh`

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E6%9C%AC%E5%9C%B0%E4%B8%8E%E8%BF%9C%E7%A8%8B%E6%89%A7%E8%A1%8C)

本地与远程执行

默认情况下，所有钩子在本地和远程（网络）环境中都执行。要仅在一个环境中运行钩子，请在钩子脚本中检查 `CLAUDE_CODE_REMOTE` 环境变量。

```
#!/bin/bash

# 示例：仅在远程环境中运行
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

npm install
pip install -r requirements.txt
```

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E6%8C%81%E4%B9%85%E5%8C%96%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)

持久化环境变量

SessionStart 钩子可以通过写入 `CLAUDE_ENV_FILE` 环境变量中指定的文件来为后续 bash 命令持久化环境变量。有关详细信息，请参阅钩子参考中的 [SessionStart 钩子](https://code.claude.com/docs/zh-CN/hooks#sessionstart)。

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E7%BD%91%E7%BB%9C%E8%AE%BF%E9%97%AE%E5%92%8C%E5%AE%89%E5%85%A8)

网络访问和安全
---------------------------------------------------------------------------------------------------------------------------------------

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E7%BD%91%E7%BB%9C%E7%AD%96%E7%95%A5)

网络策略

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#github-%E4%BB%A3%E7%90%86)

GitHub 代理

为了安全起见，所有 GitHub 操作都通过专用代理服务进行，该服务透明地处理所有 git 交互。在沙箱内，git 客户端使用自定义构建的作用域凭证进行身份验证。此代理：

*   安全地管理 GitHub 身份验证 - git 客户端在沙箱内使用作用域凭证，代理验证并将其转换为你的实际 GitHub 身份验证令牌
*   限制 git push 操作到当前工作分支以确保安全
*   启用无缝克隆、获取和 PR 操作，同时维护安全边界

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%AE%89%E5%85%A8%E4%BB%A3%E7%90%86)

安全代理

环境在 HTTP/HTTPS 网络代理后面运行，用于安全和滥用防止目的。所有出站互联网流量都通过此代理，该代理提供：

*   防止恶意请求
*   速率限制和滥用防止
*   内容过滤以增强安全性

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E8%AE%BF%E9%97%AE%E7%BA%A7%E5%88%AB)

访问级别

默认情况下，网络访问仅限于 [允许列表中的域](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#default-allowed-domains)。你可以配置自定义网络访问，包括禁用网络访问。

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E9%BB%98%E8%AE%A4%E5%85%81%E8%AE%B8%E7%9A%84%E5%9F%9F)

默认允许的域

使用”受限”网络访问时，默认允许以下域：

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#anthropic-%E6%9C%8D%E5%8A%A1)

Anthropic 服务

*   api.anthropic.com
*   statsig.anthropic.com
*   claude.ai

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E7%89%88%E6%9C%AC%E6%8E%A7%E5%88%B6)

版本控制

*   github.com
*   [www.github.com](http://www.github.com/)
*   api.github.com
*   raw.githubusercontent.com
*   objects.githubusercontent.com
*   codeload.github.com
*   avatars.githubusercontent.com
*   camo.githubusercontent.com
*   gist.github.com
*   gitlab.com
*   [www.gitlab.com](http://www.gitlab.com/)
*   registry.gitlab.com
*   bitbucket.org
*   [www.bitbucket.org](http://www.bitbucket.org/)
*   api.bitbucket.org

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%AE%B9%E5%99%A8%E6%B3%A8%E5%86%8C%E8%A1%A8)

容器注册表

*   registry-1.docker.io
*   auth.docker.io
*   index.docker.io
*   hub.docker.com
*   [www.docker.com](http://www.docker.com/)
*   production.cloudflare.docker.com
*   download.docker.com
*   *.gcr.io
*   ghcr.io
*   mcr.microsoft.com
*   *.data.mcr.microsoft.com

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E4%BA%91%E5%B9%B3%E5%8F%B0)

云平台

*   cloud.google.com
*   accounts.google.com
*   gcloud.google.com
*   *.googleapis.com
*   storage.googleapis.com
*   compute.googleapis.com
*   container.googleapis.com
*   azure.com
*   portal.azure.com
*   microsoft.com
*   [www.microsoft.com](http://www.microsoft.com/)
*   *.microsoftonline.com
*   packages.microsoft.com
*   dotnet.microsoft.com
*   dot.net
*   visualstudio.com
*   dev.azure.com
*   oracle.com
*   [www.oracle.com](http://www.oracle.com/)
*   java.com
*   [www.java.com](http://www.java.com/)
*   java.net
*   [www.java.net](http://www.java.net/)
*   download.oracle.com
*   yum.oracle.com

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8-javascript/node)

包管理器 - JavaScript/Node

*   registry.npmjs.org
*   [www.npmjs.com](http://www.npmjs.com/)
*   [www.npmjs.org](http://www.npmjs.org/)
*   npmjs.com
*   npmjs.org
*   yarnpkg.com
*   registry.yarnpkg.com

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8-python)

包管理器 - Python

*   pypi.org
*   [www.pypi.org](http://www.pypi.org/)
*   files.pythonhosted.org
*   pythonhosted.org
*   test.pypi.org
*   pypi.python.org
*   pypa.io
*   [www.pypa.io](http://www.pypa.io/)

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8-ruby)

包管理器 - Ruby

*   rubygems.org
*   [www.rubygems.org](http://www.rubygems.org/)
*   api.rubygems.org
*   index.rubygems.org
*   ruby-lang.org
*   [www.ruby-lang.org](http://www.ruby-lang.org/)
*   rubyforge.org
*   [www.rubyforge.org](http://www.rubyforge.org/)
*   rubyonrails.org
*   [www.rubyonrails.org](http://www.rubyonrails.org/)
*   rvm.io
*   get.rvm.io

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8-rust)

包管理器 - Rust

*   crates.io
*   [www.crates.io](http://www.crates.io/)
*   static.crates.io
*   rustup.rs
*   static.rust-lang.org
*   [www.rust-lang.org](http://www.rust-lang.org/)

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8-go)

包管理器 - Go

*   proxy.golang.org
*   sum.golang.org
*   index.golang.org
*   golang.org
*   [www.golang.org](http://www.golang.org/)
*   goproxy.io
*   pkg.go.dev

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8-jvm)

包管理器 - JVM

*   maven.org
*   repo.maven.org
*   central.maven.org
*   repo1.maven.org
*   jcenter.bintray.com
*   gradle.org
*   [www.gradle.org](http://www.gradle.org/)
*   services.gradle.org
*   spring.io
*   repo.spring.io

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8-%E5%85%B6%E4%BB%96%E8%AF%AD%E8%A8%80)

包管理器 - 其他语言

*   packagist.org (PHP Composer)
*   [www.packagist.org](http://www.packagist.org/)
*   repo.packagist.org
*   nuget.org (.NET NuGet)
*   [www.nuget.org](http://www.nuget.org/)
*   api.nuget.org
*   pub.dev (Dart/Flutter)
*   api.pub.dev
*   hex.pm (Elixir/Erlang)
*   [www.hex.pm](http://www.hex.pm/)
*   cpan.org (Perl CPAN)
*   [www.cpan.org](http://www.cpan.org/)
*   metacpan.org
*   [www.metacpan.org](http://www.metacpan.org/)
*   api.metacpan.org
*   cocoapods.org (iOS/macOS)
*   [www.cocoapods.org](http://www.cocoapods.org/)
*   cdn.cocoapods.org
*   haskell.org
*   [www.haskell.org](http://www.haskell.org/)
*   hackage.haskell.org
*   swift.org
*   [www.swift.org](http://www.swift.org/)

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#linux-%E5%8F%91%E8%A1%8C%E7%89%88)

Linux 发行版

*   archive.ubuntu.com
*   security.ubuntu.com
*   ubuntu.com
*   [www.ubuntu.com](http://www.ubuntu.com/)
*   *.ubuntu.com
*   ppa.launchpad.net
*   launchpad.net
*   [www.launchpad.net](http://www.launchpad.net/)

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%92%8C%E5%B9%B3%E5%8F%B0)

开发工具和平台

*   dl.k8s.io (Kubernetes)
*   pkgs.k8s.io
*   k8s.io
*   [www.k8s.io](http://www.k8s.io/)
*   releases.hashicorp.com (HashiCorp)
*   apt.releases.hashicorp.com
*   rpm.releases.hashicorp.com
*   archive.releases.hashicorp.com
*   hashicorp.com
*   [www.hashicorp.com](http://www.hashicorp.com/)
*   repo.anaconda.com (Anaconda/Conda)
*   conda.anaconda.org
*   anaconda.org
*   [www.anaconda.com](http://www.anaconda.com/)
*   anaconda.com
*   continuum.io
*   apache.org (Apache)
*   [www.apache.org](http://www.apache.org/)
*   archive.apache.org
*   downloads.apache.org
*   eclipse.org (Eclipse)
*   [www.eclipse.org](http://www.eclipse.org/)
*   download.eclipse.org
*   nodejs.org (Node.js)
*   [www.nodejs.org](http://www.nodejs.org/)

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E4%BA%91%E6%9C%8D%E5%8A%A1%E5%92%8C%E7%9B%91%E6%8E%A7)

云服务和监控

*   statsig.com
*   [www.statsig.com](http://www.statsig.com/)
*   api.statsig.com
*   *.sentry.io

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%86%85%E5%AE%B9%E4%BA%A4%E4%BB%98%E5%92%8C%E9%95%9C%E5%83%8F)

内容交付和镜像

*   *.sourceforge.net
*   packagecloud.io
*   *.packagecloud.io

#### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E6%9E%B6%E6%9E%84%E5%92%8C%E9%85%8D%E7%BD%AE)

架构和配置

*   json-schema.org
*   [www.json-schema.org](http://www.json-schema.org/)
*   json.schemastore.org
*   [www.schemastore.org](http://www.schemastore.org/)

标记为 `*` 的域表示通配符子域匹配。例如，`*.gcr.io` 允许访问 `gcr.io` 的任何子域。

### [​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E8%87%AA%E5%AE%9A%E4%B9%89%E7%BD%91%E7%BB%9C%E8%AE%BF%E9%97%AE%E7%9A%84%E5%AE%89%E5%85%A8%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)

自定义网络访问的安全最佳实践

1.   **最小权限原则**：仅启用所需的最小网络访问
2.   **定期审计**：定期审查允许的域
3.   **使用 HTTPS**：始终优先使用 HTTPS 端点而不是 HTTP

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%AE%89%E5%85%A8%E5%92%8C%E9%9A%94%E7%A6%BB)

安全和隔离
-------------------------------------------------------------------------------------------------------------------

Claude Code on the web 提供强大的安全保证：

*   **隔离的虚拟机**：每个会话在隔离的 Anthropic 管理的 VM 中运行
*   **网络访问控制**：网络访问默认受限，可以禁用

在禁用网络访问的情况下运行时，Claude Code 被允许与 Anthropic API 通信，这可能仍然允许数据从隔离的 Claude Code VM 中退出。

*   **凭证保护**：敏感凭证（如 git 凭证或签名密钥）永远不会在 Claude Code 的沙箱内。身份验证通过使用作用域凭证的安全代理处理
*   **安全分析**：代码在隔离的 VM 内进行分析和修改，然后创建 PR

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E5%AE%9A%E4%BB%B7%E5%92%8C%E9%80%9F%E7%8E%87%E9%99%90%E5%88%B6)

定价和速率限制
---------------------------------------------------------------------------------------------------------------------------------------

Claude Code on the web 与你账户内所有其他 Claude 和 Claude Code 使用共享速率限制。并行运行多个任务将按比例消耗更多速率限制。

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E9%99%90%E5%88%B6)

限制
-------------------------------------------------------------------------------------

*   **存储库身份验证**：仅当你已认证到同一账户时，才能将会话从网络移到本地
*   **平台限制**：Claude Code on the web 仅适用于 GitHub 中托管的代码。GitLab 和其他非 GitHub 存储库无法与云会话一起使用

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)

最佳实践
---------------------------------------------------------------------------------------------------------

1.   **使用 Claude Code 钩子**：配置 [sessionStart 钩子](https://code.claude.com/docs/zh-CN/hooks#sessionstart) 以自动化环境设置和依赖安装。
2.   **记录要求**：在你的 `CLAUDE.md` 文件中清楚地指定依赖和命令。如果你有 `AGENTS.md` 文件，可以在 `CLAUDE.md` 中使用 `@AGENTS.md` 来源它，以维护单一真实来源。

[​](https://code.claude.com/docs/zh-CN/claude-code-on-the-web#%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)

相关资源
---------------------------------------------------------------------------------------------------------

*   [钩子配置](https://code.claude.com/docs/zh-CN/hooks)
*   [设置参考](https://code.claude.com/docs/zh-CN/settings)
*   [安全](https://code.claude.com/docs/zh-CN/security)
*   [数据使用](https://code.claude.com/docs/zh-CN/data-usage)
