import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { action, customerPhone, customerName, invoiceNo, totalAmount, dueAmount, supplierPhone, supplierName } =
      await request.json();

    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });
    const shopName = settings?.shopName || 'VENKATA LAKSHMI ELECTRICALS';

    let cleanPhone = (customerPhone || supplierPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    let messageText = '';

    if (action === 'bill') {
      messageText =
        `⚡ *${shopName}* ⚡\n\n` +
        `Dear *${customerName || 'Valued Customer'}*,\n\n` +
        `Thank you for your purchase! Here is your bill summary:\n\n` +
        `📄 *Invoice No:* ${invoiceNo || 'INV-2026'}\n` +
        `💰 *Total Amount:* ₹${totalAmount}\n` +
        `🔴 *Outstanding Due:* ₹${dueAmount}\n\n` +
        `Visit again for all your Electrical & Hardware needs!\n` +
        `📞 *Contact:* ${settings?.phone || '+91 98765 43210'}`;
    } else if (action === 'reminder') {
      messageText =
        `🔔 *PAYMENT REMINDER - ${shopName}* 🔔\n\n` +
        `Dear *${customerName}*,\n\n` +
        `This is a friendly reminder regarding your outstanding credit balance (Udhar):\n\n` +
        `🔴 *Current Outstanding:* ₹${dueAmount}\n\n` +
        `Kindly settle the due amount at your earliest convenience via Cash or UPI.\n\n` +
        `Thank you for your continued business!\n` +
        `📞 *Shop Contact:* ${settings?.phone || '+91 98765 43210'}`;
    } else if (action === 'reorder') {
      // Fetch low stock items
      const lowStock = await prisma.product.findMany({
        where: {
          stockQuantity: {
            lte: prisma.product.fields.minStockAlert,
          },
        },
      });

      const itemsList = lowStock.map((p) => `• ${p.name} (Current Stock: ${p.stockQuantity} ${p.unit})`).join('\n');

      messageText =
        `📦 *NEW STOCK REORDER REQUEST* 📦\n\n` +
        `To: *${supplierName || 'Distributor'}*\n` +
        `From: *${shopName}*\n\n` +
        `Please send quote / dispatch for low stock electrical items:\n\n` +
        `${itemsList || '• Polycab 1.5 Sqmm Wire\n• Anchor Switches'}\n\n` +
        `Kindly confirm availability. Thank you!`;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
      messageText,
      phone: cleanPhone,
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json({ error: 'Failed to generate WhatsApp payload' }, { status: 500 });
  }
}
