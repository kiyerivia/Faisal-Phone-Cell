import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  AlertTriangle, 
  Smartphone, 
  CheckCircle2, 
  X,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { syncService, SyncStatus } from '../../services/syncService';
import { db } from '../../db/database';
import { SparepartItem, ServiceOrder, StoreSettings } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activePage }) => {
  const { theme, toggleTheme } = useTheme();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    unsyncedCount: 0,
    message: 'Siap'
  });
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [lowStockItems, setLowStockItems] = useState<SparepartItem[]>([]);
  const [readyServices, setReadyServices] = useState<ServiceOrder[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const unsub = syncService.subscribe((status) => {
      setSyncStatus(status);
    });

    const loadData = async () => {
      const s = await db.settings.get('default_store_settings');
      if (s) setSettings(s);

      // Check low stock
      const allParts = await db.spareparts.toArray();
      const low = allParts.filter(p => p.stock <= p.min_stock);
      setLowStockItems(low);

      // Check ready services waiting for customer pickup
      const ready = await db.service_orders.filter(o => o.status.includes('Selesai')).toArray();
      setReadyServices(ready);
    };

    loadData();
    const interval = setInterval(loadData, 5000);

    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) +
        ' • ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      );
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleSyncClick = async () => {
    const res = await syncService.syncNow();
    setSyncToast(res.message);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const totalNotifications = lowStockItems.length + readyServices.length;

  return (
    <header className="h-16 bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md transition-colors duration-200 shadow-sm dark:shadow-none">
      {/* Brand info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900/5 dark:bg-slate-800/80 p-1 border border-teal-500/30 flex items-center justify-center shadow-md shadow-teal-500/10 ring-1 ring-teal-400/20 overflow-hidden group">
          <img 
            src="/logo.png" 
            alt="Faisal Phone Cell Logo" 
            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-200" 
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              {settings?.store_name || 'Faisal Phone Cell'}
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 rounded border border-teal-500/30">
              Desktop v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {settings?.tagline || 'Spesialis Servis HP & Grosir Sparepart'}
          </p>
        </div>
      </div>

      {/* Center / Action Status */}
      <div className="flex items-center gap-3">
        {/* Offline-First Storage Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
          <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Local DB: <strong className="text-emerald-600 dark:text-emerald-400">Offline-Ready</strong></span>
        </div>

        {/* Sync Status Button */}
        <button
          onClick={handleSyncClick}
          disabled={syncStatus.isSyncing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
            syncStatus.isSyncing
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
              : syncStatus.unsyncedCount > 0
              ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-500/30'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
          title="Klik untuk sinkronisasi ke cloud sekarang"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-amber-500 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`} />
          <span className="hidden md:inline">
            {syncStatus.isSyncing
              ? 'Menyinkronkan...'
              : syncStatus.unsyncedCount > 0
              ? `${syncStatus.unsyncedCount} Data Belum Sync`
              : 'Cloud Sync'}
          </span>
        </button>

        {/* Online / Offline Status Badge */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            syncStatus.isOnline
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-red-500 dark:bg-red-400'}`}></span>
          {syncStatus.isOnline ? (
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Online</span>
          ) : (
            <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>
          )}
        </div>

        {/* Theme Toggle Button (Light ☀️ / Dark 🌙) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          title={theme === 'light' ? 'Ubah ke Tema Gelap (Dark Mode)' : 'Ubah ke Tema Terang (Light Mode)'}
        >
          {theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-teal-400" />
          )}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 font-bold text-[11px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {totalNotifications}
              </span>
            )}
          </button>

          {/* Notifications Modal */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Pemberitahuan Toko ({totalNotifications})
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 p-2 space-y-1">
                {totalNotifications === 0 ? (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-teal-500/60 mb-2" />
                    Semua stok aman dan tidak ada servis tertunda!
                  </div>
                ) : (
                  <>
                    {/* Low Stock alerts */}
                    {lowStockItems.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => { onNavigate('spareparts'); setShowNotifications(false); }}
                        className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            Stok Menipis ({p.stock} tersisa)
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.location}</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{p.name}</p>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-mono">
                          Model: {p.phone_model} • Min: {p.min_stock}
                        </div>
                      </div>
                    ))}

                    {/* Ready for Pickup alerts */}
                    {readyServices.map((srv) => (
                      <div
                        key={srv.id}
                        onClick={() => { onNavigate('services'); setShowNotifications(false); }}
                        className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            Servis Siap Diambil
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{srv.order_no}</span>
                        </div>
                        <p className="text-xs text-slate-900 dark:text-white font-medium mt-1">{srv.customer_name} ({srv.phone_model})</p>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Sisa Bayar: {formatRupiah(Math.max(0, srv.final_cost - srv.down_payment))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Time display */}
        <div className="hidden xl:block text-xs font-medium text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-700">
          {currentTime}
        </div>
      </div>

      {/* Sync Notification Toast */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-800 border border-teal-500 text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <p className="text-xs font-medium">{syncToast}</p>
        </div>
      )}
    </header>
  );
};
