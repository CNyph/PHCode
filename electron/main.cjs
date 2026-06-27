const { app, BrowserWindow, Menu, globalShortcut, shell } = require('electron')
const path = require('path')
const { startServer, stopServer } = require('./services/server.cjs')
const { startAIService, stopAIService } = require('./services/ai.cjs')
const { getAvailablePort, saveAIPort } = require('./utils/port.cjs')
const { registerIPC } = require('./ipc/index.cjs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null

function createMenu() {
  const send = (channel) => () => mainWindow?.webContents.send(channel)

  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Chat', accelerator: 'CmdOrCtrl+N', click: send('menu:new-chat') },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: send('menu:open-settings') },
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
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: send('menu:toggle-sidebar') },
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
        { label: 'Learn More', click: () => shell.openExternal('https://github.com') },
        { label: 'Report Issue', click: () => shell.openExternal('https://github.com/issues') }
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

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function registerShortcuts() {
  const send = (channel) => () => mainWindow?.webContents.send(channel)
  globalShortcut.register('CmdOrCtrl+N', send('menu:new-chat'))
  globalShortcut.register('CmdOrCtrl+B', send('menu:toggle-sidebar'))
  globalShortcut.register('CmdOrCtrl+,', send('menu:open-settings'))
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
      sandbox: true
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  registerIPC(mainWindow)
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

async function stopAllServices() {
  await stopServer()
  stopAIService()
}

app.whenReady().then(async () => {
  let aiPort = null
  if (isDev) {
    aiPort = await getAvailablePort()
    saveAIPort(aiPort)
    console.log(`[Electron] AI service will use port ${aiPort}`)
  }

  startAIService(isDev, aiPort)
  await startServer(isDev, aiPort)

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
  void stopAllServices()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  globalShortcut.unregisterAll()
  void stopAllServices()
})
