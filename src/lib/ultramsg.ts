import { prisma } from '@/lib/prisma';

export async function sendUltraMsgWhatsApp(
  phone: string,
  body: string,
  imageUrl?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const settings = (await prisma.shopSettings.findFirst({ where: { id: 'default' } })) as any;
    const instanceId = settings?.ultraMsgInstanceId || 'instance191882';
    const token = settings?.ultraMsgToken || 'nf1d6jqukm5blsc0';

    if (!instanceId || !token) {
      return { success: false, error: 'UltraMsg Instance ID or Token is missing in Settings.' };
    }

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    const targetImageUrl = imageUrl || settings?.logoUrl;

    let response;
    // If a valid external HTTP/HTTPS logo image URL is provided, send as image + caption
    if (targetImageUrl && (targetImageUrl.startsWith('http://') || targetImageUrl.startsWith('https://'))) {
      const url = `https://api.ultramsg.com/${instanceId}/messages/image`;
      const params = new URLSearchParams();
      params.append('token', token);
      params.append('to', cleanPhone);
      params.append('image', targetImageUrl);
      params.append('caption', body);
      params.append('priority', '10');

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } else {
      // Standard chat text message
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const params = new URLSearchParams();
      params.append('token', token);
      params.append('to', cleanPhone);
      params.append('body', body);
      params.append('priority', '10');

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    }

    const data = await response.json();

    if (response.ok && (data.sent === 'true' || data.sent === true || data.id)) {
      return { success: true, id: data.id };
    } else {
      // Fallback: If image dispatch failed, retry as chat text message
      if (targetImageUrl && (targetImageUrl.startsWith('http://') || targetImageUrl.startsWith('https://'))) {
        const fallbackUrl = `https://api.ultramsg.com/${instanceId}/messages/chat`;
        const params = new URLSearchParams();
        params.append('token', token);
        params.append('to', cleanPhone);
        params.append('body', body);
        params.append('priority', '10');

        const fbResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const fbData = await fbResponse.json();
        if (fbResponse.ok && (fbData.sent === 'true' || fbData.sent === true || fbData.id)) {
          return { success: true, id: fbData.id };
        }
      }
      console.error('UltraMsg send error:', data);
      return { success: false, error: data.error || data.message || 'UltraMsg failed to deliver message' };
    }
  } catch (error: any) {
    console.error('UltraMsg request exception:', error);
    return { success: false, error: error.message || 'UltraMsg connection error' };
  }
}
