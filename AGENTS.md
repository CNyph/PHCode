# PHCode — Agent Guide

> 你的私人 AI 助手，数据永不离开本机

## Project

Electron desktop app (frameless window) + React + Vite frontend + Node.js (Express) business layer + Python (FastAPI) AI inference layer. Local AI chat application using Ollama.

## Architecture

```
React (Vite) → Electron → Node.js (Express, port 3000) → Python (FastAPI, port 8000) → Ollama (port 11434)
                                      ↓
                                 SQLite (data/phcode.db)
```

## Commands

```bash
npm run dev              # Start all services (Vite + Electron + Express + FastAPI)
npm run dev:server       # Start Node.js server only
npm run dev:ai           # Start Python AI service only
npm run dev:frontend     # Start Vite dev server only
npm run dev:electron     # Start Electron only
npm run build            # vite build + electron-builder
npm run lint             # ESLint src/
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier write
npm run format:check     # Prettier check
npm run typecheck        # tsc --noEmit
```

## Structure

```
src/                          # React frontend
  components/                 # React components (ChatArea, InputArea, Sidebar, TitleBar, ModelSelector, Logo, Avatar)
  components/chat/            # Chat-specific components (MarkdownRenderer, CodeBlock, MessageActions, ImagePreview)
  components/ui/              # shadcn/ui components (new-york style) + Toast
  contexts/                   # React contexts (ThemeContext)
  hooks/                      # Custom React hooks
  layouts/                    # MainLayout.tsx (root layout)
  lib/utils.ts                # cn() helper for className merging
  pages/                      # Page components (SettingsPage, KnowledgeBasePage)
  services/                   # API client (api.ts) + export service (exportService.ts)
  stores/                     # Zustand state management (conversationStore, chatStore)
  styles/                     # globals.css (CSS custom properties theming)
  types/                      # TypeScript type definitions
electron/                     # Electron main process
  main.cjs                    # Main process entry (launches all services)
  preload.cjs                 # contextBridge → window.electronAPI
server/                       # Node.js business layer (Express)
  src/
    routes/                   # API routes (conversations, messages, chat, settings, upload, knowledge)
    repositories/             # Data access layer (SQLite via sql.js)
    middleware/               # Error handler, request logging
    models/                   # TypeScript type definitions
ai/                           # Python AI inference layer (FastAPI)
  app/
    routers/                  # API routes (chat, models, embeddings)
    services/                 # Ollama client, AI services
    core/                     # Configuration
data/                         # Local data storage
  phcode.db                   # SQLite database
  uploads/                    # User uploaded files
```

## Key conventions

- **Path alias**: `@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`)
- **Theming**: CSS custom properties in `src/styles/globals.css`. Theme switching via `src/contexts/ThemeContext.tsx` (dark/light). Use `var(--bg-primary)`, `var(--text-primary)`, etc. — do NOT use Tailwind color utilities for app colors
- **UI components**: shadcn/ui in `src/components/ui/`. Use `cn()` from `@/lib/utils` for conditional class merging
- **State management**: Zustand stores in `src/stores/` (conversationStore, chatStore)
- **API communication**: React ↔ Node.js via HTTP (localhost:3000), Node.js ↔ Python via HTTP (localhost:8000)
- **Electron IPC**: `window.electronAPI` has `minimize()`, `maximize()`, `close()`, `onNewChat()`, `onToggleSidebar()`, `onOpenSettings()` — exposed via preload.js
- **Application Menu**: Standard menu with File (New Chat, Settings), Edit, View (Toggle Sidebar), Window, Help
- **Global Shortcuts**: Ctrl+N (new chat), Ctrl+B (toggle sidebar), Ctrl+, (settings)
- **Animations**: `framer-motion` for transitions and motion components
- **Icons**: `lucide-react` exclusively
- **Database**: SQLite via sql.js (pure JS/WASM, no native compilation), tables: conversations, messages, settings, prompt_templates, knowledge_bases, knowledge_documents
- **AI models**: Ollama local models (default: llama3.2), accessed via Python FastAPI
- **LaTeX**: KaTeX for math formula rendering in Markdown
- **Embeddings**: Ollama embedding API for RAG support
- **User settings**: Stored in localStorage (phcode-settings), includes userName, userAvatar, selectedModel
- **Auto-title**: First message becomes conversation title (first 30 chars)

## Code style

- No semicolons, single quotes, trailing commas (all)
- 100 char print width, LF line endings
- TypeScript strict mode: `noUnusedLocals` + `noUnusedParameters` — prefix unused vars/args with `_`
- ESLint ignores: `dist`, `electron`, `python`, `node_modules`
