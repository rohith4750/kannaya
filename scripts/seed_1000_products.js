const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRANDS = [
  'Havells', 'Finolex', 'Legrand', 'Anchor by Panasonic',
  'Polycab', 'Schneider Electric', 'Syska', 'Crompton',
  'Philips', 'Orient Electric', 'Atomberg', 'V-Guard'
];

const CATEGORIES = [
  'Copper Wires & Cables',
  'Modular Switches & Sockets',
  'MCBs & Distribution Boards',
  'LED Bulbs & Panel Lights',
  'Ceiling Fans & Exhaust Fans',
  'PVC Pipes & Fittings',
  'Switchboards & Back Boxes',
  'Tape, Glands & Cable Accessories',
  'Water Heaters & Geysers',
  'Power Tools & Drill Bits'
];

const RACKS = [
  { rackName: 'Rack A', shelfCode: 'A1', description: 'Wires & Cables Bin' },
  { rackName: 'Rack A', shelfCode: 'A2', description: 'Heavy Cables Bin' },
  { rackName: 'Rack B', shelfCode: 'B1', description: 'Modular Switches Shelf' },
  { rackName: 'Rack B', shelfCode: 'B2', description: 'Sockets & Faceplates' },
  { rackName: 'Rack C', shelfCode: 'C1', description: 'MCB & Circuit Breakers' },
  { rackName: 'Rack C', shelfCode: 'C2', description: 'Distribution Boxes' },
  { rackName: 'Rack D', shelfCode: 'D1', description: 'Lighting & Bulbs' },
  { rackName: 'Rack D', shelfCode: 'D2', description: 'Fan Accessories & Regulators' },
];

const PRODUCT_PREFIXES = {
  'Copper Wires & Cables': ['Single Core FR Wire', 'Multi-strand Copper Wire', 'Armoured Power Cable', 'Flexible Coaxial Cable', 'Submersible Cable'],
  'Modular Switches & Sockets': ['10A 1-Way Switch', '16A 2-Way Switch', '6A 3-Pin Socket', '16A Heavy Socket', 'Fan Regulator Step Type', 'Indicator Module', 'RJ45 Internet Socket'],
  'MCBs & Distribution Boards': ['Single Pole MCB 10A', 'Double Pole MCB 32A', 'Triple Pole MCB 63A', 'RCCB 40A 30mA', '8-Way DB Box Double Door', '12-Way DB Box Surface Mount'],
  'LED Bulbs & Panel Lights': ['9W Cool Day LED Bulb', '12W Warm White LED Bulb', '15W Concealed Downlight', '20W LED Tube Light 4ft', '18W Surface Panel Light', '5W COB Spotlight'],
  'Ceiling Fans & Exhaust Fans': ['High-Speed Ceiling Fan 1200mm', 'BLDC Energy Saving Fan', 'Exhaust Fan 200mm', 'Pedestal Fan 400mm', 'Wall Mount Cabin Fan'],
  'PVC Pipes & Fittings': ['Heavy Conduit Pipe 25mm 3m', 'Medium Conduit Pipe 20mm', 'PVC Bend 25mm 90 Deg', 'PVC Circular Junction Box 4-Way', 'PVC Coupler 20mm'],
  'Switchboards & Back Boxes': ['Metal Gang Box 4-Module', 'Metal Gang Box 6-Module', 'PVC Surface Box 8-Module', 'Modular Plate 12-Module White', 'Glass Finish Modular Plate 6M'],
  'Tape, Glands & Cable Accessories': ['Insulation Tape Black 10m', 'Waterproof Rubber Tape', 'Brass Cable Gland 20mm', 'Nylon Cable Tie 200mm Pack of 100', 'Wire Connector Wire Nut'],
  'Water Heaters & Geysers': ['Storage Geyser 15L 5-Star', 'Instant Water Heater 3L', 'Immersion Rod 1500W', 'Geyser Connection Hose Pipe Pair'],
  'Power Tools & Drill Bits': ['Impact Drill Machine 500W', 'Angle Grinder 4 Inch', 'Concrete Drill Bit Set 6mm-12mm', 'Screw Driver Set Insulated 1000V', 'Wire Stripper & Crimping Tool']
};

