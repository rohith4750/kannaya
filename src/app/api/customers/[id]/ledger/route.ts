import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        ledger: {
          orderBy: { createdAt: 'desc' },
          include: {
            invoice: {
              include: { items: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer Ledger GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer ledger' }, { status: 500 });
  }
}
