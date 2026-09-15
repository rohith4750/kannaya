import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export async function getSmtpTransporter() {
  const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });
  if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    return null;
  }

  const port = settings.smtpPort || 587;
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: port,
    secure: isSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return { transporter, settings };
}

export async function sendCreditLimitExceededAlert({
  customerName,
  customerPhone,
  customerEmail,
  creditLimit,
  currentOutstanding,
  invoiceNo,
}: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  creditLimit: number;
  currentOutstanding: number;
  invoiceNo?: string;
}) {
  try {
    const smtpObj = await getSmtpTransporter();
    if (!smtpObj) {
      console.log('SMTP credentials not configured in Shop Settings. Skipping email alert.');
      return { success: false, error: 'SMTP credentials not configured in Shop Settings' };
    }

    const { transporter, settings } = smtpObj;

    if (settings.enableCreditLimitAlerts === false) {
      console.log('Credit limit email alerts disabled in settings.');
      return { success: false, error: 'Alerts disabled in settings' };
    }

    const recipient = settings.alertRecipientEmail || settings.email || settings.smtpUser;
    if (!recipient) {
      return { success: false, error: 'No recipient email configured for alerts' };
    }

    const exceededAmount = Math.max(0, currentOutstanding - creditLimit);
    const shopName = settings.shopName || 'VENKATA LAKSHMI ELECTRICALS';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 2px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background-color: #991b1b; color: #ffffff; padding: 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0 0; font-size: 12px; opacity: 0.9; }
          .body { padding: 25px; font-size: 14px; line-height: 1.6; }
          .alert-banner { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin-bottom: 20px; color: #991b1b; font-weight: bold; border-radius: 4px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          .table th { background-color: #4a4a4a; color: white; padding: 10px; text-align: left; text-transform: uppercase; font-size: 11px; }
          .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
          .amount-exceeded { color: #dc2626; font-size: 18px; font-weight: 800; }
          .footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>⚠️ CREDIT LIMIT EXCEEDED ALERT</h2>
            <p>${shopName} • Automated Financial Risk Warning</p>
          </div>

          <div class="body">
            <div class="alert-banner">
              🚨 Customer <strong>"${customerName}"</strong> has exceeded their allocated credit limit!
            </div>

            <p>Hello Admin,</p>
            <p>An automated credit limit check was triggered. The outstanding balance for customer <strong>${customerName}</strong> (${customerPhone}) has crossed their allowed limit of <strong>₹${creditLimit.toLocaleString('en-IN')}</strong>.</p>

            <table class="table">
              <tr>
                <th>Customer Name</th>
                <td>${customerName}</td>
              </tr>
              <tr>
                <th>Contact Phone</th>
                <td>${customerPhone}</td>
              </tr>
              ${customerEmail ? `<tr><th>Customer Email</th><td>${customerEmail}</td></tr>` : ''}
              ${invoiceNo ? `<tr><th>Triggered Invoice</th><td>#${invoiceNo}</td></tr>` : ''}
              <tr>
                <th>Configured Credit Limit</th>
                <td>₹${creditLimit.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <th>Current Outstanding Balance</th>
                <td>₹${currentOutstanding.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <th>Exceeded Risk Amount</th>
                <td><span class="amount-exceeded">₹${exceededAmount.toLocaleString('en-IN')}</span></td>
              </tr>
            </table>

            <p style="font-size: 12px; color: #64748b;">
              <strong>Recommended Action:</strong> Please contact the customer to clear pending dues before extending further credit sales.
            </p>
          </div>

          <div class="footer">
            Sent automatically via SMTP by ${shopName} ERP OS System • ${new Date().toLocaleString('en-IN')}
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${shopName} Alerts" <${settings.smtpSenderEmail || settings.smtpUser}>`,
      to: recipient,
      cc: customerEmail && customerEmail.includes('@') ? customerEmail : undefined,
      subject: `⚠️ Credit Limit Exceeded: ${customerName} (₹${exceededAmount.toLocaleString('en-IN')} Over Limit)`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Credit limit alert email sent:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send credit limit alert email:', error);
    return { success: false, error: error.message || 'SMTP Email Sending Failed' };
  }
}

export async function sendTestSmtpEmail(testRecipient: string) {
  try {
    const smtpObj = await getSmtpTransporter();
    if (!smtpObj) {
      return { success: false, error: 'SMTP credentials not configured. Please fill Host, User, and Password.' };
    }

    const { transporter, settings } = smtpObj;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #6d8196; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #6d8196; margin-top: 0;">✅ SMTP Email Test Successful!</h2>
        <p>This is a test notification sent from <strong>${settings.shopName || 'VENKATA LAKSHMI ELECTRICALS'} ERP System</strong>.</p>
        <p>Your SMTP mail configuration is active and working properly.</p>
        <hr style="border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 11px; color: #888;">Timestamp: ${new Date().toLocaleString('en-IN')}</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${settings.shopName || 'Venkata Lakshmi ERP'}" <${settings.smtpSenderEmail || settings.smtpUser}>`,
      to: testRecipient,
      subject: `✅ SMTP Connection Test - ${settings.shopName || 'Venkata Lakshmi ERP'}`,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('SMTP test email failed:', error);
    return { success: false, error: error.message || 'SMTP Connection Error' };
  }
}
