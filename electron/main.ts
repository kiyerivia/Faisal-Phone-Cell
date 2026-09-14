import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] || 'http://localhost:5173';

// Configure Auto-Updater logging & settings
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('updater-event', { status: 'checking', message: 'Memeriksa pembaruan...' });
  });

  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('updater-event', {
      status: 'available',
      message: `Versi baru v${info.version} ditemukan! Sedang mendownload otomatis...`,
      info
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    win?.webContents.send('updater-event', {
      status: 'not-available',
      message: 'Aplikasi sudah menggunakan versi terbaru.',
      info
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    win?.webContents.send('updater-event', {
      status: 'downloading',
      message: `Mendownload pembaruan: ${Math.round(progress.percent)}%`,
      progress
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('updater-event', {
      status: 'downloaded',
      message: `Versi ${info.version} selesai didownload! Klik untuk restart & terapkan pembaruan.`,
      info
    });
  });

  autoUpdater.on('error', (err) => {
    win?.webContents.send('updater-event', {
      status: 'error',
      message: err?.message || 'Gagal memeriksa pembaruan',
      error: err
    });
  });
}

function createWindow() {
  win = new BrowserWindow({
    title: 'Faisal Phone Cell - Manajemen Stok & Servisan HP',
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    backgroundColor: '#0b1120',
    autoHideMenuBar: true,
    show: false,
  });

  win.once('ready-to-show', () => {
    win?.show();
    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch(() => {});
      }, 3000);
    }
  });

  // Make all links open with external browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:') || url.startsWith('wa.me')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'));
  }
}

// IPC Handlers for UI
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:check-update', async () => {
  if (!app.isPackaged) {
    return { status: 'dev-mode', message: 'Auto-update hanya aktif di versi terinstall (.exe).' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'success', result };
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('app:install-update', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();
});
