import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    let customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        ledger: {
          orderBy: { createdAt: 'desc' },
          include: {
            invoice: {
              include: { items: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'asc' },
          include: { items: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Auto-consolidate multiple customer invoices into 1 Single Master Running Invoice
    if (customer.invoices.length > 1) {
      const masterInvoice = customer.invoices[0];
      const otherInvoices = customer.invoices.slice(1);

      await prisma.$transaction(async (tx) => {
        let addedSubtotal = 0;
        let addedDiscount = 0;
        let addedTotalAmount = 0;
        let addedPaidAmount = 0;
        let addedDueAmount = 0;

        for (const otherInv of otherInvoices) {
          addedSubtotal += otherInv.subtotal;
          addedDiscount += otherInv.discount;
          addedTotalAmount += otherInv.totalAmount;
          addedPaidAmount += otherInv.paidAmount;
          addedDueAmount += otherInv.dueAmount;

          // Re-point items to master invoice
          await tx.invoiceItem.updateMany({
            where: { invoiceId: otherInv.id },
            data: { invoiceId: masterInvoice.id },
          });

          // Re-point ledger entries to master invoice
          await tx.customerLedger.updateMany({
            where: { invoiceId: otherInv.id },
            data: { invoiceId: masterInvoice.id },
          });

          // Delete secondary invoice
          await tx.invoice.delete({ where: { id: otherInv.id } });
        }

        // Update master invoice totals
        await tx.invoice.update({
          where: { id: masterInvoice.id },
          data: {
            subtotal: { increment: addedSubtotal },
            discount: { increment: addedDiscount },
            totalAmount: { increment: addedTotalAmount },
            paidAmount: { increment: addedPaidAmount },
            dueAmount: { increment: addedDueAmount },
          },
        });
      });

      // Refetch clean customer record with single consolidated master invoice
      customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          ledger: {
            orderBy: { createdAt: 'desc' },
            include: {
              invoice: {
                include: { items: true },
              },
            },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            include: { items: true },
          },
        },
      });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer Ledger GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer ledger' }, { status: 500 });
  }
}
