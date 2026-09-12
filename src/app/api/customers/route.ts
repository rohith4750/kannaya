import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // 1. Record Credit Payment (Clear Balance)
    if (action === 'payment') {
      const { customerId, amount, paymentMethod = 'CASH', notes } = body;
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
