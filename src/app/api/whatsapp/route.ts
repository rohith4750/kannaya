import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppGatewayMessage, getWhatsAppGatewayState } from '@/lib/whatsapp-gateway';
import { sendUltraMsgWhatsApp } from '@/lib/ultramsg';

export async function POST(request: Request) {
  try {
    const {
      action,
      customerPhone,
      customerName,
      invoiceNo,
      totalAmount,
      dueAmount,
      supplierPhone,
      supplierName,
      sendDirectly = true,
    } = await request.json();

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
      const allVariants = await prisma.productVariant.findMany({
        include: { product: true },
      });
      const lowStock = allVariants.filter((v) => v.stockQuantity <= v.minStockAlert);

      const itemsList = lowStock
        .map((v) => `• ${v.product.name} (${v.variantName}) - Stock: ${v.stockQuantity} ${v.product.unit}`)
        .join('\n');

      messageText =
        `📦 *NEW STOCK REORDER REQUEST* 📦\n\n` +
        `To: *${supplierName || 'Distributor'}*\n` +
        `From: *${shopName}*\n\n` +
        `Please send quote / dispatch for low stock electrical items:\n\n` +
        `${itemsList || '• Finolex Wire (1.5 SQMM)\n• Havells LED Bulb (9W)'}\n\n` +
        `Kindly confirm availability. Thank you!`;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    // Primary Dispatch: UltraMsg API Instance (instance191882)
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

    // Secondary Fallback: Self-hosted Baileys Gateway
    const gatewayState = getWhatsAppGatewayState();
    let gatewaySent = false;
    let gatewayError = null;

    if (!ultraMsgSent && gatewayState.status === 'CONNECTED' && cleanPhone) {
      const sendRes = await sendWhatsAppGatewayMessage(cleanPhone, messageText);
      if (sendRes.success) {
        gatewaySent = true;
      } else {
        gatewayError = sendRes.error;
      }
    }

    return NextResponse.json({
      success: true,
      ultraMsgSent,
      ultraMsgError,
      gatewaySent,
      gatewayError,
      whatsappUrl,
      messageText,
      phone: cleanPhone,
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json({ error: 'Failed to generate WhatsApp payload' }, { status: 500 });
  }
}


