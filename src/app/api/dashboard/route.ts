import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this_month';
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    let fromDate: Date;
    let toDate: Date;

    if (monthParam && yearParam) {
      const selectedYear = parseInt(yearParam);
      const selectedMonth = parseInt(monthParam) - 1;
      fromDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0);
      toDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    } else if (period === 'today') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'last_month') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === 'last_3_months') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'this_year') {
      fromDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (period === 'custom' && startDateParam && endDateParam) {
      fromDate = new Date(startDateParam);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(endDateParam);
      toDate.setHours(23, 59, 59, 999);
    } else {
      // Default: This Month
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // 1. Invoices for Period
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const periodSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const periodCollection = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const periodDuesAdded = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

    // 2. Customer Total Outstanding (All-time snapshot)
    const customers = await prisma.customer.findMany({ select: { outstanding: true } });
    const customerDueTotal = customers.reduce((sum, c) => sum + c.outstanding, 0);

    // 3. Supplier Total Outstanding (All-time snapshot)
    const suppliers = await prisma.supplier.findMany({ select: { outstanding: true } });
    const supplierDueTotal = suppliers.reduce((sum, s) => sum + s.outstanding, 0);

    // 4. Low Stock Products Count
    const products = await prisma.product.findMany({ select: { stockQuantity: true, minStockAlert: true } });
    const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
    const totalProductCount = products.length;

    // 5. Recent Invoices in Filtered Period
    const recentInvoices = invoices.slice(0, 8);

    // 6. Top Selling Products in Period
    const topSellingProducts = await prisma.invoiceItem.groupBy({
      by: ['productName', 'rackLocation'],
      where: {
        invoice: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
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

    // 7. Dynamic Sales & Collection Trend Data
    const trendMap: { [key: string]: { sales: number; collection: number } } = {};

    if (period === 'this_year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthNames.forEach((m) => (trendMap[m] = { sales: 0, collection: 0 }));
      invoices.forEach((inv) => {
        const mName = monthNames[new Date(inv.createdAt).getMonth()];
        if (trendMap[mName]) {
          trendMap[mName].sales += inv.totalAmount;
          trendMap[mName].collection += inv.paidAmount;
        }
      });
    } else {
      // Group by Day/Date
      invoices.forEach((inv) => {
        const dKey = new Date(inv.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });
        if (!trendMap[dKey]) trendMap[dKey] = { sales: 0, collection: 0 };
        trendMap[dKey].sales += inv.totalAmount;
        trendMap[dKey].collection += inv.paidAmount;
      });
    }

    const salesTrend = Object.entries(trendMap).map(([day, val]) => ({
      day,
      sales: val.sales,
      collection: val.collection,
    }));

    return NextResponse.json({
      period,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      metrics: {
        todaysSales: periodSales,
        todaysCollection: periodCollection,
        periodDuesAdded,
        customerDueTotal,
        supplierDueTotal,
        lowStockCount,
        totalProductCount,
        totalInvoiceCount: invoices.length,
      },
      recentInvoices,
      topSellingProducts,
      salesTrend: salesTrend.length > 0 ? salesTrend : [
        { day: 'Period Total', sales: periodSales, collection: periodCollection },
      ],
    });
  } catch (error: any) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
