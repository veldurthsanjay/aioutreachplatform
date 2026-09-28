import { Router, Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const integrationsRouter = Router();

// GET integration status overview
integrationsRouter.get('/', (req: Request, res: Response) => {
  const config = storageService.getIntegrations();

  // Check actual environment variables for connection status
  const aiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const emailKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD;
  const whatsappToken = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;

  const currentStatus = {
    ai: {
      ...config.ai,
      apiKeySet: Boolean(aiKey),
      status: aiKey ? (config.ai.status === 'connected' ? 'connected' : 'requires_config') : 'not_connected',
      provider: config.ai.provider || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : undefined)
    },
    email: {
      ...config.email,
      apiKeySet: Boolean(emailKey),
      senderEmail: process.env.SENDER_EMAIL || config.email.senderEmail || '',
      status: emailKey ? (config.email.status === 'connected' ? 'connected' : 'requires_config') : 'not_connected',
      provider: config.email.provider || (process.env.RESEND_API_KEY ? 'resend' : process.env.SMTP_HOST ? 'smtp' : undefined)
    },
    whatsapp: {
      ...config.whatsapp,
      apiKeySet: Boolean(whatsappToken),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || config.whatsapp.phoneNumberId || '',
      status: (whatsappToken && process.env.WHATSAPP_PHONE_NUMBER_ID) ? (config.whatsapp.status === 'connected' ? 'connected' : 'requires_config') : 'not_connected'
    }
  };

  res.json(currentStatus);
});

// Helper to save key into server/.env
function updateEnvFile(keyValues: Record<string, string>) {
  const envPath = path.join(__dirname, '../../.env');
  let currentEnv = '';
  if (fs.existsSync(envPath)) {
    currentEnv = fs.readFileSync(envPath, 'utf-8');
  }

  const lines = currentEnv.split('\n');
  const parsed: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        parsed[k] = v;
      }
    }
  }

  // Merge new values
  for (const [k, v] of Object.entries(keyValues)) {
    if (v) {
      parsed[k] = v;
      process.env[k] = v; // Update in-memory process.env
    }
  }

  const newContent = Object.entries(parsed)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';

  fs.writeFileSync(envPath, newContent, 'utf-8');
}

// POST save / test AI config
integrationsRouter.post('/ai', async (req: Request, res: Response) => {
  const { provider, apiKey, model } = req.body;
  const config = storageService.getIntegrations();

  if (apiKey) {
    if (provider === 'gemini') {
      updateEnvFile({ GEMINI_API_KEY: apiKey, AI_API_KEY: apiKey });
    } else if (provider === 'openai') {
      updateEnvFile({ OPENAI_API_KEY: apiKey, AI_API_KEY: apiKey });
    } else if (provider === 'anthropic') {
      updateEnvFile({ ANTHROPIC_API_KEY: apiKey, AI_API_KEY: apiKey });
    }
  }

  config.ai = {
    ...config.ai,
    provider: provider || config.ai.provider || 'gemini',
    model: model || config.ai.model || 'gemini-1.5-flash',
    apiKeySet: Boolean(apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY),
    lastTested: new Date().toISOString()
  };

  storageService.saveIntegrations(config);
  wsManager.broadcast('INTEGRATIONS_UPDATED', config);
  res.json({ success: true, config: config.ai });
});

// POST save / test Email config
integrationsRouter.post('/email', async (req: Request, res: Response) => {
  const { provider, apiKey, senderEmail, senderName, smtpHost, smtpPort, smtpUser, smtpPassword } = req.body;
  const config = storageService.getIntegrations();

  const envUpdates: Record<string, string> = {};
  if (senderEmail) envUpdates['SENDER_EMAIL'] = senderEmail;
  if (senderName) envUpdates['SENDER_NAME'] = senderName;

  if (provider === 'resend' && apiKey) {
    envUpdates['RESEND_API_KEY'] = apiKey;
    envUpdates['EMAIL_API_KEY'] = apiKey;
  } else if (provider === 'smtp') {
    if (smtpHost) envUpdates['SMTP_HOST'] = smtpHost;
    if (smtpPort) envUpdates['SMTP_PORT'] = String(smtpPort);
    if (smtpUser) envUpdates['SMTP_USER'] = smtpUser;
    if (smtpPassword) envUpdates['SMTP_PASSWORD'] = smtpPassword;
  }

  updateEnvFile(envUpdates);

  config.email = {
    ...config.email,
    provider: provider || config.email.provider || 'resend',
    senderEmail: senderEmail || config.email.senderEmail || '',
    senderName: senderName || config.email.senderName || '',
    apiKeySet: Boolean(apiKey || process.env.RESEND_API_KEY || process.env.SMTP_PASSWORD),
    lastTested: new Date().toISOString()
  };

  storageService.saveIntegrations(config);
  wsManager.broadcast('INTEGRATIONS_UPDATED', config);
  res.json({ success: true, config: config.email });
});

// POST save / test WhatsApp config
integrationsRouter.post('/whatsapp', async (req: Request, res: Response) => {
  const { apiKey, phoneNumberId, businessAccountId } = req.body;
  const config = storageService.getIntegrations();

  const envUpdates: Record<string, string> = {};
  if (apiKey) envUpdates['WHATSAPP_TOKEN'] = apiKey;
  if (phoneNumberId) envUpdates['WHATSAPP_PHONE_NUMBER_ID'] = phoneNumberId;
  if (businessAccountId) envUpdates['WHATSAPP_BUSINESS_ACCOUNT_ID'] = businessAccountId;

  updateEnvFile(envUpdates);

  config.whatsapp = {
    ...config.whatsapp,
    phoneNumberId: phoneNumberId || config.whatsapp.phoneNumberId,
    businessAccountId: businessAccountId || config.whatsapp.businessAccountId,
    apiKeySet: Boolean(apiKey || process.env.WHATSAPP_TOKEN),
    lastTested: new Date().toISOString()
  };

  storageService.saveIntegrations(config);
  wsManager.broadcast('INTEGRATIONS_UPDATED', config);
  res.json({ success: true, config: config.whatsapp });
});
