export interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  onNewChat: (callback: () => void) => () => void
  onToggleSidebar: (callback: () => void) => () => void
  onOpenSettings: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
