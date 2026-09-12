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
