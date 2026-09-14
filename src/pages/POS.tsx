import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  User, 
  CreditCard, 
  QrCode, 
  Banknote,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../db/database';
import { SparepartItem, Transaction, TransactionItem, StoreSettings } from '../types';
import { formatRupiah, generateInvoiceNo } from '../utils/formatters';
import { printTransactionReceipt, printA4Invoice } from '../utils/receiptPrinter';

interface CartItem extends TransactionItem {
  stock_available: number;
  price_type: 'retail' | 'technician';
  retail_price: number;
  technician_price: number;
}

export const POS: React.FC = () => {
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Custom Item Form Modal
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(50000);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Last Completed Transaction
  const [completedTrx, setCompletedTrx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await db.spareparts.where('stock').above(0).toArray();
    const s = await db.settings.get('default_store_settings');
    setSpareparts(p);
    if (s) setSettings(s);
  };

  const handleAddToCart = (part: SparepartItem, priceType: 'retail' | 'technician' = 'retail') => {
    const existingIndex = cart.findIndex(item => item.id === part.id);
    const unitPrice = priceType === 'technician' && part.technician_price > 0 ? part.technician_price : part.sell_price;

    if (existingIndex >= 0) {
      const current = cart[existingIndex];
      if (current.qty >= part.stock) {
        alert(`Stok ${part.name} hanya tersedia ${part.stock} pcs!`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      updated[existingIndex].total_price = updated[existingIndex].qty * updated[existingIndex].unit_price;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          type: 'sparepart',
          id: part.id,
          sku: part.sku,
          name: part.name,
          qty: 1,
          unit_cost: part.cost_price,
          unit_price: unitPrice,
          total_price: unitPrice,
          stock_available: part.stock,
          price_type: priceType,
          retail_price: part.sell_price,
          technician_price: part.technician_price || part.sell_price,
        }
      ]);
    }
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || customPrice <= 0) return;

    setCart([
      ...cart,
      {
        type: 'service',
        name: customName,
        qty: 1,
        unit_cost: 0,
        unit_price: Number(customPrice),
        total_price: Number(customPrice),
        stock_available: 999,
        price_type: 'retail',
        retail_price: Number(customPrice),
        technician_price: Number(customPrice),
      }
    ]);

    setCustomName('');
    setCustomPrice(50000);
    setShowCustomModal(false);
  };

  const updateCartQty = (index: number, delta: number) => {
    const updated = [...cart];
    const item = updated[index];
    const nextQty = item.qty + delta;

    if (nextQty <= 0) {
      updated.splice(index, 1);
    } else {
      if (item.type === 'sparepart' && nextQty > item.stock_available) {
        alert(`Maksimal stok tersedia hanya ${item.stock_available} pcs`);
        return;
      }
      item.qty = nextQty;
      item.total_price = item.qty * item.unit_price;
    }
    setCart(updated);
  };

  const togglePriceType = (index: number) => {
    const updated = [...cart];
    const item = updated[index];
    if (item.type !== 'sparepart') return;

    if (item.price_type === 'retail') {
      item.price_type = 'technician';
      item.unit_price = item.technician_price;
    } else {
      item.price_type = 'retail';
      item.unit_price = item.retail_price;
    }
    item.total_price = item.qty * item.unit_price;
    setCart(updated);
  };

  const removeCartItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.total_price, 0);
  const totalCost = cart.reduce((acc, curr) => acc + (curr.unit_cost * curr.qty), 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const change = Math.max(0, cashGiven - grandTotal);
  const profit = grandTotal - totalCost;

  const handleQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }

    if (paymentMethod === 'Tunai' && cashGiven < grandTotal) {
      alert(`Uang pembayaran kurang! Total: ${formatRupiah(grandTotal)}, Diberikan: ${formatRupiah(cashGiven)}`);
      return;
    }

    const now = new Date().toISOString();
    const invoiceNo = generateInvoiceNo();

    const transaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoice_no: invoiceNo,
      type: cart.some(i => i.type === 'service') ? (cart.some(i => i.type === 'sparepart') ? 'campuran' : 'servis') : 'penjualan',
      customer_name: customerName || 'Pelanggan Umum',
      customer_phone: customerPhone || '-',
      items: cart.map(i => ({
        type: i.type,
        id: i.id,
        sku: i.sku,
        name: i.name,
        qty: i.qty,
        unit_cost: i.unit_cost,
        unit_price: i.unit_price,
        total_price: i.total_price
      })),
      subtotal,
      discount,
      total_amount: grandTotal,
      total_cost: totalCost,
      profit,
      payment_method: paymentMethod,
      cash_given: paymentMethod === 'Tunai' ? cashGiven : grandTotal,
      change: paymentMethod === 'Tunai' ? change : 0,
      cashier_name: 'Faisal (Kasir)',
      created_at: now,
      is_synced: 0
    };

    await db.transactions.add(transaction);

    for (const item of cart) {
      if (item.type === 'sparepart' && item.id) {
        const live = await db.spareparts.get(item.id);
        if (live) {
          const newStock = Math.max(0, live.stock - item.qty);
          await db.spareparts.update(item.id, {
            stock: newStock,
            updated_at: now,
            is_synced: 0
          });

          await db.stock_movements.add({
            id: `mov-${Date.now()}-${item.id}`,
            sparepart_id: item.id,
            sparepart_sku: item.sku || '',
            sparepart_name: item.name,
            type: 'keluar_penjualan',
            qty: item.qty,
            prev_stock: live.stock,
            new_stock: newStock,
            reference_no: invoiceNo,
            notes: `Penjualan Kasir POS (${customerName})`,
            created_at: now,
            is_synced: 0
          });
        }
      }
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    setCompletedTrx(transaction);
    setCart([]);
    setDiscount(0);
    setCashGiven(0);
    setCustomerName('Pelanggan Umum');
    setCustomerPhone('');
    loadData();
  };

  const filteredParts = spareparts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));

    const matchBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
    return matchSearch && matchBrand;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Kasir & Penjualan (POS)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transaksi cepat sparepart, input jasa servis lepas, dan cetak struk kasir
          </p>
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 font-semibold text-xs rounded-xl border border-teal-200 dark:border-teal-500/30 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          + Jasa / Item Manual
        </button>
      </div>

      {/* POS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 flex-1 overflow-hidden">
        {/* Left: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden space-y-3">
          <div className="space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik Tipe HP / Nama Part / Scan Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Quick Brand Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'iPhone / Apple', 'Samsung', 'Xiaomi / Redmi / POCO', 'Oppo', 'Realme', 'Vivo / iQOO', 'Infinix / Tecno / Itel', 'Universal / Lainnya'].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                    selectedBrand === b
                      ? 'bg-teal-600 text-white font-bold dark:bg-teal-500 dark:text-slate-950'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {b === 'ALL' ? 'Semua Brand' : b}
                </button>
              ))}
            </div>
          </div>

          {/* Parts Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            {filteredParts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                Tidak ada sparepart yang ditemukan atau stok habis.
              </div>
            ) : (
              filteredParts.map((part) => (
                <div
                  key={part.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">{part.brand}</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        Stok: {part.stock}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-1 line-clamp-2">
                      {part.name}
                    </div>
                    <div className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-0.5">
                      📱 {part.phone_model}
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Harga Ecer</div>
                      <div className="font-mono font-bold text-sm text-teal-700 dark:text-teal-300">
                        {formatRupiah(part.sell_price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddToCart(part, 'technician')}
                        className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 text-[10px] font-semibold transition-colors"
                        title="Tambah dengan Harga Khusus Teknisi"
                      >
                        Teknisi
                      </button>
                      <button
                        onClick={() => handleAddToCart(part, 'retail')}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm dark:shadow-md transition-all"
                      >
                        + Beli
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden glass-panel rounded-2xl p-4 justify-between">
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Keranjang Kasir ({cart.length})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Pelanggan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
              <input
                type="text"
                placeholder="No. HP / WA"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto my-3 divide-y divide-slate-100 dark:divide-slate-800/80 pr-1 space-y-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 text-xs py-8">
                <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
                Klik item di katalog untuk menambahkan ke kasir
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="pt-2 pb-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{item.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatRupiah(item.unit_price)}</span>
                      {item.type === 'sparepart' && (
                        <button
                          onClick={() => togglePriceType(idx)}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold transition-colors ${
                            item.price_type === 'technician'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {item.price_type === 'technician' ? 'Harga Teknisi' : 'Harga Ecer'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateCartQty(idx, -1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateCartQty(idx, 1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total line price */}
                  <div className="text-right min-w-[4.5rem]">
                    <div className="font-mono font-bold text-teal-700 dark:text-teal-300 text-xs">
                      {formatRupiah(item.total_price)}
                    </div>
                    <button
                      onClick={() => removeCartItem(idx)}
                      className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout & Payment Section */}
          <div className="shrink-0 space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Diskon (Rp):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-right text-xs font-mono text-amber-700 dark:text-amber-300 focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center text-base font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>TOTAL:</span>
                <span className="font-mono text-teal-700 dark:text-teal-300">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {(['Tunai', 'QRIS', 'Transfer Bank'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== 'Tunai') setCashGiven(grandTotal);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMethod === method
                      ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-500/50 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Cash Given & Change */}
            {paymentMethod === 'Tunai' && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Uang Diterima:</span>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                  <button
                    onClick={() => handleQuickCash(grandTotal)}
                    className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 rounded font-mono font-semibold"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickCash(amt)}
                      className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-mono"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Kembalian:</span>
                  <span className={`font-mono font-bold ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatRupiah(change)}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-600 disabled:opacity-50 text-white dark:text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Bayar & Proses Transaksi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Service Item Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Tambah Jasa Servis / Item Lepas ke Kasir
            </h3>
            <form onSubmit={handleAddCustomService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Jasa / Barang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jasa Pasang LCD iPhone / Flash Software"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biaya / Harga (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-teal-700 dark:text-teal-300 focus:border-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs"
                >
                  + Masukkan ke Kasir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Success & Print Prompt Modal */}
      {completedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm animate-in zoom-in-95 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-teal-500/40 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaksi Berhasil!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{completedTrx.invoice_no}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Bayar:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(completedTrx.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Metode:</span>
                <span className="text-teal-700 dark:text-teal-300 font-semibold">{completedTrx.payment_method}</span>
              </div>
              {completedTrx.payment_method === 'Tunai' && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Kembalian:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(completedTrx.change)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (settings) printTransactionReceipt(completedTrx, settings);
                  }}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Struk Thermal (POS)
                </button>
                <button
                  onClick={() => {
                    if (settings) printA4Invoice(completedTrx, settings);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-teal-500/30"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Faktur A4 / PDF
                </button>
              </div>
              <button
                onClick={() => setCompletedTrx(null)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg"
              >
                Tutup & Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
