import Dexie, { type Table } from 'dexie';
import { SparepartItem, ServiceOrder, Transaction, StockMovement, StoreSettings } from '../types';

export class FaisalPhoneDB extends Dexie {
  spareparts!: Table<SparepartItem, string>;
  service_orders!: Table<ServiceOrder, string>;
  transactions!: Table<Transaction, string>;
  stock_movements!: Table<StockMovement, string>;
  settings!: Table<StoreSettings, string>;

  constructor() {
    super('FaisalPhoneCellDB');
    this.version(1).stores({
      spareparts: 'id, sku, barcode, brand, phone_model, category, name, stock, min_stock, location, updated_at, is_synced',
      service_orders: 'id, order_no, customer_name, customer_phone, phone_brand, phone_model, status, created_at, updated_at, is_synced',
      transactions: 'id, invoice_no, type, customer_name, created_at, is_synced',
      stock_movements: 'id, sparepart_id, type, created_at, is_synced',
      settings: 'id'
    });
  }
}

export const db = new FaisalPhoneDB();

// Default Store Settings
export const DEFAULT_SETTINGS: StoreSettings = {
  id: 'default_store_settings',
  store_name: 'Faisal Phone Cell',
  tagline: 'Spesialis Servis HP Semua Tipe & Grosir Sparepart',
  store_phone: '0812-3456-7890',
  store_address: 'Jl. Pemuda No. 88, Ruko Ponsel Utama, Blok B-3',
  receipt_footer: 'Terima kasih atas kepercayaan Anda!\nBarang yang sudah dibeli / diservis bergaransi 7 hari (syarat segel utuh).',
  low_stock_threshold_default: 3,
  supabase_url: '',
  supabase_anon_key: '',
  sync_enabled: false,
  auto_sync_interval_mins: 5,
};

// Inisialisasi pengaturan toko jika database baru/kosong (tanpa data dummy/sampel)
export async function seedInitialData() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}

// Fungsi untuk mengosongkan seluruh database (katalog, orderan, kasir, mutasi stok) agar mulai dari nol
export async function clearAllData() {
  await db.spareparts.clear();
  await db.service_orders.clear();
  await db.transactions.clear();
  await db.stock_movements.clear();
  await seedInitialData();
}
