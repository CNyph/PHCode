# PHCode 项目改进 Roadmap

## Phase 1：基础架构（最高优先级）

### 目标

构建生产级、可维护、可扩展的项目架构。

### 任务

-   重构 Electron 架构
    -   主进程拆分为 `services`、`handlers`、`ipc`、`utils`
    -   React → IPC → Service → Python → AI Provider
    -   AI Provider 抽象，方便切换 Ollama、OpenAI、Claude、Gemini 等
-   数据存储升级
    -   使用 SQLite 替代 JSON
    -   建立 Conversation、Message、Settings、Model 等数据表
-   工程化
    -   ESLint
    -   Prettier
    -   Husky
    -   lint-staged
    -   GitHub Actions（Lint、Type Check、Build）
-   安全
    -   开启 `contextIsolation`
    -   开启 `sandbox`
    -   关闭 `nodeIntegration`
    -   IPC 参数校验与权限校验

------------------------------------------------------------------------

## Phase 2：聊天体验优化

### 目标

提升用户交互体验。

### 功能

-   消息编辑与重新生成
-   分支聊天（Conversation Tree）
-   Markdown 增强
    -   Mermaid
    -   KaTeX
    -   PlantUML
    -   Task List
    -   代码高亮
    -   一键复制
    -   下载代码
-   Streaming 优化
    -   打字机效果
    -   自动滚动
    -   停止生成
    -   继续生成
-   文件上传
    -   PDF
    -   Word
    -   Excel
    -   Markdown
    -   图片
    -   ZIP
    -   代码文件

------------------------------------------------------------------------

## Phase 3：AI 能力增强

### 目标

打造项目核心竞争力。

### 功能

-   Prompt Library
    -   翻译
    -   总结
    -   论文润色
    -   Code Review
    -   PR Review
    -   自定义 Prompt
-   多模型管理
    -   不同场景自动选择模型
-   MCP（工具调用）
    -   Browser
    -   Filesystem
    -   Git
    -   Python
    -   SQL
-   本地知识库（RAG）
    -   文档向量化
    -   多文档检索
    -   引用资料回答
-   Agent
    -   Planner
    -   Tool Call
    -   Memory
    -   Result

------------------------------------------------------------------------

## Phase 4：产品化

### 目标

形成完整生态。

### 功能

-   插件系统
    -   manifest.json
    -   main.ts
    -   icon.svg
-   Workspace
    -   多项目
    -   多会话
    -   标签管理
-   设置中心
    -   模型
    -   API
    -   字体
    -   主题
    -   快捷键
    -   缓存
    -   更新
    -   日志
-   自动更新
-   AI 自动管理
    -   自动标题
    -   自动标签
    -   自动分类

------------------------------------------------------------------------

# UI 优化

参考产品： - ChatGPT - Claude - Cursor - Cherry Studio - Open WebUI

建议： - 毛玻璃 - Skeleton - 消息动画 - 可折叠侧边栏 - 可调整布局 -
Monaco 编辑器增强 - Diff Viewer

------------------------------------------------------------------------

# 推荐开发顺序

``` text
Phase 1：基础架构
        ↓
Phase 2：聊天体验
        ↓
Phase 3：AI 能力
        ↓
Phase 4：产品化
```

------------------------------------------------------------------------

# Top 10 优先开发功能

1.  MCP（工具调用）
2.  本地知识库（RAG）
3.  多模型统一管理
4.  分支聊天
5.  Prompt Library
6.  插件系统
7.  Workspace
8.  SQLite + 全文搜索
9.  Monaco 编辑器增强
10. AI 自动生成标题、标签与分类
