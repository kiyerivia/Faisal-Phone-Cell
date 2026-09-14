import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Phone, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Layers, 
  X, 
  MessageSquare,
  DollarSign,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { db } from '../db/database';
import { ServiceOrder, ServiceStatus, SparepartItem, BrandType, UsedPart, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo, generateServiceOrderNo, cleanPhoneForWA, getWhatsAppServiceMsg } from '../utils/formatters';
import { printServiceReceipt } from '../utils/receiptPrinter';

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

const STATUS_LIST: ServiceStatus[] = [
  'Antrean (Pending)',
  'Pengecekan (Diagnosing)',
  'Sedang Dikerjakan (In Progress)',
  'Menunggu Sparepart (Waiting Part)',
  'Selesai - Siap Ambil (Ready)',
  'Sudah Diambil (Completed)',
  'Dibatalkan (Cancelled)'
];

export const ServiceOrders: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneBrand, setPhoneBrand] = useState<BrandType>('iPhone / Apple');
  const [phoneModel, setPhoneModel] = useState('');
  const [problem, setProblem] = useState('');
  const [completeness, setCompleteness] = useState('Batangan (Tanpa Charger)');
  const [passwordPattern, setPasswordPattern] = useState('');
  const [status, setStatus] = useState<ServiceStatus>('Antrean (Pending)');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [serviceFee, setServiceFee] = useState<number>(50000);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [partsUsed, setPartsUsed] = useState<UsedPart[]>([]);

  // Sparepart selector in form
  const [selectedPartId, setSelectedPartId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const o = await db.service_orders.reverse().sortBy('created_at');
    const p = await db.spareparts.toArray();
    const s = await db.settings.get('default_store_settings');
    setOrders(o);
    setSpareparts(p);
    if (s) setSettings(s);
  };

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    setPhoneBrand('iPhone / Apple');
    setPhoneModel('');
    setProblem('');
    setCompleteness('Unit HP Batangan');
    setPasswordPattern('');
    setStatus('Antrean (Pending)');
    setTechnicianNotes('');
    setServiceFee(50000);
    setDownPayment(0);
    setPartsUsed([]);
    setSelectedPartId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: ServiceOrder) => {
    setEditingOrder(order);
    setCustomerName(order.customer_name);
    setCustomerPhone(order.customer_phone);
    setPhoneBrand(order.phone_brand);
    setPhoneModel(order.phone_model);
    setProblem(order.problem);
    setCompleteness(order.completeness);
    setPasswordPattern(order.password_pattern || '');
    setStatus(order.status);
    setTechnicianNotes(order.technician_notes || '');
    setServiceFee(order.service_fee);
    setDownPayment(order.down_payment);
    setPartsUsed(order.parts_used || []);
    setIsModalOpen(true);
  };

  const handleAddPartToOrder = () => {
    if (!selectedPartId) return;
    const part = spareparts.find(p => p.id === selectedPartId);
    if (!part) return;

    const existingIndex = partsUsed.findIndex(p => p.part_id === part.id);
    if (existingIndex >= 0) {
      const updated = [...partsUsed];
      updated[existingIndex].qty += 1;
      setPartsUsed(updated);
    } else {
      setPartsUsed([
        ...partsUsed,
        {
          part_id: part.id,
          sku: part.sku,
          name: part.name,
          qty: 1,
          cost_price: part.cost_price,
          sell_price: part.sell_price
        }
      ]);
    }
    setSelectedPartId('');
  };

  const handleRemovePartFromOrder = (partId: string) => {
    setPartsUsed(partsUsed.filter(p => p.part_id !== partId));
  };

  const partsTotalSell = partsUsed.reduce((acc, p) => acc + (p.sell_price * p.qty), 0);
  const partsTotalCost = partsUsed.reduce((acc, p) => acc + (p.cost_price * p.qty), 0);
  const totalCostEstimate = partsTotalSell + serviceFee;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phoneModel || !problem) {
      alert('Nama pelanggan, tipe HP, dan kerusakan wajib diisi!');
      return;
    }

    const now = new Date().toISOString();

    if (editingOrder) {
      const isFinishing = status.includes('Sudah Diambil') && !editingOrder.status.includes('Sudah Diambil');

      const updated: ServiceOrder = {
        ...editingOrder,
        customer_name: customerName,
        customer_phone: customerPhone,
        phone_brand: phoneBrand,
        phone_model: phoneModel,
        problem,
        completeness,
        password_pattern: passwordPattern,
        status,
        technician_notes: technicianNotes,
        service_fee: Number(serviceFee),
        down_payment: Number(downPayment),
        cost_estimate: totalCostEstimate,
        final_cost: totalCostEstimate,
        parts_used: partsUsed,
        updated_at: now,
        completed_at: status.includes('Selesai') || status.includes('Sudah Diambil') ? now : editingOrder.completed_at,
        is_synced: 0
      };

      await db.service_orders.put(updated);

      if (isFinishing) {
        for (const p of partsUsed) {
          const livePart = await db.spareparts.get(p.part_id);
          if (livePart) {
            const newStock = Math.max(0, livePart.stock - p.qty);
            await db.spareparts.update(p.part_id, {
              stock: newStock,
              updated_at: now,
              is_synced: 0
            });

            await db.stock_movements.add({
              id: `mov-${Date.now()}-${p.part_id}`,
              sparepart_id: p.part_id,
              sparepart_sku: p.sku,
              sparepart_name: p.name,
              type: 'keluar_servis',
              qty: p.qty,
              prev_stock: livePart.stock,
              new_stock: newStock,
              reference_no: editingOrder.order_no,
              notes: `Dipakai servis ${editingOrder.order_no} (${customerName})`,
              created_at: now,
              is_synced: 0
            });
          }
        }

        const profit = (partsTotalSell - partsTotalCost) + Number(serviceFee);
        await db.transactions.add({
          id: `trx-${Date.now()}`,
          invoice_no: `INV-SRV-${editingOrder.order_no}`,
          type: 'servis',
          service_order_id: editingOrder.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          items: [
            ...partsUsed.map(p => ({
              type: 'sparepart' as const,
              id: p.part_id,
              sku: p.sku,
              name: p.name,
              qty: p.qty,
              unit_cost: p.cost_price,
              unit_price: p.sell_price,
              total_price: p.sell_price * p.qty
            })),
            {
              type: 'service' as const,
              name: `Jasa Servis ${phoneModel} (${problem})`,
              qty: 1,
              unit_cost: 0,
              unit_price: Number(serviceFee),
              total_price: Number(serviceFee)
            }
          ],
          subtotal: totalCostEstimate,
          discount: 0,
          total_amount: totalCostEstimate,
          total_cost: partsTotalCost,
          profit: profit,
          payment_method: 'Tunai',
          cash_given: totalCostEstimate,
          change: 0,
          cashier_name: 'Faisal (Teknisi)',
          created_at: now,
          is_synced: 0
        });
      }
    } else {
      const count = await db.service_orders.count();
      const orderNo = generateServiceOrderNo(count);

      const newOrder: ServiceOrder = {
        id: `srv-${Date.now()}`,
        order_no: orderNo,
        customer_name: customerName,
        customer_phone: customerPhone,
        phone_brand: phoneBrand,
        phone_model: phoneModel,
        problem,
        completeness,
        password_pattern: passwordPattern,
        status,
        technician_notes: technicianNotes,
        service_fee: Number(serviceFee),
        down_payment: Number(downPayment),
        cost_estimate: totalCostEstimate,
        final_cost: totalCostEstimate,
        parts_used: partsUsed,
        created_at: now,
        updated_at: now,
        is_synced: 0
      };

      await db.service_orders.add(newOrder);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleQuickStatusChange = async (order: ServiceOrder, nextStatus: ServiceStatus) => {
    await db.service_orders.update(order.id, {
      status: nextStatus,
      updated_at: new Date().toISOString(),
      is_synced: 0
    });
    loadData();
  };

  const handleDelete = async (id: string, orderNo: string) => {
    if (confirm(`Yakin ingin menghapus nota servis ${orderNo}?`)) {
      await db.service_orders.delete(id);
      loadData();
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery) ||
      o.phone_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.problem.toLowerCase().includes(searchQuery.toLowerCase());

    let matchStatus = true;
    if (selectedStatusTab === 'PENDING') matchStatus = o.status.includes('Antrean');
    if (selectedStatusTab === 'PROGRESS') matchStatus = o.status.includes('Sedang') || o.status.includes('Pengecekan');
    if (selectedStatusTab === 'WAITING') matchStatus = o.status.includes('Menunggu');
    if (selectedStatusTab === 'READY') matchStatus = o.status.includes('Selesai');
    if (selectedStatusTab === 'DONE') matchStatus = o.status.includes('Sudah Diambil');

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Manajemen Servisan HP & Nota
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Penerimaan unit, antrean pengerjaan teknisi, alokasi sparepart, tanda terima, dan notifikasi WhatsApp
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Penerimaan Servis Baru
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan No. Nota (FPC-...), Nama Pelanggan, No WA, atau Tipe HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        {/* Status Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
          {[
            { id: 'ALL', label: 'Semua Status', count: orders.length },
            { id: 'PENDING', label: 'Antrean', count: orders.filter(o => o.status.includes('Antrean')).length },
            { id: 'PROGRESS', label: 'Dikerjakan', count: orders.filter(o => o.status.includes('Sedang') || o.status.includes('Pengecekan')).length },
            { id: 'WAITING', label: 'Menunggu Part', count: orders.filter(o => o.status.includes('Menunggu')).length },
            { id: 'READY', label: 'Siap Diambil', count: orders.filter(o => o.status.includes('Selesai')).length },
            { id: 'DONE', label: 'Selesai & Diambil', count: orders.filter(o => o.status.includes('Sudah Diambil')).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatusTab === tab.id
                  ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Service Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-16 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
            <Wrench className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            Tidak ada data servisan yang cocok.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const remaining = Math.max(0, order.final_cost - order.down_payment);
            const waText = getWhatsAppServiceMsg(
              order.customer_name,
              order.order_no,
              `${order.phone_brand} ${order.phone_model}`,
              order.status,
              order.final_cost,
              order.down_payment,
              settings?.store_name || 'Faisal Phone Cell'
            );
            const waUrl = `https://wa.me/${cleanPhoneForWA(order.customer_phone)}?text=${waText}`;

            return (
              <div
                key={order.id}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Header Card */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-500/20">
                      {order.order_no}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      order.status.includes('Selesai')
                        ? 'badge-ready'
                        : order.status.includes('Sedang')
                        ? 'badge-progress'
                        : order.status.includes('Menunggu')
                        ? 'badge-waiting'
                        : order.status.includes('Sudah Diambil')
                        ? 'badge-completed'
                        : 'badge-pending'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Customer and Device info */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {order.customer_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{order.customer_phone}</span>
                      <span>•</span>
                      <span className="text-[11px]">{formatDateIndo(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Phone Details */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <span>📱 {order.phone_brand} - {order.phone_model}</span>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-500 dark:text-slate-400">Kerusakan:</strong> {order.problem}
                    </div>
                    {order.password_pattern && (
                      <div className="text-[11px] text-teal-700 dark:text-teal-300 font-mono">
                        🔑 Kunci/Pola: {order.password_pattern}
                      </div>
                    )}
                    {order.completeness && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        📦 Kelengkapan: {order.completeness}
                      </div>
                    )}
                  </div>

                  {/* Parts used */}
                  {order.parts_used && order.parts_used.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        Sparepart Dipasang:
                      </div>
                      <div className="space-y-0.5">
                        {order.parts_used.map((p, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 pl-2">
                            <span className="line-clamp-1">• {p.name} ({p.qty}x)</span>
                            <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">{formatRupiah(p.sell_price * p.qty)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.technician_notes && (
                    <div className="mt-2 p-2 rounded bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic">
                      Catatan Teknisi: {order.technician_notes}
                    </div>
                  )}
                </div>

                {/* Footer Card: Cost & Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Total Biaya Servis</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {formatRupiah(order.final_cost)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {order.down_payment > 0 ? `DP: ${formatRupiah(order.down_payment)}` : 'Sisa Bayar'}
                      </div>
                      <div className={`text-xs font-bold font-mono ${remaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {remaining === 0 ? 'Lunas' : formatRupiah(remaining)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <div className="flex items-center gap-1">
                      {/* WA Link */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                        title="Kirim Update WA"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      {/* Print Claim Receipt */}
                      <button
                        onClick={() => settings && printServiceReceipt(order, settings)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Cetak Nota Tanda Terima"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(order)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
                        title="Edit Servisan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Status Next Button */}
                    {!order.status.includes('Sudah Diambil') && !order.status.includes('Dibatalkan') && (
                      <button
                        onClick={() => {
                          if (order.status.includes('Antrean')) {
                            handleQuickStatusChange(order, 'Sedang Dikerjakan (In Progress)');
                          } else if (order.status.includes('Sedang') || order.status.includes('Menunggu') || order.status.includes('Pengecekan')) {
                            handleQuickStatusChange(order, 'Selesai - Siap Ambil (Ready)');
                          } else if (order.status.includes('Selesai')) {
                            handleOpenEdit(order);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/20 dark:hover:bg-teal-500/30 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-xs font-bold rounded-lg transition-all"
                      >
                        <span>
                          {order.status.includes('Antrean')
                            ? 'Kerjakan'
                            : order.status.includes('Sedang') || order.status.includes('Menunggu') || order.status.includes('Pengecekan')
                            ? 'Set Selesai'
                            : 'Ambil Unit'}
                        </span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New / Edit Service Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                {editingOrder ? `Edit Servisan ${editingOrder.order_no}` : 'Formulir Penerimaan Servis HP Baru'}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / HP *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Smartphone *
                  </label>
                  <select
                    value={phoneBrand}
                    onChange={(e) => setPhoneBrand(e.target.value as BrandType)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  >
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe / Model HP *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: iPhone 11 / Samsung A50"
                    value={phoneModel}
                    onChange={(e) => setPhoneModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Problem & Completeness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kerusakan / Keluhan HP *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Layar sentuh blank hitam setelah jatuh, getar masih ada"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pola Kunci / PIN Password
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PIN 1234 atau Pola L"
                      value={passwordPattern}
                      onChange={(e) => setPasswordPattern(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kelengkapan Unit
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Batangan, Dus, Kartu SIM"
                      value={completeness}
                      onChange={(e) => setCompleteness(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Technician Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Pengerjaan *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-700 dark:text-amber-300 focus:border-teal-500 focus:outline-none font-medium"
                  >
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Teknisi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Selesai dites normal, segel terpasang"
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sparepart Allocation Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Alokasikan Sparepart dari Stok Toko
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Otomatis potong stok saat unit diambil
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Sparepart yang Digunakan --</option>
                    {spareparts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.phone_model}] (Stok: {p.stock}) - {formatRupiah(p.sell_price)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPartToOrder}
                    disabled={!selectedPartId}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    + Pasang Part
                  </button>
                </div>

                {/* List of allocated parts */}
                {partsUsed.length > 0 && (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {partsUsed.map((p) => (
                      <div key={p.part_id} className="p-2.5 bg-white dark:bg-slate-900/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.qty}x @ {formatRupiah(p.sell_price)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                            {formatRupiah(p.sell_price * p.qty)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePartFromOrder(p.part_id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cost & Down Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ongkos Jasa Servis (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={serviceFee}
                    onChange={(e) => setServiceFee(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Uang Muka / DP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={downPayment}
                    onChange={(e) => setDownPayment(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-emerald-600 dark:text-emerald-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Estimasi Biaya
                  </label>
                  <div className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-teal-700 dark:text-teal-300">
                    {formatRupiah(totalCostEstimate)}
                  </div>
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
                  Simpan & Cetak Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
