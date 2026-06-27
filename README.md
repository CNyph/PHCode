# PHCode

> 本地优先的 AI 对话工作台，数据始终保留在你的设备上

PHCode 是一款面向本地部署场景的桌面 AI 应用，基于 `Electron + React + Vite + Node.js + FastAPI`
构建，默认接入 `Ollama` 本地模型，并提供联网搜索、本地知识库、多用户账户、Prompt 管理、会话分支等能力。

## 设计目标

- 本地运行：模型、会话与知识库数据均保存在本机
- 可控可扩展：支持模型切换、RAG、联网搜索与自定义 Prompt
- 桌面体验：统一的 Electron 桌面端，提供快捷键与窗口管理
- 多用户隔离：账户、会话、知识库、设置按用户维度隔离

## 主要能力

| 能力 | 说明 |
|---|---|
| 本地 AI 对话 | 连接 Ollama 本地模型，支持流式输出 |
| 自动发现模型 | 自动探测本机 Ollama 服务并加载可用模型 |
| 联网搜索 | 可选启用，失败自动降级，不中断对话 |
| 多用户账户 | 本地登录 / 注册界面，支持会话持久化 |
| 会话管理 | 新建、重命名、删除、切换会话 |
| 对话分支 | 支持分支浏览与继续生成 |
| 本地知识库 | 文档上传、知识库检索与 RAG 上下文注入 |
| Prompt 管理 | 保存、编辑、复制常用 Prompt 模板 |
| Markdown 渲染 | 支持表格、列表、引用、代码块等 |
| 代码高亮 | 支持代码块语法高亮 |
| 数学公式 | 使用 KaTeX 渲染 LaTeX 公式 |
| 文件上传 | 支持图片、PDF、文本及常见代码文件 |
| 主题系统 | 深色 / 浅色主题切换并自动保存 |
| 聊天导出 | 支持将聊天记录导出为 JSON |

## 技术架构

```text
React (Vite) → Electron → Node.js (Express, port 3000) → Python (FastAPI, port 8000) → Ollama (port 11434)
                                      ↓
                                 SQLite (data/phcode.db)
```

## 项目结构

```text
src/                          # React 前端
  components/                 # UI 组件
  components/chat/            # 聊天相关组件
  components/ui/              # 基础 UI 组件
  contexts/                   # React Context
  hooks/                      # 自定义 Hooks
  layouts/                    # 页面布局
  pages/                      # 页面组件
  services/                   # API 客户端
  stores/                     # Zustand 状态管理
  styles/                     # 全局样式
  types/                      # TypeScript 类型定义
electron/                     # Electron 主进程
server/                       # Node.js 业务层
  src/routes/                 # API 路由
  src/repositories/           # SQLite 数据访问
  src/middleware/             # 认证与错误处理
ai/                           # Python AI 服务
  app/routers/                # FastAPI 路由
  app/services/               # Ollama / RAG 服务
data/                         # 本地数据目录
  phcode.db                   # SQLite 数据库
  uploads/                    # 上传文件
```

## 环境要求

- Node.js 18+
- Python 3.10+
- Ollama 已安装并运行

## 本地开发

### 安装依赖

```bash
npm install
cd server && npm install && cd ..
cd ai && pip install -r requirements.txt && cd ..
```

### 启动应用

```bash
npm run dev
```

开发模式会同时启动前端、Electron、Node.js 业务层和 Python AI 服务。

## 常用命令

```bash
npm run dev              # 启动全部服务
npm run dev:server       # 启动 Node.js 服务
npm run dev:ai           # 启动 Python AI 服务
npm run dev:frontend     # 启动 Vite 前端
npm run dev:electron     # 启动 Electron
npm run build            # 构建生产版本
npm run preview          # 预览前端构建结果
npm run lint             # ESLint 检查
npm run lint:fix         # ESLint 自动修复
npm run format           # Prettier 格式化
npm run format:check     # Prettier 格式检查
npm run typecheck        # TypeScript 类型检查
```

## 使用说明

- 首次启动后，进入登录 / 注册页面创建本地账户。
- 在设置页可查看 Ollama 连接状态、可用模型列表与默认模型。
- 若未手动配置 Ollama 地址，应用会自动在本机探测常见端口。
- 联网搜索属于增强能力，可在对话输入区手动开启或关闭。
- 知识库与 Prompt 都按用户隔离，不同账户之间不会互相影响。

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl/Cmd + N` | 新建对话 |
| `Ctrl/Cmd + B` | 切换侧边栏 |
| `Ctrl/Cmd + ,` | 打开设置 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 插入换行 |

## 数据与隐私

- 所有核心数据保存在本地 SQLite 数据库中。
- 上传文件保存在 `data/uploads/`。
- 登录态使用本地会话令牌，不依赖云端账户系统。
- 联网搜索仅在你主动开启时使用外部网络。

## 许可证

[MIT License](LICENSE)
