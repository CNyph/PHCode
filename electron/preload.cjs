const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  onNewChat: (callback) => ipcRenderer.on('menu:new-chat', callback),
  onToggleSidebar: (callback) => ipcRenderer.on('menu:toggle-sidebar', callback),
  onOpenSettings: (callback) => ipcRenderer.on('menu:open-settings', callback),
})
