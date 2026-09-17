import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LedgerType, PaymentMethod } from '@prisma/client';
import { sendCreditLimitExceededAlert } from '@/lib/mailer';
import { sendUltraMsgWhatsApp } from '@/lib/ultramsg';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount = 0,
      tax = 0,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMethod = 'CASH',
      invoiceDate,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart items cannot be empty' }, { status: 400 });
    }

    const customDate = invoiceDate ? new Date(invoiceDate) : new Date();

    // Generate Guaranteed Unique Invoice Number
    const year = customDate.getFullYear();
    const prefix = `INV-${year}-`;

    const latestInvoice = await prisma.invoice.findFirst({
      where: { invoiceNo: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNo: true },
    });

    let nextNum = 1;
    if (latestInvoice && latestInvoice.invoiceNo) {
      const parts = latestInvoice.invoiceNo.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }

    let invoiceNo = `${prefix}${nextNum.toString().padStart(4, '0')}`;
    let checkExists = await prisma.invoice.findUnique({ where: { invoiceNo } });
    while (checkExists) {
      nextNum++;
      invoiceNo = `${prefix}${nextNum.toString().padStart(4, '0')}`;
      checkExists = await prisma.invoice.findUnique({ where: { invoiceNo } });
    }

    // Perform database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Collect item variant / product IDs
      const itemVariantIds = items
        .map((it: any) => it.variantId || it.id)
        .filter((id: any) => typeof id === 'string' && id.trim().length > 0);

      const dbVariants = await tx.productVariant.findMany({
        where: { id: { in: itemVariantIds } },
        include: { product: true, rack: true },
      });
      const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: customerId || null,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || 'N/A',
          subtotal: parseFloat(subtotal),
          discount: parseFloat(discount),
          tax: parseFloat(tax),
          totalAmount: parseFloat(totalAmount),
          paidAmount: parseFloat(paidAmount),
          dueAmount: parseFloat(dueAmount),
          paymentMethod: paymentMethod as PaymentMethod,
          status: 'COMPLETED',
          createdAt: customDate,
          items: {
            create: items.map((item: any) => {
              const vId = item.variantId || item.id;
              const dbVariant = variantMap.get(vId);
              const pId = dbVariant ? dbVariant.productId : (item.productId || null);

              return {
                productId: pId,
                variantId: dbVariant ? dbVariant.id : null,
                productName: item.name || (dbVariant ? `${dbVariant.product.name} (${dbVariant.variantName})` : 'Item'),
                unit: item.unit || dbVariant?.product.unit || 'pcs',
                price: parseFloat(item.sellingPrice),
                quantity: parseFloat(item.quantity),
                total: parseFloat(item.sellingPrice) * parseFloat(item.quantity),
                rackLocation: dbVariant?.rack
                  ? `${dbVariant.rack.rackName} ${dbVariant.rack.shelfCode}`
                  : (item.rackLocation || 'Default'),
                createdAt: customDate,
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Deduct variant stock
      for (const item of items) {
        const vId = item.variantId || item.id;
        const dbVariant = variantMap.get(vId);

        if (dbVariant) {
          try {
            await tx.productVariant.update({
              where: { id: dbVariant.id },
              data: {
                stockQuantity: {
                  decrement: parseFloat(item.quantity),
                },
              },
            });
          } catch (err) {
            console.warn(`Skipping variant stock deduction for: ${dbVariant.id}`);
          }
        }
      }

      // 3. Customer Udhar & Ledger Update
      let updatedCustomer = null;
      if (customerId) {
        const cust = await tx.customer.findUnique({ where: { id: customerId } });
        if (cust) {
          const newOutstanding = cust.outstanding + parseFloat(dueAmount);
          const newTotalPurchases = cust.totalPurchases + parseFloat(totalAmount);
          const newTotalPaid = cust.totalPaid + parseFloat(paidAmount);

          updatedCustomer = await tx.customer.update({
            where: { id: customerId },
            data: {
              outstanding: newOutstanding,
              totalPurchases: newTotalPurchases,
              totalPaid: newTotalPaid,
            },
          });

          await tx.customerLedger.create({
            data: {
              customerId,
              type: LedgerType.SALE,
              amount: parseFloat(totalAmount),
              balance: newOutstanding,
              notes: `Items added to Invoice #${invoice.invoiceNo} (${paymentMethod} Sale: Paid ₹${paidAmount}, Due ₹${dueAmount})`,
              invoiceId: invoice.id,
              createdAt: customDate,
            },
          });

          if (parseFloat(paidAmount) > 0) {
            await tx.customerLedger.create({
              data: {
                customerId,
                type: LedgerType.PAYMENT,
                amount: parseFloat(paidAmount),
                balance: newOutstanding,
                notes: `Payment for Invoice #${invoice.invoiceNo} via ${paymentMethod}`,
                invoiceId: invoice.id,
                createdAt: customDate,
              },
            });
          }
        }
      }

      return { invoice, customer: updatedCustomer };
    });

    let creditLimitExceededAlertSent = false;
    if (result.customer && result.customer.outstanding > result.customer.creditLimit) {
      creditLimitExceededAlertSent = true;
      sendCreditLimitExceededAlert({
        customerName: result.customer.name,
        customerPhone: result.customer.phone,
        customerEmail: result.customer.email || undefined,
        creditLimit: result.customer.creditLimit,
        currentOutstanding: result.customer.outstanding,
        invoiceNo: result.invoice.invoiceNo,
      }).catch((e) => console.error('Background SMTP Alert error:', e));
    }

    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });

    // Auto Dispatch WhatsApp via UltraMsg
    let ultraMsgSent = false;
    let ultraMsgError = null;

    if (settings?.enableWhatsAppAutoSend !== false && customerPhone && customerPhone !== 'N/A') {
      let cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

      if (cleanPhone) {
        const itemsListStr = result.invoice.items
          .map((it: any) => `• *${it.productName}*\n  Qty: ${it.quantity} ${it.unit} × ₹${it.price} = ₹${it.total}`)
          .join('\n');

        const totAmt = result.invoice.totalAmount;
        const pAmt = result.invoice.paidAmount;
        const dAmt = result.invoice.dueAmount;
        const statusBadge = dAmt <= 0 ? '🟢 PAID' : `🔴 PENDING (₹${dAmt})`;

        const messageText =
          `⚡ *${settings?.shopName || 'VENKATA LAKSHMI ELECTRICALS'}* ⚡\n\n` +
          `Dear *${customerName || 'Valued Customer'}*,\n\n` +
          `Thank you for your purchase! Here is your bill summary:\n\n` +
          `📄 *Invoice No:* ${result.invoice.invoiceNo}\n\n` +
          `🛒 *PURCHASED ITEMS:*\n${itemsListStr}\n\n` +
          `💰 *Total Bill Amount:* ₹${totAmt}\n` +
          `💵 *Amount Paid:* ₹${pAmt}\n` +
          `📌 *Bill Status:* ${statusBadge}\n\n` +
          `👤 *Proprietor:* Konnla Kannaya Reddy\n` +
          `📞 *Shop Contact:* ${settings?.phone || '+91 98765 43210'}`;

        const uRes = await sendUltraMsgWhatsApp(cleanPhone, messageText);
        if (uRes.success) {
          ultraMsgSent = true;
        } else {
          ultraMsgError = uRes.error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      customer: result.customer,
      creditLimitExceededAlertSent,
      ultraMsgSent,
      ultraMsgError,
      settings,
    });
  } catch (error: any) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: error.message || 'Billing process failed' }, { status: 500 });
  }
}
