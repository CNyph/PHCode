const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  onNewChat: (callback) => {
    const handler = (_event) => callback()
    ipcRenderer.on('menu:new-chat', handler)
    return () => ipcRenderer.removeListener('menu:new-chat', handler)
  },
  onToggleSidebar: (callback) => {
    const handler = (_event) => callback()
    ipcRenderer.on('menu:toggle-sidebar', handler)
    return () => ipcRenderer.removeListener('menu:toggle-sidebar', handler)
  },
  onOpenSettings: (callback) => {
    const handler = (_event) => callback()
    ipcRenderer.on('menu:open-settings', handler)
    return () => ipcRenderer.removeListener('menu:open-settings', handler)
  },
})
