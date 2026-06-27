# PHCode

> 本地优先的 AI 对话工作台，数据始终保留在你的设备上  
> A local-first AI chat workspace that keeps your data on device.

PHCode 是一款面向本地部署场景的桌面 AI 应用，基于 `Electron + React + Vite + Node.js + FastAPI`
构建，默认接入 `Ollama` 本地模型，并提供联网搜索、本地知识库、多用户账户、Prompt 管理、会话分支等能力。  
PHCode is a desktop AI application for local deployment, built with `Electron + React + Vite + Node.js + FastAPI`.
It connects to local `Ollama` models by default and provides web search, local knowledge base, multi-user accounts,
Prompt management, and conversation branching.

## 设计目标 / Design Goals

- 本地运行：模型、会话与知识库数据均保存在本机  
  Local-first: models, conversations, and knowledge base data stay on your machine.
- 可控可扩展：支持模型切换、RAG、联网搜索与自定义 Prompt  
  Controllable and extensible: model switching, RAG, web search, and custom Prompts.
- 桌面体验：统一的 Electron 桌面端，提供快捷键与窗口管理  
  Desktop experience: a unified Electron client with shortcuts and window controls.
- 多用户隔离：账户、会话、知识库、设置按用户维度隔离  
  Multi-user isolation: accounts, conversations, knowledge bases, and settings are scoped per user.

## 主要能力 / Features

| 能力 / Feature | 说明 / Description |
|---|---|
| 本地 AI 对话 / Local AI chat | 连接 Ollama 本地模型，支持流式输出 / Connects to Ollama with streaming responses |
| 自动发现模型 / Auto model discovery | 自动探测本机 Ollama 服务并加载可用模型 / Auto-detects local Ollama and loads available models |
| 联网搜索 / Web search | 可选启用，失败自动降级，不中断对话 / Optional, fails gracefully without interrupting chat |
| 多用户账户 / Multi-user accounts | 本地登录 / 注册界面，支持会话持久化 / Local login and registration with session persistence |
| 会话管理 / Conversation management | 新建、重命名、删除、切换会话 / Create, rename, delete, and switch conversations |
| 对话分支 / Branching | 支持分支浏览与继续生成 / Branch browsing and continuation generation |
| 本地知识库 / Local knowledge base | 文档上传、知识库检索与 RAG 上下文注入 / Upload docs and inject RAG context |
| Prompt 管理 / Prompt library | 保存、编辑、复制常用 Prompt 模板 / Save, edit, and reuse Prompt templates |
| Markdown 渲染 / Markdown rendering | 支持表格、列表、引用、代码块等 / Tables, lists, quotes, and code blocks |
| 代码高亮 / Code highlighting | 支持代码块语法高亮 / Syntax highlighting for code blocks |
| 数学公式 / Math rendering | 使用 KaTeX 渲染 LaTeX 公式 / Renders LaTeX via KaTeX |
| 文件上传 / File upload | 支持图片、PDF、文本及常见代码文件 / Supports images, PDF, text, and code files |
| 主题系统 / Theme system | 深色 / 浅色主题切换并自动保存 / Dark and light themes with persistence |
| 聊天导出 / Chat export | 支持将聊天记录导出为 JSON / Export chat history as JSON |

## 技术架构 / Architecture

```text
React (Vite) → Electron → Node.js (Express, port 3000) → Python (FastAPI, port 8000) → Ollama (port 11434)
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
  src/middleware/             # 认证与错误处理 / Auth and error handling
ai/                           # Python AI 服务 / Python AI service
  app/routers/                # FastAPI 路由 / FastAPI routes
  app/services/               # Ollama / RAG 服务 / Ollama and RAG services
data/                         # 本地数据目录 / Local data directory
  phcode.db                   # SQLite 数据库 / SQLite database
  uploads/                    # 上传文件 / Uploaded files
```

## 环境要求 / Requirements

- Node.js 18+
- Python 3.10+
- Ollama 已安装并运行 / Ollama installed and running

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

- 首次启动后，进入登录 / 注册页面创建本地账户。  
  On first launch, use the login/register page to create a local account.
- 在设置页可查看 Ollama 连接状态、可用模型列表与默认模型。  
  The settings page shows Ollama status, available models, and the default model.
- 若未手动配置 Ollama 地址，应用会自动在本机探测常见端口。  
  If you do not set an Ollama URL manually, the app auto-detects common local ports.
- 联网搜索属于增强能力，可在对话输入区手动开启或关闭。  
  Web search is optional and can be toggled from the chat input area.
- 知识库与 Prompt 都按用户隔离，不同账户之间不会互相影响。  
  Knowledge bases and Prompts are scoped per user and isolated between accounts.

## 快捷键 / Shortcuts

| 快捷键 / Shortcut | 功能 / Action |
|---|---|
| `Ctrl/Cmd + N` | 新建对话 / New conversation |
| `Ctrl/Cmd + B` | 切换侧边栏 / Toggle sidebar |
| `Ctrl/Cmd + ,` | 打开设置 / Open settings |
| `Enter` | 发送消息 / Send message |
| `Shift + Enter` | 插入换行 / Insert newline |

## 数据与隐私 / Data & Privacy

- 所有核心数据保存在本地 SQLite 数据库中。  
  All core data is stored in the local SQLite database.
- 上传文件保存在 `data/uploads/`。  
  Uploaded files are stored in `data/uploads/`.
- 登录态使用本地会话令牌，不依赖云端账户系统。  
  Authentication uses local session tokens and does not depend on a cloud account system.
- 联网搜索仅在你主动开启时使用外部网络。  
  Web search only uses external network access when you enable it.

## 许可证 / License

[MIT License](LICENSE)
