import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LedgerType, PaymentMethod } from '@prisma/client';

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
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart items cannot be empty' }, { status: 400 });
    }

    // Generate Invoice Number
    const count = await prisma.invoice.count();
    const invoiceNo = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    // Perform database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
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
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              productName: item.name,
              unit: item.unit || 'pcs',
              price: parseFloat(item.sellingPrice),
              quantity: parseFloat(item.quantity),
              total: parseFloat(item.sellingPrice) * parseFloat(item.quantity),
              rackLocation: item.rack ? `${item.rack.rackName} ${item.rack.shelfCode}` : 'Default',
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Deduct product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stockQuantity: {
              decrement: parseFloat(item.quantity),
            },
          },
        });
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

          // Ledger Entry for Sale
          await tx.customerLedger.create({
            data: {
              customerId,
              type: LedgerType.SALE,
              amount: parseFloat(totalAmount),
              balance: newOutstanding,
              notes: `Bill ${invoiceNo} (${paymentMethod} Sale: Paid ₹${paidAmount}, Due ₹${dueAmount})`,
              invoiceId: invoice.id,
            },
          });

          // Ledger Entry for Payment if paidAmount > 0
          if (parseFloat(paidAmount) > 0) {
            await tx.customerLedger.create({
              data: {
                customerId,
                type: LedgerType.PAYMENT,
                amount: parseFloat(paidAmount),
                balance: newOutstanding,
                notes: `Payment for bill ${invoiceNo} via ${paymentMethod}`,
                invoiceId: invoice.id,
              },
            });
          }
        }
      }

      return { invoice, customer: updatedCustomer };
    });

    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      customer: result.customer,
      settings,
    });
  } catch (error: any) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: error.message || 'Billing process failed' }, { status: 500 });
  }
}
