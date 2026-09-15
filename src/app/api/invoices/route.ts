import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';

    let whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { invoiceNo: { contains: query, mode: 'insensitive' } },
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, items, discount = 0, paidAmount } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    const oldInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!oldInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    let newSubtotal = 0;
    for (const item of items) {
      const p = parseFloat(item.price);
      const q = parseFloat(item.quantity);
      newSubtotal += p * q;
    }
    const disc = parseFloat(discount);
    const newTotalAmount = Math.max(0, newSubtotal - disc);
    const newPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : oldInvoice.paidAmount;
    const newDueAmount = Math.max(0, newTotalAmount - newPaidAmount);

    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId } });

      for (const item of items) {
        const p = parseFloat(item.price);
        const q = parseFloat(item.quantity);
        await tx.invoiceItem.create({
          data: {
            invoiceId,
            productId: item.productId || null,
            variantId: item.variantId || null,
            productName: item.productName || item.name,
            unit: item.unit || 'pcs',
            price: p,
            quantity: q,
            total: p * q,
            rackLocation: item.rackLocation || 'Default',
          },
        });
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          subtotal: newSubtotal,
          discount: disc,
          totalAmount: newTotalAmount,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
        },
      });

      if (oldInvoice.customerId) {
        const cust = await tx.customer.findUnique({ where: { id: oldInvoice.customerId } });
        if (cust) {
          const diffTotal = newTotalAmount - oldInvoice.totalAmount;
          const diffPaid = newPaidAmount - oldInvoice.paidAmount;
          const diffDue = newDueAmount - oldInvoice.dueAmount;

          const updatedOutstanding = Math.max(0, cust.outstanding + diffDue);
          const updatedPurchases = Math.max(0, cust.totalPurchases + diffTotal);
          const updatedPaid = Math.max(0, cust.totalPaid + diffPaid);

          await tx.customer.update({
            where: { id: oldInvoice.customerId },
            data: {
              outstanding: updatedOutstanding,
              totalPurchases: updatedPurchases,
              totalPaid: updatedPaid,
            },
          });

          await tx.customerLedger.updateMany({
            where: { invoiceId, type: 'SALE' },
            data: {
              amount: newTotalAmount,
              balance: updatedOutstanding,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoice PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (invoice.customerId) {
        const cust = await tx.customer.findUnique({ where: { id: invoice.customerId } });
        if (cust) {
          const updatedPurchases = Math.max(0, cust.totalPurchases - invoice.totalAmount);
          const updatedPaid = Math.max(0, cust.totalPaid - invoice.paidAmount);
          const updatedOutstanding = Math.max(0, cust.outstanding - invoice.dueAmount);

          await tx.customer.update({
            where: { id: invoice.customerId },
            data: {
              totalPurchases: updatedPurchases,
              totalPaid: updatedPaid,
              outstanding: updatedOutstanding,
            },
          });
        }
      }

      // Restore stock for variants
      for (const item of invoice.items) {
        if (item.variantId) {
          try {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          } catch (e) {
            console.warn(`Variant stock restore skip for ${item.variantId}`);
          }
        }
      }

      await tx.customerLedger.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoice DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete invoice' }, { status: 500 });
  }
}
