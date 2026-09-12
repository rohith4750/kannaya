import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(brands);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const brand = await prisma.brand.create({
      data: { name },
    });
    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
