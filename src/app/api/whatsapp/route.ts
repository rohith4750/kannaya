import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendUltraMsgWhatsApp } from '@/lib/ultramsg';

export async function POST(request: Request) {
  try {
    const {
      action,
      customerPhone,
      customerName,
      invoiceNo,
      totalAmount,
      paidAmount,
      dueAmount,
      customerOutstanding,
      items,
      supplierPhone,
      supplierName,
      sendDirectly = true,
    } = await request.json();

    const settings = (await prisma.shopSettings.findFirst({ where: { id: 'default' } })) as any;
    const shopName = settings?.shopName || 'VENKATA LAKSHMI ELECTRICALS';

    let cleanPhone = (customerPhone || supplierPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    let messageText = '';

    if (action === 'bill' || action === 'credit') {
      let itemsListStr = '';
      if (items && Array.isArray(items) && items.length > 0) {
        itemsListStr = items
          .map((it: any) => {
            const qty = it.quantity || 1;
            const unit = it.unit || 'pcs';
            const price = it.price !== undefined ? parseFloat(it.price) : parseFloat(it.sellingPrice || 0);
            const itemTotal = it.total !== undefined ? parseFloat(it.total) : qty * price;
            const name = it.productName || it.name || 'Item';
            return `• *${name}*\n  Qty: ${qty} ${unit} × ₹${price} = ₹${itemTotal}`;
          })
          .join('\n');
      }

      const totAmt = totalAmount !== undefined ? parseFloat(totalAmount) : 0;
      const dAmt = dueAmount !== undefined ? parseFloat(dueAmount) : 0;
      const pAmt = paidAmount !== undefined ? parseFloat(paidAmount) : Math.max(0, totAmt - dAmt);
      const statusBadge = dAmt <= 0 ? '🟢 PAID' : `🔴 PENDING (₹${dAmt})`;

      const itemsSection = itemsListStr ? `🛒 *PURCHASED ITEMS:*\n${itemsListStr}\n\n` : '';

      messageText =
        `⚡ *${shopName}* ⚡\n\n` +
        `Dear *${customerName || 'Valued Customer'}*,\n\n` +
        `Thank you for your purchase! Here is your bill summary:\n\n` +
        `📄 *Invoice No:* ${invoiceNo || 'INV-2026'}\n\n` +
        itemsSection +
        `💰 *Total Bill Amount:* ₹${totAmt}\n` +
        `💵 *Amount Paid:* ₹${pAmt}\n` +
        `📌 *Bill Status:* ${statusBadge}\n\n` +
        `👤 *Proprietor:* Konala Kannaya Reddy\n` +
        `📞 *Shop Contact:* ${settings?.phone || '+91 98765 43210'}`;
    } else if (action === 'payment_received') {
      const pAmt = paidAmount !== undefined ? parseFloat(paidAmount) : 0;
      const remBal = dueAmount !== undefined ? parseFloat(dueAmount) : (customerOutstanding !== undefined ? parseFloat(customerOutstanding) : 0);
      const statusBadge = remBal <= 0 ? '🟢 PAID' : `🔴 PENDING (₹${remBal})`;

      messageText =
        `💳 *PAYMENT RECEIPT - ${shopName}* 💳\n\n` +
        `Dear *${customerName || 'Valued Customer'}*,\n\n` +
        `We have received your payment:\n\n` +
        `💵 *Payment Amount Received:* ₹${pAmt}\n` +
        `📌 *Bill Status:* ${statusBadge}\n\n` +
        `👤 *Proprietor:* Konnla Kannaya Reddy\n` +
        `📞 *Shop Contact:* ${settings?.phone || '+91 98765 43210'}`;
    } else if (action === 'reminder') {
      messageText =
        `🔔 *PAYMENT REMINDER - ${shopName}* 🔔\n\n` +
        `Dear *${customerName}*,\n\n` +
        `This is a friendly reminder regarding your pending bill balance:\n\n` +
        `🔴 *Pending Amount:* ₹${dueAmount || customerOutstanding || 0}\n\n` +
        `Kindly settle the due amount at your earliest convenience via Cash or UPI.\n\n` +
        `👤 *Proprietor:* Konnla Kannaya Reddy\n` +
        `📞 *Shop Contact:* ${settings?.phone || '+91 98765 43210'}`;
    } else if (action === 'reorder' || action === 'purchase_order') {
      let itemsListStr = '';

      if (items && Array.isArray(items) && items.length > 0) {
        itemsListStr = items
          .map((it: any) => {
            const qty = it.quantity || it.reorderQty || 1;
            const unit = it.unit || 'pcs';
            const name = it.productName || it.name || 'Item';
            return `• *${name}* — Qty: ${qty} ${unit}`;
          })
          .join('\n');
      } else {
        const allVariants = await (prisma as any).productVariant.findMany({
          include: { product: true },
        });
        const lowStock = allVariants.filter((v: any) => v.stockQuantity <= v.minStockAlert);

        itemsListStr = lowStock
          .map((v: any) => {
            const qty = Math.max(10, ((v.minStockAlert || 5) * 2) - v.stockQuantity);
            return `• *${v.product.name} (${v.variantName})* — Qty: ${qty} ${v.product.unit}`;
          })
          .join('\n');
      }

      messageText =
        `📦 *NEW STOCK REORDER / PURCHASE ORDER* 📦\n\n` +
        `To Supplier: *${supplierName || 'Distributor'}*\n` +
        `From Shop: *${shopName}*\n\n` +
        `Please accept our purchase order for the following products:\n\n` +
        `${itemsListStr || '• Finolex Wire (1.5 SQMM) — 10 Coils\n• Havells LED Bulb (9W) — 50 Pcs'}\n\n` +
        `Kindly confirm stock availability & dispatch schedule.\n\n` +
        `👤 *Proprietor:* Konnla Kannaya Reddy\n` +
        `📞 *Shop Contact:* ${settings?.phone || '+91 98765 43210'}`;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    // Dispatch: UltraMsg API Instance
    let ultraMsgSent = false;
    let ultraMsgError = null;

    if (cleanPhone && settings?.enableWhatsAppAutoSend !== false) {
      const uRes = await sendUltraMsgWhatsApp(cleanPhone, messageText);
      if (uRes.success) {
        ultraMsgSent = true;
      } else {
        ultraMsgError = uRes.error;
      }
    }

    return NextResponse.json({
      success: true,
      ultraMsgSent,
      ultraMsgError,
      whatsappUrl,
      messageText,
      phone: cleanPhone,
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json({ error: 'Failed to generate WhatsApp payload' }, { status: 500 });
  }
}
