import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Plus, 
  Search, 
  AlertTriangle, 
  History, 
  Boxes, 
  Truck, 
  CheckCircle2, 
  RotateCcw,
  Layers,
  Calendar
} from 'lucide-react';
import { db } from '../db/database';
import { SparepartItem, StockMovement } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

export const StockManagement: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Restock modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [restockQty, setRestockQty] = useState<number>(5);
  const [supplierInvoice, setSupplierInvoice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [restockNotes, setRestockNotes] = useState('');

  // Defective / Return modal state
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectPartId, setDefectPartId] = useState('');
  const [defectQty, setDefectQty] = useState<number>(1);
  const [defectReason, setDefectReason] = useState('LCD Fleksibel Garis / Cacat Pabrik');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const m = await db.stock_movements.reverse().sortBy('created_at');
    const p = await db.spareparts.toArray();
    setMovements(m);
    setSpareparts(p);
  };

  const handleOpenRestock = (preSelectedPart?: SparepartItem) => {
    if (preSelectedPart) {
      setSelectedPartId(preSelectedPart.id);
      setNewCostPrice(preSelectedPart.cost_price);
      setSupplierName(preSelectedPart.supplier || '');
    } else {
      setSelectedPartId(spareparts[0]?.id || '');
      setNewCostPrice(spareparts[0]?.cost_price || 0);
      setSupplierName(spareparts[0]?.supplier || '');
    }
    setRestockQty(5);
    setSupplierInvoice(`PO-${Date.now().toString().slice(-6)}`);
    setRestockNotes('Restock rutin dari distributor');
    setIsRestockModalOpen(true);
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId || restockQty <= 0) return;

    const part = await db.spareparts.get(selectedPartId);
    if (!part) return;

    const now = new Date().toISOString();
    const newStock = part.stock + Number(restockQty);

    await db.spareparts.update(part.id, {
      stock: newStock,
      cost_price: newCostPrice > 0 ? Number(newCostPrice) : part.cost_price,
      supplier: supplierName || part.supplier,
      updated_at: now,
      is_synced: 0
    });

    await db.stock_movements.add({
      id: `mov-${Date.now()}`,
      sparepart_id: part.id,
      sparepart_sku: part.sku,
      sparepart_name: part.name,
      type: 'masuk_supplier',
      qty: Number(restockQty),
      prev_stock: part.stock,
      new_stock: newStock,
      reference_no: supplierInvoice,
      notes: `Supplier: ${supplierName || '-'} | ${restockNotes}`,
      created_at: now,
      is_synced: 0
    });

    setIsRestockModalOpen(false);
    loadData();
  };

  const handleSaveDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectPartId || defectQty <= 0) return;

    const part = await db.spareparts.get(defectPartId);
    if (!part) return;

    if (defectQty > part.stock) {
      alert(`Stok hanya ada ${part.stock}, tidak bisa mencatat cacat melebihi stok!`);
      return;
    }

    const now = new Date().toISOString();
    const newStock = Math.max(0, part.stock - Number(defectQty));

    await db.spareparts.update(part.id, {
      stock: newStock,
      updated_at: now,
      is_synced: 0
    });

    await db.stock_movements.add({
      id: `mov-${Date.now()}`,
      sparepart_id: part.id,
      sparepart_sku: part.sku,
      sparepart_name: part.name,
      type: 'penyesuaian_rusak',
      qty: Number(defectQty),
      prev_stock: part.stock,
      new_stock: newStock,
      notes: `Part Rusak / Cacat: ${defectReason}`,
      created_at: now,
      is_synced: 0
    });

    setIsDefectModalOpen(false);
    loadData();
  };

  const filteredMovements = movements.filter((m) => {
    const matchSearch =
      m.sparepart_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sparepart_sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.reference_no && m.reference_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType = selectedTypeFilter === 'ALL' || m.type === selectedTypeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Restock & Mutasi Stok Sparepart
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Catat pembelian masuk dari supplier, part rusak/retur, dan lacak seluruh histori mutasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setDefectPartId(spareparts[0]?.id || '');
              setIsDefectModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/20 text-red-600 dark:text-red-300 font-semibold text-xs rounded-xl border border-red-200 dark:border-red-500/30 transition-all shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Catat Part Rusak / Retur
          </button>
          <button
            onClick={() => handleOpenRestock()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            + Restock dari Supplier
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama Sparepart, SKU, No. Faktur / Referensi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Tipe Mutasi:</span>
          {[
            { id: 'ALL', label: 'Semua Mutasi' },
            { id: 'masuk_supplier', label: 'Restock Supplier (+)' },
            { id: 'keluar_penjualan', label: 'Terjual Kasir (-)' },
            { id: 'keluar_servis', label: 'Dipakai Servis (-)' },
            { id: 'penyesuaian_rusak', label: 'Part Rusak / Retur (-)' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTypeFilter(type.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedTypeFilter === type.id
                  ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Sparepart</th>
                <th className="py-3.5 px-4">Jenis Mutasi</th>
                <th className="py-3.5 px-4 text-center">Jumlah (Qty)</th>
                <th className="py-3.5 px-4 text-center">Stok Awal → Akhir</th>
                <th className="py-3.5 px-4">No. Ref / Faktur</th>
                <th className="py-3.5 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                    Belum ada riwayat mutasi stok tercatat.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isPositive = mov.type === 'masuk_supplier';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDateIndo(mov.created_at)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {mov.sparepart_name}
                        </div>
                        <div className="text-[11px] font-mono text-teal-700 dark:text-teal-400">
                          {mov.sparepart_sku}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          mov.type === 'masuk_supplier'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : mov.type === 'keluar_penjualan'
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                            : mov.type === 'keluar_servis'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/20'
                        }`}>
                          {mov.type === 'masuk_supplier'
                            ? 'Restock Masuk'
                            : mov.type === 'keluar_penjualan'
                            ? 'Penjualan Kasir'
                            : mov.type === 'keluar_servis'
                            ? 'Servisan HP'
                            : 'Part Rusak / Retur'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                          {isPositive ? `+${mov.qty}` : `-${mov.qty}`} Pcs
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
                        {mov.prev_stock} → <strong className="text-slate-900 dark:text-white">{mov.new_stock}</strong>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                        {mov.reference_no || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">
                        {mov.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Catat Pembelian Stok dari Supplier
            </h3>

            <form onSubmit={handleSaveRestock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Sparepart yang Direstock *
                </label>
                <select
                  value={selectedPartId}
                  onChange={(e) => {
                    setSelectedPartId(e.target.value);
                    const p = spareparts.find(item => item.id === e.target.value);
                    if (p) setNewCostPrice(p.cost_price);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  required
                >
                  {spareparts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.phone_model}] (Stok saat ini: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Masuk (Qty) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-teal-700 dark:text-teal-300 focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Modal Baru (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Supplier / Distributor
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Crown Sparepart Jkt"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Faktur / Nota Pembelian
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: FAK-88219"
                    value={supplierInvoice}
                    onChange={(e) => setSupplierInvoice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Garansi tes 1 bulan dari supplier"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20"
                >
                  + Tambah Stok Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Defect / Return Modal */}
      {isDefectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Catat Part Rusak / Cacat / Retur
            </h3>

            <form onSubmit={handleSaveDefect} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Sparepart *
                </label>
                <select
                  value={defectPartId}
                  onChange={(e) => setDefectPartId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
                  required
                >
                  {spareparts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.phone_model}] (Tersedia: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Rusak (Qty) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={defectQty}
                  onChange={(e) => setDefectQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-red-600 dark:text-red-400 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan Kerusakan / Retur *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Layar bergaris saat dites / Fleksibel sobek"
                  value={defectReason}
                  onChange={(e) => setDefectReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDefectModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Kurangi Stok Rusak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
