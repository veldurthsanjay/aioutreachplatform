import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface SendWhatsAppOptions {
  to: string; // Recipient phone number with country code (e.g., 919876543210 or 15551234567)
  text: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  method?: 'cloud_api' | 'wa_me_link';
  link?: string;
  response?: any;
  error?: string;
}

export const whatsappService = {
  // Format clean phone number
  cleanPhoneNumber(raw: string): string {
    let clean = (raw || '').replace(/[^0-9]/g, '');
    // If 10 digits and starts with 9/8/7/6 (Indian number), prefix 91 if no country code
    if (clean.length === 10) {
      clean = '91' + clean;
    }
    return clean;
  },

  // Generate direct click-to-chat WhatsApp link
  getWhatsAppWebLink(to: string, text: string): string {
    const cleanPhone = this.cleanPhoneNumber(to);
    const encodedText = encodeURIComponent(text || '');
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  },

  async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const cleanPhone = this.cleanPhoneNumber(options.to);

    if (!cleanPhone) {
      throw new Error('Invalid recipient phone number');
    }

    // 1. If Meta Cloud API credentials are provided, dispatch via Meta Graph API
    if (token && phoneNumberId) {
      const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: options.text
        }
      };

      try {
        const response = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        });

        const messageId = response.data?.messages?.[0]?.id || `wa-${Date.now()}`;
        console.log(`[WhatsApp Sent via Meta API]: Message ID ${messageId} to ${cleanPhone}`);

        return {
          success: true,
          messageId,
          method: 'cloud_api',
          response: response.data
        };
      } catch (error: any) {
        console.error('[WhatsApp Cloud API Error]:', error.response?.data || error.message);
        const errMsg = error.response?.data?.error?.message || error.message || 'Meta Cloud API delivery failed';
        throw new Error(`WhatsApp Meta API error: ${errMsg}`);
      }
    }

    // 2. If Meta Cloud API credentials are not set, return clear error and wa.me link
    const waLink = this.getWhatsAppWebLink(options.to, options.text);
    throw new Error(
      `Meta Cloud API Token & Phone Number ID not configured in Integrations. Use 1-Click "Send via WhatsApp Web" (wa.me) or configure Meta Cloud API keys.`
    );
  }
};
