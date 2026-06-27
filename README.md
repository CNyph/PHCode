# PHCode

> 本地优先的 AI 对话工作台，数据始终留在你的设备上  
> A local-first AI chat workspace that keeps your data on device.

PHCode 是一款面向本地部署场景的桌面 AI 应用，基于 `Electron + React + Vite + Node.js + FastAPI` 构建，
默认连接 `Ollama` 本地模型，支持联网搜索、本地知识库、多用户账户、Prompt 管理、会话分支、文件上传等能力。

PHCode is a desktop AI application designed for local deployment. It is built with
`Electron + React + Vite + Node.js + FastAPI`, connects to local `Ollama` models by default,
and provides web search, local knowledge base, multi-user accounts, prompt management,
conversation branching, and file upload.

## 核心价值 / Why PHCode

- 本地优先 / Local-first：模型、会话、知识库与设置尽量保留在本机
- 隐私可控 / Privacy-controlled：不依赖云端账号体系即可使用
- 可扩展 / Extensible：支持模型切换、联网搜索、RAG、Prompt 管理与工具入口
- 桌面级体验 / Desktop-native: Electron 桌面壳，支持快捷键、窗口管理与沉浸式界面
- 多用户隔离 / Multi-user isolation：账号、会话、知识库、Prompt 按用户维度隔离

## 主要功能 / Features

| 功能 / Feature | 说明 / Description |
|---|---|
| 本地 AI 对话 / Local AI chat | 连接 Ollama 本地模型，支持流式输出 / Streams responses from local Ollama models |
| 自动探测模型 / Auto model discovery | 自动检测 Ollama 服务并加载可用模型 / Auto-detects Ollama and loads available models |
| 联网搜索 / Web search | 可按需开启，显示来源卡片，失败时优雅降级 / Optional search with source preview and graceful fallback |
| 多用户账户 / Multi-user accounts | 本地注册、登录、会话保持 / Local registration, login, and session persistence |
| 会话管理 / Conversation management | 新建、重命名、删除、切换会话 / Create, rename, delete, and switch conversations |
| 会话分支 / Branching | 支持分支浏览与继续生成 / Branch navigation and continuation |
| 本地知识库 / Local knowledge base | 文档上传、检索与 RAG 上下文注入 / Upload docs, search them, and inject RAG context |
| Prompt 管理 / Prompt library | 保存、编辑、复用常用 Prompt / Save, edit, and reuse prompt templates |
| 模型参数调优 / Model tuning | 可配置 temperature、top_p、max_tokens、system prompt / Configurable generation parameters |
| 文件上传 / File upload | 支持图片、PDF、文本和常见代码文件 / Supports images, PDF, text, and common code files |
| Markdown 渲染 / Markdown rendering | 表格、列表、引用、代码块、数学公式 / Tables, lists, quotes, code blocks, and math |
| 代码高亮 / Code highlighting | 代码块语法高亮 / Syntax highlighting for code blocks |
| 数学公式 / Math rendering | 使用 KaTeX 渲染 LaTeX / Renders LaTeX with KaTeX |
| 主题系统 / Theme system | 深色 / 浅色主题切换并持久化 / Dark and light themes with persistence |
| 聊天导出 / Chat export | 支持导出聊天记录为 JSON / Export chat history as JSON |
| 诊断面板 / Diagnostics | 快速查看服务状态与连接信息 / Inspect service health and connection info |
| 工具与插件入口 / Tools & plugins | 提供可扩展的界面入口 / Extensible UI surface for future capabilities |

## 界面预览 / UI Highlights

- 采用更统一的现代桌面应用布局
- 设置页按功能分区，便于定位模型、调参、知识库与诊断项
- 知识库页面采用双栏工作台式布局
- 联网搜索结果可在对话中直接查看来源
- 整体视觉风格偏向简洁、克制、专业

## 技术架构 / Architecture

```text
React (Vite) → Electron → Node.js (Express, port 3000) → Python (FastAPI, port 5000) → Ollama (port 11434)
                                           ↓
                                      SQLite (data/phcode.db)
```

