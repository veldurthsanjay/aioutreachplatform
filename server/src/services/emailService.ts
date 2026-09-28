import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { storageService } from './storageService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
}

export const emailService = {
  createTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465');
    const user = process.env.SMTP_USER || process.env.SENDER_EMAIL || 'dnkn93044@gmail.com';
    const rawPass = process.env.SMTP_PASSWORD || '';
    const pass = rawPass.replace(/\s+/g, ''); // Remove spaces from Google app password

    if (!user || !pass) {
      throw new Error('SMTP user or password not configured in environment variables');
    }

    const isSecure = port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  },

  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (error: any) {
      console.error('[SMTP Verification Error]:', error.message);
      return { success: false, message: error.message || 'Failed to connect to SMTP server' };
    }
  },

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const user = process.env.SMTP_USER || process.env.SENDER_EMAIL || 'dnkn93044@gmail.com';
    const fromName = options.fromName || process.env.SENDER_NAME || 'AI Outreach';
    const from = `"${fromName}" <${user}>`;

    const transporter = this.createTransporter();

    try {
      // Convert plain text newlines to clean HTML if needed
      const htmlBody = options.body.replace(/\n/g, '<br/>');

      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.body,
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222;">${htmlBody}</div>`
      });

      console.log(`[Email Sent]: Message ID ${info.messageId} to ${options.to}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error: any) {
      console.error('[Email Send Error]:', error.message);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
};
