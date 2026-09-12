import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { rack: true },
            },
          },
        },
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });

    return NextResponse.json({ invoice, settings });
  } catch (error) {
    console.error('Single Invoice GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice details' }, { status: 500 });
  }
}
