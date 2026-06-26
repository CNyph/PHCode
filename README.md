# PHCode

> 你的私人 AI 助手，数据永不离开本机

基于 Ollama 的本地 AI 桌面对话应用，支持多模型切换、Markdown 渲染、代码高亮、LaTeX 公式、文件上传等功能。

## 功能特性

### 核心功能
- 🤖 **多模型支持** - 通过 Ollama 运行本地大语言模型（Llama、Qwen、Mistral 等）
- 💬 **多会话管理** - 创建、切换、重命名、删除对话
- 📝 **Markdown 渲染** - 完整的 Markdown 支持，包括表格、列表、引用
- 🎨 **代码高亮** - 支持 100+ 编程语言的语法高亮
- 📐 **LaTeX 公式** - KaTeX 数学公式渲染
- 📎 **文件上传** - 支持图片、PDF、代码文件等
- 🖼️ **图片预览** - 缩略图查看 + 点击放大

### 界面特性
- 🌓 **深色/浅色主题** - 一键切换，自动保存偏好
- 👤 **用户头像** - 自定义头像显示
- 🔍 **搜索历史** - 快速查找对话
- ⚡ **流式输出** - 实时显示 AI 生成内容
- 📱 **响应式布局** - 自适应窗口大小

### 高级功能
- 📚 **知识库** - RAG 支持，上传文档建立知识库
- 📤 **导出功能** - 一键导出聊天记录为 JSON
- ⚙️ **设置中心** - 模型配置、Ollama 连接状态
- 🔌 **Embedding** - 文本向量化 API

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 桌面端 | Electron 31 |
| 业务层 | Node.js + Express |
| AI 层 | Python + FastAPI |
| 本地模型 | Ollama |
| 数据库 | SQLite (sql.js) |

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.10+
- Ollama（已安装并运行）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/phcode.git
   cd phcode
   ```

2. **安装前端依赖**
   ```bash
   npm install
   ```

3. **安装服务端依赖**
   ```bash
   cd server && npm install && cd ..
   ```

4. **安装 Python 依赖**
   ```bash
   cd ai && pip install -r requirements.txt && cd ..
   ```

5. **安装 Ollama 模型**
   ```bash
   ollama pull llama3.2
   ```

6. **启动应用**
   ```bash
   npm run dev
   ```

## 开发命令

```bash
npm run dev              # 启动所有服务
npm run dev:server       # 仅启动 Node.js 服务
npm run dev:ai           # 仅启动 Python AI 服务
npm run dev:frontend     # 仅启动 Vite 前端
npm run build            # 构建生产版本
npm run lint             # 代码检查
npm run typecheck        # 类型检查
```

## 项目结构

```
PHCode/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── stores/             # Zustand 状态管理
│   ├── services/           # API 服务
│   └── pages/              # 页面组件
├── server/                 # Node.js 业务层
│   └── src/
│       ├── routes/         # API 路由
│       └── repositories/   # 数据访问层
├── ai/                     # Python AI 服务
│   └── app/
│       ├── routers/        # FastAPI 路由
│       └── services/       # Ollama 客户端
├── electron/               # Electron 主进程
└── data/                   # 本地数据存储
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建对话 |
| `Ctrl/Cmd + B` | 切换侧边栏 |
| `Ctrl/Cmd + ,` | 打开设置 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |

## 许可证

[MIT License](LICENSE)

## 致谢

- [Ollama](https://ollama.com/) - 本地大语言模型运行时
- [React](https://react.dev/) - 用户界面库
- [Electron](https://www.electronjs.org/) - 桌面应用框架
- [FastAPI](https://fastapi.tiangolo.com/) - 高性能 Python Web 框架
