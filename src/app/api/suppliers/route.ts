import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LedgerType } from '@prisma/client';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        ledger: {
          orderBy: { createdAt: 'desc' },
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Suppliers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Record Payment to Supplier
    if (action === 'payment') {
      const { supplierId, amount, notes } = body;
      const payAmt = parseFloat(amount);

      const supp = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supp) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

      const newOutstanding = Math.max(0, supp.outstanding - payAmt);
      const newTotalPaid = supp.totalPaid + payAmt;

      const updatedSupplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          outstanding: newOutstanding,
          totalPaid: newTotalPaid,
        },
      });

      const ledgerEntry = await prisma.supplierLedger.create({
        data: {
          supplierId,
          type: LedgerType.PAYMENT,
          amount: payAmt,
          balance: newOutstanding,
          notes: notes || `Payment made to supplier`,
        },
      });

      return NextResponse.json({ success: true, supplier: updatedSupplier, ledgerEntry });
    }

    // 2. Create New Supplier Profile
    const { name, contactPerson, phone, email, address } = body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
      },
    });

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error('Suppliers POST error:', error);
    return NextResponse.json({ error: error.message || 'Supplier operation failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete supplier ledger entries
      await tx.supplierLedger.deleteMany({ where: { supplierId: id } });

      // 2. Delete purchase order items & purchase orders
      const pos = await tx.purchaseOrder.findMany({ where: { supplierId: id }, select: { id: true } });
      const poIds = pos.map((p) => p.id);

      if (poIds.length > 0) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: poIds } } });
        await tx.purchaseOrder.deleteMany({ where: { supplierId: id } });
      }

      // 3. Delete supplier profile
      await tx.supplier.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Supplier account deleted successfully' });
  } catch (error: any) {
    console.error('Suppliers DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete supplier' }, { status: 500 });
  }
}
