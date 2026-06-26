const { app, BrowserWindow, ipcMain, Menu, globalShortcut, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let serverProcess = null
let aiProcess = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function startServer() {
  if (!isDev) return

  const serverDir = path.join(__dirname, '..', 'server')
  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: serverDir,
    shell: true,
    stdio: 'pipe'
  })

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`)
  })

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[Server Error] ${data.toString().trim()}`)
  })

  serverProcess.on('error', (err) => {
    console.error('[Server] Failed to start:', err)
  })
}

function startAIService() {
  if (!isDev) return

  const aiDir = path.join(__dirname, '..', 'ai')
  aiProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], {
    cwd: aiDir,
    shell: true,
    stdio: 'pipe'
  })

  aiProcess.stdout?.on('data', (data) => {
    console.log(`[AI] ${data.toString().trim()}`)
  })

  aiProcess.stderr?.on('data', (data) => {
    console.error(`[AI Error] ${data.toString().trim()}`)
  })

  aiProcess.on('error', (err) => {
    console.error('[AI] Failed to start:', err)
  })
}

function stopServices() {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
  if (aiProcess) {
    aiProcess.kill()
    aiProcess = null
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Chat',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-chat')
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('menu:open-settings')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('menu:toggle-sidebar')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://github.com')
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/issues')
        }
      ]
    }
  ]

  if (isDev) {
    template.push({
      label: 'Dev',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function registerShortcuts() {
  globalShortcut.register('CmdOrCtrl+N', () => {
    mainWindow?.webContents.send('menu:new-chat')
  })

  globalShortcut.register('CmdOrCtrl+B', () => {
    mainWindow?.webContents.send('menu:toggle-sidebar')
  })

  globalShortcut.register('CmdOrCtrl+,', () => {
    mainWindow?.webContents.send('menu:open-settings')
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

async function waitForServer(url, maxAttempts = 30, interval = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {}
    await new Promise(r => setTimeout(r, interval))
  }
  return false
}

app.whenReady().then(async () => {
  startServer()
  startAIService()

  const serverReady = await waitForServer('http://localhost:3000/api/health')
  if (!serverReady) {
    console.error('[Electron] Server failed to start within timeout')
  }

  createWindow()
  createMenu()
  registerShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  stopServices()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  globalShortcut.unregisterAll()
  stopServices()
})

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window:close', () => {
  mainWindow?.close()
})
