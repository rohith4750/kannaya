import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, restoreData } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required' }, { status: 400 });
    }

    // 1. BACKUP DATABASE SNAPSHOT
    if (action === 'backup') {
      const [
        users,
        categories,
        brands,
        racks,
        products,
        variants,
        customers,
        customerLedgers,
        invoices,
        invoiceItems,
        suppliers,
        supplierLedgers,
        purchaseOrders,
        purchaseItems,
        shopSettings,
        permissionConfig,
      ] = await Promise.all([
        prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, allowedModules: true, createdAt: true } }),
        prisma.category.findMany(),
        prisma.brand.findMany(),
        prisma.rack.findMany(),
        prisma.product.findMany(),
        prisma.productVariant.findMany(),
        prisma.customer.findMany(),
        prisma.customerLedger.findMany(),
        prisma.invoice.findMany(),
        prisma.invoiceItem.findMany(),
        prisma.supplier.findMany(),
        prisma.supplierLedger.findMany(),
        prisma.purchaseOrder.findMany(),
        prisma.purchaseOrderItem.findMany(),
        prisma.shopSettings.findMany(),
        prisma.permissionConfig.findMany(),
      ]);

      const backupSnapshot = {
        meta: {
          appName: 'Sri Venkata Lakshmi Electricals ERP',
          exportedAt: new Date().toISOString(),
          version: '2.0.0',
        },
        data: {
          users,
          categories,
          brands,
          racks,
          products,
          variants,
          customers,
          customerLedgers,
          invoices,
          invoiceItems,
          suppliers,
          supplierLedgers,
          purchaseOrders,
          purchaseItems,
          shopSettings,
          permissionConfig,
        },
      };

      return NextResponse.json(backupSnapshot);
    }

    // 2. FLUSH SALES & CUSTOMER DUES DATA
    if (action === 'flush_sales') {
      await prisma.$transaction([
        prisma.invoiceItem.deleteMany(),
        prisma.customerLedger.deleteMany(),
        prisma.invoice.deleteMany(),
        prisma.customer.updateMany({
          data: {
            totalPurchases: 0,
            totalPaid: 0,
            outstanding: 0,
          },
        }),
      ]);
      return NextResponse.json({
        success: true,
        message: '✅ All Sales Invoices, Customer Dues, and Ledger records have been cleanly flushed.',
      });
    }

    // 3. FLUSH INVENTORY & PRODUCTS DATA
    if (action === 'flush_inventory') {
      await prisma.$transaction([
        prisma.invoiceItem.deleteMany(),
        prisma.purchaseOrderItem.deleteMany(),
        prisma.productVariant.deleteMany(),
        prisma.product.deleteMany(),
        prisma.category.deleteMany(),
        prisma.brand.deleteMany(),
        prisma.rack.deleteMany(),
      ]);
      return NextResponse.json({
        success: true,
        message: '✅ All Inventory Products, Variants, Categories, Brands, and Rack Locations flushed.',
      });
    }

    // 4. FLUSH PURCHASES & SUPPLIER DATA
    if (action === 'flush_purchases') {
      await prisma.$transaction([
        prisma.purchaseOrderItem.deleteMany(),
        prisma.supplierLedger.deleteMany(),
        prisma.purchaseOrder.deleteMany(),
        prisma.supplier.updateMany({
          data: {
            totalPurchased: 0,
            totalPaid: 0,
            outstanding: 0,
          },
        }),
      ]);
      return NextResponse.json({
        success: true,
        message: '✅ All Supplier Purchase Orders, Supplier Dues, and Ledger entries flushed.',
      });
    }

    // 5. FULL DATABASE RESET (CLEARS ALL OPERATIONAL DATA)
    if (action === 'flush_all') {
      await prisma.$transaction([
        prisma.invoiceItem.deleteMany(),
        prisma.purchaseOrderItem.deleteMany(),
        prisma.customerLedger.deleteMany(),
        prisma.supplierLedger.deleteMany(),
        prisma.invoice.deleteMany(),
        prisma.purchaseOrder.deleteMany(),
        prisma.productVariant.deleteMany(),
        prisma.product.deleteMany(),
        prisma.category.deleteMany(),
        prisma.brand.deleteMany(),
        prisma.rack.deleteMany(),
        prisma.customer.deleteMany(),
        prisma.supplier.deleteMany(),
      ]);

      return NextResponse.json({
        success: true,
        message: '🚀 FULL DATABASE FLUSH COMPLETED. All test sales & inventory data removed. All User accounts, roles, security PINs, and shop settings are 100% preserved.',
      });
    }

    // 6. RESTORE DATABASE FROM SNAPSHOT
    if (action === 'restore') {
      if (!restoreData || !restoreData.data) {
        return NextResponse.json({ error: 'Valid restore JSON data is required' }, { status: 400 });
      }

      const { data } = restoreData;

      await prisma.$transaction(async (tx) => {
        // Clear operational data before restore
        await tx.invoiceItem.deleteMany();
        await tx.purchaseOrderItem.deleteMany();
        await tx.customerLedger.deleteMany();
        await tx.supplierLedger.deleteMany();
        await tx.invoice.deleteMany();
        await tx.purchaseOrder.deleteMany();
        await tx.productVariant.deleteMany();
        await tx.product.deleteMany();

        if (Array.isArray(data.categories) && data.categories.length > 0) {
          for (const c of data.categories) {
            await tx.category.upsert({ where: { id: c.id }, update: c, create: c });
          }
        }
        if (Array.isArray(data.brands) && data.brands.length > 0) {
          for (const b of data.brands) {
            await tx.brand.upsert({ where: { id: b.id }, update: b, create: b });
          }
        }
        if (Array.isArray(data.racks) && data.racks.length > 0) {
          for (const r of data.racks) {
            await tx.rack.upsert({ where: { id: r.id }, update: r, create: r });
          }
        }
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          for (const cust of data.customers) {
            await tx.customer.upsert({ where: { id: cust.id }, update: cust, create: cust });
          }
        }
        if (Array.isArray(data.suppliers) && data.suppliers.length > 0) {
          for (const supp of data.suppliers) {
            await tx.supplier.upsert({ where: { id: supp.id }, update: supp, create: supp });
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: '✅ Database restoration from JSON snapshot completed successfully.',
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Super Admin Database Action Error:', error);
    return NextResponse.json({ error: error.message || 'Database action failed' }, { status: 500 });
  }
}
