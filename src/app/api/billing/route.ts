import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LedgerType, PaymentMethod } from '@prisma/client';
import { sendCreditLimitExceededAlert } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount = 0,
      tax = 0,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMethod = 'CASH',
      invoiceDate,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart items cannot be empty' }, { status: 400 });
    }

    const customDate = invoiceDate ? new Date(invoiceDate) : new Date();

    // Generate Invoice Number
    const count = await prisma.invoice.count();
    const invoiceNo = `INV-${customDate.getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    // Perform database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Collect item variant / product IDs
      const itemVariantIds = items
        .map((it: any) => it.variantId || it.id)
        .filter((id: any) => typeof id === 'string' && id.trim().length > 0);

      const dbVariants = await tx.productVariant.findMany({
        where: { id: { in: itemVariantIds } },
        include: { product: true, rack: true },
      });
      const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

      let invoice: any = null;

      // Check running invoice for customer
      if (customerId) {
        const existingInvoice = await tx.invoice.findFirst({
          where: { customerId },
          orderBy: { createdAt: 'asc' },
        });

        if (existingInvoice) {
          for (const item of items) {
            const vId = item.variantId || item.id;
            const dbVariant = variantMap.get(vId);
            const pId = dbVariant ? dbVariant.productId : (item.productId || null);

            await tx.invoiceItem.create({
              data: {
                invoiceId: existingInvoice.id,
                productId: pId,
                variantId: dbVariant ? dbVariant.id : null,
                productName: item.name || (dbVariant ? `${dbVariant.product.name} (${dbVariant.variantName})` : 'Item'),
                unit: item.unit || dbVariant?.product.unit || 'pcs',
                price: parseFloat(item.sellingPrice),
                quantity: parseFloat(item.quantity),
                total: parseFloat(item.sellingPrice) * parseFloat(item.quantity),
                rackLocation: dbVariant?.rack
                  ? `${dbVariant.rack.rackName} ${dbVariant.rack.shelfCode}`
                  : (item.rackLocation || 'Default'),
                createdAt: customDate,
              },
            });
          }

          invoice = await tx.invoice.update({
            where: { id: existingInvoice.id },
            data: {
              subtotal: { increment: parseFloat(subtotal) },
              discount: { increment: parseFloat(discount) },
              tax: { increment: parseFloat(tax) },
              totalAmount: { increment: parseFloat(totalAmount) },
              paidAmount: { increment: parseFloat(paidAmount) },
              dueAmount: { increment: parseFloat(dueAmount) },
            },
            include: { items: true },
          });
        }
      }

      // New invoice if no running invoice
      if (!invoice) {
        invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            customerId: customerId || null,
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || 'N/A',
            subtotal: parseFloat(subtotal),
            discount: parseFloat(discount),
            tax: parseFloat(tax),
            totalAmount: parseFloat(totalAmount),
            paidAmount: parseFloat(paidAmount),
            dueAmount: parseFloat(dueAmount),
            paymentMethod: paymentMethod as PaymentMethod,
            status: 'COMPLETED',
            createdAt: customDate,
            items: {
              create: items.map((item: any) => {
                const vId = item.variantId || item.id;
                const dbVariant = variantMap.get(vId);
                const pId = dbVariant ? dbVariant.productId : (item.productId || null);

                return {
                  productId: pId,
                  variantId: dbVariant ? dbVariant.id : null,
                  productName: item.name || (dbVariant ? `${dbVariant.product.name} (${dbVariant.variantName})` : 'Item'),
                  unit: item.unit || dbVariant?.product.unit || 'pcs',
                  price: parseFloat(item.sellingPrice),
                  quantity: parseFloat(item.quantity),
                  total: parseFloat(item.sellingPrice) * parseFloat(item.quantity),
                  rackLocation: dbVariant?.rack
                    ? `${dbVariant.rack.rackName} ${dbVariant.rack.shelfCode}`
                    : (item.rackLocation || 'Default'),
                  createdAt: customDate,
                };
              }),
            },
          },
          include: {
            items: true,
          },
        });
      }

      // 2. Deduct variant stock
      for (const item of items) {
        const vId = item.variantId || item.id;
        const dbVariant = variantMap.get(vId);

        if (dbVariant) {
          try {
            await tx.productVariant.update({
              where: { id: dbVariant.id },
              data: {
                stockQuantity: {
                  decrement: parseFloat(item.quantity),
                },
              },
            });
          } catch (err) {
            console.warn(`Skipping variant stock deduction for: ${dbVariant.id}`);
          }
        }
      }

      // 3. Customer Udhar & Ledger Update
      let updatedCustomer = null;
      if (customerId) {
        const cust = await tx.customer.findUnique({ where: { id: customerId } });
        if (cust) {
          const newOutstanding = cust.outstanding + parseFloat(dueAmount);
          const newTotalPurchases = cust.totalPurchases + parseFloat(totalAmount);
          const newTotalPaid = cust.totalPaid + parseFloat(paidAmount);

          updatedCustomer = await tx.customer.update({
            where: { id: customerId },
            data: {
              outstanding: newOutstanding,
              totalPurchases: newTotalPurchases,
              totalPaid: newTotalPaid,
            },
          });

          await tx.customerLedger.create({
            data: {
              customerId,
              type: LedgerType.SALE,
              amount: parseFloat(totalAmount),
              balance: newOutstanding,
              notes: `Items added to Invoice #${invoice.invoiceNo} (${paymentMethod} Sale: Paid ₹${paidAmount}, Due ₹${dueAmount})`,
              invoiceId: invoice.id,
              createdAt: customDate,
            },
          });

          if (parseFloat(paidAmount) > 0) {
            await tx.customerLedger.create({
              data: {
                customerId,
                type: LedgerType.PAYMENT,
                amount: parseFloat(paidAmount),
                balance: newOutstanding,
                notes: `Payment for Invoice #${invoice.invoiceNo} via ${paymentMethod}`,
                invoiceId: invoice.id,
                createdAt: customDate,
              },
            });
          }
        }
      }

      return { invoice, customer: updatedCustomer };
    });

    let creditLimitExceededAlertSent = false;
    if (result.customer && result.customer.outstanding > result.customer.creditLimit) {
      creditLimitExceededAlertSent = true;
      sendCreditLimitExceededAlert({
        customerName: result.customer.name,
        customerPhone: result.customer.phone,
        customerEmail: result.customer.email || undefined,
        creditLimit: result.customer.creditLimit,
        currentOutstanding: result.customer.outstanding,
        invoiceNo: result.invoice.invoiceNo,
      }).catch((e) => console.error('Background SMTP Alert error:', e));
    }

    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      customer: result.customer,
      creditLimitExceededAlertSent,
      settings,
    });
  } catch (error: any) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: error.message || 'Billing process failed' }, { status: 500 });
  }
}
