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
