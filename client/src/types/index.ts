export type NavigationTab =
  | 'dashboard'
  | 'campaigns'
  | 'leads'
  | 'messages'
  | 'outreach'
  | 'conversations'
  | 'followups'
  | 'integrations'
  | 'settings';

export type ChannelType = 'email' | 'whatsapp' | 'both';
export type LeadStatus = 'new' | 'message_generated' | 'approved' | 'queued' | 'sending' | 'sent' | 'replied' | 'failed' | 'do_not_contact';
export type MessageStatus = 'draft' | 'approved' | 'rejected' | 'queued' | 'sending' | 'sent' | 'failed';

export interface Campaign {
  id: string;
  name: string;
  product: string;
  audience: string;
  objective: string;
  instructions: string;
  tone: string;
  channel: ChannelType;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  campaignId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  category?: string;
  location?: string;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageItem {
  id: string;
  campaignId: string;
  leadId: string;
  channel: 'email' | 'whatsapp';
  subject?: string;
  body: string;
  status: MessageStatus;
  errorReason?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'lead' | 'system';
  content: string;
  channel: 'email' | 'whatsapp';
  timestamp: string;
}

export interface Conversation {
  id: string;
  leadId: string;
  campaignId: string;
  channel: 'email' | 'whatsapp';
  messages: ConversationMessage[];
  sentiment?: 'positive' | 'neutral' | 'negative' | 'question' | 'objection' | 'unsubscribe' | 'interested';
  suggestedReply?: string;
  unread: boolean;
  lastUpdated: string;
  lead?: Lead;
  campaign?: Campaign;
}

export interface FollowUpStep {
  stepNumber: number;
  waitDays: number;
  channel: 'email' | 'whatsapp';
  instructions: string;
}

export interface FollowUpSequence {
  id: string;
  campaignId: string;
  campaignName?: string;
  name: string;
  steps: FollowUpStep[];
  active: boolean;
  createdAt: string;
}

export interface IntegrationConfig {
  ai: {
    status: 'connected' | 'not_connected' | 'requires_config';
    provider?: 'openrouter' | 'gemini' | 'openai' | 'anthropic' | 'groq';
    model?: string;
    apiKeySet: boolean;
    lastTested?: string;
    errorMessage?: string;
  };
  email: {
    status: 'connected' | 'not_connected' | 'requires_config';
    provider?: 'smtp' | 'resend' | 'gmail';
    senderEmail?: string;
    senderName?: string;
    apiKeySet: boolean;
    lastTested?: string;
    errorMessage?: string;
  };
  whatsapp: {
    status: 'connected' | 'not_connected' | 'requires_config';
    phoneNumberId?: string;
    businessAccountId?: string;
    apiKeySet: boolean;
    lastTested?: string;
    errorMessage?: string;
  };
}

export interface AppSettings {
  dailyEmailLimit: number;
  dailyWhatsAppLimit: number;
  delayBetweenMessagesSec: number;
  aiTemperature: number;
  autoClassifyReplies: boolean;
  stopFollowUpOnReply: boolean;
}

export interface DashboardStats {
  totalCampaigns: number;
  totalLeads: number;
  leadsByStatus: Record<LeadStatus, number>;
  totalMessagesGenerated: number;
  messagesApproved: number;
  messagesSent: number;
  messagesFailed: number;
  totalConversations: number;
  replyRatePercent: number;
  activeFollowUps: number;
  integrationsStatus: {
    ai: string;
    email: string;
    whatsapp: string;
  };
}
