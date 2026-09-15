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
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 1. Invoices with Items, Product, Variant
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Today's Invoices
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    // Today Profit
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const todayCollection = todayInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    let todayCost = 0;
    todayInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const itemUnitCost = item.variant?.purchasePrice ?? (item.price * 0.7);
        todayCost += item.quantity * itemUnitCost;
      });
    });
    const todayGrossProfit = todaySales - todayCost;
    const todayProfitMargin = todaySales > 0 ? (todayGrossProfit / todaySales) * 100 : 0;

    // Filtered Period Profit
    const periodSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const periodCollection = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const periodDuesAdded = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    let periodCost = 0;

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let creditSales = 0;
    let splitSales = 0;

    const categoryProfitMap: { [key: string]: { name: string; sales: number; profit: number; count: number } } = {};

    invoices.forEach((inv) => {
      if (inv.paymentMethod === 'CASH') cashSales += inv.totalAmount;
      else if (inv.paymentMethod === 'UPI') upiSales += inv.totalAmount;
      else if (inv.paymentMethod === 'CARD') cardSales += inv.totalAmount;
      else if (inv.paymentMethod === 'CREDIT') creditSales += inv.totalAmount;
      else if (inv.paymentMethod === 'SPLIT') splitSales += inv.totalAmount;

      inv.items.forEach((item) => {
        const itemUnitCost = item.variant?.purchasePrice ?? (item.price * 0.7);
        const itemTotalCost = item.quantity * itemUnitCost;
        periodCost += itemTotalCost;

        const itemProfit = item.total - itemTotalCost;
        const catName = item.product?.category?.name || 'General Goods';

        if (!categoryProfitMap[catName]) {
          categoryProfitMap[catName] = { name: catName, sales: 0, profit: 0, count: 0 };
        }
        categoryProfitMap[catName].sales += item.total;
        categoryProfitMap[catName].profit += itemProfit;
        categoryProfitMap[catName].count += item.quantity;
      });
    });

    const periodGrossProfit = periodSales - periodCost;
    const periodProfitMargin = periodSales > 0 ? (periodGrossProfit / periodSales) * 100 : 0;
    const avgOrderValue = invoices.length > 0 ? periodSales / invoices.length : 0;

    const categoryPerformance = Object.values(categoryProfitMap).sort((a, b) => b.sales - a.sales);

    // Outstanding totals
    const customers = await prisma.customer.findMany({ select: { outstanding: true } });
    const customerDueTotal = customers.reduce((sum, c) => sum + c.outstanding, 0);

    const suppliers = await prisma.supplier.findMany({ select: { outstanding: true } });
    const supplierDueTotal = suppliers.reduce((sum, s) => sum + s.outstanding, 0);

    // Inventory Metrics based on ProductVariants
    const variants = await prisma.productVariant.findMany({
      select: {
        stockQuantity: true,
        purchasePrice: true,
        sellingPrice: true,
        minStockAlert: true,
      },
    });

    const products = await prisma.product.findMany({ select: { id: true } });

    const lowStockCount = variants.filter((v) => v.stockQuantity <= v.minStockAlert).length;
    const totalProductCount = products.length;
    const totalVariantCount = variants.length;
    const totalInventoryCostValue = variants.reduce((sum, v) => sum + (v.stockQuantity * v.purchasePrice), 0);
    const totalInventoryRetailValue = variants.reduce((sum, v) => sum + (v.stockQuantity * v.sellingPrice), 0);
    const potentialInventoryProfit = totalInventoryRetailValue - totalInventoryCostValue;

    const recentInvoices = invoices.slice(0, 8);

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

    const trendMap: { [key: string]: { sales: number; collection: number; profit: number } } = {};

    if (period === 'this_year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthNames.forEach((m) => (trendMap[m] = { sales: 0, collection: 0, profit: 0 }));
      invoices.forEach((inv) => {
        const mName = monthNames[new Date(inv.createdAt).getMonth()];
        if (trendMap[mName]) {
          trendMap[mName].sales += inv.totalAmount;
          trendMap[mName].collection += inv.paidAmount;
          let invCost = 0;
          inv.items.forEach((item) => {
            invCost += item.quantity * (item.variant?.purchasePrice ?? (item.price * 0.7));
          });
          trendMap[mName].profit += (inv.totalAmount - invCost);
        }
      });
    } else {
      invoices.forEach((inv) => {
        const dKey = new Date(inv.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });
        if (!trendMap[dKey]) trendMap[dKey] = { sales: 0, collection: 0, profit: 0 };
        trendMap[dKey].sales += inv.totalAmount;
        trendMap[dKey].collection += inv.paidAmount;

        let invCost = 0;
        inv.items.forEach((item) => {
          invCost += item.quantity * (item.variant?.purchasePrice ?? (item.price * 0.7));
        });
        trendMap[dKey].profit += (inv.totalAmount - invCost);
      });
    }

    const salesTrend = Object.entries(trendMap).map(([day, val]) => ({
      day,
      sales: val.sales,
      collection: val.collection,
      profit: Math.max(0, val.profit),
    }));

    return NextResponse.json({
      period,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      metrics: {
        todaySales,
        todayCollection,
        todayCost,
        todayGrossProfit,
        todayProfitMargin,

        periodSales,
        periodCollection,
        periodCost,
        periodGrossProfit,
        periodProfitMargin,
        periodDuesAdded,
        avgOrderValue,

        cashSales,
        upiSales,
        cardSales,
        creditSales,
        splitSales,

        customerDueTotal,
        supplierDueTotal,
        lowStockCount,
        totalProductCount,
        totalVariantCount,
        totalInvoiceCount: invoices.length,
        totalInventoryCostValue,
        totalInventoryRetailValue,
        potentialInventoryProfit,
      },
      recentInvoices,
      topSellingProducts,
      categoryPerformance,
      salesTrend: salesTrend.length > 0 ? salesTrend : [
        { day: 'Period Total', sales: periodSales, collection: periodCollection, profit: periodGrossProfit },
      ],
    });
  } catch (error: any) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard analytics' }, { status: 500 });
  }
}
