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
                { hsnCode: { contains: query, mode: 'insensitive' } },
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
    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });

    // Handle Batch Array of Multiple Products
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json({ error: 'Product array cannot be empty' }, { status: 400 });
      }

      const createdProducts = [];
      for (const item of body) {
        if (!item.name || !item.name.trim()) continue;

        let catId = item.categoryId;
        let brId = item.brandId;

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

        const variantList = Array.isArray(item.variants) && item.variants.length > 0 ? item.variants : [
          {
            variantName: 'Standard',
            barcode: item.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            hsnCode: item.hsnCode || null,
            purchasePrice: parseFloat(item.purchasePrice) || 0,
            sellingPrice: parseFloat(item.sellingPrice) || 0,
            wholesalePrice: item.wholesalePrice ? parseFloat(item.wholesalePrice) : null,
            minWholesaleQty: item.minWholesaleQty ? parseFloat(item.minWholesaleQty) : null,
            stockQuantity: parseFloat(item.stockQuantity) || 0,
            minStockAlert: parseFloat(item.minStockAlert) || 5,
            rackId: item.rackId || null,
          }
        ];

        const product = await prisma.product.create({
          data: {
            name: item.name.trim().toUpperCase(),
            hsnCode: item.hsnCode ? item.hsnCode.trim().toUpperCase() : (settings?.defaultHsnCode || '8544'),
            gstPercent: item.gstPercent !== undefined && item.gstPercent !== '' ? parseFloat(item.gstPercent) : (settings?.defaultGstPercent || 18),
            unit: (item.unit || 'PCS').toUpperCase(),
            warranty: item.warranty ? item.warranty.trim().toUpperCase() : null,
            description: item.description ? item.description.trim().toUpperCase() : null,
            categoryId: catId,
            brandId: brId,
            variants: {
              create: variantList.map((v: any, index: number) => ({
                variantName: (v.variantName || `Variant ${index + 1}`).trim().toUpperCase(),
                barcode: v.barcode && v.barcode.trim() ? v.barcode.trim().toUpperCase() : `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
                hsnCode: v.hsnCode && v.hsnCode.trim() ? v.hsnCode.trim().toUpperCase() : null,
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
        createdProducts.push(product);
      }

      return NextResponse.json(createdProducts);
    }

    // Handle Single Product Object
    const {
      name,
      hsnCode,
      gstPercent,
      unit,
      warranty,
      description,
      categoryId,
      brandId,
      variants,
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

    const variantList = Array.isArray(variants) && variants.length > 0 ? variants : [
      {
        variantName: 'Standard',
        barcode: body.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        hsnCode: body.hsnCode || null,
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
        name: name.trim().toUpperCase(),
        hsnCode: hsnCode ? hsnCode.trim().toUpperCase() : (settings?.defaultHsnCode || '8544'),
        gstPercent: gstPercent !== undefined && gstPercent !== '' ? parseFloat(gstPercent) : (settings?.defaultGstPercent || 18),
        unit: (unit || 'PCS').toUpperCase(),
        warranty: warranty ? warranty.trim().toUpperCase() : null,
        description: description ? description.trim().toUpperCase() : null,
        categoryId: catId,
        brandId: brId,
        variants: {
          create: variantList.map((v: any, index: number) => ({
            variantName: (v.variantName || `Variant ${index + 1}`).trim().toUpperCase(),
            barcode: v.barcode && v.barcode.trim() ? v.barcode.trim().toUpperCase() : `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            hsnCode: v.hsnCode && v.hsnCode.trim() ? v.hsnCode.trim().toUpperCase() : null,
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

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim().toUpperCase() }),
        ...(hsnCode !== undefined && { hsnCode: hsnCode ? hsnCode.trim().toUpperCase() : null }),
        ...(gstPercent !== undefined && { gstPercent: parseFloat(gstPercent) }),
        ...(unit !== undefined && { unit: unit.trim().toUpperCase() }),
        ...(warranty !== undefined && { warranty: warranty ? warranty.trim().toUpperCase() : null }),
        ...(description !== undefined && { description: description ? description.trim().toUpperCase() : null }),
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

    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              ...(v.variantName && { variantName: v.variantName.trim().toUpperCase() }),
              ...(v.barcode && { barcode: v.barcode.trim().toUpperCase() }),
              ...(v.hsnCode !== undefined && { hsnCode: v.hsnCode ? v.hsnCode.trim().toUpperCase() : null }),
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
              variantName: (v.variantName || 'Variant').trim().toUpperCase(),
              barcode: v.barcode && v.barcode.trim() ? v.barcode.trim().toUpperCase() : `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
              hsnCode: v.hsnCode ? v.hsnCode.trim().toUpperCase() : null,
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
