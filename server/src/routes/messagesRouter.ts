import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';
import { aiService } from '../services/aiService';
import { MessageItem, Lead, Campaign } from '../types';

export const messagesRouter = Router();

// POST generate message using AI for single lead
messagesRouter.post('/generate-single', async (req: Request, res: Response) => {
  const { leadId, campaignId, channel } = req.body;

  if (!leadId) {
    return res.status(400).json({ error: 'leadId is required' });
  }

  const leads = storageService.getLeads();
  const campaigns = storageService.getCampaigns();

  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const targetCampaignId = campaignId || lead.campaignId;
  let campaign = campaigns.find(c => c.id === targetCampaignId);

  if (!campaign) {
    // Default fallback campaign
    campaign = {
      id: 'default',
      name: 'General Outreach',
      product: 'B2B Professional Services',
      audience: 'Industry Leaders',
      objective: 'Schedule a brief introductory call',
      instructions: 'Personalize value, highlight efficiency and ROI',
      tone: 'Professional & Direct',
      channel: (channel as any) || 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const msgChannel = channel || (campaign.channel === 'both' ? 'email' : campaign.channel) || 'email';

  try {
    const generated = await aiService.generateOutreachMessage(campaign, lead, msgChannel);

    const newMessage: MessageItem = {
      id: uuidv4(),
      campaignId: campaign.id,
      leadId: lead.id,
      channel: msgChannel,
      subject: generated.subject,
      body: generated.body,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const messages = storageService.getMessages();
    messages.unshift(newMessage);
    storageService.saveMessages(messages);

    // Update lead status
    const lIdx = leads.findIndex(l => l.id === lead.id);
    if (lIdx !== -1) {
      leads[lIdx].status = 'message_generated';
      leads[lIdx].updatedAt = new Date().toISOString();
      storageService.saveLeads(leads);
      wsManager.broadcast('LEAD_UPDATED', leads[lIdx]);
    }

    wsManager.broadcast('MESSAGE_CREATED', newMessage);
    return res.status(201).json(newMessage);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST batch generate AI messages
messagesRouter.post('/generate-batch', async (req: Request, res: Response) => {
  const { campaignId, leadIds, channel } = req.body;

  const leads = storageService.getLeads();
  const campaigns = storageService.getCampaigns();

  let targetLeads: Lead[] = [];
  if (Array.isArray(leadIds) && leadIds.length > 0) {
    const idSet = new Set(leadIds);
    targetLeads = leads.filter(l => idSet.has(l.id));
  } else if (campaignId) {
    targetLeads = leads.filter(l => l.campaignId === campaignId && l.status === 'new');
  } else {
    targetLeads = leads.filter(l => l.status === 'new');
  }

  if (targetLeads.length === 0) {
    return res.status(400).json({ error: 'No ungenerated leads found for batch AI generation.' });
  }

  const campaign = campaigns.find(c => c.id === campaignId) || {
    id: 'default',
    name: 'General Outreach',
    product: 'B2B Professional Services',
    audience: 'Industry Leaders',
    objective: 'Schedule a brief introductory call',
    instructions: 'Personalize value, highlight efficiency and ROI',
    tone: 'Professional & Direct',
    channel: (channel as any) || 'email',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const generatedList: MessageItem[] = [];
  const errors: string[] = [];

  for (const lead of targetLeads) {
    const msgChannel = channel || (campaign.channel === 'both' ? 'email' : campaign.channel) || 'email';
    try {
      const generated = await aiService.generateOutreachMessage(campaign, lead, msgChannel);
      const msg: MessageItem = {
        id: uuidv4(),
        campaignId: campaign.id,
        leadId: lead.id,
        channel: msgChannel,
        subject: generated.subject,
        body: generated.body,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      generatedList.push(msg);

      // Update lead
      lead.status = 'message_generated';
      lead.updatedAt = new Date().toISOString();
    } catch (err: any) {
      errors.push(`Lead ${lead.contactName || lead.id}: ${err.message}`);
    }
  }

  const messages = storageService.getMessages();
  messages.unshift(...generatedList);
  storageService.saveMessages(messages);
  storageService.saveLeads(leads);

  wsManager.broadcast('MESSAGES_BATCH_GENERATED', { count: generatedList.length });

  res.json({
    success: true,
    generatedCount: generatedList.length,
    totalTargeted: targetLeads.length,
    messages: generatedList,
    errors: errors.length > 0 ? errors : undefined
  });
});

// GET all messages with optional filtering
messagesRouter.get('/', (req: Request, res: Response) => {
  const { campaignId, leadId, status, channel } = req.query;
  let messages = storageService.getMessages();

  if (campaignId && typeof campaignId === 'string') {
    messages = messages.filter(m => m.campaignId === campaignId);
  }
  if (leadId && typeof leadId === 'string') {
    messages = messages.filter(m => m.leadId === leadId);
  }
  if (status && typeof status === 'string') {
    messages = messages.filter(m => m.status === status);
  }
  if (channel && typeof channel === 'string') {
    messages = messages.filter(m => m.channel === channel);
  }

  res.json(messages);
});

// GET single message
messagesRouter.get('/:id', (req: Request, res: Response) => {
  const messages = storageService.getMessages();
  const message = messages.find(m => m.id === req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json(message);
});

// POST save generated or custom message
messagesRouter.post('/', (req: Request, res: Response) => {
  const { campaignId, leadId, channel, subject, body, status } = req.body;

  if (!leadId || !body) {
    return res.status(400).json({ error: 'Lead ID and message body are required' });
  }

  const newMessage: MessageItem = {
    id: uuidv4(),
    campaignId: campaignId || '',
    leadId,
    channel: channel || 'email',
    subject: subject || '',
    body,
    status: status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const messages = storageService.getMessages();
  // If a message already exists for this lead/channel in draft state, update or append
  messages.unshift(newMessage);
  storageService.saveMessages(messages);

  // Update lead status
  const leads = storageService.getLeads();
  const leadIndex = leads.findIndex(l => l.id === leadId);
  if (leadIndex !== -1) {
    leads[leadIndex].status = 'message_generated';
    leads[leadIndex].updatedAt = new Date().toISOString();
    storageService.saveLeads(leads);
    wsManager.broadcast('LEAD_UPDATED', leads[leadIndex]);
  }

  wsManager.broadcast('MESSAGE_CREATED', newMessage);
  res.status(201).json(newMessage);
});

// PUT edit message content or status
messagesRouter.put('/:id', (req: Request, res: Response) => {
  const messages = storageService.getMessages();
  const index = messages.findIndex(m => m.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const updatedMessage: MessageItem = {
    ...messages[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  messages[index] = updatedMessage;
  storageService.saveMessages(messages);

  wsManager.broadcast('MESSAGE_UPDATED', updatedMessage);
  res.json(updatedMessage);
});

// POST single message approval
messagesRouter.post('/:id/approve', (req: Request, res: Response) => {
  const messages = storageService.getMessages();
  const msgIndex = messages.findIndex(m => m.id === req.params.id);

  if (msgIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }

  messages[msgIndex].status = 'approved';
  messages[msgIndex].updatedAt = new Date().toISOString();
  storageService.saveMessages(messages);

  // Update lead status
  const leads = storageService.getLeads();
  const leadIndex = leads.findIndex(l => l.id === messages[msgIndex].leadId);
  if (leadIndex !== -1) {
    leads[leadIndex].status = 'approved';
    leads[leadIndex].updatedAt = new Date().toISOString();
    storageService.saveLeads(leads);
    wsManager.broadcast('LEAD_UPDATED', leads[leadIndex]);
  }

  wsManager.broadcast('MESSAGE_UPDATED', messages[msgIndex]);
  res.json(messages[msgIndex]);
});

// POST mark single message as sent (e.g. after dispatch or manual WhatsApp Web send)
messagesRouter.post('/:id/mark-sent', (req: Request, res: Response) => {
  const messages = storageService.getMessages();
  const msgIndex = messages.findIndex(m => m.id === req.params.id);

  if (msgIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }

  messages[msgIndex].status = 'sent';
  messages[msgIndex].sentAt = new Date().toISOString();
  messages[msgIndex].updatedAt = new Date().toISOString();
  messages[msgIndex].errorReason = undefined;
  storageService.saveMessages(messages);

  // Update lead status
  const leads = storageService.getLeads();
  const leadIndex = leads.findIndex(l => l.id === messages[msgIndex].leadId);
  if (leadIndex !== -1) {
    leads[leadIndex].status = 'sent';
    leads[leadIndex].updatedAt = new Date().toISOString();
    storageService.saveLeads(leads);
    wsManager.broadcast('LEAD_UPDATED', leads[leadIndex]);
  }

  wsManager.broadcast('MESSAGE_UPDATED', messages[msgIndex]);
  res.json(messages[msgIndex]);
});

// POST single message rejection
messagesRouter.post('/:id/reject', (req: Request, res: Response) => {
  const messages = storageService.getMessages();
  const msgIndex = messages.findIndex(m => m.id === req.params.id);

  if (msgIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }

  messages[msgIndex].status = 'rejected';
  messages[msgIndex].updatedAt = new Date().toISOString();
  storageService.saveMessages(messages);

  wsManager.broadcast('MESSAGE_UPDATED', messages[msgIndex]);
  res.json(messages[msgIndex]);
});

// POST bulk approval
messagesRouter.post('/bulk-approve', (req: Request, res: Response) => {
  const { messageIds } = req.body;
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: 'Invalid message IDs' });
  }

  const idSet = new Set(messageIds);
  const messages = storageService.getMessages();
  const leads = storageService.getLeads();
  const leadIdsToUpdate = new Set<string>();

  for (let i = 0; i < messages.length; i++) {
    if (idSet.has(messages[i].id)) {
      messages[i].status = 'approved';
      messages[i].updatedAt = new Date().toISOString();
      leadIdsToUpdate.add(messages[i].leadId);
    }
  }

  for (let i = 0; i < leads.length; i++) {
    if (leadIdsToUpdate.has(leads[i].id)) {
      leads[i].status = 'approved';
      leads[i].updatedAt = new Date().toISOString();
    }
  }

  storageService.saveMessages(messages);
  storageService.saveLeads(leads);

  wsManager.broadcast('MESSAGES_BULK_APPROVED', { count: messageIds.length });
  res.json({ success: true, count: messageIds.length });
});

// DELETE message
messagesRouter.delete('/:id', (req: Request, res: Response) => {
  const messages = storageService.getMessages();
  const filtered = messages.filter(m => m.id !== req.params.id);

  if (filtered.length === messages.length) {
    return res.status(404).json({ error: 'Message not found' });
  }

  storageService.saveMessages(filtered);
  wsManager.broadcast('MESSAGE_DELETED', { id: req.params.id });
  res.json({ success: true });
});
