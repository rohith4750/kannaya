import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || '';

    let whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        brand: true,
        rack: true,
      },
      orderBy: { name: 'asc' },
    });

    if (filter === 'low-stock') {
      const filtered = products.filter((p: any) => p.stockQuantity <= p.minStockAlert);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      unit,
      purchasePrice,
      sellingPrice,
      stockQuantity,
      minStockAlert,
      categoryId,
      brandId,
      rackId,
    } = body;

    const product = await prisma.product.create({
      data: {
        name,
        sku: sku || `SKU-${Date.now()}`,
        barcode: barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        unit: unit || 'pcs',
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        stockQuantity: parseFloat(stockQuantity) || 0,
        minStockAlert: parseFloat(minStockAlert) || 5,
        categoryId,
        brandId,
        rackId: rackId || null,
      },
      include: {
        category: true,
        brand: true,
        rack: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, stockQuantity, sellingPrice, purchasePrice, rackId, minStockAlert } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(stockQuantity !== undefined && { stockQuantity: parseFloat(stockQuantity) }),
        ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
        ...(purchasePrice !== undefined && { purchasePrice: parseFloat(purchasePrice) }),
        ...(minStockAlert !== undefined && { minStockAlert: parseFloat(minStockAlert) }),
        ...(rackId !== undefined && { rackId }),
      },
      include: {
        category: true,
        brand: true,
        rack: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Products PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
