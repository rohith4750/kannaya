import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface PhonePePayParams {
  amount: number; // in INR
  transactionId: string;
  customerMobile?: string;
  note?: string;
  redirectUrl?: string;
}

export async function getPhonePeConfig() {
  const settings: any = await prisma.shopSettings.findFirst({ where: { id: 'default' } });
  
  const merchantId = settings?.phonepeMerchantId || process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
  const saltKey = settings?.phonepeSaltKey || process.env.PHONEPE_SALT_KEY || '099eb0cd-02fe-4eeb-a721-4343f443a2ad';
  const saltIndex = settings?.phonepeSaltIndex || Number(process.env.PHONEPE_SALT_INDEX) || 1;
  const env = (settings?.phonepeEnv || process.env.PHONEPE_ENV || 'UAT').toUpperCase();
  const vpa = settings?.phonepeVpa || settings?.upiId || '9876543210@ybl';
  const enabled = settings?.enablePhonePe ?? true;

  const baseUrl = env === 'PRODUCTION'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

  return {
    merchantId,
    saltKey,
    saltIndex,
    env,
    vpa,
    baseUrl,
    enabled,
    shopName: settings?.shopName || 'SRI VENKATA LAKSHMI ELECTRICALS',
  };
}

/**
 * Generate standard UPI QR URL for PhonePe, Paytm, Google Pay, BHIM apps
 */
export function generateUpiQrUrl(params: { vpa: string; payeeName: string; amount: number; transactionId: string; note?: string }): string {
  const { vpa, payeeName, amount, transactionId, note } = params;
  const encodedName = encodeURIComponent(payeeName || 'Electrical Store');
  const encodedNote = encodeURIComponent(note || `Bill Payment - ${transactionId}`);
  const amtFormatted = amount.toFixed(2);
  
  return `upi://pay?pa=${vpa}&pn=${encodedName}&am=${amtFormatted}&tr=${transactionId}&cu=INR&tn=${encodedNote}`;
}

/**
 * Initiate PhonePe Payment Gateway Transaction (/pg/v1/pay)
 */
export async function createPhonePePayTransaction(params: PhonePePayParams) {
  const config = await getPhonePeConfig();
  
  // Amount in Paise (INR * 100)
  const amountInPaise = Math.round(params.amount * 100);
  const merchantTransactionId = params.transactionId || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId,
    merchantUserId: `CUST_${Date.now()}`,
    amount: amountInPaise,
    redirectUrl: params.redirectUrl || 'http://localhost:3000/invoices',
    redirectMode: 'REDIRECT',
    callbackUrl: 'http://localhost:3000/api/phonepe/callback',
    mobileNumber: params.customerMobile ? params.customerMobile.replace(/\D/g, '').slice(-10) : '9999999999',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const apiPath = '/pg/v1/pay';
  const checksumString = base64Payload + apiPath + config.saltKey;

  const sha256 = crypto.createHash('sha256').update(checksumString).digest('hex');
  const xVerify = `${sha256}###${config.saltIndex}`;

  const response = await fetch(`${config.baseUrl}${apiPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': xVerify,
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  const responseData = await response.json();

  const upiQrString = generateUpiQrUrl({
    vpa: config.vpa,
    payeeName: config.shopName,
    amount: params.amount,
    transactionId: merchantTransactionId,
    note: params.note,
  });

  return {
    success: responseData.success ?? true,
    merchantTransactionId,
    redirectUrl: responseData.data?.instrumentResponse?.redirectInfo?.url || null,
    upiQrString,
    vpa: config.vpa,
    raw: responseData,
  };
}

/**
 * Check PhonePe Transaction Status (/pg/v1/status/{merchantId}/{merchantTransactionId})
 */
export async function checkPhonePeTransactionStatus(merchantTransactionId: string) {
  const config = await getPhonePeConfig();
  const apiPath = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;
  
  const checksumString = apiPath + config.saltKey;
  const sha256 = crypto.createHash('sha256').update(checksumString).digest('hex');
  const xVerify = `${sha256}###${config.saltIndex}`;

  try {
    const response = await fetch(`${config.baseUrl}${apiPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': config.merchantId,
      },
    });

    const data = await response.json();
    return {
      success: data.success,
      code: data.code,
      state: data.data?.state || 'UNKNOWN',
      amount: data.data?.amount ? data.data.amount / 100 : 0,
      transactionId: merchantTransactionId,
      providerReferenceId: data.data?.providerReferenceId || null,
      message: data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      code: 'ERROR',
      state: 'FAILED',
      amount: 0,
      transactionId: merchantTransactionId,
      message: error.message,
    };
  }
}
