import { Transaction, ServiceOrder, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo } from './formatters';

export function printTransactionReceipt(transaction: Transaction, settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=450,height=650');
  if (!printWindow) {
    alert('Pop-up printer diblokir browser. Silakan izinkan pop-up.');
    return;
  }

  const itemsHtml = transaction.items
    .map(
      (item) => `
      <tr style="vertical-align: top;">
        <td style="padding: 3px 0; text-align: left; word-break: break-word;">
          <div style="font-weight: bold; color: #000; font-size: 11px;">${item.name}</div>
          <div style="font-size: 10px; color: #333;">${item.qty} x ${formatRupiah(item.unit_price)}</div>
        </td>
        <td style="padding: 3px 0; text-align: right; font-weight: bold; font-size: 11px; white-space: nowrap;">
          ${formatRupiah(item.total_price)}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Struk - ${transaction.invoice_no}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0;
            size: auto;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 11px;
            line-height: 1.35;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 72mm;
            margin: 0 auto;
            padding: 10px 12px 25px 12px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle { font-size: 10px; margin-top: 1px; color: #222; }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 1.5px 0;
          }
          .row-label {
            width: 38%;
            text-align: left;
            color: #333;
            font-size: 11px;
          }
          .row-value {
            width: 62%;
            text-align: right;
            font-size: 11px;
            word-break: break-all;
          }
          .total-row {
            font-size: 13px;
            font-weight: bold;
          }
          .footer {
            font-size: 9.5px;
            text-align: center;
            margin-top: 10px;
            color: #222;
            white-space: pre-line;
            line-height: 1.3;
          }
          @media print {
            body {
              width: 100%;
              max-width: 100%;
              padding: 6px 8px;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header Toko -->
        <div class="text-center">
          <div class="title">${settings.store_name}</div>
          <div class="subtitle">${settings.tagline}</div>
          <div class="subtitle">${settings.store_address}</div>
          <div class="subtitle">Telp/WA: ${settings.store_phone}</div>
        </div>

        <div class="divider"></div>

        <!-- Info Transaksi -->
        <table>
          <tr>
            <td class="row-label">No. Nota:</td>
            <td class="row-value bold">${transaction.invoice_no}</td>
          </tr>
          <tr>
            <td class="row-label">Tanggal:</td>
            <td class="row-value">${formatDateIndo(transaction.created_at)}</td>
          </tr>
          <tr>
            <td class="row-label">Pelanggan:</td>
            <td class="row-value">${transaction.customer_name || 'Umum'}</td>
          </tr>
          <tr>
            <td class="row-label">Kasir:</td>
            <td class="row-value">${transaction.cashier_name || 'Admin'}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <!-- Rincian Item -->
        <table>
          ${itemsHtml}
        </table>

        <div class="divider"></div>

        <!-- Rincian Pembayaran -->
        <table>
          <tr>
            <td class="row-label">Subtotal:</td>
            <td class="row-value">${formatRupiah(transaction.subtotal)}</td>
          </tr>
          ${
            transaction.discount > 0
              ? `<tr>
                  <td class="row-label">Diskon:</td>
                  <td class="row-value">-${formatRupiah(transaction.discount)}</td>
                </tr>`
              : ''
          }
          <tr class="total-row">
            <td style="padding: 4px 0; text-align: left;">TOTAL:</td>
            <td style="padding: 4px 0; text-align: right;">${formatRupiah(transaction.total_amount)}</td>
          </tr>
          <tr>
            <td class="row-label">Metode Bayar:</td>
            <td class="row-value bold">${transaction.payment_method}</td>
          </tr>
          <tr>
            <td class="row-label">Bayar:</td>
            <td class="row-value">${formatRupiah(transaction.cash_given)}</td>
          </tr>
          <tr>
            <td class="row-label">Kembalian:</td>
            <td class="row-value bold">${formatRupiah(transaction.change)}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <!-- Footer -->
        <div class="footer">
          ${settings.receipt_footer}
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printServiceReceipt(order: ServiceOrder, settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=480,height=700');
  if (!printWindow) {
    alert('Pop-up printer diblokir browser. Silakan izinkan pop-up.');
    return;
  }

  const partsHtml =
    order.parts_used.length > 0
      ? order.parts_used
          .map(
            (p) => `
        <tr style="font-size: 10.5px;">
          <td style="padding: 1.5px 0; text-align: left; word-break: break-word;">
            • ${p.name} (${p.qty}x)
          </td>
          <td style="padding: 1.5px 0; text-align: right; white-space: nowrap;">
            ${formatRupiah(p.sell_price * p.qty)}
          </td>
        </tr>
      `
          )
          .join('')
      : '<tr><td colspan="2" style="font-size: 10px; color: #555; padding: 2px 0;">- Tidak ada penggantian part -</td></tr>';

  const remaining = Math.max(0, order.final_cost - order.down_payment);

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Tanda Terima Servis - ${order.order_no}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0;
            size: auto;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 11px;
            line-height: 1.35;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 72mm;
            margin: 0 auto;
            padding: 10px 12px 25px 12px;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .title { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border: 1px solid #000;
            font-weight: bold;
            font-size: 10px;
            margin: 4px 0;
          }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 1.5px 0; }
          .row-label { width: 38%; text-align: left; color: #333; }
          .row-value { width: 62%; text-align: right; word-break: break-all; }
          .section-title { font-weight: bold; margin-top: 4px; text-decoration: underline; font-size: 11px; }
          .footer {
            font-size: 9.5px;
            margin-top: 10px;
            text-align: center;
            color: #222;
            line-height: 1.3;
          }
          @media print {
            body { width: 100%; max-width: 100%; padding: 6px 8px; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">${settings.store_name}</div>
          <div style="font-size: 10px; color: #333;">${settings.store_address}</div>
          <div style="font-size: 10px; color: #333;">WA: ${settings.store_phone}</div>
          <div class="badge">TANDA TERIMA SERVIS HP</div>
        </div>

        <div class="divider"></div>

        <table>
          <tr>
            <td class="row-label">No. Servis:</td>
            <td class="row-value bold" style="font-size: 12px;">${order.order_no}</td>
          </tr>
          <tr>
            <td class="row-label">Tgl Masuk:</td>
            <td class="row-value">${formatDateIndo(order.created_at)}</td>
          </tr>
          <tr>
            <td class="row-label">Pelanggan:</td>
            <td class="row-value bold">${order.customer_name}</td>
          </tr>
          <tr>
            <td class="row-label">No. HP/WA:</td>
            <td class="row-value">${order.customer_phone}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <table>
          <tr>
            <td class="row-label">Tipe HP:</td>
            <td class="row-value bold">${order.phone_brand} - ${order.phone_model}</td>
          </tr>
        </table>
        <div style="margin-top: 3px; font-size: 10.5px;">
          <span><b>Keluhan/Kerusakan:</b></span>
          <div style="padding-left: 4px; color: #222;">${order.problem}</div>
        </div>
        <table style="margin-top: 3px;">
          <tr>
            <td class="row-label">Kelengkapan:</td>
            <td class="row-value">${order.completeness || 'Batangan'}</td>
          </tr>
          <tr>
            <td class="row-label">Pola/PIN:</td>
            <td class="row-value bold">${order.password_pattern || 'Tidak Ada'}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <div class="section-title">Rincian Part & Biaya:</div>
        <table style="margin: 3px 0;">
          ${partsHtml}
          <tr style="font-size: 10.5px;">
            <td style="padding: 1.5px 0; text-align: left;">• Jasa Servis/Pasang</td>
            <td style="padding: 1.5px 0; text-align: right; white-space: nowrap;">${formatRupiah(order.service_fee)}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <table>
          <tr style="font-size: 12px; font-weight: bold;">
            <td class="row-label">Total Biaya:</td>
            <td class="row-value">${formatRupiah(order.final_cost)}</td>
          </tr>
          <tr>
            <td class="row-label">Uang Muka (DP):</td>
            <td class="row-value">${formatRupiah(order.down_payment)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 12px;">
            <td class="row-label">Sisa Bayar:</td>
            <td class="row-value">${formatRupiah(remaining)}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <div class="footer">
          * Simpan nota ini sebagai bukti sah pengambilan unit HP.<br>
          * Garansi servis 7 hari (syarat segel tidak rusak).<br>
          * Kerusakan jatuh/kena air membatalkan garansi.
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printA4Invoice(transaction: Transaction, settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Pop-up printer diblokir browser. Silakan izinkan pop-up.');
    return;
  }

  const itemsHtml = transaction.items
    .map(
      (item, idx) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">
          <div style="font-weight: 600;">${item.name}</div>
          ${item.sku ? `<div style="font-size: 11px; color: #64748b; font-family: monospace;">SKU: ${item.sku}</div>` : ''}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${item.qty}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatRupiah(item.unit_price)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: 600;">${formatRupiah(item.total_price)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Faktur Invoice - ${transaction.invoice_no}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { margin: 15mm; size: A4 portrait; }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 12px;
            color: #0f172a;
            background: #fff;
            padding: 24px;
            max-width: 210mm;
            margin: 0 auto;
          }
          .header-grid {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f766e;
            text-transform: uppercase;
          }
          .meta-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            gap: 20px;
          }
          .meta-card {
            flex: 1;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          table.invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 10px 8px;
            text-align: left;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            color: #334155;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 6px 8px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding: 0 40px;
            text-align: center;
          }
          .sig-line {
            width: 160px;
            border-bottom: 1px solid #000;
            margin-top: 60px;
          }
        </style>
      </head>
      <body>
        <div class="header-grid">
          <div>
            <div class="brand-title">${settings.store_name}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">${settings.tagline}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${settings.store_address}</div>
            <div style="font-size: 11px; color: #64748b;">Telp / WA: ${settings.store_phone}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 22px; font-weight: 800; color: #334155;">FAKTUR INVOICE</div>
            <div style="font-family: monospace; font-size: 13px; font-weight: bold; color: #0f766e; margin-top: 4px;">
              ${transaction.invoice_no}
            </div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
              DITUJUKAN KEPADA:
            </div>
            <div style="font-weight: 700; font-size: 13px;">${transaction.customer_name || 'Pelanggan Umum'}</div>
            <div style="color: #475569;">${transaction.customer_phone || '-'}</div>
          </div>
          <div class="meta-card">
            <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
              RINCIAN TRANSAKSI:
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Tanggal:</span>
              <span style="font-weight: 600;">${formatDateIndo(transaction.created_at)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Metode:</span>
              <span style="font-weight: 600;">${transaction.payment_method}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Kasir:</span>
              <span>${transaction.cashier_name || 'Admin'}</span>
            </div>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th>Deskripsi Barang / Jasa</th>
              <th style="width: 70px; text-align: center;">Jumlah</th>
              <th style="width: 130px; text-align: right;">Harga Satuan</th>
              <th style="width: 140px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td style="color: #64748b;">Subtotal:</td>
            <td style="text-align: right; font-weight: 600;">${formatRupiah(transaction.subtotal)}</td>
          </tr>
          ${
            transaction.discount > 0
              ? `<tr>
                  <td style="color: #e11d48;">Diskon:</td>
                  <td style="text-align: right; color: #e11d48; font-weight: 600;">-${formatRupiah(transaction.discount)}</td>
                </tr>`
              : ''
          }
          <tr style="border-top: 2px solid #0f766e; font-size: 14px; font-weight: 800;">
            <td style="padding-top: 8px;">TOTAL AKHIR:</td>
            <td style="padding-top: 8px; text-align: right; color: #0f766e;">${formatRupiah(transaction.total_amount)}</td>
          </tr>
        </table>

        <div class="signatures">
          <div>
            <div style="color: #64748b;">Penerima / Pelanggan,</div>
            <div class="sig-line"></div>
            <div style="margin-top: 4px; font-weight: 600;">( ${transaction.customer_name || 'Pelanggan'} )</div>
          </div>
          <div>
            <div style="color: #64748b;">Hormat Kami,</div>
            <div class="sig-line"></div>
            <div style="margin-top: 4px; font-weight: 600;">( ${settings.store_name} )</div>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #64748b; text-align: center;">
          ${settings.receipt_footer}
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
