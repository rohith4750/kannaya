import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        rack: true,
        invoiceItems: {
          take: 10,
          orderBy: { invoice: { createdAt: 'desc' } },
          include: { invoice: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Single Product GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}
