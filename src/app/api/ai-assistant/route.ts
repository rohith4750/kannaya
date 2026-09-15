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
      const allVariants = await prisma.productVariant.findMany({
        include: {
          product: { include: { brand: true } },
          rack: true,
        },
      });

      const lowStockVariants = allVariants.filter((v) => v.stockQuantity <= v.minStockAlert);

      answer = `You currently have *${lowStockVariants.length}* low stock variants that require reordering:`;
      data = lowStockVariants.map((v) => ({
        Product: `${v.product.name} (${v.variantName})`,
        Brand: v.product.brand?.name || 'Generic',
        'Current Stock': `${v.stockQuantity} ${v.product.unit}`,
        'Min Alert Level': `${v.minStockAlert} ${v.product.unit}`,
        'Rack Location': v.rack ? `${v.rack.rackName} (${v.rack.shelfCode})` : 'N/A',
      }));
      actionButton = {
        label: 'Generate Supplier Reorder WhatsApp',
        type: 'whatsapp_reorder',
      };
    } else if (q.includes('supplier') || q.includes('purchase')) {
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
      const [customers, variants, suppliers, products] = await Promise.all([
        prisma.customer.findMany({ select: { outstanding: true } }),
        prisma.productVariant.findMany({ select: { stockQuantity: true, minStockAlert: true } }),
        prisma.supplier.findMany({ select: { outstanding: true } }),
        prisma.product.findMany({ select: { id: true } }),
      ]);

      const totalCustDue = customers.reduce((sum, c) => sum + c.outstanding, 0);
      const totalSuppDue = suppliers.reduce((sum, s) => sum + s.outstanding, 0);
      const lowStockCount = variants.filter((v) => v.stockQuantity <= v.minStockAlert).length;

      answer = `*Kannaya AI Store Summary:*\n• Total Customer Udhar Outstanding: *₹${totalCustDue.toLocaleString('en-IN')}*\n• Total Supplier Pending Due: *₹${totalSuppDue.toLocaleString('en-IN')}*\n• Low Stock Variant Alerts: *${lowStockCount} items* needing restock.`;
      data = {
        'Customer Udhar Due': `₹${totalCustDue.toLocaleString('en-IN')}`,
        'Supplier Pending Due': `₹${totalSuppDue.toLocaleString('en-IN')}`,
        'Low Stock Variants': lowStockCount,
        'Total Product Categories': products.length,
        'Total Variant Catalog': variants.length,
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
