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
        { category: { name: { contains: query, mode: 'insensitive' } } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
        {
          variants: {
            some: {
              OR: [
                { variantName: { contains: query, mode: 'insensitive' } },
                { barcode: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            rack: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (filter === 'low-stock') {
      const filtered = products.filter((p: any) =>
        p.variants.some((v: any) => v.stockQuantity <= v.minStockAlert)
      );
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
      hsnCode,
      gstPercent,
      unit,
      warranty,
      description,
      categoryId,
      brandId,
      variants, // Array of { variantName, barcode, sku, purchasePrice, sellingPrice, wholesalePrice, minWholesaleQty, stockQuantity, minStockAlert, rackId, imageUrl }
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    let catId = categoryId;
    let brId = brandId;

    if (!catId) {
      let defaultCat = await prisma.category.findFirst();
      if (!defaultCat) {
        defaultCat = await prisma.category.create({ data: { name: 'General' } });
      }
      catId = defaultCat.id;
    }

    if (!brId) {
      let defaultBrand = await prisma.brand.findFirst();
      if (!defaultBrand) {
        defaultBrand = await prisma.brand.create({ data: { name: 'Generic' } });
      }
      brId = defaultBrand.id;
    }

    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });

    // Validate variants array or create standard single variant
    const variantList = Array.isArray(variants) && variants.length > 0 ? variants : [
      {
        variantName: 'Standard',
        barcode: body.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        sku: body.sku || `SVE-${Date.now()}`,
        purchasePrice: parseFloat(body.purchasePrice) || 0,
        sellingPrice: parseFloat(body.sellingPrice) || 0,
        wholesalePrice: body.wholesalePrice ? parseFloat(body.wholesalePrice) : null,
        minWholesaleQty: body.minWholesaleQty ? parseFloat(body.minWholesaleQty) : null,
        stockQuantity: parseFloat(body.stockQuantity) || 0,
        minStockAlert: parseFloat(body.minStockAlert) || 5,
        rackId: body.rackId || null,
      }
    ];

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        hsnCode: hsnCode || settings?.defaultHsnCode || '8544',
        gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : (settings?.defaultGstPercent || 18),
        unit: unit || 'pcs',
        warranty: warranty || null,
        description: description || null,
        categoryId: catId,
        brandId: brId,
        variants: {
          create: variantList.map((v: any, index: number) => ({
            variantName: v.variantName || `Variant ${index + 1}`,
            barcode: v.barcode && v.barcode.trim() ? v.barcode.trim() : `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            sku: v.sku && v.sku.trim() ? v.sku.trim() : `SVE-${Date.now()}-${index + 1}`,
            purchasePrice: parseFloat(v.purchasePrice) || 0,
            sellingPrice: parseFloat(v.sellingPrice) || 0,
            wholesalePrice: v.wholesalePrice !== undefined && v.wholesalePrice !== null && v.wholesalePrice !== '' ? parseFloat(v.wholesalePrice) : null,
            minWholesaleQty: v.minWholesaleQty !== undefined && v.minWholesaleQty !== null && v.minWholesaleQty !== '' ? parseFloat(v.minWholesaleQty) : null,
            stockQuantity: parseFloat(v.stockQuantity) || 0,
            minStockAlert: parseFloat(v.minStockAlert) || 5,
            rackId: v.rackId || null,
            imageUrl: v.imageUrl || null,
          })),
        },
      },
      include: {
        category: true,
        brand: true,
        variants: {
          include: { rack: true },
        },
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
    const { id, name, hsnCode, gstPercent, unit, warranty, description, categoryId, brandId, variants } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Update base product
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(hsnCode !== undefined && { hsnCode }),
        ...(gstPercent !== undefined && { gstPercent: parseFloat(gstPercent) }),
        ...(unit !== undefined && { unit }),
        ...(warranty !== undefined && { warranty }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
        ...(brandId && { brandId }),
      },
      include: {
        category: true,
        brand: true,
        variants: {
          include: { rack: true },
        },
      },
    });

    // If variants array passed, upsert variants
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              ...(v.variantName && { variantName: v.variantName.trim() }),
              ...(v.barcode && { barcode: v.barcode.trim() }),
              ...(v.sku !== undefined && { sku: v.sku }),
              ...(v.purchasePrice !== undefined && { purchasePrice: parseFloat(v.purchasePrice) }),
              ...(v.sellingPrice !== undefined && { sellingPrice: parseFloat(v.sellingPrice) }),
              ...(v.wholesalePrice !== undefined && { wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : null }),
              ...(v.minWholesaleQty !== undefined && { minWholesaleQty: v.minWholesaleQty ? parseFloat(v.minWholesaleQty) : null }),
              ...(v.stockQuantity !== undefined && { stockQuantity: parseFloat(v.stockQuantity) }),
              ...(v.minStockAlert !== undefined && { minStockAlert: parseFloat(v.minStockAlert) }),
              ...(v.rackId !== undefined && { rackId: v.rackId || null }),
              ...(v.imageUrl !== undefined && { imageUrl: v.imageUrl || null }),
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: id,
              variantName: v.variantName || 'Variant',
              barcode: v.barcode && v.barcode.trim() ? v.barcode.trim() : `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
              sku: v.sku || `SVE-${Date.now()}`,
              purchasePrice: parseFloat(v.purchasePrice) || 0,
              sellingPrice: parseFloat(v.sellingPrice) || 0,
              wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : null,
              minWholesaleQty: v.minWholesaleQty ? parseFloat(v.minWholesaleQty) : null,
              stockQuantity: parseFloat(v.stockQuantity) || 0,
              minStockAlert: parseFloat(v.minStockAlert) || 5,
              rackId: v.rackId || null,
              imageUrl: v.imageUrl || null,
            },
          });
        }
      }
    }

    const reFetched = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: {
          include: { rack: true },
        },
      },
    });

    return NextResponse.json(reFetched);
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
