import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const Role = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

const PaymentMethod = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  CREDIT: 'CREDIT',
  SPLIT: 'SPLIT',
} as const;

const LedgerType = {
  SALE: 'SALE',
  PAYMENT: 'PAYMENT',
  PURCHASE: 'PURCHASE',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

async function main() {
  console.log('Seeding Kannaya Electrical ERP Database...');

  // 1. Clean existing data
  await prisma.user.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.customerLedger.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.supplierLedger.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.rack.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.shopSettings.deleteMany();

  // 2. Default Users (Admin & Staff)
  await prisma.user.create({
    data: {
      name: 'Owner Admin',
      email: 'admin@kannaya.com',
      password: 'adminpassword123',
      role: Role.ADMIN as any,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Cashier Staff',
      email: 'staff@kannaya.com',
      password: 'staffpassword123',
      role: Role.STAFF as any,
    },
  });

  // 3. Shop Settings
  await prisma.shopSettings.create({
    data: {
      id: 'default',
      shopName: 'VENKATA LAKSHMI ELECTRONICS',
      tagline: 'Powering Your Needs • Building A Brighter Tomorrow (Since 2023)',
      phone: '+91 98765 43210',
      address: 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001',
      gstin: '36ABCDE1234F1Z5',
      printerType: '80mm',
    },
  });

  // 4. Categories
  const catWires = await prisma.category.create({
    data: { name: 'Wires & Cables', description: 'FR, FRLS, Armoured wires and multicore cables' },
  });
  const catSwitches = await prisma.category.create({
    data: { name: 'Switches & Sockets', description: 'Modular switches, sockets, plates, and accessories' },
  });
  const catPipes = await prisma.category.create({
    data: { name: 'Pipes & Fittings', description: 'PVC conduit pipes, bends, junction boxes' },
  });
  const catProtection = await prisma.category.create({
    data: { name: 'Protection & MCBs', description: 'MCBs, RCCBs, Isolators, DB Boxes' },
  });
  const catLighting = await prisma.category.create({
    data: { name: 'Lighting & LED', description: 'LED bulbs, tube lights, panel lights, floodlights' },
  });
  const catFans = await prisma.category.create({
    data: { name: 'Fans & Appliances', description: 'Ceiling fans, exhaust fans, water heaters' },
  });

  // 5. Brands
  const brandAnchor = await prisma.brand.create({ data: { name: 'Anchor' } });
  const brandFinolex = await prisma.brand.create({ data: { name: 'Finolex' } });
  const brandHavells = await prisma.brand.create({ data: { name: 'Havells' } });
  const brandCrompton = await prisma.brand.create({ data: { name: 'Crompton' } });
  const brandSchneider = await prisma.brand.create({ data: { name: 'Schneider' } });

  // 6. Racks
  const rackA1 = await prisma.rack.create({ data: { rackName: 'Rack A', shelfCode: 'A1', description: 'Wires (1.5 - 2.5 Sqmm)' } });
  const rackA2 = await prisma.rack.create({ data: { rackName: 'Rack A', shelfCode: 'A2', description: 'Heavy Wires (4.0 - 6.0 Sqmm)' } });
  const rackA4 = await prisma.rack.create({ data: { rackName: 'Rack A', shelfCode: 'A4', description: 'Protection MCBs & Breakers' } });
  const rackB1 = await prisma.rack.create({ data: { rackName: 'Rack B', shelfCode: 'B1', description: 'Modular Switches' } });
  const rackB2 = await prisma.rack.create({ data: { rackName: 'Rack B', shelfCode: 'B2', description: 'Heavy Sockets & Regulators' } });
  const rackB4 = await prisma.rack.create({ data: { rackName: 'Rack B', shelfCode: 'B4', description: 'LED Bulbs & Lighting' } });
  const rackC1 = await prisma.rack.create({ data: { rackName: 'Rack C', shelfCode: 'C1', description: 'PVC Conduit Pipes Stand' } });
  const rackD1 = await prisma.rack.create({ data: { rackName: 'Rack D', shelfCode: 'D1', description: 'Ceiling Fans Section' } });

  // 7. Products with SVE- SKUs
  const wireProduct = await prisma.product.create({
    data: {
      name: 'Finolex Wire',
      hsnCode: '8544',
      gstPercent: 18,
      unit: 'ROLL',
      warranty: '15 Years Guarantee',
      description: 'Finolex 100% Electrolytic Grade Copper FR Insulated Wire (90m coil)',
      categoryId: catWires.id,
      brandId: brandFinolex.id,
      variants: {
        create: [
          {
            variantName: '1.5 SQMM',
            barcode: '890123',
            purchasePrice: 800,
            sellingPrice: 950,
            wholesalePrice: 880,
            minWholesaleQty: 10,
            stockQuantity: 100,
            minStockAlert: 20,
            rackId: rackA1.id,
          },
          {
            variantName: '2.5 SQMM',
            barcode: '890124',
            purchasePrice: 1200,
            sellingPrice: 1450,
            wholesalePrice: 1320,
            minWholesaleQty: 10,
            stockQuantity: 80,
            minStockAlert: 15,
            rackId: rackA1.id,
          },
          {
            variantName: '4 SQMM',
            barcode: '890125',
            purchasePrice: 1800,
            sellingPrice: 2200,
            wholesalePrice: 2000,
            minWholesaleQty: 5,
            stockQuantity: 50,
            minStockAlert: 10,
            rackId: rackA2.id,
          },
          {
            variantName: '6 SQMM',
            barcode: '890126',
            purchasePrice: 2600,
            sellingPrice: 3100,
            wholesalePrice: 2850,
            minWholesaleQty: 5,
            stockQuantity: 30,
            minStockAlert: 5,
            rackId: rackA2.id,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const bulbProduct = await prisma.product.create({
    data: {
      name: 'Havells LED Bulb',
      hsnCode: '8539',
      gstPercent: 12,
      unit: 'PCS',
      warranty: '2 Years Replacement',
      description: 'Energy efficient B22 cool day white LED bulb',
      categoryId: catLighting.id,
      brandId: brandHavells.id,
      variants: {
        create: [
          {
            variantName: '9W',
            barcode: '890223',
            purchasePrice: 55,
            sellingPrice: 85,
            wholesalePrice: 70,
            minWholesaleQty: 10,
            stockQuantity: 150,
            minStockAlert: 30,
            rackId: rackB4.id,
          },
          {
            variantName: '12W',
            barcode: '890224',
            purchasePrice: 70,
            sellingPrice: 110,
            wholesalePrice: 90,
            minWholesaleQty: 10,
            stockQuantity: 120,
            minStockAlert: 25,
            rackId: rackB4.id,
          },
          {
            variantName: '15W',
            barcode: '890225',
            purchasePrice: 95,
            sellingPrice: 145,
            wholesalePrice: 120,
            minWholesaleQty: 10,
            stockQuantity: 90,
            minStockAlert: 20,
            rackId: rackB4.id,
          },
          {
            variantName: '20W',
            barcode: '890226',
            purchasePrice: 130,
            sellingPrice: 190,
            wholesalePrice: 160,
            minWholesaleQty: 5,
            stockQuantity: 60,
            minStockAlert: 15,
            rackId: rackB4.id,
          },
        ],
      },
    },
    include: { variants: true },
  });

  await prisma.product.create({
    data: {
      name: 'Schneider MCB',
      hsnCode: '8536',
      gstPercent: 18,
      unit: 'PCS',
      warranty: '5 Years Warranty',
      description: 'C-Curve single pole mini circuit breaker',
      categoryId: catProtection.id,
      brandId: brandSchneider.id,
      variants: {
        create: [
          {
            variantName: '6A',
            barcode: '890323',
            purchasePrice: 110,
            sellingPrice: 165,
            wholesalePrice: 135,
            minWholesaleQty: 10,
            stockQuantity: 80,
            minStockAlert: 15,
            rackId: rackA4.id,
          },
          {
            variantName: '10A',
            barcode: '890324',
            purchasePrice: 110,
            sellingPrice: 165,
            wholesalePrice: 135,
            minWholesaleQty: 10,
            stockQuantity: 70,
            minStockAlert: 15,
            rackId: rackA4.id,
          },
          {
            variantName: '16A',
            barcode: '890325',
            purchasePrice: 115,
            sellingPrice: 170,
            wholesalePrice: 140,
            minWholesaleQty: 10,
            stockQuantity: 90,
            minStockAlert: 20,
            rackId: rackA4.id,
          },
          {
            variantName: '20A',
            barcode: '890326',
            purchasePrice: 120,
            sellingPrice: 175,
            wholesalePrice: 145,
            minWholesaleQty: 10,
            stockQuantity: 60,
            minStockAlert: 10,
            rackId: rackA4.id,
          },
          {
            variantName: '32A',
            barcode: '890327',
            purchasePrice: 135,
            sellingPrice: 195,
            wholesalePrice: 165,
            minWholesaleQty: 5,
            stockQuantity: 50,
            minStockAlert: 10,
            rackId: rackA4.id,
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'PVC Pipe',
      hsnCode: '3917',
      gstPercent: 18,
      unit: 'PCS',
      warranty: '10 Years Durability',
      description: 'Finolex 10ft heavy duty PVC conduit pipe',
      categoryId: catPipes.id,
      brandId: brandFinolex.id,
      variants: {
        create: [
          {
            variantName: '20mm',
            barcode: '890423',
            purchasePrice: 45,
            sellingPrice: 65,
            wholesalePrice: 55,
            minWholesaleQty: 25,
            stockQuantity: 200,
            minStockAlert: 50,
            rackId: rackC1.id,
          },
          {
            variantName: '25mm',
            barcode: '890424',
            purchasePrice: 60,
            sellingPrice: 85,
            wholesalePrice: 72,
            minWholesaleQty: 25,
            stockQuantity: 180,
            minStockAlert: 40,
            rackId: rackC1.id,
          },
          {
            variantName: '32mm',
            barcode: '890425',
            purchasePrice: 90,
            sellingPrice: 130,
            wholesalePrice: 110,
            minWholesaleQty: 15,
            stockQuantity: 100,
            minStockAlert: 25,
            rackId: rackC1.id,
          },
          {
            variantName: '40mm',
            barcode: '890426',
            purchasePrice: 125,
            sellingPrice: 175,
            wholesalePrice: 150,
            minWholesaleQty: 10,
            stockQuantity: 70,
            minStockAlert: 15,
            rackId: rackC1.id,
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Switches',
      hsnCode: '8536',
      gstPercent: 18,
      unit: 'PCS',
      warranty: '2 Years Guarantee',
      description: 'Anchor Roma modular polycarb switch & regulator range',
      categoryId: catSwitches.id,
      brandId: brandAnchor.id,
      variants: {
        create: [
          {
            variantName: '1 Way',
            barcode: '890523',
            purchasePrice: 22,
            sellingPrice: 35,
            wholesalePrice: 27,
            minWholesaleQty: 20,
            stockQuantity: 300,
            minStockAlert: 50,
            rackId: rackB1.id,
          },
          {
            variantName: '2 Way',
            barcode: '890524',
            purchasePrice: 32,
            sellingPrice: 48,
            wholesalePrice: 38,
            minWholesaleQty: 20,
            stockQuantity: 150,
            minStockAlert: 30,
            rackId: rackB1.id,
          },
          {
            variantName: 'Bell Switch',
            barcode: '890525',
            purchasePrice: 40,
            sellingPrice: 60,
            wholesalePrice: 48,
            minWholesaleQty: 10,
            stockQuantity: 80,
            minStockAlert: 15,
            rackId: rackB1.id,
          },
          {
            variantName: 'Fan Regulator',
            barcode: '890526',
            purchasePrice: 180,
            sellingPrice: 250,
            wholesalePrice: 210,
            minWholesaleQty: 5,
            stockQuantity: 100,
            minStockAlert: 20,
            rackId: rackB2.id,
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Fans',
      hsnCode: '8414',
      gstPercent: 18,
      unit: 'PCS',
      warranty: '2 Years On-Site Warranty',
      description: 'Crompton high delivery copper motor ceiling fans',
      categoryId: catFans.id,
      brandId: brandCrompton.id,
      variants: {
        create: [
          {
            variantName: '1200mm Brown',
            barcode: '890623',
            purchasePrice: 1450,
            sellingPrice: 1950,
            wholesalePrice: 1680,
            minWholesaleQty: 3,
            stockQuantity: 25,
            minStockAlert: 5,
            rackId: rackD1.id,
          },
          {
            variantName: '1200mm White',
            barcode: '890624',
            purchasePrice: 1450,
            sellingPrice: 1950,
            wholesalePrice: 1680,
            minWholesaleQty: 3,
            stockQuantity: 30,
            minStockAlert: 5,
            rackId: rackD1.id,
          },
          {
            variantName: '1400mm Ivory',
            barcode: '890625',
            purchasePrice: 1650,
            sellingPrice: 2200,
            wholesalePrice: 1900,
            minWholesaleQty: 3,
            stockQuantity: 15,
            minStockAlert: 3,
            rackId: rackD1.id,
          },
        ],
      },
    },
  });

  // 8. Customers
  const customerRamesh = await prisma.customer.create({
    data: {
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh.electrician@gmail.com',
      address: 'Plot 45, Near Hanuman Temple, Sector 3',
      creditLimit: 50000,
      totalPurchases: 125000,
      totalPaid: 106500,
      outstanding: 18500,
    },
  });

  // 9. Suppliers
  const supplierABC = await prisma.supplier.create({
    data: {
      name: 'ABC Electrical Distributors',
      contactPerson: 'Vikram Sharma',
      phone: '9848012345',
      email: 'sales@abcelectricals.com',
      address: 'Wholesale Electrical Market, Hub 1',
      totalPurchased: 850000,
      totalPaid: 730000,
      outstanding: 120000,
    },
  });

  // 10. Sample Invoice
  const sampleWireVariant = wireProduct.variants[0];
  const sampleBulbVariant = bulbProduct.variants[0];

  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2026-001',
      customerId: customerRamesh.id,
      customerName: customerRamesh.name,
      customerPhone: customerRamesh.phone,
      subtotal: 1800,
      discount: 0,
      tax: 0,
      totalAmount: 1800,
      paidAmount: 1000,
      dueAmount: 800,
      paymentMethod: PaymentMethod.CREDIT as any,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 5 * 86400000),
      items: {
        create: [
          {
            productId: wireProduct.id,
            variantId: sampleWireVariant.id,
            productName: 'Finolex Wire (1.5 SQMM)',
            unit: 'ROLL',
            price: 950,
            quantity: 1,
            total: 950,
            rackLocation: 'Rack A - Shelf A1',
          },
          {
            productId: bulbProduct.id,
            variantId: sampleBulbVariant.id,
            productName: 'Havells LED Bulb (9W)',
            unit: 'PCS',
            price: 85,
            quantity: 10,
            total: 850,
            rackLocation: 'Rack B - Shelf B4',
          },
        ],
      },
    },
  });

  await prisma.customerLedger.create({
    data: {
      customerId: customerRamesh.id,
      type: LedgerType.SALE as any,
      amount: 1800,
      balance: 18500,
      notes: 'Sale INV-2026-001 (Paid 1000 Cash, Due 800 Udhar)',
      invoiceId: inv1.id,
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  console.log('Kannaya Electrical ERP database seeded successfully with SVE- SKUs!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
