import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(purchaseOrders);
  } catch (error: any) {
    console.error('Purchase orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplierId, poNumber, items, paidAmount: paidInput, notes } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Supplier and at least one item are required' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const generatedPoNumber =
      poNumber && poNumber.trim() !== ''
        ? poNumber.trim()
        : `PO-${Date.now().toString().slice(-6)}`;

    let calculatedTotal = 0;
    const formattedItems = items.map((item: any) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      const itemTotal = price * quantity;
      calculatedTotal += itemTotal;
      return {
        productId: item.productId,
        price,
        quantity,
        total: itemTotal,
      };
    });

    const paidAmount = paidInput !== undefined && paidInput !== '' ? parseFloat(paidInput) : calculatedTotal;
    const dueAmount = Math.max(0, calculatedTotal - paidAmount);

    // Transaction for atomic update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Order
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber: generatedPoNumber,
          supplierId,
          totalAmount: calculatedTotal,
          paidAmount,
          dueAmount,
          status: dueAmount > 0 ? 'PARTIAL' : 'COMPLETED',
          items: {
            create: formattedItems,
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      // 2. Update Supplier Financial Totals
      const newOutstanding = supplier.outstanding + dueAmount;
      const newTotalPurchased = supplier.totalPurchased + calculatedTotal;
      const newTotalPaid = supplier.totalPaid + paidAmount;

      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          totalPurchased: newTotalPurchased,
          totalPaid: newTotalPaid,
          outstanding: newOutstanding,
        },
      });

      // 3. Create Supplier Ledger Entry
      await tx.supplierLedger.create({
        data: {
          supplierId,
          type: 'PURCHASE' as any,
          amount: calculatedTotal,
          balance: newOutstanding,
          purchaseOrderId: po.id,
          notes: notes || `Stock Purchase Order #${generatedPoNumber}`,
        },
      });

      // 4. Update Product Stock Quantity & Purchase Price
      for (const item of formattedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            purchasePrice: item.price,
          },
        });
      }

      return po;
    });

    return NextResponse.json({ success: true, purchaseOrder: result });
  } catch (error: any) {
    console.error('Purchase order POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record purchase order' }, { status: 500 });
  }
}
