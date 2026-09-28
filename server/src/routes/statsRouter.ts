import { Router, Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { DashboardStats, LeadStatus } from '../types';

export const statsRouter = Router();

statsRouter.get('/', (req: Request, res: Response) => {
  const campaigns = storageService.getCampaigns();
  const leads = storageService.getLeads();
  const messages = storageService.getMessages();
  const conversations = storageService.getConversations();
  const followups = storageService.getFollowUps();
  const integrations = storageService.getIntegrations();

  const leadsByStatus: Record<LeadStatus, number> = {
    new: 0,
    message_generated: 0,
    approved: 0,
    queued: 0,
    sending: 0,
    sent: 0,
    replied: 0,
    failed: 0,
    do_not_contact: 0
  };

  for (const lead of leads) {
    if (leadsByStatus[lead.status] !== undefined) {
      leadsByStatus[lead.status]++;
    }
  }

  const messagesApproved = messages.filter(m => m.status === 'approved').length;
  const messagesSent = messages.filter(m => m.status === 'sent').length;
  const messagesFailed = messages.filter(m => m.status === 'failed').length;

  const repliesCount = leads.filter(l => l.status === 'replied').length + conversations.length;
  const replyRatePercent = messagesSent > 0 ? Math.round((repliesCount / messagesSent) * 100) : 0;
  const activeFollowUps = followups.filter(f => f.active).length;

  const stats: DashboardStats = {
    totalCampaigns: campaigns.length,
    totalLeads: leads.length,
    leadsByStatus,
    totalMessagesGenerated: messages.length,
    messagesApproved,
    messagesSent,
    messagesFailed,
    totalConversations: conversations.length,
    replyRatePercent,
    activeFollowUps,
    integrationsStatus: {
      ai: integrations.ai.status,
      email: integrations.email.status,
      whatsapp: integrations.whatsapp.status
    }
  };

  res.json(stats);
});
