import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db/database';
import { StoreSettings } from '../types';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  unsyncedCount: number;
  message: string;
  error?: string | null;
}

type SyncListener = (status: SyncStatus) => void;

class SyncService {
  private supabase: SupabaseClient | null = null;
  private listeners: Set<SyncListener> = new Set();
  private timer: any = null;
  private status: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: null,
    unsyncedCount: 0,
    message: 'Siap',
    error: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateStatus({ isOnline: true, message: 'Online' });
        this.syncNow();
      });
      window.addEventListener('offline', () => {
        this.updateStatus({ isOnline: false, message: 'Offline (Mode Lokal Aktif)' });
      });
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.status }));
  }

  private updateStatus(partial: Partial<SyncStatus>) {
    this.status = { ...this.status, ...partial };
    this.notify();
  }

  public async initClient(settings?: StoreSettings) {
    if (!settings) {
      settings = await db.settings.get('default_store_settings');
    }

    if (settings?.supabase_url && settings?.supabase_anon_key && settings.sync_enabled) {
      try {
        this.supabase = createClient(settings.supabase_url, settings.supabase_anon_key, {
          auth: { persistSession: false }
        });
        this.startAutoSync(settings.auto_sync_interval_mins || 5);
      } catch (err: any) {
        console.error('Supabase init error:', err);
        this.updateStatus({ error: 'Konfigurasi Cloud Supabase tidak valid' });
      }
    } else {
      this.supabase = null;
      this.stopAutoSync();
    }
    await this.countUnsynced();
  }

  public async countUnsynced(): Promise<number> {
    try {
      const unsyncedParts = await db.spareparts.where('is_synced').equals(0).count();
      const unsyncedOrders = await db.service_orders.where('is_synced').equals(0).count();
      const unsyncedTrx = await db.transactions.where('is_synced').equals(0).count();
      const unsyncedMov = await db.stock_movements.where('is_synced').equals(0).count();

      const total = unsyncedParts + unsyncedOrders + unsyncedTrx + unsyncedMov;
      this.updateStatus({ unsyncedCount: total });
      return total;
    } catch {
      return 0;
    }
  }

  public async syncNow(): Promise<{ success: boolean; message: string }> {
    if (this.status.isSyncing) return { success: false, message: 'Sinkronisasi sedang berjalan' };
    if (!navigator.onLine) {
      this.updateStatus({ isOnline: false, message: 'Tidak ada koneksi internet' });
      return { success: false, message: 'Tidak ada koneksi internet' };
    }

    const settings = await db.settings.get('default_store_settings');
    if (!settings?.supabase_url || !settings?.supabase_anon_key || !settings.sync_enabled) {
      const unsynced = await this.countUnsynced();
      return { 
        success: true, 
        message: `Mode Offline Lokal aktif (${unsynced} data tersimpan aman di disk komputer). Hubungkan Supabase di Pengaturan untuk sync ke Cloud.` 
      };
    }

    if (!this.supabase) {
      await this.initClient(settings);
    }

    if (!this.supabase) {
      return { success: false, message: 'Cloud Supabase belum terkonfigurasi' };
    }

    this.updateStatus({ isSyncing: true, message: 'Sedang menyinkronkan data ke cloud...', error: null });

    try {
      // 1. Upload unsynced spareparts
      const dirtyParts = await db.spareparts.where('is_synced').equals(0).toArray();
      if (dirtyParts.length > 0) {
        const { error: partErr } = await this.supabase
          .from('spareparts')
          .upsert(dirtyParts.map((p) => ({ ...p, is_synced: 1 })), { onConflict: 'id' });
        
        if (partErr) throw new Error(`Gagal sync sparepart: ${partErr.message}`);
        await Promise.all(dirtyParts.map((p) => db.spareparts.update(p.id, { is_synced: 1 })));
      }

      // 2. Upload unsynced service orders
      const dirtyOrders = await db.service_orders.where('is_synced').equals(0).toArray();
      if (dirtyOrders.length > 0) {
        const { error: orderErr } = await this.supabase
          .from('service_orders')
          .upsert(dirtyOrders.map((o) => ({ ...o, is_synced: 1 })), { onConflict: 'id' });

        if (orderErr) throw new Error(`Gagal sync servisan: ${orderErr.message}`);
        await Promise.all(dirtyOrders.map((o) => db.service_orders.update(o.id, { is_synced: 1 })));
      }

      // 3. Upload unsynced transactions
      const dirtyTrx = await db.transactions.where('is_synced').equals(0).toArray();
      if (dirtyTrx.length > 0) {
        const { error: trxErr } = await this.supabase
          .from('transactions')
          .upsert(dirtyTrx.map((t) => ({ ...t, is_synced: 1 })), { onConflict: 'id' });

        if (trxErr) throw new Error(`Gagal sync transaksi: ${trxErr.message}`);
        await Promise.all(dirtyTrx.map((t) => db.transactions.update(t.id, { is_synced: 1 })));
      }

      // 4. Upload stock movements
      const dirtyMov = await db.stock_movements.where('is_synced').equals(0).toArray();
      if (dirtyMov.length > 0) {
        const { error: movErr } = await this.supabase
          .from('stock_movements')
          .upsert(dirtyMov.map((m) => ({ ...m, is_synced: 1 })), { onConflict: 'id' });

        if (movErr) throw new Error(`Gagal sync pergerakan stok: ${movErr.message}`);
        await Promise.all(dirtyMov.map((m) => db.stock_movements.update(m.id, { is_synced: 1 })));
      }

      const nowStr = new Date().toISOString();
      if (settings) {
        settings.last_sync_time = nowStr;
        await db.settings.put(settings);
      }

      this.updateStatus({
        isSyncing: false,
        lastSyncTime: nowStr,
        unsyncedCount: 0,
        message: 'Data berhasil tersinkronkan ke Cloud!',
        error: null
      });

      return { success: true, message: 'Semua data sukses disinkronkan ke Cloud!' };
    } catch (err: any) {
      console.error('Sync failed:', err);
      this.updateStatus({
        isSyncing: false,
        message: 'Sinkronisasi gagal',
        error: err.message || 'Terjadi kesalahan koneksi cloud'
      });
      await this.countUnsynced();
      return { success: false, message: err.message || 'Sinkronisasi gagal' };
    }
  }

  public startAutoSync(minutes: number) {
    this.stopAutoSync();
    const intervalMs = Math.max(1, minutes) * 60 * 1000;
    this.timer = setInterval(() => {
      this.syncNow();
    }, intervalMs);
  }

  public stopAutoSync() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const syncService = new SyncService();