const SPEC_VARIANTS = ['Red 90m', 'Black 90m', 'Blue 90m', 'Yellow 90m', 'Green Earth 90m', 'Standard White', 'Silver Metallic', 'Matte Black', 'Brass Gold', 'Heavy Duty', 'Economy Pack', 'Pro Series'];
const UNITS = ['meter', 'pcs', 'box', 'roll', 'pkt', 'set'];

async function main() {
  console.log('🚀 Starting 1,000 Products Seeding Script for Venkata Lakshmi Electronics...');

  // 1. Ensure Brands
  console.log('📦 Creating / Verifying Brands...');
  const brandRecords = {};
  for (const bName of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { name: bName },
      update: {},
      create: { name: bName },
    });
    brandRecords[bName] = brand.id;
  }

  // 2. Ensure Categories
  console.log('📂 Creating / Verifying Categories...');
  const catRecords = {};
  for (const cName of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name: cName },
      update: {},
      create: { name: cName, description: `Electrical supplies category for ${cName}` },
    });
    catRecords[cName] = cat.id;
  }

  // 3. Ensure Racks
  console.log('🗄️ Creating / Verifying Racks...');
  const rackIds = [];
  for (const r of RACKS) {
    const rack = await prisma.rack.upsert({
      where: { rackName_shelfCode: { rackName: r.rackName, shelfCode: r.shelfCode } },
      update: {},
      create: r,
    });
    rackIds.push(rack.id);
  }

  // 4. Generate 1,000 Products
  console.log('⚡ Generating 1,000 Product items...');
  const existingCount = await prisma.product.count();
  const startNum = existingCount + 1001;

  const productsToCreate = [];
  const brandKeys = Object.keys(brandRecords);
  const catKeys = Object.keys(catRecords);

  for (let i = 0; i < 1000; i++) {
    const num = startNum + i;
    const catName = catKeys[i % catKeys.length];
    const brandName = brandKeys[(i * 3 + 1) % brandKeys.length];
    const catId = catRecords[catName];
    const brandId = brandRecords[brandName];
    const rackId = rackIds[i % rackIds.length];

    const prefixes = PRODUCT_PREFIXES[catName];
    const prefix = prefixes[i % prefixes.length];
    const variant = SPEC_VARIANTS[(i + Math.floor(i / 5)) % SPEC_VARIANTS.length];
    const name = `${brandName} ${prefix} - ${variant} #${num}`;

    const barcode = `8901${String(num).padStart(8, '0')}`;
    const sku = `ELE-${catName.substring(0, 3).toUpperCase()}-${num}`;

    const baseCost = Math.floor((((i * 17) % 450) + 15) * 10) / 10;
    const purchasePrice = baseCost;
    const sellingPrice = Math.floor(baseCost * 1.25 * 10) / 10;
    const wholesalePrice = Math.floor(baseCost * 1.15 * 10) / 10;
    const minWholesaleQty = 10;

    const stockQuantity = Math.floor(((i * 7) % 180) + 10);
    const minStockAlert = 10;

    const unit = catName.includes('Wires') ? (i % 2 === 0 ? 'meter' : 'roll') : catName.includes('Pipes') ? 'pcs' : UNITS[i % UNITS.length];

    productsToCreate.push({
      name,
      sku,
      barcode,
      hsnCode: '8544',
      gstPercent: 18,
      unit,
      purchasePrice,
      sellingPrice,
      wholesalePrice,
      minWholesaleQty,
      stockQuantity,
      minStockAlert,
      warranty: i % 3 === 0 ? '2 Years Replacement' : '1 Year Warranty',
      description: `Premium grade ${name} supplied by ${brandName}. Ideal for residential and commercial electrical wiring.`,
      categoryId: catId,
      brandId: brandId,
      rackId: rackId,
    });
  }

  // 5. Batch Insert in chunks of 200
  console.log('💾 Inserting products into Database...');
  const batchSize = 200;
  for (let i = 0; i < productsToCreate.length; i += batchSize) {
    const chunk = productsToCreate.slice(i, i + batchSize);
    await prisma.product.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(` ✅ Inserted ${Math.min(i + batchSize, productsToCreate.length)} / 1000 products...`);
  }

  const finalTotal = await prisma.product.count();
  console.log(`🎉 SUCCESS! Total Products in Database now: ${finalTotal}`);
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding Products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
