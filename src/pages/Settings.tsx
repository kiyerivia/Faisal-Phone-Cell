import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Cloud, 
  Database, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Trash2,
  Store,
  Printer,
  ShieldCheck,
  Sun,
  Moon,
  ArrowUpCircle,
  Sparkles,
  Info,
  Laptop,
  CheckCircle,
  Code2,
  Building2,
  Globe,
  ExternalLink
} from 'lucide-react';
import { db, DEFAULT_SETTINGS, seedInitialData } from '../db/database';
import { StoreSettings } from '../types';
import { syncService } from '../services/syncService';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [syncTestResult, setSyncTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Auto-Updater State
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
    message: string;
    progressPercent?: number;
    info?: any;
  }>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    loadSettings();

    // Check version from Electron
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then((ver) => {
        if (ver) setAppVersion(ver);
      }).catch(() => {});
    }

    // Subscribe to electron auto-updater events
    if (window.electronAPI?.onUpdaterEvent) {
      const unsubscribe = window.electronAPI.onUpdaterEvent((data) => {
        setUpdateStatus({
          status: data.status,
          message: data.message,
          progressPercent: data.progress ? Math.round(data.progress.percent) : undefined,
          info: data.info
        });
        if (data.status !== 'checking') {
          setIsCheckingUpdate(false);
        }
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus({
      status: 'checking',
      message: 'Sedang memeriksa ketersediaan versi terbaru di server...'
    });

    if (window.electronAPI?.checkUpdate) {
      try {
        const res = await window.electronAPI.checkUpdate();
        if (res.status === 'dev-mode') {
          setUpdateStatus({
            status: 'idle',
            message: 'Mode Development: Auto-updater otomatis aktif penuh di aplikasi Windows terinstal (.exe).'
          });
          setIsCheckingUpdate(false);
        } else if (res.status === 'error') {
          setUpdateStatus({
            status: 'error',
            message: res.message || 'Gagal memeriksa update (Periksa koneksi internet atau server release).'
          });
          setIsCheckingUpdate(false);
        }
      } catch (err: any) {
        setUpdateStatus({
          status: 'error',
          message: err?.message || 'Gagal menghubungi server update'
        });
        setIsCheckingUpdate(false);
      }
    } else {
      // Browser mode simulated feedback
      setTimeout(() => {
        setUpdateStatus({
          status: 'not-available',
          message: `Aplikasi Anda sudah menggunakan versi terbaru (v${appVersion}). Siap untuk operasional konter!`
        });
        setIsCheckingUpdate(false);
      }, 900);
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const loadSettings = async () => {
    const s = await db.settings.get('default_store_settings');
    if (s) {
      setSettings(s);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.put(settings);
    await syncService.initClient(settings);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleTestCloudSync = async () => {
    setIsTestingSync(true);
    setSyncTestResult(null);
    await db.settings.put(settings);
    await syncService.initClient(settings);
    const result = await syncService.syncNow();
    setSyncTestResult(result);
    setIsTestingSync(false);
  };

  const handleBackupDatabase = async () => {
    const spareparts = await db.spareparts.toArray();
    const service_orders = await db.service_orders.toArray();
    const transactions = await db.transactions.toArray();
    const stock_movements = await db.stock_movements.toArray();
    const currentSettings = await db.settings.get('default_store_settings');

    const backupData = {
      app: 'Faisal Phone Cell',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      data: {
        spareparts,
        service_orders,
        transactions,
        stock_movements,
        settings: currentSettings
      }
    };

    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_FaisalPhone_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data) throw new Error('Format file backup tidak valid');

        if (confirm('PERINGATAN: Memulihkan database akan menimpa data saat ini. Lanjutkan?')) {
          if (json.data.spareparts) {
            await db.spareparts.clear();
            await db.spareparts.bulkPut(json.data.spareparts);
          }
          if (json.data.service_orders) {
            await db.service_orders.clear();
            await db.service_orders.bulkPut(json.data.service_orders);
          }
          if (json.data.transactions) {
            await db.transactions.clear();
            await db.transactions.bulkPut(json.data.transactions);
          }
          if (json.data.stock_movements) {
            await db.stock_movements.clear();
            await db.stock_movements.bulkPut(json.data.stock_movements);
          }
          if (json.data.settings) {
            await db.settings.put(json.data.settings);
            setSettings(json.data.settings);
          }

          alert('Database berhasil dipulihkan dari file backup!');
          window.location.reload();
        }
      } catch (err: any) {
        alert(`Gagal memulihkan database: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (confirm('PERINGATAN PENTING:\n\nApakah Anda yakin ingin MENGHAPUS SEMUA data katalog sparepart, nota antrean servisan, transaksi kasir, dan histori mutasi stok?\n\nSemua data operasional akan dikosongkan agar Anda dapat mulai menggunakan sistem dari nol.\n\nLanjutkan?')) {
      await db.spareparts.clear();
      await db.service_orders.clear();
      await db.transactions.clear();
      await db.stock_movements.clear();
      await seedInitialData();
      alert('Seluruh katalog dan orderan telah berhasil dibersihkan! Sistem sekarang bersih dan siap dipakai dari nol.');
      window.location.reload();
    }
  };

  const sqlSchemaCode = `-- Skema Tabel Supabase PostgreSQL untuk Faisal Phone Cell
-- Buka Supabase Dashboard > SQL Editor > Tempel & Run script ini:

CREATE TABLE IF NOT EXISTS spareparts (
  id TEXT PRIMARY KEY,
  sku TEXT,
  barcode TEXT,
  brand TEXT,
  phone_model TEXT,
  category TEXT,
  name TEXT,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 1,
  cost_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  technician_price NUMERIC DEFAULT 0,
  location TEXT,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_synced INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS service_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  phone_brand TEXT,
  phone_model TEXT,
  problem TEXT,
  completeness TEXT,
  password_pattern TEXT,
  status TEXT,
  technician_notes TEXT,
  service_fee NUMERIC DEFAULT 0,
  cost_estimate NUMERIC DEFAULT 0,
  down_payment NUMERIC DEFAULT 0,
  final_cost NUMERIC DEFAULT 0,
  parts_used JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_synced INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  invoice_no TEXT,
  type TEXT,
  service_order_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  payment_method TEXT,
  cash_given NUMERIC DEFAULT 0,
  change NUMERIC DEFAULT 0,
  cashier_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_synced INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  sparepart_id TEXT,
  sparepart_sku TEXT,
  sparepart_name TEXT,
  type TEXT,
  qty INT DEFAULT 0,
  prev_stock INT DEFAULT 0,
  new_stock INT DEFAULT 0,
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_synced INT DEFAULT 1
);

ALTER TABLE spareparts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Spareparts" ON spareparts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write ServiceOrders" ON service_orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          Pengaturan Toko & Tema Tampilan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi tema terang/gelap, identitas toko, format struk, koneksi Supabase Cloud, dan backup database
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 0: Pilihan Tema Tampilan */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Sun className="w-4 h-4 text-amber-500" />
            Tema Tampilan Aplikasi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                theme === 'light'
                  ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="p-3 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Tema Terang (Light Mode)
                  {theme === 'light' && <span className="px-2 py-0.5 rounded text-[10px] bg-teal-600 text-white font-bold">Aktif</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tampilan bersih, cerah, dan kontras tinggi untuk ruangan terang
                </p>
              </div>
            </div>

            <div
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                theme === 'dark'
                  ? 'border-teal-500 bg-teal-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="p-3 rounded-lg bg-slate-800 text-teal-400 border border-slate-700">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Tema Gelap (Dark Mode)
                  {theme === 'dark' && <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500 text-slate-950 font-bold">Aktif</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tampilan gelap elegan dan nyaman di mata untuk ruangan minim cahaya
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Profil Toko & Struk */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Store className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Identitas Toko & Informasi Nota Struk
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Toko / Usaha *
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Telepon / WhatsApp Konter *
              </label>
              <input
                type="text"
                value={settings.store_phone}
                onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Toko Lengkap
              </label>
              <input
                type="text"
                value={settings.store_address}
                onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Garansi / Footer Struk Kasir & Nota Servis
            </label>
            <textarea
              rows={2}
              value={settings.receipt_footer}
              onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Section 2: Supabase Cloud Sync */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Koneksi Cloud Database (Supabase)
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Aktifkan Cloud Sync:</span>
              <input
                type="checkbox"
                checked={settings.sync_enabled}
                onChange={(e) => setSettings({ ...settings, sync_enabled: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-teal-500"
              />
            </label>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Menghubungkan ke **Supabase (PostgreSQL Cloud)** memungkinkan data stok dan servisan Anda otomatis tersinkronkan ke cloud, sehingga bisa dibuka dari HP (Android/iOS) atau komputer lain secara real-time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefghijklm.supabase.co"
                value={settings.supabase_url}
                onChange={(e) => setSettings({ ...settings, supabase_url: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={settings.supabase_anon_key}
                onChange={(e) => setSettings({ ...settings, supabase_anon_key: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestCloudSync}
                disabled={isTestingSync || !settings.supabase_url || !settings.supabase_anon_key}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-teal-800 dark:text-teal-300 rounded-xl border border-teal-200 dark:border-teal-500/30 text-xs font-semibold transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                <span>{isTestingSync ? 'Sedang Sinkronisasi...' : 'Tes & Sinkronkan Sekarang'}</span>
              </button>

              {syncTestResult && (
                <span className={`text-xs font-medium flex items-center gap-1.5 ${
                  syncTestResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {syncTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {syncTestResult.message}
                </span>
              )}
            </div>

            {settings.last_sync_time && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Terakhir Sync: {new Date(settings.last_sync_time).toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>

          {/* SQL Setup Helper */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Script SQL Skema Database Supabase (1 Menit Setup)
              </span>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin SQL'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800 text-[10px] font-mono overflow-x-auto max-h-36">
              {sqlSchemaCode}
            </pre>
          </div>
        </div>

        {/* Section 3: Backup & Restore Lokal */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Backup & Pemulihan Database Lokal (Offline)
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Anda dapat mendownload seluruh database (stok sparepart, nota servisan, transaksi kasir, dan histori mutasi) ke dalam 1 file backup JSON untuk disimpan di flashdisk atau Google Drive Anda.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleBackupDatabase}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 rounded-xl border border-teal-200 dark:border-teal-500/30 text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Download Backup Database (.json)
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-xs">
              <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Pulihkan dari File Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreDatabase}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleClearAllData}
              className="ml-auto flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-500/20 text-xs transition-colors"
              title="Hapus semua barang sparepart, servis, kasir & mutasi untuk memulai dari awal"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Kosongkan Seluruh Data (Mulai dari Nol)
            </button>
          </div>
        </div>

        {/* Section 4: Pembaruan Software & Auto-Updater */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Pembaruan Software & Auto-Updater
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cek versi terbaru atau kelola pengiriman update software ke PC cabang / teknisi lain
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700/50 text-teal-700 dark:text-teal-300 text-xs font-bold font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                Versi Saat Ini: v{appVersion}
              </span>
            </div>
          </div>

          {/* Interactive Check for Update Area */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Status Sistem Pembaruan:
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {updateStatus.message || 'Sistem siap memeriksa versi rilis terbaru.'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:scale-[1.02] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Memeriksa...' : 'Periksa Pembaruan Online'}</span>
                </button>

                {updateStatus.status === 'downloaded' && (
                  <button
                    type="button"
                    onClick={handleInstallUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md animate-bounce"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>Restart & Pasang Sekarang</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar for Downloading */}
            {updateStatus.status === 'downloading' && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Mengunduh file pembaruan...</span>
                  <span>{updateStatus.progressPercent || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${updateStatus.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Guide for 2 Update Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Cara 2 Card (Active Method) */}
            <div className="p-4 rounded-xl border-2 border-teal-500/40 bg-teal-50/30 dark:bg-teal-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Cara 2: Kirim File Installer (.exe) (Dipakai Saat Ini)
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-teal-600 text-white font-bold">Metode Anda</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Kirim file installer versi baru setiap kali ada penambahan fitur:
              </p>
              <ol className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
                <li>Ubah versi di <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">package.json</code> (misal: <span className="font-mono text-teal-700 dark:text-teal-300">1.0.1</span>).</li>
                <li>Jalankan perintah <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">npm run build:win</code>.</li>
                <li>Ambil file di folder <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">release/Faisal Phone Cell Setup 1.0.1.exe</code>.</li>
                <li>Kirim file ke PC tujuan & install langsung.</li>
              </ol>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Data Aman 100%:</strong> Stok, nota servis, dan kasir di PC tujuan <u>tidak akan terhapus</u> saat ditimpa installer baru.</span>
              </div>
            </div>

            {/* Cara 1 Card (Auto-Updater via GitHub) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Cara 1: Auto-Updater Otomatis (GitHub Releases)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Auto-updater background sudah siap di sistem. Kapan pun Anda ingin mengaktifkan update otomatis tanpa kirim file manual:
              </p>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Hubungkan project ke GitHub repository.</li>
                <li>Tambahkan konfigurasi <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">"publish": &#123; "provider": "github" &#125;</code> di <code className="font-mono text-[10px]">package.json</code>.</li>
                <li>Saat Anda rilis versi baru di GitHub, aplikasi di seluruh PC cabang otomatis mendownload pembaruan di latar belakang.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 5: Informasi Software, Pengembang & Studio */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Informasi Software & Pengembang
          </h3>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-2 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/10 shrink-0">
              <img 
                src={logoImg} 
                alt="Faisal Phone Cell" 
                className="w-full h-full object-contain" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('logo.svg')) {
                    target.src = './logo.svg';
                  }
                }}
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Faisal Phone Cell
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold border border-teal-500/20">
                  v{appVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sistem Manajemen Stok Sparepart & Servisan HP (Offline-First Desktop Software dengan Cloud Sync Supabase & Struk Kasir Termal/A4).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                  <div className="p-1.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Studio Pembuat:</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Rivia Studio</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                  <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Pengembang (Developer):</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Rivia Developer</div>
                  </div>
                </div>

                <a 
                  href="https://www.riviadeveloper.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Website Resmi:</div>
                      <div className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono group-hover:underline">www.riviadeveloper.com</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 transition-colors shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSavedToast && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Pengaturan berhasil disimpan!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            Simpan Seluruh Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
