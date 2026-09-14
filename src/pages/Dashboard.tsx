import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Layers, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  ShoppingCart, 
  ArrowUpRight, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Package
} from 'lucide-react';
import { db } from '../db/database';
import { SparepartItem, ServiceOrder, Transaction } from '../types';
import { formatRupiah, formatDateIndo, cleanPhoneForWA, getWhatsAppServiceMsg } from '../utils/formatters';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [parts, setParts] = useState<SparepartItem[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const p = await db.spareparts.toArray();
    const o = await db.service_orders.reverse().sortBy('created_at');
    const t = await db.transactions.reverse().sortBy('created_at');
    const s = await db.settings.get('default_store_settings');
    setParts(p);
    setOrders(o);
    setTransactions(t);
    setStoreSettings(s);
  };

  // Metrics calculation
  const totalStockQty = parts.reduce((acc, curr) => acc + curr.stock, 0);
  const totalAssetValue = parts.reduce((acc, curr) => acc + curr.stock * curr.cost_price, 0);
  const totalPotentialSales = parts.reduce((acc, curr) => acc + curr.stock * curr.sell_price, 0);

  const lowStockItems = parts.filter((p) => p.stock <= p.min_stock);

  // Today's metrics
  const today = new Date().toDateString();
  const todayTrx = transactions.filter(
    (t) => new Date(t.created_at).toDateString() === today
  );
  const todayRevenue = todayTrx.reduce((acc, curr) => acc + curr.total_amount, 0);
  const todayProfit = todayTrx.reduce((acc, curr) => acc + curr.profit, 0);

  // Active Service Orders
  const activeOrders = orders.filter(
    (o) => !o.status.includes('Sudah Diambil') && !o.status.includes('Dibatalkan')
  );
  const readyOrders = orders.filter((o) => o.status.includes('Selesai'));
  const inProgressOrders = orders.filter((o) => o.status.includes('Sedang Dikerjakan') || o.status.includes('Pengecekan'));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white p-6 rounded-2xl border border-teal-600/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Dashboard Utama
          </h2>
          <p className="text-sm text-teal-100">
            Selamat datang di Sistem Manajemen Stok & Servisan <strong className="text-amber-300">Faisal Phone Cell</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <ShoppingCart className="w-4 h-4 text-slate-950" />
            Buka Kasir POS
          </button>
          <button
            onClick={() => onNavigate('services')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            Penerimaan Servis
          </button>
          <button
            onClick={() => onNavigate('spareparts')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 text-teal-200" />
            Tambah Sparepart
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omset Hari Ini */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Omset Hari Ini
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3 font-mono">
            {formatRupiah(todayRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Laba Bersih: {formatRupiah(todayProfit)}</span>
          </div>
        </div>

        {/* Card 2: Servisan Aktif */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Servisan Berjalan
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3 font-mono">
            {activeOrders.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Unit</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{inProgressOrders.length} Dikerjakan</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{readyOrders.length} Siap Ambil</span>
          </div>
        </div>

        {/* Card 3: Total Aset Sparepart */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nilai Aset Stok
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3 font-mono">
            {formatRupiah(totalAssetValue)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Total {totalStockQty} Pcs ({parts.length} Varian Part)
          </div>
        </div>

        {/* Card 4: Stok Menipis */}
        <div 
          onClick={() => onNavigate('spareparts')}
          className={`glass-card p-5 rounded-2xl cursor-pointer transition-all ${
            lowStockItems.length > 0 ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Stok Menipis / Kritis
            </span>
            <div className={`p-2 rounded-xl ${lowStockItems.length > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-3 font-mono">
            {lowStockItems.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Item</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Perlu restock supplier</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Servisan HP Terbaru & Sedang Dikerjakan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Antrean & Progres Servisan HP
            </h3>
            <button
              onClick={() => onNavigate('services')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              Lihat Semua ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm">
            {activeOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                Tidak ada antrean servis saat ini.
              </div>
            ) : (
              activeOrders.slice(0, 5).map((order) => {
                const remaining = Math.max(0, order.final_cost - order.down_payment);
                const waText = getWhatsAppServiceMsg(
                  order.customer_name,
                  order.order_no,
                  `${order.phone_brand} ${order.phone_model}`,
                  order.status,
                  order.final_cost,
                  order.down_payment,
                  storeSettings?.store_name || 'Faisal Phone Cell'
                );
                const waUrl = `https://wa.me/${cleanPhoneForWA(order.customer_phone)}?text=${waText}`;

                return (
                  <div key={order.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-500/20">
                          {order.order_no}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {order.customer_name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">({order.customer_phone})</span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        📱 {order.phone_brand} - <span className="text-amber-600 dark:text-amber-300 font-semibold">{order.phone_model}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                        "{order.problem}"
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        order.status.includes('Selesai')
                          ? 'badge-ready'
                          : order.status.includes('Sedang')
                          ? 'badge-progress'
                          : 'badge-pending'
                      }`}>
                        {order.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatRupiah(order.final_cost)}
                          </div>
                          {order.down_payment > 0 && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              DP: {formatRupiah(order.down_payment)} (Sisa: {formatRupiah(remaining)})
                            </div>
                          )}
                        </div>

                        {/* WA notification link */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                          title="Kirim Update WA ke Pelanggan"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Peringatan Stok Sparepart Menipis */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stok Sparepart Menipis
            </h3>
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              Restock <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-3 space-y-2.5 max-h-[420px] overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                Semua stok sparepart dalam batas aman!
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="text-teal-700 dark:text-teal-400 font-medium">{item.phone_model}</span>
                      <span>•</span>
                      <span>{item.location}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-mono font-bold">
                      Sisa: {item.stock}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Min: {item.min_stock}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
