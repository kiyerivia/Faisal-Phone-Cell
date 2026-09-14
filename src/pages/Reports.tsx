import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  ShoppingCart, 
  Wrench, 
  ArrowUpRight
} from 'lucide-react';
import { db } from '../db/database';
import { Transaction, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { printTransactionReceipt, printA4Invoice } from '../utils/receiptPrinter';

export const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('MONTH');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const t = await db.transactions.reverse().sortBy('created_at');
    const s = await db.settings.get('default_store_settings');
    setTransactions(t);
    if (s) setSettings(s);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = todayStart - (7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredTransactions = transactions.filter((trx) => {
    const trxTime = new Date(trx.created_at).getTime();

    let dateMatch = true;
    if (dateFilter === 'TODAY') dateMatch = trxTime >= todayStart;
    else if (dateFilter === 'WEEK') dateMatch = trxTime >= sevenDaysAgo;
    else if (dateFilter === 'MONTH') dateMatch = trxTime >= monthStart;

    const searchMatch =
      trx.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return dateMatch && searchMatch;
  });

  const totalRevenue = filteredTransactions.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalCost = filteredTransactions.reduce((acc, curr) => acc + curr.total_cost, 0);
  const totalProfit = filteredTransactions.reduce((acc, curr) => acc + curr.profit, 0);
  const avgTicket = filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0;

  const handleExportCSV = () => {
    const headers = ['No. Invoice', 'Tanggal & Jam', 'Pelanggan', 'Tipe Transaksi', 'Metode Bayar', 'Rincian Item', 'Total Omset', 'Total Modal', 'Laba Bersih'];
    const rows = filteredTransactions.map(t => [
      `"${t.invoice_no}"`,
      `"${formatDateIndo(t.created_at)}"`,
      `"${t.customer_name}"`,
      `"${t.type}"`,
      `"${t.payment_method}"`,
      `"${t.items.map(i => `${i.name} (${i.qty}x)`).join('; ')}"`,
      t.total_amount,
      t.total_cost,
      t.profit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_FaisalPhone_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Laporan Keuangan & Rekap Penjualan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analisis omset kotor, harga modal (HPP), laba bersih, dan cetak ulang riwayat struk transaksi
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
        >
          <Download className="w-4 h-4" />
          Export Laporan CSV
        </button>
      </div>

      {/* Date Filter Tabs */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Periode Waktu:</span>
          {[
            { id: 'TODAY', label: 'Hari Ini' },
            { id: 'WEEK', label: '7 Hari Terakhir' },
            { id: 'MONTH', label: 'Bulan Ini' },
            { id: 'ALL', label: 'Semua Waktu' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setDateFilter(period.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                dateFilter === period.id
                  ? 'bg-teal-600 text-white font-bold dark:bg-teal-500 dark:text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Invoice, Pelanggan, atau Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Total Omset (Bruto)</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3 font-mono">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Dari {filteredTransactions.length} transaksi tercatat
          </div>
        </div>

        {/* Total Modal / COGS */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Total Modal Sparepart</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-3 font-mono">
            {formatRupiah(totalCost)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Harga pokok barang terjual
          </div>
        </div>

        {/* Total Laba Bersih */}
        <div className="glass-card p-5 rounded-2xl border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
            <span>Laba Bersih (Net Profit)</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-3 font-mono">
            {formatRupiah(totalProfit)}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-500/80 mt-2 font-semibold">
            Margin: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </div>
        </div>

        {/* Rata-Rata Transaksi */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Rata-Rata / Transaksi</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3 font-mono">
            {formatRupiah(avgTicket)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Nilai rata-rata nota
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">No. Invoice & Waktu</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Rincian Barang / Jasa</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                <th className="py-3.5 px-4 text-right">Laba Bersih</th>
                <th className="py-3.5 px-4 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                    Tidak ada transaksi pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-700 dark:text-teal-400 text-xs">
                        {trx.invoice_no}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatDateIndo(trx.created_at)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {trx.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {trx.customer_phone || '-'}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-0.5">
                        {trx.items.map((item, i) => (
                          <div key={i} className="text-slate-700 dark:text-slate-300 text-[11px] truncate">
                            • {item.name} <span className="text-slate-400">({item.qty}x)</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-slate-200 dark:border-slate-700">
                        {trx.payment_method}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(trx.total_amount)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatRupiah(trx.profit)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => settings && printTransactionReceipt(trx, settings)}
                          className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 transition-colors flex items-center gap-1 font-semibold text-[10px]"
                          title="Cetak Ulang Struk Thermal (58mm/80mm)"
                        >
                          <Printer className="w-3 h-3" />
                          Struk
                        </button>
                        <button
                          onClick={() => settings && printA4Invoice(trx, settings)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
                          title="Cetak Faktur A4 / Simpan PDF"
                        >
                          <Printer className="w-3 h-3" />
                          Faktur A4
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
