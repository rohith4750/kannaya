import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export interface WhatsAppGatewayState {
  socket?: any;
  status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED';
  qrCodeDataUrl: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  lastError: string | null;
}

const AUTH_DIR = path.join(process.cwd(), '.whatsapp-auth');

// Extend globalThis for HMR singleton persistence across Next.js dev reloads
const globalForWhatsApp = globalThis as unknown as {
  waState: WhatsAppGatewayState;
  waInitializing: boolean;
};

if (!globalForWhatsApp.waState) {
  globalForWhatsApp.waState = {
    socket: null,
    status: 'DISCONNECTED',
    qrCodeDataUrl: null,
    connectedPhone: null,
    connectedName: null,
    lastError: null,
  };
}

export function getWhatsAppGatewayState(): WhatsAppGatewayState {
  return {
    status: globalForWhatsApp.waState.status,
    qrCodeDataUrl: globalForWhatsApp.waState.qrCodeDataUrl,
    connectedPhone: globalForWhatsApp.waState.connectedPhone,
    connectedName: globalForWhatsApp.waState.connectedName,
    lastError: globalForWhatsApp.waState.lastError,
  };
}

export async function initializeWhatsAppGateway(forceReconnect = false): Promise<WhatsAppGatewayState> {
  if (globalForWhatsApp.waInitializing) {
    return getWhatsAppGatewayState();
  }

  if (globalForWhatsApp.waState.status === 'CONNECTED' && !forceReconnect) {
    return getWhatsAppGatewayState();
  }

  try {
    globalForWhatsApp.waInitializing = true;
    globalForWhatsApp.waState.status = 'CONNECTING';

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as [number, number, number] }));

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Sri Venkata Lakshmi ERP', 'Chrome', '1.0.0'],
    });

    globalForWhatsApp.waState.socket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr);
          globalForWhatsApp.waState.qrCodeDataUrl = qrDataUrl;
          globalForWhatsApp.waState.status = 'QR_READY';
        } catch (err: any) {
          console.error('QR code generation error:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        globalForWhatsApp.waState.status = 'DISCONNECTED';
        globalForWhatsApp.waState.qrCodeDataUrl = null;
        globalForWhatsApp.waState.socket = null;
        globalForWhatsApp.waState.lastError = lastDisconnect?.error?.message || 'Connection closed';

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {
            console.error('Error clearing auth dir:', e);
          }
        }

        if (shouldReconnect) {
          console.log('WhatsApp connection closed.');
          globalForWhatsApp.waInitializing = false;
        } else {
          globalForWhatsApp.waInitializing = false;
        }
      } else if (connection === 'open') {
        console.log('WhatsApp Web Gateway Connected Successfully!');
        const jid = sock.user?.id || '';
        const phoneNum = jid.split(':')[0] || jid.split('@')[0] || '';

        globalForWhatsApp.waState.status = 'CONNECTED';
        globalForWhatsApp.waState.qrCodeDataUrl = null;
        globalForWhatsApp.waState.connectedPhone = phoneNum;
        globalForWhatsApp.waState.connectedName = sock.user?.name || 'Venkata Lakshmi ERP';
        globalForWhatsApp.waState.lastError = null;
        globalForWhatsApp.waInitializing = false;
      }
    });

    return getWhatsAppGatewayState();
  } catch (error: any) {
    console.error('Failed to initialize WhatsApp Gateway:', error);
    globalForWhatsApp.waState.status = 'DISCONNECTED';
    globalForWhatsApp.waState.lastError = error.message;
    globalForWhatsApp.waInitializing = false;
    return getWhatsAppGatewayState();
  }
}

export async function disconnectWhatsAppGateway(): Promise<boolean> {
  try {
    if (globalForWhatsApp.waState.socket) {
      await globalForWhatsApp.waState.socket.logout().catch(() => {});
      globalForWhatsApp.waState.socket.end(undefined);
    }
    globalForWhatsApp.waState.socket = null;
    globalForWhatsApp.waState.status = 'DISCONNECTED';
    globalForWhatsApp.waState.qrCodeDataUrl = null;
    globalForWhatsApp.waState.connectedPhone = null;

    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
    return true;
  } catch (e) {
    console.error('Logout error:', e);
    return false;
  }
}

export async function sendWhatsAppGatewayMessage(
  phone: string,
  textMessage: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (globalForWhatsApp.waState.status !== 'CONNECTED' || !globalForWhatsApp.waState.socket) {
      if (fs.existsSync(AUTH_DIR)) {
        await initializeWhatsAppGateway();
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    const sock = globalForWhatsApp.waState.socket;
    if (!sock || globalForWhatsApp.waState.status !== 'CONNECTED') {
      return { success: false, error: 'WhatsApp Web Gateway is not connected. Scan QR code in Settings.' };
    }

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const recipientJid = `${cleanPhone}@s.whatsapp.net`;
    const result = await sock.sendMessage(recipientJid, { text: textMessage });

    return { success: true, messageId: result?.key?.id || 'sent' };
  } catch (error: any) {
    console.error('Error sending WhatsApp Gateway message:', error);
    return { success: false, error: error.message || 'Failed to send WhatsApp message' };
  }
}
