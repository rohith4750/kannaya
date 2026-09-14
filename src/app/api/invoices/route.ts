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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Delete invoice items first, then invoice
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoice DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete invoice' }, { status: 500 });
  }
}

