export type BrandType = 
  | 'iPhone / Apple'
  | 'Samsung'
  | 'Xiaomi / Redmi / POCO'
  | 'Oppo'
  | 'Realme'
  | 'Vivo / iQOO'
  | 'Infinix / Tecno / Itel'
  | 'Asus'
  | 'Huawei'
  | 'Universal / Lainnya';

export type SparepartCategory =
  | 'LCD & Touchscreen'
  | 'Baterai (Battery)'
  | 'Flexible & Board Cas'
  | 'IC (Power, EMMC, CPU, dll)'
  | 'Kamera Depan / Belakang'
  | 'Backdoor / Casing / Frame'
  | 'Speaker / Buzzer / Mic'
  | 'Konektor & SIM Tray'
  | 'Kaca Glass & OCA'
  | 'Lem, Timah & Bahan Servis'
  | 'Aksesoris & Tempered Glass';

export interface SparepartItem {
  id: string;
  sku: string;
  barcode?: string;
  brand: BrandType;
  phone_model: string; // misal: "iPhone 11", "Redmi Note 9 Pro", "Samsung A50"
  category: SparepartCategory;
  name: string; // misal: "LCD Original Equipment Crown", "Baterai R-One BN53"
  stock: number;
  min_stock: number;
  cost_price: number; // Harga modal / beli
  sell_price: number; // Harga jual umum / ecer
  technician_price: number; // Harga khusus teknisi / grosir
  location: string; // Lokasi rak/laci misal "Laci A-03", "Kotak Baterai #2"
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_synced?: number; // 0 = false, 1 = true
}

export type ServiceStatus =
  | 'Antrean (Pending)'
  | 'Pengecekan (Diagnosing)'
  | 'Sedang Dikerjakan (In Progress)'
  | 'Menunggu Sparepart (Waiting Part)'
  | 'Selesai - Siap Ambil (Ready)'
  | 'Sudah Diambil (Completed)'
  | 'Dibatalkan (Cancelled)';

export interface UsedPart {
  part_id: string;
  sku: string;
  name: string;
  qty: number;
  cost_price: number;
  sell_price: number;
}

export interface ServiceOrder {
  id: string;
  order_no: string; // misal "FPC-202609-001"
  customer_name: string;
  customer_phone: string;
  phone_brand: BrandType;
  phone_model: string;
  problem: string; // Kerusakan/Keluhan
  completeness: string; // Batangan, Dus, SIM Tray, dll.
  password_pattern?: string; // Sandi / Pola
  status: ServiceStatus;
  technician_notes?: string;
  service_fee: number; // Ongkos jasa pasang/servis
  cost_estimate: number;
  down_payment: number; // Uang muka (DP)
  final_cost: number;
  parts_used: UsedPart[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_synced?: number;
}

export interface TransactionItem {
  type: 'sparepart' | 'service';
  id?: string;
  sku?: string;
  name: string;
  qty: number;
  unit_cost: number;
  unit_price: number;
  total_price: number;
}

export interface Transaction {
  id: string;
  invoice_no: string;
  type: 'penjualan' | 'servis' | 'campuran';
  service_order_id?: string;
  customer_name: string;
  customer_phone?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total_amount: number;
  total_cost: number; // Total harga modal (untuk hitung profit)
  profit: number; // Laba bersih = total_amount - total_cost
  payment_method: 'Tunai' | 'Transfer Bank' | 'QRIS';
  cash_given: number;
  change: number;
  cashier_name: string;
  notes?: string;
  created_at: string;
  is_synced?: number;
}

export interface StockMovement {
  id: string;
  sparepart_id: string;
  sparepart_sku: string;
  sparepart_name: string;
  type: 'masuk_supplier' | 'keluar_penjualan' | 'keluar_servis' | 'penyesuaian_rusak' | 'retur_supplier';
  qty: number;
  prev_stock: number;
  new_stock: number;
  reference_no?: string; // No Nota Kasir atau No Servis
  notes?: string;
  created_at: string;
  is_synced?: number;
}

export interface StoreSettings {
  id?: string;
  store_name: string;
  tagline: string;
  store_phone: string;
  store_address: string;
  receipt_footer: string;
  low_stock_threshold_default: number;
  supabase_url: string;
  supabase_anon_key: string;
  sync_enabled: boolean;
  auto_sync_interval_mins: number;
  last_sync_time?: string;
}
