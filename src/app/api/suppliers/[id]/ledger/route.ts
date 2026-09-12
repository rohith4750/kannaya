import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        ledger: {
          include: {
            purchaseOrder: {
              include: {
                items: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier account not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error('Supplier ledger GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier ledger' }, { status: 500 });
  }
}
