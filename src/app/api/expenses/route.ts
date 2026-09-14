import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('q');

    let whereClause: any = {};
    if (category && category !== 'ALL') {
      whereClause.category = category as ExpenseCategory;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { receiptRef: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { expenseDate: 'desc' },
    });

    // Compute Summary Stats
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayExpenses = expenses.filter((e) => new Date(e.expenseDate) >= startOfToday);
    const monthExpenses = expenses.filter((e) => new Date(e.expenseDate) >= startOfMonth);

    const totalTodayAmount = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalMonthAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalLifetimeAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      expenses,
      summary: {
        totalTodayAmount,
        totalMonthAmount,
        totalLifetimeAmount,
        totalCount: expenses.length,
      },
    });
  } catch (error: any) {
    console.error('Expenses GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      category = 'OTHER',
      amount,
      paymentMethod = 'CASH',
      expenseDate,
      recipientName,
      receiptRef,
      notes,
    } = body;

    if (!title || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Expense title and valid positive amount are required' }, { status: 400 });
    }

    const newExpense = await prisma.expense.create({
      data: {
        title: title.trim(),
        category: category as ExpenseCategory,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod as PaymentMethod,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        recipientName: recipientName?.trim() || null,
        receiptRef: receiptRef?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (error: any) {
    console.error('Expenses POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Expense record deleted successfully' });
  } catch (error: any) {
    console.error('Expenses DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete expense' }, { status: 500 });
  }
}
