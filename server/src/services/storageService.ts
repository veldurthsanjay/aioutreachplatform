import fs from 'fs';
import path from 'path';
import {
  Campaign,
  Lead,
  MessageItem,
  Conversation,
  FollowUpSequence,
  IntegrationConfig,
  AppSettings
} from '../types';

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filePath = getFilePath(filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) {
      return defaultValue;
    }
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = getFilePath(filename);
  const tempPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    // Fallback direct write
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

// Default states
const defaultSettings: AppSettings = {
  dailyEmailLimit: 50,
  dailyWhatsAppLimit: 50,
  delayBetweenMessagesSec: 5,
  aiTemperature: 0.7,
  autoClassifyReplies: true,
  stopFollowUpOnReply: true,
};

const defaultIntegrations: IntegrationConfig = {
  ai: {
    status: 'not_connected',
    apiKeySet: false
  },
  email: {
    status: 'not_connected',
    apiKeySet: false
  },
  whatsapp: {
    status: 'not_connected',
    apiKeySet: false
  }
};

export const storageService = {
  // Campaigns
  getCampaigns(): Campaign[] {
    return readJsonFile<Campaign[]>('campaigns.json', []);
  },
  saveCampaigns(campaigns: Campaign[]): void {
    writeJsonFile('campaigns.json', campaigns);
  },

  // Leads
  getLeads(): Lead[] {
    return readJsonFile<Lead[]>('leads.json', []);
  },
  saveLeads(leads: Lead[]): void {
    writeJsonFile('leads.json', leads);
  },

  // Messages
  getMessages(): MessageItem[] {
    return readJsonFile<MessageItem[]>('messages.json', []);
  },
  saveMessages(messages: MessageItem[]): void {
    writeJsonFile('messages.json', messages);
  },

  // Conversations
  getConversations(): Conversation[] {
    return readJsonFile<Conversation[]>('conversations.json', []);
  },
  saveConversations(conversations: Conversation[]): void {
    writeJsonFile('conversations.json', conversations);
  },

  // Follow-ups
  getFollowUps(): FollowUpSequence[] {
    return readJsonFile<FollowUpSequence[]>('followups.json', []);
  },
  saveFollowUps(followups: FollowUpSequence[]): void {
    writeJsonFile('followups.json', followups);
  },

  // Settings
  getSettings(): AppSettings {
    return readJsonFile<AppSettings>('settings.json', defaultSettings);
  },
  saveSettings(settings: AppSettings): void {
    writeJsonFile('settings.json', settings);
  },

  // Integrations
  getIntegrations(): IntegrationConfig {
    return readJsonFile<IntegrationConfig>('integrations.json', defaultIntegrations);
  },
  saveIntegrations(integrations: IntegrationConfig): void {
    writeJsonFile('integrations.json', integrations);
  }
};
