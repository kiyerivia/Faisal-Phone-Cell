# Faisal Phone Cell - Software Manajemen Stok Sparepart & Servisan HP (Windows Desktop)

Software kasir, manajemen stok sparepart smartphone semua tipe, dan pelacakan servisan HP dengan arsitektur **Offline-First** (berjalan 100% tanpa internet) dan opsi **Cloud Sync (Supabase)** untuk sinkronisasi antar perangkat (Komputer Windows + HP Android/iOS).

---

## 📱 Fitur-Fitur Utama

1. **Katalog Stok Sparepart Multi-Tipe HP**
   - Mendukung semua brand: *Apple iPhone, Samsung, Xiaomi / Redmi / POCO, Oppo, Realme, Vivo / iQOO, Infinix / Tecno / Itel, Asus, Huawei, dll.*
   - Kategori lengkap: *LCD & Touchscreen, Baterai, Flexible Board Cas, IC (Power, EMMC, CPU), Kamera, Backdoor/Casing, Speaker/Buzzer, Lem & Bahan Servis, Aksesoris*.
   - Filter cepat, pencarian instan, manajemen lokasi laci/rak part, harga modal, harga eceran, harga teknisi, dan cetak label rak.

2. **Modul Servisan HP (Service Tracker & Tanda Terima)**
   - Formulir penerimaan servisan (Data pelanggan, No WA, Tipe HP, Kerusakan, Sandi/Pola, Kelengkapan, Estimasi Biaya, DP).
   - Antrean status servisan: *Antrean, Pengecekan, Sedang Dikerjakan, Menunggu Sparepart, Selesai (Siap Ambil), Sudah Diambil, Dibatalkan*.
   - Alokasi sparepart otomatis (memotong stok saat unit diambil).
   - Cetak nota tanda terima servis & tombol kirim update status otomatis via WhatsApp.

3. **Kasir POS & Penjualan Cepat**
   - Transaksi penjualan sparepart dan jasa servis lepas.
   - Pilihan harga ecer vs harga khusus teknisi.
   - Tombol nominal uang cepat & kalkulator kembalian otomatis.
   - Cetak struk kasir thermal 58mm / 80mm.

4. **Restock Supplier & Mutasi Stok**
   - Catat pembelian masuk dari distributor / supplier.
   - Catat barang retur / part cacat untuk klaim garansi ke supplier.
   - Log histori mutasi stok lengkap.

5. **Laporan Finansial & Keuangan**
   - Laporan omset kotor, harga modal (HPP), laba bersih, margin profit, dan rata-rata nota.
   - Filter periode: Hari Ini, 7 Hari Terakhir, Bulan Ini, Semua Waktu.
   - Cetak ulang riwayat transaksi & Export laporan ke CSV / Excel.

6. **Offline-First & Cloud Sync (Multi-Device)**
   - Data tersimpan lokal di komputer dengan database berkecepatan tinggi tanpa perlu koneksi internet.
   - Dukungan Supabase Cloud (PostgreSQL) untuk auto-sync real-time ke HP dan komputer lain.
   - Fitur 1-Click Backup Database (.json) dan Restore.

---

## 🚀 Cara Menjalankan Software

### 1. Menjalankan di Mode Aplikasi Desktop (Windows)
```bash
# Jalankan Electron dev server
npm run electron:dev
```

### 2. Menjalankan di Mode Browser / Web Lokal
```bash
npm run dev
```
Buka browser di: `http://localhost:5173`

### 3. Membuat File Installer Windows (.exe)
```bash
npm run build:win
```
File installer `.exe` dan versi portable akan otomatis dibuat di folder: `release/`.

---

## ☁️ Cara Menghubungkan ke Cloud Supabase (Untuk HP / Multi-Device)
1. Buka [https://supabase.com](https://supabase.com) dan buat project baru (Gratis).
2. Buka menu **SQL Editor**, salin script SQL skema yang ada di menu **Pengaturan & Cloud** aplikasi ini, lalu klik **Run**.
3. Buka menu **Project Settings > API** di Supabase, salin:
   - **Project URL**
   - **anon / public Key**
4. Masukkan ke menu **Pengaturan & Cloud** di software Faisal Phone Cell, centang **Aktifkan Cloud Sync**, lalu klik **Simpan**.
5. Data otomatis tersinkronkan ke Cloud secara aman!
