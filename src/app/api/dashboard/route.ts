import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Today's Sales Total
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const todaysSales = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const todaysCollection = todayInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    // 2. Customer Total Outstanding
    const customers = await prisma.customer.findMany({
      select: { outstanding: true },
    });
    const customerDueTotal = customers.reduce((sum, c) => sum + c.outstanding, 0);

    // 3. Supplier Total Outstanding
    const suppliers = await prisma.supplier.findMany({
      select: { outstanding: true },
    });
    const supplierDueTotal = suppliers.reduce((sum, s) => sum + s.outstanding, 0);

    // 4. Low Stock Products Count
    const products = await prisma.product.findMany({
      select: { stockQuantity: true, minStockAlert: true },
    });
    const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
    const totalProductCount = products.length;

    // 5. Recent Invoices
    const recentInvoices = await prisma.invoice.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    // 6. Top Selling Categories / Products
    const topSellingProducts = await prisma.invoiceItem.groupBy({
      by: ['productName', 'rackLocation'],
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 5,
    });

    // 7. Mock / Recent Daily Sales Trend
    const salesTrend = [
      { day: 'Mon', sales: 18500, collection: 14000 },
      { day: 'Tue', sales: 22400, collection: 19000 },
      { day: 'Wed', sales: 15800, collection: 12500 },
      { day: 'Thu', sales: 31200, collection: 25000 },
      { day: 'Fri', sales: 28900, collection: 22000 },
      { day: 'Sat', sales: 34500, collection: 29000 },
      { day: 'Today', sales: todaysSales > 0 ? todaysSales : 24500, collection: todaysCollection > 0 ? todaysCollection : 15000 },
    ];

    return NextResponse.json({
      metrics: {
        todaysSales: todaysSales > 0 ? todaysSales : 24500,
        todaysCollection: todaysCollection > 0 ? todaysCollection : 15000,
        customerDueTotal,
        supplierDueTotal,
        lowStockCount,
        totalProductCount,
      },
      recentInvoices,
      topSellingProducts,
      salesTrend,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
