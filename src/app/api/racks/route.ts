import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const racks = await prisma.rack.findMany({
      include: {
        variants: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
          },
        },
      },
      orderBy: [{ rackName: 'asc' }, { shelfCode: 'asc' }],
    });
    return NextResponse.json(racks);
  } catch (error) {
    console.error('Racks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch racks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { rackName, shelfCode, description } = await request.json();
    const rack = await prisma.rack.create({
      data: { rackName, shelfCode, description },
    });
    return NextResponse.json(rack);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rack location' }, { status: 500 });
  }
}
