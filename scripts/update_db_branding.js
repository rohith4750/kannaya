const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBranding() {
  try {
    const res = await prisma.shopSettings.updateMany({
      data: {
        shopName: 'SRI VENKATA LAKSHMI ELECTRICALS',
        tagline: 'Complete Electrical Solutions',
      },
    });
    console.log('Database branding updated successfully:', res);
  } catch (err) {
    console.error('Error updating DB branding:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateBranding();
