import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  checkUpdate: (): Promise<{ status: string; message?: string; result?: any }> => ipcRenderer.invoke('app:check-update'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('app:install-update'),
  onUpdaterEvent: (callback: (data: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('updater-event', subscription);
    return () => {
      ipcRenderer.removeListener('updater-event', subscription);
    };
  }
};

try {
  contextBridge.exposeInMainWorld('electronAPI', api);
} catch {
  (window as any).electronAPI = api;
}

// Expose protected methods that allow the renderer process to use ipcRenderer
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type] || '');
  }
});

