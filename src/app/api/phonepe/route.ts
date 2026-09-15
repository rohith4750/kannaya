import { NextResponse } from 'next/server';
import { createPhonePePayTransaction, checkPhonePeTransactionStatus, getPhonePeConfig } from '@/lib/phonepe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantTransactionId = searchParams.get('txnId');

    if (!merchantTransactionId) {
      const config = await getPhonePeConfig();
      return NextResponse.json(config);
    }

    const status = await checkPhonePeTransactionStatus(merchantTransactionId);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('PhonePe GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to check PhonePe status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, transactionId, customerMobile, note, redirectUrl } = body;

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const txnResult = await createPhonePePayTransaction({
      amount: amt,
      transactionId: transactionId || `TXN_${Date.now()}`,
      customerMobile,
      note,
      redirectUrl,
    });

    return NextResponse.json(txnResult);
  } catch (error: any) {
    console.error('PhonePe POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate PhonePe transaction' }, { status: 500 });
  }
}
