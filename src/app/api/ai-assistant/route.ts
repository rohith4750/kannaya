import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    const q = (query || '').toLowerCase().trim();

    let answer = '';
    let data: any = null;
    let actionButton: any = null;

    if (q.includes('customer') && (q.includes('owe') || q.includes('due') || q.includes('most') || q.includes('highest'))) {
      // 1. Highest debtor
      const topDebtor = await prisma.customer.findFirst({
        orderBy: { outstanding: 'desc' },
      });

      if (topDebtor) {
        answer = `*${topDebtor.name}* owes the highest credit balance in your shop with an outstanding amount of *₹${topDebtor.outstanding.toLocaleString('en-IN')}*.`;
        data = {
          Customer: topDebtor.name,
          Phone: topDebtor.phone,
          'Total Purchases': `₹${topDebtor.totalPurchases.toLocaleString('en-IN')}`,
          'Pending Udhar': `₹${topDebtor.outstanding.toLocaleString('en-IN')}`,
          'Credit Limit': `₹${topDebtor.creditLimit.toLocaleString('en-IN')}`,
        };
        actionButton = {
          label: `Send WhatsApp Reminder to ${topDebtor.name}`,
          type: 'whatsapp_reminder',
          phone: topDebtor.phone,
          name: topDebtor.name,
          dueAmount: topDebtor.outstanding,
        };
      } else {
        answer = 'No customers with pending credit balance found.';
      }
    } else if (q.includes('fast') || q.includes('selling') || q.includes('top product') || q.includes('best')) {
      // 2. Fastest selling products
      const topItems = await prisma.invoiceItem.groupBy({
        by: ['productName', 'rackLocation'],
        _sum: {
          quantity: true,
          total: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      });

      answer = 'Here are your fastest selling products based on total sales quantity:';
      data = topItems.map((item, idx) => ({
        Rank: `#${idx + 1}`,
        Product: item.productName,
        'Quantity Sold': item._sum.quantity,
        'Revenue Generated': `₹${(item._sum.total || 0).toLocaleString('en-IN')}`,
        Location: item.rackLocation || 'Rack A1',
      }));
    } else if (q.includes('low stock') || q.includes('reorder') || q.includes('shortage') || q.includes('out of stock')) {
      // 3. Low stock products
      const lowStockProducts = await prisma.product.findMany({
        where: {
          stockQuantity: {
            lte: prisma.product.fields.minStockAlert,
          },
        },
        include: {
          rack: true,
          brand: true,
        },
      });

      answer = `You currently have *${lowStockProducts.length}* low stock products that require reordering:`;
      data = lowStockProducts.map((p) => ({
        Product: p.name,
        Brand: p.brand.name,
        'Current Stock': `${p.stockQuantity} ${p.unit}`,
        'Min Alert Level': `${p.minStockAlert} ${p.unit}`,
        'Rack Location': p.rack ? `${p.rack.rackName} (${p.rack.shelfCode})` : 'N/A',
      }));
      actionButton = {
        label: 'Generate Supplier Reorder WhatsApp',
        type: 'whatsapp_reorder',
      };
    } else if (q.includes('supplier') || q.includes('purchase')) {
      // 4. Supplier pending payments
      const topSuppliers = await prisma.supplier.findMany({
        where: { outstanding: { gt: 0 } },
        orderBy: { outstanding: 'desc' },
      });

      answer = `You have *${topSuppliers.length}* suppliers with pending payments:`;
      data = topSuppliers.map((s) => ({
        Supplier: s.name,
        Contact: s.contactPerson || s.phone,
        'Pending Amount': `₹${s.outstanding.toLocaleString('en-IN')}`,
        'Total Purchased': `₹${s.totalPurchased.toLocaleString('en-IN')}`,
      }));
    } else {
      // General store analytics summary
      const [customers, products, suppliers, invoices] = await Promise.all([
        prisma.customer.findMany({ select: { outstanding: true } }),
        prisma.product.findMany({ select: { stockQuantity: true, minStockAlert: true } }),
        prisma.supplier.findMany({ select: { outstanding: true } }),
        prisma.invoice.findMany({ take: 10 }),
      ]);

      const totalCustDue = customers.reduce((sum, c) => sum + c.outstanding, 0);
      const totalSuppDue = suppliers.reduce((sum, s) => sum + s.outstanding, 0);
      const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

      answer = `*Kannaya AI Store Summary:*\n• Total Customer Udhar Outstanding: *₹${totalCustDue.toLocaleString('en-IN')}*\n• Total Supplier Pending Due: *₹${totalSuppDue.toLocaleString('en-IN')}*\n• Low Stock Alerts: *${lowStockCount} items* needing restock.`;
      data = {
        'Customer Udhar Due': `₹${totalCustDue.toLocaleString('en-IN')}`,
        'Supplier Pending Due': `₹${totalSuppDue.toLocaleString('en-IN')}`,
        'Low Stock Items': lowStockCount,
        'Total Product Catalog': products.length,
      };
    }

    return NextResponse.json({
      query,
      answer,
      data,
      actionButton,
    });
  } catch (error) {
    console.error('AI Assistant API error:', error);
    return NextResponse.json({ error: 'AI Assistant query processing failed' }, { status: 500 });
  }
}
