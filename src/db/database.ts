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

// Seed sample phone spareparts data if DB is empty
export async function seedInitialData() {
  const count = await db.spareparts.count();
  if (count > 0) return;

  const now = new Date().toISOString();

  // Settings
  await db.settings.put(DEFAULT_SETTINGS);

  const sampleParts: SparepartItem[] = [
    // --- APPLE / IPHONE ---
    {
      id: 'part-ip11-lcd-og',
      sku: 'LCD-IP11-OG',
      barcode: '8991001001',
      brand: 'iPhone / Apple',
      phone_model: 'iPhone 11',
      category: 'LCD & Touchscreen',
      name: 'LCD iPhone 11 Original Equipment Crown Glass',
      stock: 6,
      min_stock: 2,
      cost_price: 320000,
      sell_price: 490000,
      technician_price: 410000,
      location: 'Rak LCD A-01',
      supplier: 'Crown Sparepart Jkt',
      notes: 'Warna hitam, TrueTone ready, fleksibel tebal',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-ip11-bat-rone',
      sku: 'BAT-IP11-RO',
      barcode: '8991001002',
      brand: 'iPhone / Apple',
      phone_model: 'iPhone 11',
      category: 'Baterai (Battery)',
      name: 'Baterai iPhone 11 R-One High Capacity 3110mAh',
      stock: 8,
      min_stock: 3,
      cost_price: 145000,
      sell_price: 240000,
      technician_price: 195000,
      location: 'Laci Baterai B-01',
      supplier: 'R-One Indonesia',
      notes: 'Sudah include lem stiker baterai',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-ip13-lcd-incell',
      sku: 'LCD-IP13-INC',
      barcode: '8991001003',
      brand: 'iPhone / Apple',
      phone_model: 'iPhone 13',
      category: 'LCD & Touchscreen',
      name: 'LCD iPhone 13 OLED GX High Quality',
      stock: 2,
      min_stock: 2,
      cost_price: 680000,
      sell_price: 950000,
      technician_price: 820000,
      location: 'Rak LCD A-02',
      supplier: 'GX Parts Asia',
      notes: 'OLED super tipis, kontras warna pekat',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-ipx-flex-cas',
      sku: 'FLX-IPX-CHG',
      barcode: '8991001004',
      brand: 'iPhone / Apple',
      phone_model: 'iPhone X / XS',
      category: 'Flexible & Board Cas',
      name: 'Flexible Connector Charger + Mic iPhone X Original',
      stock: 4,
      min_stock: 2,
      cost_price: 65000,
      sell_price: 135000,
      technician_price: 95000,
      location: 'Kotak Fleksibel F-01',
      supplier: 'Crown Sparepart Jkt',
      notes: 'Support fast charging dan mic jernih',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },

    // --- SAMSUNG ---
    {
      id: 'part-sam-a50-lcd-oled',
      sku: 'LCD-SAMA50-OL',
      barcode: '8991002001',
      brand: 'Samsung',
      phone_model: 'Samsung Galaxy A50 / A50s / A30s',
      category: 'LCD & Touchscreen',
      name: 'LCD Samsung A50 / A50s OLED Frame Kontras',
      stock: 5,
      min_stock: 2,
      cost_price: 240000,
      sell_price: 390000,
      technician_price: 320000,
      location: 'Rak LCD A-04',
      supplier: 'Mitra Ponsel Surabaya',
      notes: 'Support fingerprint di layar / under display',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-sam-a12-board-cas',
      sku: 'BRD-SAMA12-CHG',
      barcode: '8991002002',
      brand: 'Samsung',
      phone_model: 'Samsung Galaxy A12 (A125F)',
      category: 'Flexible & Board Cas',
      name: 'Papan Board Cas Samsung A12 Full Komponen IC',
      stock: 1, // Low stock test
      min_stock: 3,
      cost_price: 30000,
      sell_price: 75000,
      technician_price: 50000,
      location: 'Kotak Board B-03',
      supplier: 'Crown Sparepart Jkt',
      notes: 'Ada IC Pengaman proteksi tegangan',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-sam-a51-bat-eb-ba515',
      sku: 'BAT-SAMA51-EB',
      barcode: '8991002003',
      brand: 'Samsung',
      phone_model: 'Samsung Galaxy A51',
      category: 'Baterai (Battery)',
      name: 'Baterai Samsung A51 EB-BA515ABY Original 100%',
      stock: 7,
      min_stock: 2,
      cost_price: 85000,
      sell_price: 165000,
      technician_price: 125000,
      location: 'Laci Baterai B-02',
      supplier: 'Mitra Ponsel Surabaya',
      notes: 'Kapasitas 4000mAh real tested',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },

    // --- XIAOMI / REDMI / POCO ---
    {
      id: 'part-mi-note9pro-bat-bn53',
      sku: 'BAT-MI-BN53',
      barcode: '8991003001',
      brand: 'Xiaomi / Redmi / POCO',
      phone_model: 'Redmi Note 9 Pro / Note 10 Pro / POCO X3',
      category: 'Baterai (Battery)',
      name: 'Baterai BN53 Redmi Note 9 Pro / Note 10 Pro / POCO X3',
      stock: 9,
      min_stock: 3,
      cost_price: 90000,
      sell_price: 175000,
      technician_price: 135000,
      location: 'Laci Baterai B-03',
      supplier: 'R-One Indonesia',
      notes: '5020mAh High power cell',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-mi-note10-lcd-crown',
      sku: 'LCD-MINOTE10-CR',
      barcode: '8991003002',
      brand: 'Xiaomi / Redmi / POCO',
      phone_model: 'Redmi Note 10 4G / Note 10S',
      category: 'LCD & Touchscreen',
      name: 'LCD Redmi Note 10 4G / Note 10S AMOLED Crown',
      stock: 4,
      min_stock: 2,
      cost_price: 275000,
      sell_price: 430000,
      technician_price: 360000,
      location: 'Rak LCD A-05',
      supplier: 'Crown Sparepart Jkt',
      notes: 'Warna tajam, responsif 10 sentuhan',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-poco-x3pro-ic-pm',
      sku: 'IC-PM7150-002',
      barcode: '8991003003',
      brand: 'Xiaomi / Redmi / POCO',
      phone_model: 'POCO X3 Pro / Redmi Note 9S',
      category: 'IC (Power, EMMC, CPU, dll)',
      name: 'IC Power PM7150 002 Original New Reball',
      stock: 5,
      min_stock: 2,
      cost_price: 55000,
      sell_price: 120000,
      technician_price: 85000,
      location: 'Kotak IC Kecil IC-01',
      supplier: 'Master IC Tool',
      notes: 'Khusus solusi HP mati total / restart berulang',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },

    // --- OPPO & REALME ---
    {
      id: 'part-oppo-a53-lcd-og',
      sku: 'LCD-OPPO-A53',
      barcode: '8991004001',
      brand: 'Oppo',
      phone_model: 'Oppo A53 / A33 2020 / Realme C17',
      category: 'LCD & Touchscreen',
      name: 'LCD Oppo A53 / A33 2020 90Hz Original Equipment',
      stock: 6,
      min_stock: 2,
      cost_price: 165000,
      sell_price: 285000,
      technician_price: 225000,
      location: 'Rak LCD A-06',
      supplier: 'Crown Sparepart Jkt',
      notes: 'Support 90Hz refresh rate mulus',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-realme-c11-bat-blp729',
      sku: 'BAT-REALME-BLP729',
      barcode: '8991004002',
      brand: 'Realme',
      phone_model: 'Realme C11 / C12 / C15',
      category: 'Baterai (Battery)',
      name: 'Baterai BLP729 Realme C11 / C12 / C15 6000mAh',
      stock: 8,
      min_stock: 2,
      cost_price: 80000,
      sell_price: 155000,
      technician_price: 115000,
      location: 'Laci Baterai B-04',
      supplier: 'R-One Indonesia',
      notes: 'Baterai awet monster 6000mAh',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },

    // --- VIVO ---
    {
      id: 'part-vivo-y12-lcd-crown',
      sku: 'LCD-VIVO-Y12',
      barcode: '8991005001',
      brand: 'Vivo / iQOO',
      phone_model: 'Vivo Y12 / Y15 / Y17 / Y11',
      category: 'LCD & Touchscreen',
      name: 'LCD Vivo Y12 / Y15 / Y17 / Y11 Crown Fullset',
      stock: 7,
      min_stock: 2,
      cost_price: 140000,
      sell_price: 250000,
      technician_price: 190000,
      location: 'Rak LCD A-07',
      supplier: 'Mitra Ponsel Surabaya',
      notes: 'Presisi di frame casing',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },

    // --- INFINIX / TECNO ---
    {
      id: 'part-infinix-hot10-lcd',
      sku: 'LCD-INF-HOT10',
      barcode: '8991006001',
      brand: 'Infinix / Tecno / Itel',
      phone_model: 'Infinix Hot 10 (X682)',
      category: 'LCD & Touchscreen',
      name: 'LCD Infinix Hot 10 X682 / Hot 10 Play Fullset Touch',
      stock: 5,
      min_stock: 2,
      cost_price: 150000,
      sell_price: 260000,
      technician_price: 200000,
      location: 'Rak LCD A-08',
      supplier: 'Mitra Ponsel Surabaya',
      notes: 'Ukuran 6.78 inch punch hole presisi',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },

    // --- BAHAN SERVIS / UNIVERSAL ---
    {
      id: 'part-lem-t7000-50ml',
      sku: 'LEM-T7000-50',
      barcode: '8991009001',
      brand: 'Universal / Lainnya',
      phone_model: 'Semua Tipe HP Universal',
      category: 'Lem, Timah & Bahan Servis',
      name: 'Lem LCD T-7000 Hitam 50ml Zhanlida Original',
      stock: 12,
      min_stock: 4,
      cost_price: 18000,
      sell_price: 35000,
      technician_price: 28000,
      location: 'Meja Teknisi T-01',
      supplier: 'Alat Servis Jkt',
      notes: 'Lem hitam khusus rekat LCD & backdoor',
      created_at: now,
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'part-timah-pasta-mechanic',
      sku: 'TMH-MECH-183',
      barcode: '8991009002',
      brand: 'Universal / Lainnya',
      phone_model: 'Universal Servis IC',
      category: 'Lem, Timah & Bahan Servis',
      name: 'Timah Pasta Solder Mechanic XG-50 183°C',
      stock: 8,
      min_stock: 3,
      cost_price: 35000,
      sell_price: 60000,
      technician_price: 48000,
      location: 'Meja Teknisi T-02',
      supplier: 'Alat Servis Jkt',
      notes: 'Bagus untuk cetak kaki IC dan jumper fleksibel',
      created_at: now,
      updated_at: now,
      is_synced: 0
    }
  ];

  await db.spareparts.bulkPut(sampleParts);

  // Sample initial service orders
  const sampleServiceOrders: ServiceOrder[] = [
    {
      id: 'srv-001',
      order_no: 'FPC-202609-001',
      customer_name: 'Budi Santoso',
      customer_phone: '081388992211',
      phone_brand: 'iPhone / Apple',
      phone_model: 'iPhone 11',
      problem: 'Layar pecah retak parah setelah jatuh, sentuhan kadang loncat sendiri',
      completeness: 'Unit HP batangan (tanpa charger)',
      password_pattern: 'Pin: 112233',
      status: 'Sedang Dikerjakan (In Progress)',
      technician_notes: 'Sudah dites mesin masih normal nyala. Siap pasang LCD Crown OG.',
      service_fee: 100000,
      cost_estimate: 590000,
      down_payment: 200000,
      final_cost: 590000,
      parts_used: [
        {
          part_id: 'part-ip11-lcd-og',
          sku: 'LCD-IP11-OG',
          name: 'LCD iPhone 11 Original Equipment Crown Glass',
          qty: 1,
          cost_price: 320000,
          sell_price: 490000
        }
      ],
      created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'srv-002',
      order_no: 'FPC-202609-002',
      customer_name: 'Dewi Lestari',
      customer_phone: '085712345678',
      phone_brand: 'Samsung',
      phone_model: 'Samsung Galaxy A12',
      problem: 'Tidak bisa dicas, dicolok kabel goyang-goyang tidak masuk arus',
      completeness: 'Unit HP + Casing Softcase',
      password_pattern: 'Pola huruf L dari kiri atas',
      status: 'Antrean (Pending)',
      technician_notes: 'Perlu ganti satu set papan board cas',
      service_fee: 50000,
      cost_estimate: 125000,
      down_payment: 0,
      final_cost: 125000,
      parts_used: [
        {
          part_id: 'part-sam-a12-board-cas',
          sku: 'BRD-SAMA12-CHG',
          name: 'Papan Board Cas Samsung A12 Full Komponen IC',
          qty: 1,
          cost_price: 30000,
          sell_price: 75000
        }
      ],
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      updated_at: now,
      is_synced: 0
    },
    {
      id: 'srv-003',
      order_no: 'FPC-202609-003',
      customer_name: 'Ahmad Fauzi',
      customer_phone: '081299887766',
      phone_brand: 'Xiaomi / Redmi / POCO',
      phone_model: 'POCO X3 Pro',
      problem: 'Baterai drop cepat panas dan sering mati tiba-tiba saat sisa 30%',
      completeness: 'Unit HP batangan',
      password_pattern: 'Pin: 202609',
      status: 'Selesai - Siap Ambil (Ready)',
      technician_notes: 'Baterai BN53 sudah terpasang rapi, tested streaming Youtube 1 jam aman baterai awet',
      service_fee: 50000,
      cost_estimate: 225000,
      down_payment: 100000,
      final_cost: 225000,
      parts_used: [
        {
          part_id: 'part-mi-note9pro-bat-bn53',
          sku: 'BAT-MI-BN53',
          name: 'Baterai BN53 Redmi Note 9 Pro / Note 10 Pro / POCO X3',
          qty: 1,
          cost_price: 90000,
          sell_price: 175000
        }
      ],
      created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      updated_at: now,
      completed_at: now,
      is_synced: 0
    }
  ];

  await db.service_orders.bulkPut(sampleServiceOrders);

  // Sample transactions for dashboard metrics
  const sampleTransactions: Transaction[] = [
    {
      id: 'trx-001',
      invoice_no: 'INV-20260912-001',
      type: 'penjualan',
      customer_name: 'Rian (Teknisi Sebelah)',
      customer_phone: '082199001122',
      items: [
        {
          type: 'sparepart',
          id: 'part-oppo-a53-lcd-og',
          sku: 'LCD-OPPO-A53',
          name: 'LCD Oppo A53 / A33 2020 90Hz Original Equipment',
          qty: 1,
          unit_cost: 165000,
          unit_price: 225000, // harga teknisi
          total_price: 225000
        },
        {
          type: 'sparepart',
          id: 'part-lem-t7000-50ml',
          sku: 'LEM-T7000-50',
          name: 'Lem LCD T-7000 Hitam 50ml Zhanlida Original',
          qty: 1,
          unit_cost: 18000,
          unit_price: 28000,
          total_price: 28000
        }
      ],
      subtotal: 253000,
      discount: 3000,
      total_amount: 250000,
      total_cost: 183000,
      profit: 67000,
      payment_method: 'Tunai',
      cash_given: 300000,
      change: 50000,
      cashier_name: 'Faisal (Owner)',
      created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      is_synced: 0
    },
    {
      id: 'trx-002',
      invoice_no: 'INV-20260912-002',
      type: 'penjualan',
      customer_name: 'Rudi Hartono',
      customer_phone: '087811223344',
      items: [
        {
          type: 'sparepart',
          id: 'part-ip11-bat-rone',
          sku: 'BAT-IP11-RO',
          name: 'Baterai iPhone 11 R-One High Capacity 3110mAh',
          qty: 1,
          unit_cost: 145000,
          unit_price: 240000,
          total_price: 240000
        }
      ],
      subtotal: 240000,
      discount: 0,
      total_amount: 240000,
      total_cost: 145000,
      profit: 95000,
      payment_method: 'QRIS',
      cash_given: 240000,
      change: 0,
      cashier_name: 'Faisal (Owner)',
      created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      is_synced: 0
    }
  ];

  await db.transactions.bulkPut(sampleTransactions);

  // Initial stock movements log
  const sampleMovements: StockMovement[] = [
    {
      id: 'mov-001',
      sparepart_id: 'part-ip11-lcd-og',
      sparepart_sku: 'LCD-IP11-OG',
      sparepart_name: 'LCD iPhone 11 Original Equipment Crown Glass',
      type: 'masuk_supplier',
      qty: 10,
      prev_stock: 0,
      new_stock: 10,
      reference_no: 'PO-CROWN-8821',
      notes: 'Stok awal masuk dari supplier Crown Jakarta',
      created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
      is_synced: 0
    },
    {
      id: 'mov-002',
      sparepart_id: 'part-oppo-a53-lcd-og',
      sparepart_sku: 'LCD-OPPO-A53',
      sparepart_name: 'LCD Oppo A53 / A33 2020 90Hz Original Equipment',
      type: 'keluar_penjualan',
      qty: 1,
      prev_stock: 7,
      new_stock: 6,
      reference_no: 'INV-20260912-001',
      notes: 'Terjual ke teknisi Rian',
      created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      is_synced: 0
    }
  ];

  await db.stock_movements.bulkPut(sampleMovements);
}
