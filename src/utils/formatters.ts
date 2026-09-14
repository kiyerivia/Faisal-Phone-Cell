// Utility functions for formatting Indonesian currency, dates, phone numbers, and codes

export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDateIndo(dateStr?: string | Date): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

export function formatDateOnly(dateStr?: string | Date): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

export function generateInvoiceNo(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}${day}-${randomSuffix}`;
}

export function generateServiceOrderNo(existingCount: number = 0): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const sequence = String(existingCount + 1).padStart(4, '0');
  return `FPC-${year}${month}-${sequence}`;
}

export function cleanPhoneForWA(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function getWhatsAppServiceMsg(
  customerName: string,
  orderNo: string,
  phoneModel: string,
  status: string,
  totalCost: number,
  downPayment: number,
  storeName: string
): string {
  const remaining = Math.max(0, totalCost - downPayment);
  let statusIndo = status;
  if (status.includes('Selesai')) {
    statusIndo = '✅ *SELESAI & SIAP DIAMBIL*';
  } else if (status.includes('Sedang Dikerjakan')) {
    statusIndo = '⚙️ *SEDANG DIKERJAKAN TEKNISI*';
  } else if (status.includes('Menunggu Sparepart')) {
    statusIndo = '📦 *MENUNGGU KEDATANGAN SPAREPART*';
  }

  return encodeURIComponent(
    `Halo Kak *${customerName}*,\n\n` +
    `Berikut update pengerjaan servis HP dari *${storeName}*:\n` +
    `📋 *No. Nota:* ${orderNo}\n` +
    `📱 *Tipe HP:* ${phoneModel}\n` +
    `📌 *Status:* ${statusIndo}\n` +
    `💰 *Total Biaya:* ${formatRupiah(totalCost)}\n` +
    `💵 *Uang Muka (DP):* ${formatRupiah(downPayment)}\n` +
    `🧾 *Sisa Pembayaran:* ${formatRupiah(remaining)}\n\n` +
    (status.includes('Selesai')
      ? `Unit sudah selesai dites dan siap diambil di toko kami ya kak. Jangan lupa bawa nota tanda terima.\n\n`
      : `Mohon ditunggu proses pengerjaannya ya kak.\n\n`) +
    `Terima kasih! 🙏`
  );
}
