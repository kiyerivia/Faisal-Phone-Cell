# Rencana Pengembangan Software "Faisal Phone Cell" (Windows Desktop & Multi-Device)

Aplikasi Desktop Windows **Faisal Phone Cell** dirancang khusus untuk toko servis handphone dan distributor sparepart. Software ini mengusung arsitektur **Offline-First dengan Cloud Sync (Supabase)** sehingga dapat berjalan 100% tanpa internet di komputer kasir toko, namun data otomatis tersinkronisasi ke Cloud saat online dan dapat diakses dari perangkat lain (HP / Laptop).

---

## Fitur Utama Software

1. **Katalog & Manajemen Stok Sparepart Multi-Tipe HP**
   * Filter cepat berdasarkan Brand HP (*Apple iPhone, Samsung, Xiaomi/Redmi, Oppo, Realme, Vivo, Infinix/Tecno, Asus, dll.*).
   * Kategori sparepart lengkap: *LCD & Touchscreen, Baterai, Flexible Board Cas, IC Power/EMMC/CPU, Kamera, Housing/Backdoor, Speaker/Buzzer, Lem & Alat Servis, Aksesoris*.
   * Manajemen Stok, Batas Minimum Stok (Low Stock Alert), Harga Modal/Beli, Harga Jual Ecer & Teknisi, serta **Lokasi Rak/Laci Part** (mempermudah teknisi mencari part).

2. **Modul Manajemen Servisan HP (Service Order & Tracker)**
   * Form Servis Masuk: Nama Pelanggan, No WhatsApp, Tipe HP, Kerusakan, Password/Pola Kunci, Estimasi Biaya, DP (Uang Muka).
   * Status Servisan: *Antrean, Sedang Dikerjakan, Menunggu Sparepart, Selesai (Siap Ambil), Batal, Sudah Diambil*.
   * Integrasi Stok Sparepart: Penggunaan part saat servis langsung memotong stok di toko.
   * Cetak Nota Tanda Terima Servis & Tombol Kirim Update Status via WhatsApp (Click-to-Chat).

3. **Kasir / Point of Sale (POS) & Penjualan**
   * Transaksi penjualan sparepart langsung dan jasa servis.
   * Cetak struk kasir thermal (58mm / 80mm) dan invoice PDF.

4. **Stok Masuk (Restock Supplier) & Penyesuaian Stok (Retur/Part Cacat)**
   * Catatan pembelian dari supplier untuk menambah stok dan riwayat harga beli.
   * Manajemen part rusak/cacat untuk tracking komplain ke supplier.

5. **Laporan & Dashboard Finansial**
   * Rekap Omset Penjualan, Pendapatan Jasa Servis, Keuntungan Bersih (Laba Kotor & Bersih), serta Total Nilai Aset Stok Toko.
   * Ekspor data ke Excel / CSV & Backup Database.

6. **Offline-First + Cloud Sync (Supabase)**
   * Berjalan 100% offline di Windows dengan penyimpanan lokal cepat.
   * Pengaturan Cloud Sync ke Supabase (cukup masukkan URL & API Key).
   * Indikator Online/Offline real-time dan sinkronisasi 2 arah otomatis.

7. **Windows Installer & Executable (.exe)**
   * Dikemas menggunakan **Electron** & **Vite + React + Tailwind CSS + Lucide Icons**.
   * Script build otomatis untuk menghasilkan file instalasi Windows (`.exe` installer & portable).

---

## User Review Required

> [!IMPORTANT]
> Apakah ada kategori sparepart khusus atau format penomoran nota servis tertentu yang ingin disesuaikan dengan kebiasaan di konter Anda? Default penomoran: `FPC-YYYYMMDD-XXXX`.

---

## Proposed Changes

### 1. Inisialisasi Project & Dependencies
- Setup Vite + React + TypeScript + TailwindCSS + Lucide Icons.
- Setup Electron main process (`electron/main.ts`, `electron/preload.ts`).
- Setup `electron-builder` untuk build Windows `.exe`.

### 2. Database Lokal & Sinkronisasi Cloud
- `src/db/database.ts`: Penyimpanan lokal offline-first menggunakan Dexie.js (IndexedDB wrapper berkecepatan tinggi) dengan skema tabel lengkap:
  - `spareparts` (id, sku, brand, model_hp, category, name, stock, min_stock, cost_price, sell_price, technician_price, location, updated_at, is_synced)
  - `service_orders` (id, order_no, customer_name, customer_phone, phone_model, problem, password_pattern, status, cost_estimate, down_payment, final_cost, parts_used, created_at, updated_at, is_synced)
  - `transactions` (id, invoice_no, type, items, total_amount, payment_method, cashier, date, is_synced)
  - `stock_history` (id, sparepart_id, type, qty, previous_stock, new_stock, notes, date, is_synced)
  - `suppliers` (id, name, phone, address, notes)
  - `settings` (app_name, address, phone, receipt_footer, supabase_url, supabase_anon_key, sync_interval)
- `src/services/syncService.ts`: Modul sinkronisasi offline-to-cloud dengan Supabase client, mendeteksi perubahan lokal dan menyinkronkan saat online.

### 3. Tampilan & Antarmuka Premium (UI/UX)
- `src/components/layout/Navbar.tsx` & `Sidebar.tsx`: Navigasi responsif dengan status koneksi (Offline / Online / Syncing), Dark/Light mode, dan notifikasi stok menipis.
- `src/pages/Dashboard.tsx`: Ringkasan omset, profit, servisan aktif, dan alert stok sparepart.
- `src/pages/Spareparts.tsx`: Katalog sparepart interaktif dengan filter Brand HP, kategori, pencarian kilat, modal tambah/edit part, barcode tag generator.
- `src/pages/ServiceOrders.tsx`: Manajemen servisan HP (Kanban / Tabel board), cetak nota servis thermal/A4, integrasi WhatsApp.
- `src/pages/POS.tsx`: Kasir cepat untuk penjualan sparepart & servis, keranjang belanja, kalkulator kembalian, cetak struk.
- `src/pages/StockManagement.tsx`: Modul restock supplier dan catat barang retur/rusak.
- `src/pages/Reports.tsx`: Laporan keuangan laba rugi, riwayat transaksi, dan ekspor data.
- `src/pages/Settings.tsx`: Konfigurasi toko, Cloud Sync Supabase, Backup/Restore data JSON/SQL.

### 4. Modul Print Nota & Barcode
- `src/utils/printReceipt.ts`: Generator layout cetak thermal 58mm/80mm untuk nota kasir dan tanda terima servis HP.

### 5. Packaging Windows Executable (.exe)
- Konfigurasi `electron-builder.json` untuk output Windows `.exe`.
- Script build Windows di `package.json`.

---

## Verification Plan

### Automated / Build Verification
- Jalankan `npm run build` untuk memverifikasi TypeScript dan bundling tanpa error.
- Jalankan `npm run dev` untuk memastikan aplikasi desktop dan web berjalan mulus.
- Test packaging Electron untuk memastikan file `.exe` berhasil digenerate.

### Manual Verification
- Uji input sparepart untuk berbagai tipe HP (iPhone, Samsung, Xiaomi, dll.).
- Uji alur penerimaan servisan HP -> pengerjaan -> selesai -> potong stok otomatis -> cetak nota.
- Uji transaksi kasir dan kalkulasi omset/laba.
- Uji mode Offline (matikan koneksi) -> data tetap tersimpan -> nyalakan koneksi -> uji sinkronisasi Cloud.
- Uji Backup dan Restore database lokal.
