import { NextResponse } from 'next/server';
import {
  getWhatsAppGatewayState,
  initializeWhatsAppGateway,
  disconnectWhatsAppGateway,
  sendWhatsAppGatewayMessage,
} from '@/lib/whatsapp-gateway';

export async function GET() {
  try {
    const currentState = getWhatsAppGatewayState();
    
    // If disconnected, trigger initialization in background to get QR code if needed
    if (currentState.status === 'DISCONNECTED') {
      initializeWhatsAppGateway();
    }

    return NextResponse.json(getWhatsAppGatewayState());
  } catch (error: any) {
    console.error('WhatsApp Gateway GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch gateway status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, message } = body;

    if (action === 'connect') {
      const state = await initializeWhatsAppGateway(true);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'disconnect') {
      const ok = await disconnectWhatsAppGateway();
      return NextResponse.json({ success: ok });
    }

    if (action === 'send-test') {
      if (!phone || !message) {
        return NextResponse.json({ error: 'Phone number and message text are required' }, { status: 400 });
      }

      const res = await sendWhatsAppGatewayMessage(phone, message);
      if (res.success) {
        return NextResponse.json({ success: true, messageId: res.messageId });
      } else {
        return NextResponse.json({ error: res.error || 'Failed to send WhatsApp message' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('WhatsApp Gateway POST error:', error);
    return NextResponse.json({ error: error.message || 'Gateway operation failed' }, { status: 500 });
  }
}
