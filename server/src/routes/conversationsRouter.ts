import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';
import { Conversation, ConversationMessage } from '../types';

export const conversationsRouter = Router();

// GET all conversations
conversationsRouter.get('/', (req: Request, res: Response) => {
  const conversations = storageService.getConversations();
  const leads = storageService.getLeads();
  const campaigns = storageService.getCampaigns();

  const leadMap = new Map(leads.map(l => [l.id, l]));
  const campaignMap = new Map(campaigns.map(c => [c.id, c]));

  const enriched = conversations.map(conv => ({
    ...conv,
    lead: leadMap.get(conv.leadId) || null,
    campaign: campaignMap.get(conv.campaignId) || null
  }));

  res.json(enriched);
});

// GET single conversation
conversationsRouter.get('/:id', (req: Request, res: Response) => {
  const conversations = storageService.getConversations();
  const conv = conversations.find(c => c.id === req.params.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const leads = storageService.getLeads();
  const campaigns = storageService.getCampaigns();
  const lead = leads.find(l => l.id === conv.leadId);
  const campaign = campaigns.find(c => c.id === conv.campaignId);

  res.json({
    ...conv,
    lead,
    campaign
  });
});

// POST send message / reply in conversation
conversationsRouter.post('/:id/messages', (req: Request, res: Response) => {
  const { content, sender } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const conversations = storageService.getConversations();
  const index = conversations.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const newMsg: ConversationMessage = {
    id: uuidv4(),
    sender: sender || 'user',
    content,
    channel: conversations[index].channel,
    timestamp: new Date().toISOString()
  };

  conversations[index].messages.push(newMsg);
  conversations[index].lastUpdated = new Date().toISOString();
  if (sender === 'lead') {
    conversations[index].unread = true;
  }

  storageService.saveConversations(conversations);
  wsManager.broadcast('CONVERSATION_UPDATED', conversations[index]);

  res.status(201).json(conversations[index]);
});

// POST simulate sample inbound lead reply for testing
conversationsRouter.post('/simulate-reply', (req: Request, res: Response) => {
  const leads = storageService.getLeads();
  const campaigns = storageService.getCampaigns();

  const targetLead = leads.length > 0 ? leads[0] : {
    id: uuidv4(),
    campaignId: campaigns[0]?.id || 'default',
    businessName: 'Apex Defense Solutions',
    contactName: 'Alex Mercer',
    email: 'alex.mercer@apexdefense.tech',
    phone: '+1 555-234-8901',
    status: 'replied',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const newConv: Conversation = {
    id: uuidv4(),
    leadId: targetLead.id,
    campaignId: targetLead.campaignId || campaigns[0]?.id || 'default',
    channel: 'email',
    unread: true,
    lastUpdated: new Date().toISOString(),
    sentiment: 'interested',
    suggestedReply: 'Hi Alex, thrilled to hear from you! I would be delighted to walk you through a brief 15-minute live demo. Would Thursday at 2:00 PM EST or Friday at 10:00 AM EST work better for your calendar?',
    messages: [
      {
        id: uuidv4(),
        sender: 'user',
        content: `Hi ${targetLead.contactName || 'there'},\n\nI noticed ${targetLead.businessName || 'your company'} has been scaling operations recently. We help teams accelerate screening workflows by 60% with verified compliance. Would you be open to a 10-minute chat this week?`,
        channel: 'email',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: uuidv4(),
        sender: 'lead',
        content: `Hi, thanks for reaching out. Yes, we are currently experiencing bottlenecks in our candidate clearance pipeline and evaluating automated solutions. Could you share a quick demo link or propose a time for a 15-minute call later this week?`,
        channel: 'email',
        timestamp: new Date().toISOString()
      }
    ]
  };

  const conversations = storageService.getConversations();
  conversations.unshift(newConv);
  storageService.saveConversations(conversations);

  // Update lead status to replied
  const leadIdx = leads.findIndex(l => l.id === targetLead.id);
  if (leadIdx !== -1) {
    leads[leadIdx].status = 'replied';
    leads[leadIdx].updatedAt = new Date().toISOString();
    storageService.saveLeads(leads);
    wsManager.broadcast('LEAD_UPDATED', leads[leadIdx]);
  }

  wsManager.broadcast('CONVERSATION_UPDATED', newConv);
  res.status(201).json(newConv);
});

