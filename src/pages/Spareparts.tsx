import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  MapPin, 
  Layers, 
  Tag, 
  Check, 
  X, 
  Download, 
  Printer, 
  Boxes
} from 'lucide-react';
import { db } from '../db/database';
import { SparepartItem, BrandType, SparepartCategory } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

const BRANDS: BrandType[] = [
  'iPhone / Apple',
  'Samsung',
  'Xiaomi / Redmi / POCO',
  'Oppo',
  'Realme',
  'Vivo / iQOO',
  'Infinix / Tecno / Itel',
  'Asus',
  'Huawei',
  'Universal / Lainnya'
];

const CATEGORIES: SparepartCategory[] = [
  'LCD & Touchscreen',
  'Baterai (Battery)',
  'Flexible & Board Cas',
  'IC (Power, EMMC, CPU, dll)',
  'Kamera Depan / Belakang',
  'Backdoor / Casing / Frame',
  'Speaker / Buzzer / Mic',
  'Konektor & SIM Tray',
  'Kaca Glass & OCA',
  'Lem, Timah & Bahan Servis',
  'Aksesoris & Tempered Glass'
];

export const Spareparts: React.FC = () => {
  const [items, setItems] = useState<SparepartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SparepartItem | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState<Partial<SparepartItem>>({
    brand: 'iPhone / Apple',
    phone_model: '',
    category: 'LCD & Touchscreen',
    name: '',
    sku: '',
    barcode: '',
    stock: 1,
    min_stock: 2,
    cost_price: 0,
    sell_price: 0,
    technician_price: 0,
    location: 'Laci A-01',
    supplier: '',
    notes: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await db.spareparts.reverse().sortBy('created_at');
    setItems(data);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      brand: 'iPhone / Apple',
      phone_model: '',
      category: 'LCD & Touchscreen',
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: '',
      stock: 5,
      min_stock: 2,
      cost_price: 100000,
      sell_price: 180000,
      technician_price: 140000,
      location: 'Laci A-01',
      supplier: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SparepartItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus sparepart "${name}"?`)) {
      await db.spareparts.delete(id);
      loadItems();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    if (!formData.name || !formData.phone_model) {
      alert('Nama sparepart dan tipe HP wajib diisi!');
      return;
    }

    if (editingItem) {
      const updated: SparepartItem = {
        ...editingItem,
        ...(formData as SparepartItem),
        updated_at: now,
        is_synced: 0
      };
      await db.spareparts.put(updated);
    } else {
      const newItem: SparepartItem = {
        id: `part-${Date.now()}`,
        sku: formData.sku || `SKU-${Date.now().toString().slice(-6)}`,
        barcode: formData.barcode || '',
        brand: formData.brand as BrandType,
        phone_model: formData.phone_model || '',
        category: formData.category as SparepartCategory,
        name: formData.name || '',
        stock: Number(formData.stock) || 0,
        min_stock: Number(formData.min_stock) || 1,
        cost_price: Number(formData.cost_price) || 0,
        sell_price: Number(formData.sell_price) || 0,
        technician_price: Number(formData.technician_price) || 0,
        location: formData.location || 'Gudang',
        supplier: formData.supplier || '',
        notes: formData.notes || '',
        created_at: now,
        updated_at: now,
        is_synced: 0
      };
      await db.spareparts.add(newItem);
    }

    setIsModalOpen(false);
    loadItems();
  };

  const handleQuickStock = async (item: SparepartItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    await db.spareparts.update(item.id, {
      stock: newStock,
      updated_at: new Date().toISOString(),
      is_synced: 0
    });
    
    await db.stock_movements.add({
      id: `mov-${Date.now()}`,
      sparepart_id: item.id,
      sparepart_sku: item.sku,
      sparepart_name: item.name,
      type: delta > 0 ? 'masuk_supplier' : 'penyesuaian_rusak',
      qty: Math.abs(delta),
      prev_stock: item.stock,
      new_stock: newStock,
      notes: delta > 0 ? 'Quick Restock +1' : 'Quick Adjust -1',
      created_at: new Date().toISOString(),
      is_synced: 0
    });

    loadItems();
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Brand', 'Model HP', 'Kategori', 'Nama Part', 'Stok', 'Min Stok', 'Harga Modal', 'Harga Jual', 'Harga Teknisi', 'Lokasi Rak', 'Supplier'];
    const rows = filteredItems.map(p => [
      `"${p.sku}"`,
      `"${p.brand}"`,
      `"${p.phone_model}"`,
      `"${p.category}"`,
      `"${p.name}"`,
      p.stock,
      p.min_stock,
      p.cost_price,
      p.sell_price,
      p.technician_price,
      `"${p.location}"`,
      `"${p.supplier || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stok_Sparepart_FaisalPhone_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLabel = (item: SparepartItem) => {
    const printWin = window.open('', '_blank', 'width=350,height=300');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Label Part - ${item.sku}</title>
          <style>
            body { font-family: monospace; padding: 8px; width: 60mm; margin: 0 auto; text-align: center; border: 1px dashed #000; }
            .brand { font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .title { font-size: 12px; font-weight: bold; margin: 4px 0; }
            .model { font-size: 11px; background: #eee; padding: 2px; }
            .price { font-size: 13px; font-weight: bold; margin-top: 4px; }
            .loc { font-size: 10px; color: #444; margin-top: 3px; }
          </style>
        </head>
        <body>
          <div class="brand">FAISAL PHONE CELL</div>
          <div class="title">${item.name}</div>
          <div class="model">${item.brand} - ${item.phone_model}</div>
          <div class="price">${formatRupiah(item.sell_price)}</div>
          <div class="loc">SKU: ${item.sku} | Rak: ${item.location}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery)) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchBrand = selectedBrand === 'ALL' || item.brand === selectedBrand;
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    let matchStock = true;
    if (stockFilter === 'LOW') matchStock = item.stock <= item.min_stock;
    if (stockFilter === 'OUT') matchStock = item.stock === 0;

    return matchSearch && matchBrand && matchCategory && matchStock;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Katalog Stok Sparepart HP
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mendata semua tipe sparepart (LCD, Baterai, Fleksibel, IC, dll.) dari berbagai brand smartphone
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-xs"
            title="Export data ke Excel / CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Tambah Part Baru
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan Tipe HP (misal: iPhone 11, Redmi Note 9, Samsung A50), Nama Part, SKU, atau Lokasi Rak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-teal-700 dark:text-teal-300 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Semua Brand ({BRANDS.length})</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Status Stok:</span>
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  stockFilter === 'ALL' ? 'bg-white dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStockFilter('LOW')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  stockFilter === 'LOW' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Menipis
              </button>
              <button
                onClick={() => setStockFilter('OUT')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  stockFilter === 'OUT' ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Habis
              </button>
            </div>
          </div>

          {/* Counter info */}
          <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
            Menampilkan <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong> dari {items.length} item
          </div>
        </div>
      </div>

      {/* Spareparts Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Nama Sparepart & Model HP</th>
                <th className="py-3.5 px-4">Kategori & Brand</th>
                <th className="py-3.5 px-4">Lokasi Rak</th>
                <th className="py-3.5 px-4 text-center">Stok</th>
                <th className="py-3.5 px-4 text-right">Harga Modal</th>
                <th className="py-3.5 px-4 text-right">Harga Jual / Ecer</th>
                <th className="py-3.5 px-4 text-right">Harga Teknisi</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                    Tidak ada sparepart yang sesuai dengan filter atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stock <= item.min_stock;
                  const isOut = item.stock === 0;

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Model */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-500/20">
                            {item.sku}
                          </span>
                          <span className="text-amber-700 dark:text-amber-300 font-medium">📱 {item.phone_model}</span>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.category}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.brand}</div>
                      </td>

                      {/* Shelf Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                        {item.supplier && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Sup: {item.supplier}
                          </div>
                        )}
                      </td>

                      {/* Stock with quick buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleQuickStock(item, -1)}
                            disabled={item.stock <= 0}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
                            title="Kurangi stok (-1)"
                          >
                            -
                          </button>

                          <div className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs min-w-[3rem] ${
                            isOut
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/30'
                              : isLow
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                              : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25'
                          }`}>
                            {item.stock}
                          </div>

                          <button
                            onClick={() => handleQuickStock(item, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xs font-bold transition-colors"
                            title="Tambah stok (+1)"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          Min: {item.min_stock}
                        </div>
                      </td>

                      {/* Cost price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                        {formatRupiah(item.cost_price)}
                      </td>

                      {/* Sell price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-teal-700 dark:text-teal-300">
                        {formatRupiah(item.sell_price)}
                      </td>

                      {/* Technician price */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700 dark:text-amber-300">
                        {formatRupiah(item.technician_price)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePrintLabel(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Cetak Label Rak / Tag"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
                            title="Edit Sparepart"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            title="Hapus Sparepart"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                {editingItem ? 'Edit Data Sparepart' : 'Tambah Sparepart Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Smartphone *
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value as BrandType })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    required
                  >
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Model HP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe / Model HP *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: iPhone 11 Pro / Redmi Note 9"
                    value={formData.phone_model}
                    onChange={(e) => setFormData({ ...formData, phone_model: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Sparepart *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as SparepartCategory })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    placeholder="SKU-XXX"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-teal-700 dark:text-teal-300 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Part Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Sparepart *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: LCD iPhone 11 Original Equipment Crown Glass"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  required
                />
              </div>

              {/* Stock and Min Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Stok Sekarang *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Minimum Stok (Alert) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi Rak / Laci
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Laci A-01"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Modal / Beli (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual Ecer (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sell_price}
                    onChange={(e) => setFormData({ ...formData, sell_price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-teal-700 dark:text-teal-300 focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Teknisi / Grosir (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.technician_price}
                    onChange={(e) => setFormData({ ...formData, technician_price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-amber-700 dark:text-amber-300 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Supplier & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Crown Jakarta / Mitra Surabaya"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan / Spesifikasi Tambahan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: TrueTone ready, fleksibel tebal"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
