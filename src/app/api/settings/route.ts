import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTestSmtpEmail } from '@/lib/mailer';

export async function GET() {
  try {
    let settings = await prisma.shopSettings.findFirst({
      where: { id: 'default' },
    });

    if (!settings) {
      const defaultData: any = {
        id: 'default',
        shopName: 'VENKATA LAKSHMI ELECTRONICS',
        tagline: 'Complete Electrical & Hardware Solutions',
        phone: '+91 98765 43210',
        email: 'info@venkatalakshmi.com',
        address: 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001',
        gstin: '36ABCDE1234F1Z5',
        printerType: '80mm',
        defaultGstPercent: 18,
        defaultHsnCode: '8544',
        termsConditions: 'Goods once sold will not be taken back or exchanged. Subject to local jurisdiction.',
        bankDetails: 'State Bank of India A/C: 1234567890 | IFSC: SBIN0001234',
        upiId: '9876543210@paytm',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        enableCreditLimitAlerts: true,
      };

      settings = await prisma.shopSettings.create({
        data: defaultData,
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, recipientEmail } = body;

    if (action === 'test-smtp') {
      const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });
      const target = recipientEmail || settings?.alertRecipientEmail || settings?.email || settings?.smtpUser;

      if (!target) {
        return NextResponse.json({ error: 'Recipient email is required for SMTP test' }, { status: 400 });
      }

      const res = await sendTestSmtpEmail(target);
      if (res.success) {
        return NextResponse.json({ success: true, message: `Test email sent successfully to ${target}` });
      } else {
        return NextResponse.json({ error: res.error || 'Failed to send test email' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      shopName,
      tagline,
      phone,
      email,
      address,
      gstin,
      printerType,
      defaultGstPercent,
      defaultHsnCode,
      termsConditions,
      bankDetails,
      upiId,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSenderEmail,
      alertRecipientEmail,
      enableCreditLimitAlerts,
    } = body;

    const updatePayload: any = {
      ...(shopName !== undefined && { shopName: shopName.trim() }),
      ...(tagline !== undefined && { tagline: tagline.trim() }),
      ...(phone !== undefined && { phone: phone.trim() }),
      ...(email !== undefined && { email: email.trim() }),
      ...(address !== undefined && { address: address.trim() }),
      ...(gstin !== undefined && { gstin: gstin.trim() }),
      ...(printerType !== undefined && { printerType }),
      ...(defaultGstPercent !== undefined && { defaultGstPercent: parseFloat(defaultGstPercent) || 0 }),
      ...(defaultHsnCode !== undefined && { defaultHsnCode: defaultHsnCode.trim() }),
      ...(termsConditions !== undefined && { termsConditions: termsConditions.trim() }),
      ...(bankDetails !== undefined && { bankDetails: bankDetails.trim() }),
      ...(upiId !== undefined && { upiId: upiId.trim() }),
      ...(smtpHost !== undefined && { smtpHost: smtpHost.trim() }),
      ...(smtpPort !== undefined && { smtpPort: parseInt(smtpPort) || 587 }),
      ...(smtpUser !== undefined && { smtpUser: smtpUser.trim() }),
      ...(smtpPass !== undefined && { smtpPass: smtpPass.trim() }),
      ...(smtpSenderEmail !== undefined && { smtpSenderEmail: smtpSenderEmail.trim() }),
      ...(alertRecipientEmail !== undefined && { alertRecipientEmail: alertRecipientEmail.trim() }),
      ...(enableCreditLimitAlerts !== undefined && { enableCreditLimitAlerts: !!enableCreditLimitAlerts }),
    };

    const createPayload: any = {
      id: 'default',
      shopName: shopName?.trim() || 'VENKATA LAKSHMI ELECTRONICS',
      tagline: tagline?.trim() || 'Complete Electrical & Hardware Solutions',
      phone: phone?.trim() || '+91 98765 43210',
      email: email?.trim() || 'info@venkatalakshmi.com',
      address: address?.trim() || 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001',
      gstin: gstin?.trim() || '36ABCDE1234F1Z5',
      printerType: printerType || '80mm',
      defaultGstPercent: defaultGstPercent !== undefined ? parseFloat(defaultGstPercent) : 18,
      defaultHsnCode: defaultHsnCode?.trim() || '8544',
      termsConditions: termsConditions?.trim() || 'Goods once sold will not be taken back or exchanged.',
      bankDetails: bankDetails?.trim() || '',
      upiId: upiId?.trim() || '',
      smtpHost: smtpHost?.trim() || 'smtp.gmail.com',
      smtpPort: smtpPort ? parseInt(smtpPort) : 587,
      smtpUser: smtpUser?.trim() || '',
      smtpPass: smtpPass?.trim() || '',
      smtpSenderEmail: smtpSenderEmail?.trim() || '',
      alertRecipientEmail: alertRecipientEmail?.trim() || '',
      enableCreditLimitAlerts: enableCreditLimitAlerts !== undefined ? !!enableCreditLimitAlerts : true,
    };

    const settings = await prisma.shopSettings.upsert({
      where: { id: 'default' },
      update: updatePayload,
      create: createPayload,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
