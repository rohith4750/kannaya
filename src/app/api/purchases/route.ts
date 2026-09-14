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
    const { action } = body;

    // ACTION 1: Receive Goods at Godown (GRN Entry)
    if (action === 'receive') {
      const { purchaseOrderId, itemsReceived } = body;
      if (!purchaseOrderId || !Array.isArray(itemsReceived)) {
        return NextResponse.json({ error: 'Purchase Order ID and itemsReceived array are required' }, { status: 400 });
      }

      const existingPo = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { items: true },
      });

      if (!existingPo) {
        return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
      }

      const updatedPo = await prisma.$transaction(async (tx) => {
        let allFullyReceived = true;
        let anyReceived = false;

        for (const rec of itemsReceived) {
          const { itemId, receivedQty } = rec;
          const poItem = existingPo.items.find((i) => i.id === itemId);
          if (!poItem) continue;

          const targetReceived = Math.min(poItem.quantity, Math.max(0, parseFloat(receivedQty) || 0));
          const delta = targetReceived - (poItem.receivedQuantity || 0);

          if (delta > 0) {
            // Update product stock with newly arrived quantity
            await tx.product.update({
              where: { id: poItem.productId },
              data: {
                stockQuantity: { increment: delta },
              },
            });
          }

          // Update item received quantity
          await tx.purchaseOrderItem.update({
            where: { id: itemId },
            data: { receivedQuantity: targetReceived },
          });

          if (targetReceived < poItem.quantity) {
            allFullyReceived = false;
          }
          if (targetReceived > 0) {
            anyReceived = true;
          }
        }

        const newStatus = allFullyReceived
          ? 'FULLY_RECEIVED'
          : anyReceived
          ? 'PARTIAL_RECEIVED'
          : 'ORDERED';

        return await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: newStatus },
          include: {
            supplier: true,
            items: { include: { product: true } },
          },
        });
      });

      return NextResponse.json({ success: true, purchaseOrder: updatedPo });
    }

    // ACTION 2: Create Purchase Order (Bulk or Single)
    const { supplierId, poNumber, items, paidAmount: paidInput, notes, isReceivedImmediately = true } = body;

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
        receivedQuantity: isReceivedImmediately ? quantity : 0,
        total: itemTotal,
      };
    });

    const paidAmount = paidInput !== undefined && paidInput !== '' ? parseFloat(paidInput) : calculatedTotal;
    const dueAmount = Math.max(0, calculatedTotal - paidAmount);

    const initialStatus = isReceivedImmediately
      ? (dueAmount > 0 ? 'PARTIAL' : 'COMPLETED')
      : 'ORDERED';

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
          status: initialStatus,
          items: {
            create: formattedItems,
          },
        },
        include: {
          items: { include: { product: true } },
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

      // 4. Update Product Stock Quantity & Purchase Price if received immediately
      if (isReceivedImmediately) {
        for (const item of formattedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
              purchasePrice: item.price,
            },
          });
        }
      }

      return po;
    });

    return NextResponse.json({ success: true, purchaseOrder: result });
  } catch (error: any) {
    console.error('Purchase order POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record purchase order' }, { status: 500 });
  }
}
