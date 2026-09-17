import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import os from 'os';

export async function GET() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // Fetch counts from database
    const [
      customerCount,
      productCount,
      variantCount,
      invoiceCount,
      supplierCount,
      purchaseOrderCount,
      userCount,
      shopSettings,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.invoice.count(),
      prisma.supplier.count(),
      prisma.purchaseOrder.count(),
      prisma.user.count(),
      prisma.shopSettings.findUnique({ where: { id: 'default' } }),
    ]);

    // Test UltraMsg WhatsApp Connection if configured
    let ultraMsgStatus = 'NOT_CONFIGURED';
    let ultraMsgDetails: any = null;

    try {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
      const token = process.env.ULTRAMSG_TOKEN;
      if (instanceId && token) {
        const res = await fetch(`https://api.ultramsg.com/${instanceId}/instance/status?token=${token}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          ultraMsgStatus = data.account_status?.account_status === 'authenticated' ? 'CONNECTED' : 'DISCONNECTED';
          ultraMsgDetails = data;
        } else {
          ultraMsgStatus = 'ERROR';
        }
      }
    } catch (e: any) {
      ultraMsgStatus = 'FAILED';
    }

    const memoryUsage = process.memoryUsage();
    const systemInfo = {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMB: Math.round(os.freemem() / (1024 * 1024)),
      rssMemoryMB: Math.round(memoryUsage.rss / (1024 * 1024)),
      heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
      heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
    };

    return NextResponse.json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      db: {
        status: 'CONNECTED',
        latencyMs: dbLatency,
      },
      counts: {
        customers: customerCount,
        products: productCount,
        variants: variantCount,
        invoices: invoiceCount,
        suppliers: supplierCount,
        purchaseOrders: purchaseOrderCount,
        users: userCount,
      },
      ultraMsg: {
        status: ultraMsgStatus,
        details: ultraMsgDetails,
      },
      systemInfo,
      shopSettings,
    });
  } catch (error: any) {
    console.error('Super Admin Health Check Error:', error);
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        error: error.message || 'Health check failed',
        db: { status: 'DISCONNECTED', latencyMs: -1 },
      },
      { status: 500 }
    );
  }
}
