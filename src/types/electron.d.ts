export interface UpdaterEventData {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  message: string;
  info?: any;
  progress?: {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
  };
  error?: any;
}

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  checkUpdate: () => Promise<{ status: string; message?: string; result?: any }>;
  installUpdate: () => Promise<void>;
  onUpdaterEvent: (callback: (data: UpdaterEventData) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
