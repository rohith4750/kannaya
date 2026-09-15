import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCreditLimitExceededAlert } from '@/lib/mailer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { invoices: true, ledger: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 0. Manual SMTP Email Alert Trigger for Customer Credit Limit
    if (action === 'send-alert') {
      const { customerId } = body;
      if (!customerId) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
      }

      const cust = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!cust) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const alertRes = await sendCreditLimitExceededAlert({
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email || undefined,
        creditLimit: cust.creditLimit,
        currentOutstanding: cust.outstanding,
      });

      if (alertRes.success) {
        return NextResponse.json({
          success: true,
          message: `Credit Limit Exceeded SMTP email alert sent successfully for ${cust.name}!`,
        });
      } else {
        return NextResponse.json({ error: alertRes.error || 'Failed to send SMTP email alert' }, { status: 400 });
      }
    }

    // 1. Record Credit Payment (Clear Balance)
    if (action === 'payment') {
      const { customerId, amount, paymentMethod = 'CASH', notes, paymentDate } = body;
      const payAmt = parseFloat(amount);

      if (!customerId || !payAmt || payAmt <= 0) {
        return NextResponse.json({ error: 'Invalid customer or payment amount' }, { status: 400 });
      }

      const cust = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!cust) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const newOutstanding = Math.max(0, cust.outstanding - payAmt);
      const newTotalPaid = cust.totalPaid + payAmt;

      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          outstanding: newOutstanding,
          totalPaid: newTotalPaid,
        },
      });

      // Create Ledger Entry
      const ledgerEntry = await prisma.customerLedger.create({
        data: {
          customerId,
          type: 'PAYMENT' as any,
          amount: payAmt,
          balance: newOutstanding,
          notes: notes || `Credit Payment received via ${paymentMethod}`,
          createdAt: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        customer: updatedCustomer,
        ledgerEntry,
      });
    }

    // 2. Create New Customer Profile
    const { name, phone, email, address, creditLimit } = body;

    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'Customer with this phone already exists' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 50000,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Customers POST error:', error);
    return NextResponse.json({ error: error.message || 'Customer operation failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, email, address, creditLimit } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
        ...(creditLimit !== undefined && { creditLimit: parseFloat(creditLimit) }),
      },
    });

    // Check if new/updated credit limit is crossed and trigger SMTP alert
    if (updated.outstanding > updated.creditLimit) {
      sendCreditLimitExceededAlert({
        customerName: updated.name,
        customerPhone: updated.phone,
        customerEmail: updated.email || undefined,
        creditLimit: updated.creditLimit,
        currentOutstanding: updated.outstanding,
      }).catch((e) => console.error('SMTP alert trigger error:', e));
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Customers PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ledgerId = searchParams.get('ledgerId');

    if (ledgerId) {
      const entry = await prisma.customerLedger.findUnique({ where: { id: ledgerId } });
      if (entry) {
        if (entry.type === 'PAYMENT') {
          const cust = await prisma.customer.findUnique({ where: { id: entry.customerId } });
          if (cust) {
            await prisma.customer.update({
              where: { id: entry.customerId },
              data: {
                outstanding: cust.outstanding + entry.amount,
                totalPaid: Math.max(0, cust.totalPaid - entry.amount),
              },
            });
          }
        }
        await prisma.customerLedger.delete({ where: { id: ledgerId } });
        return NextResponse.json({ success: true });
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Customer ID or Ledger ID required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Unlink existing invoices so invoice history is preserved with customerName and customerPhone
      await tx.invoice.updateMany({
        where: { customerId: id },
        data: { customerId: null },
      });

      // 2. Delete customer ledger entries
      await tx.customerLedger.deleteMany({
        where: { customerId: id },
      });

      // 3. Delete customer record
      await tx.customer.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Customers DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