## 项目结构 / Project Structure

```text
src/                          # React 前端 / React frontend
  components/                 # UI 组件 / UI components
  components/chat/            # 聊天相关组件 / Chat-specific components
  components/ui/              # 基础 UI 组件 / Base UI components
  contexts/                   # React Context
  hooks/                      # 自定义 Hooks / Custom hooks
  layouts/                    # 页面布局 / Layouts
  pages/                      # 页面组件 / Page components
  services/                   # API 客户端 / API client
  stores/                     # Zustand 状态管理 / Zustand stores
  styles/                     # 全局样式 / Global styles
  types/                      # TypeScript 类型定义 / Type definitions
electron/                     # Electron 主进程 / Electron main process
server/                       # Node.js 业务层 / Node.js business layer
  src/routes/                 # API 路由 / API routes
  src/repositories/           # SQLite 数据访问 / SQLite data access
  src/middleware/             # 错误处理与中间件 / Error handling and middleware
ai/                           # Python AI 服务 / Python AI service
  app/routers/                # FastAPI 路由 / FastAPI routes
  app/services/               # Ollama 与 RAG 服务 / Ollama and RAG services
data/                         # 本地数据目录 / Local data directory
  phcode.db                   # SQLite 数据库 / SQLite database
  uploads/                    # 上传文件 / Uploaded files
```

## 环境要求 / Requirements

- Node.js 18+
- Python 3.10+
- 已安装并运行 `Ollama`

## 本地开发 / Local Development

### 安装依赖 / Install dependencies

```bash
npm install
cd server && npm install && cd ..
cd ai && pip install -r requirements.txt && cd ..
```

### 启动应用 / Start the app

```bash
npm run dev
```

开发模式会同时启动前端、Electron、Node.js 业务层和 Python AI 服务。

Development mode starts the frontend, Electron, Node.js backend, and Python AI service together.

## 常用命令 / Common Commands

```bash
npm run dev              # 启动全部服务 / Start all services
npm run dev:server       # 启动 Node.js 服务 / Start Node.js service
npm run dev:ai           # 启动 Python AI 服务 / Start Python AI service
npm run dev:frontend     # 启动 Vite 前端 / Start Vite frontend
npm run dev:electron     # 启动 Electron / Start Electron
npm run build            # 构建生产版本 / Build production version
npm run preview          # 预览前端构建结果 / Preview frontend build
npm run lint             # ESLint 检查 / Run ESLint
npm run lint:fix         # ESLint 自动修复 / Auto-fix ESLint issues
npm run format           # Prettier 格式化 / Run Prettier
npm run format:check     # Prettier 格式检查 / Check formatting
npm run typecheck        # TypeScript 类型检查 / Run TypeScript type check
```

## 使用说明 / Usage Notes

- 首次启动后可在登录 / 注册页创建本地账号
- 设置页可查看 Ollama 状态、模型列表和当前默认模型
- 未手动配置 Ollama 地址时，应用会自动探测常见本地端口
- 联网搜索为可选能力，可在对话输入区开启或关闭
- 知识库、Prompt 和会话均按用户隔离

## 快捷键 / Shortcuts

| 快捷键 / Shortcut | 功能 / Action |
|---|---|
| `Ctrl/Cmd + N` | 新建对话 / New conversation |
| `Ctrl/Cmd + B` | 切换侧边栏 / Toggle sidebar |
| `Ctrl/Cmd + ,` | 打开设置 / Open settings |
| `Enter` | 发送消息 / Send message |
| `Shift + Enter` | 插入换行 / Insert newline |

## 数据与隐私 / Data & Privacy

- 所有核心数据保存在本地 SQLite 数据库中
- 上传文件存放于 `data/uploads/`
- 登录态使用本地会话令牌，不依赖云端账号系统
- 联网搜索仅在手动开启时访问外部网络

## 许可证 / License

[MIT License](LICENSE)
