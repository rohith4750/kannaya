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
      shopName: 'SRI LAKSHMI ELECTRICALS & HARDWARE',
      tagline: 'Authorized Dealer: Polycab, Anchor, Finolex & Havells',
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
  const brandPolycab = await prisma.brand.create({ data: { name: 'Polycab' } });
  const brandAnchor = await prisma.brand.create({ data: { name: 'Anchor' } });
  const brandFinolex = await prisma.brand.create({ data: { name: 'Finolex' } });
  const brandHavells = await prisma.brand.create({ data: { name: 'Havells' } });
  const brandCrompton = await prisma.brand.create({ data: { name: 'Crompton' } });
  const brandPhilips = await prisma.brand.create({ data: { name: 'Philips' } });
  const brandLegrand = await prisma.brand.create({ data: { name: 'Legrand' } });

  // 6. Racks
  const rackA1 = await prisma.rack.create({ data: { rackName: 'Rack A', shelfCode: 'A1', description: 'Front Left - Main Wires (1.5 - 2.5 Sqmm)' } });
  const rackA2 = await prisma.rack.create({ data: { rackName: 'Rack A', shelfCode: 'A2', description: 'Front Left - Heavy Wires (4.0 - 6.0 Sqmm)' } });
  const rackA4 = await prisma.rack.create({ data: { rackName: 'Rack A', shelfCode: 'A4', description: 'Front Left Bottom - Protection MCBs' } });
  const rackB1 = await prisma.rack.create({ data: { rackName: 'Rack B', shelfCode: 'B1', description: 'Center Shelf 1 - Modular 6A Switches' } });
  const rackB2 = await prisma.rack.create({ data: { rackName: 'Rack B', shelfCode: 'B2', description: 'Center Shelf 2 - Modular 16A Sockets & Regulators' } });
  const rackB3 = await prisma.rack.create({ data: { rackName: 'Rack B', shelfCode: 'B3', description: 'Center Shelf 3 - Switch Plates & Gang Boxes' } });
  const rackB4 = await prisma.rack.create({ data: { rackName: 'Rack B', shelfCode: 'B4', description: 'Center Shelf 4 - LED Bulbs & Small Fittings' } });
  const rackC1 = await prisma.rack.create({ data: { rackName: 'Rack C', shelfCode: 'C1', description: 'Pipe Stand - PVC Conduit Pipes 1"' } });
  const rackC2 = await prisma.rack.create({ data: { rackName: 'Rack C', shelfCode: 'C2', description: 'Pipe Stand Bins - Junctions & Bends' } });
  const rackD1 = await prisma.rack.create({ data: { rackName: 'Rack D', shelfCode: 'D1', description: 'Warehouse Top - Ceiling Fans Boxes' } });
  const rackD2 = await prisma.rack.create({ data: { rackName: 'Rack D', shelfCode: 'D2', description: 'Warehouse Shelf - Distribution Enclosures' } });

  // 7. Products with extended metadata (GST %, HSN Code, Wholesale Pricing, Warranty)
  const products = [
    {
      name: 'Polycab 1.5 Sqmm FR Wire (Red) - 90m Coil',
      sku: 'WIR-POL-1.5-RED',
      barcode: '890100100101',
      hsnCode: '8544',
      gstPercent: 18,
      unit: 'meter',
      purchasePrice: 18.5,
      sellingPrice: 25.0,
      wholesalePrice: 21.0,
      minWholesaleQty: 90,
      stockQuantity: 500,
      minStockAlert: 100,
      warranty: '15 Years Flame Retardant Guarantee',
      description: 'Polycab FR PVC insulated copper wire for general domestic wiring',
      categoryId: catWires.id,
      brandId: brandPolycab.id,
      rackId: rackA1.id,
    },
    {
      name: 'Polycab 2.5 Sqmm FR Wire (Blue) - 90m Coil',
      sku: 'WIR-POL-2.5-BLU',
      barcode: '890100100102',
      hsnCode: '8544',
      gstPercent: 18,
      unit: 'meter',
      purchasePrice: 28.0,
      sellingPrice: 38.0,
      wholesalePrice: 32.0,
      minWholesaleQty: 90,
      stockQuantity: 350,
      minStockAlert: 80,
      warranty: '15 Years Flame Retardant Guarantee',
      description: 'Heavy duty power point copper wire',
      categoryId: catWires.id,
      brandId: brandPolycab.id,
      rackId: rackA1.id,
    },
    {
      name: 'Anchor Roma 6A 1-Way Switch (White)',
      sku: 'SWI-ANC-6A-1W',
      barcode: '890200200101',
      hsnCode: '8536',
      gstPercent: 18,
      unit: 'pcs',
      purchasePrice: 22.0,
      sellingPrice: 35.0,
      wholesalePrice: 28.0,
      minWholesaleQty: 20,
      stockQuantity: 120,
      minStockAlert: 30,
      warranty: '2 Years Manufacturer Warranty',
      description: 'Modular high durability Polycarbonate switch',
      categoryId: catSwitches.id,
      brandId: brandAnchor.id,
      rackId: rackB1.id,
    },
    {
      name: 'Anchor Roma 16A 3-Pin Heavy Socket',
      sku: 'SOC-ANC-16A-3P',
      barcode: '890200200102',
      hsnCode: '8536',
      gstPercent: 18,
      unit: 'pcs',
      purchasePrice: 65.0,
      sellingPrice: 95.0,
      wholesalePrice: 78.0,
      minWholesaleQty: 10,
      stockQuantity: 85,
      minStockAlert: 20,
      warranty: '2 Years Replacement Guarantee',
      description: 'Heavy load 16A socket for AC, Geyser and Refrigerator',
      categoryId: catSwitches.id,
      brandId: brandAnchor.id,
      rackId: rackB2.id,
    },
    {
      name: 'Finolex 1 Inch Heavy PVC Conduit Pipe (10ft)',
      sku: 'PIP-FIN-1IN-10FT',
      barcode: '890300300101',
      hsnCode: '3917',
      gstPercent: 18,
      unit: 'pcs',
      purchasePrice: 75.0,
      sellingPrice: 110.0,
      wholesalePrice: 92.0,
      minWholesaleQty: 25,
      stockQuantity: 80,
      minStockAlert: 25,
      warranty: '10 Years Mechanical Strength Guarantee',
      description: 'Unplasticized rigid PVC conduit pipe for concealed wiring',
      categoryId: catPipes.id,
      brandId: brandFinolex.id,
      rackId: rackC1.id,
    },
    {
      name: 'Havells 32A Double Pole C-Curve MCB',
      sku: 'MCB-HAV-32A-DP',
      barcode: '890400400101',
      hsnCode: '8536',
      gstPercent: 18,
      unit: 'pcs',
      purchasePrice: 210.0,
      sellingPrice: 320.0,
      wholesalePrice: 260.0,
      minWholesaleQty: 5,
      stockQuantity: 45,
      minStockAlert: 15,
      warranty: '5 Years Manufacturer Warranty',
      description: 'Air-break circuit breaker with trip indicator',
      categoryId: catProtection.id,
      brandId: brandHavells.id,
      rackId: rackA4.id,
    },
    {
      name: 'Philips 12W Stellar Cool Day LED Bulb B22',
      sku: 'LED-PHI-12W-B22',
      barcode: '890500500101',
      hsnCode: '8539',
      gstPercent: 12,
      unit: 'pcs',
      purchasePrice: 70.0,
      sellingPrice: 110.0,
      wholesalePrice: 85.0,
      minWholesaleQty: 10,
      stockQuantity: 90,
      minStockAlert: 20,
      warranty: '2 Years Manufacturer Replacement Warranty',
      description: '1050 Lumens Energy Efficient B22 Base LED Bulb',
      categoryId: catLighting.id,
      brandId: brandPhilips.id,
      rackId: rackB4.id,
    },
    {
      name: 'Crompton Aura 1200mm High Speed Ceiling Fan',
      sku: 'FAN-CRO-1200MM',
      barcode: '890600600101',
      hsnCode: '8414',
      gstPercent: 18,
      unit: 'pcs',
      purchasePrice: 1450.0,
      sellingPrice: 1950.0,
      wholesalePrice: 1680.0,
      minWholesaleQty: 3,
      stockQuantity: 15,
      minStockAlert: 5,
      warranty: '2 Years On-Site Brand Warranty',
      description: 'High air delivery 380 RPM 100% Copper motor ceiling fan',
      categoryId: catFans.id,
      brandId: brandCrompton.id,
      rackId: rackD1.id,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

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

  const customerSuresh = await prisma.customer.create({
    data: {
      name: 'Suresh Electrical Works',
      phone: '9988776655',
      email: 'suresh.works@yahoo.com',
      address: 'Phase 2 Industrial Zone, Main Highway',
      creditLimit: 100000,
      totalPurchases: 250000,
      totalPaid: 205000,
      outstanding: 45000,
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

  // 10. Initial Invoices & Ledgers
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2026-001',
      customerId: customerRamesh.id,
      customerName: customerRamesh.name,
      customerPhone: customerRamesh.phone,
      subtotal: 5000,
      discount: 0,
      tax: 0,
      totalAmount: 5000,
      paidAmount: 2000,
      dueAmount: 3000,
      paymentMethod: PaymentMethod.CREDIT as any,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 5 * 86400000),
      items: {
        create: [
          {
            productId: (await prisma.product.findFirstOrThrow({ where: { sku: 'WIR-POL-1.5-RED' } })).id,
            productName: 'Polycab 1.5 Sqmm FR Wire (Red) - 90m Coil',
            unit: 'meter',
            price: 25.0,
            quantity: 100,
            total: 2500,
            rackLocation: 'Rack A1',
          },
          {
            productId: (await prisma.product.findFirstOrThrow({ where: { sku: 'SWI-ANC-6A-1W' } })).id,
            productName: 'Anchor Roma 6A 1-Way Switch (White)',
            unit: 'pcs',
            price: 35.0,
            quantity: 50,
            total: 1750,
            rackLocation: 'Rack B1',
          },
        ],
      },
    },
  });

  await prisma.customerLedger.create({
    data: {
      customerId: customerRamesh.id,
      type: LedgerType.SALE as any,
      amount: 5000,
      balance: 18500,
      notes: 'Sale INV-2026-001 (Paid 2000 Cash, Due 3000 Udhar)',
      invoiceId: inv1.id,
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  console.log('Kannaya ERP database seeded cleanly!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
