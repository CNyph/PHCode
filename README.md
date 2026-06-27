# PHCode

> 你的本地 AI 助手，数据永不离开本机

PHCode 是一款基于 Ollama 的本地 AI 桌面对话应用，采用 `Electron + React + Vite + Node.js + FastAPI`
架构，支持多模型切换、联网搜索、本地知识库、Prompt 管理、多用户账户和对话流式输出。

## 核心功能

| 功能 | 说明 |
|---|---|
| 本地 AI 对话 | 对接 Ollama 本地模型，支持流式回复 |
| 模型自动探测 | 自动发现本机 Ollama 地址并加载模型列表 |
| 联网搜索 | 可选开启，失败自动降级，不影响本地对话 |
| 多用户账户 | 本地登录/注册界面，账户间数据隔离 |
| 会话管理 | 新建、切换、重命名、删除对话 |
| 对话分支 | 支持消息分支浏览与继续生成 |
| 本地知识库 | 上传/管理知识库文档，支持 RAG 检索 |
| Prompt 管理 | 保存、编辑、复制常用 Prompt 模板 |
| Markdown 渲染 | 支持表格、代码块、引用、列表等 |
| 代码高亮 | 支持代码块语法高亮 |
| 数学公式 | 使用 KaTeX 渲染 LaTeX 公式 |
| 文件上传 | 支持图片、PDF、文本、代码文件等 |
| 主题切换 | 深色/浅色主题自动保存 |
| 导出能力 | 可导出聊天记录为 JSON |

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
  contexts/                   # React Context
  hooks/                      # 自定义 Hooks
  layouts/                    # 页面布局
  pages/                      # 页面级组件
  services/                   # 前端 API 客户端
  stores/                     # Zustand 状态管理
  styles/                     # 全局样式
  types/                      # TypeScript 类型
electron/                     # Electron 主进程
server/                       # Node.js 业务层
  src/routes/                 # API 路由
  src/repositories/           # SQLite 数据访问
ai/                           # Python AI 服务
  app/routers/                # FastAPI 路由
  app/services/               # Ollama / RAG 服务
data/                         # 本地数据目录
  phcode.db                   # SQLite 数据库
  uploads/                    # 上传文件
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- Ollama 已安装并运行

### 安装依赖

```bash
npm install
cd server && npm install && cd ..
cd ai && pip install -r requirements.txt && cd ..
```

### 启动开发环境

```bash
npm run dev
```

## 常用命令

```bash
npm run dev              # 启动全部服务（前端 + Electron + Node.js + FastAPI）
npm run dev:server       # 仅启动 Node.js 服务
npm run dev:ai           # 仅启动 Python AI 服务
npm run dev:frontend     # 仅启动 Vite 前端
npm run dev:electron     # 仅启动 Electron
npm run build            # 构建生产版本
npm run lint             # ESLint 检查
npm run lint:fix         # ESLint 自动修复
npm run format           # Prettier 格式化
npm run format:check     # Prettier 检查
npm run typecheck        # TypeScript 类型检查
```

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl/Cmd + N` | 新建对话 |
| `Ctrl/Cmd + B` | 切换侧边栏 |
| `Ctrl/Cmd + ,` | 打开设置 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |

## 说明

- 登录/注册是本地账户体系，数据保存在本机数据库中。
- 联网搜索为可选能力，外网不可用时会自动回退到纯本地对话。
- Ollama 模型目录在本机安装后自动探测，通常无需手动配置地址。

## 许可证

[MIT License](LICENSE)
