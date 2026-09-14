import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Wrench, 
  ShoppingCart, 
  ArrowDownToLine, 
  BarChart3, 
  Settings, 
  HardDrive,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Ringkasan & Metrik Toko',
      icon: LayoutDashboard,
    },
    {
      id: 'spareparts',
      label: 'Katalog Sparepart',
      description: 'Stok Semua Tipe HP',
      icon: Layers,
    },
    {
      id: 'services',
      label: 'Servisan HP',
      description: 'Penerimaan & Antrean',
      icon: Wrench,
    },
    {
      id: 'pos',
      label: 'Kasir & POS',
      description: 'Penjualan & Struk',
      icon: ShoppingCart,
    },
    {
      id: 'stock',
      label: 'Restock & Mutasi',
      description: 'Stok Masuk / Retur',
      icon: ArrowDownToLine,
    },
    {
      id: 'reports',
      label: 'Laporan Keuangan',
      description: 'Omset & Profit Bersih',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Pengaturan & Cloud',
      description: 'Backup & Supabase Sync',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] select-none transition-colors duration-200 shadow-sm dark:shadow-none">
      {/* Navigation List */}
      <div className="p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          Menu Utama
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group text-left ${
                isActive
                  ? 'bg-teal-50 dark:bg-gradient-to-r dark:from-teal-500/20 dark:to-teal-600/10 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 shadow-sm dark:shadow-lg dark:shadow-teal-500/10 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md shadow-teal-600/20 dark:shadow-teal-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm leading-tight">{item.label}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 font-normal leading-tight mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  isActive ? 'text-teal-600 dark:text-teal-400 translate-x-0.5' : 'text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 mb-0.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Sistem Offline Aktif</span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Data tersimpan lokal di komputer. Tetap beroperasi normal saat offline.
          </p>
        </div>

        {/* Developer & Studio Branding */}
        <div className="px-1 py-0.5 flex flex-col gap-1 border-t border-slate-200/60 dark:border-slate-800/60 pt-2 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500">Studio:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Rivia Studio</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500">Pengembang:</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">Rivia Developer</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 border-t border-dashed border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500">Web:</span>
            <a
              href="https://www.riviadeveloper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 dark:text-teal-400 hover:underline font-mono text-[9.5px] font-semibold"
            >
              www.riviadeveloper.com
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
