const { ipcMain } = require('electron')

const ALLOWED_SEND_CHANNELS = ['window:minimize', 'window:maximize', 'window:close']

function registerIPC(mainWindow) {
  for (const channel of ALLOWED_SEND_CHANNELS) {
    ipcMain.on(channel, (event) => {
      if (event.sender !== mainWindow?.webContents) return

      switch (channel) {
        case 'window:minimize':
          mainWindow?.minimize()
          break
        case 'window:maximize':
          if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize()
          } else {
            mainWindow?.maximize()
          }
          break
        case 'window:close':
          mainWindow?.close()
          break
      }
    })
  }
}

module.exports = { registerIPC }
