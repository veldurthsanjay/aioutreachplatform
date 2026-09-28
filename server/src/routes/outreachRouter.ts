import { Router, Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';
import { outreachDispatcher } from '../services/outreachDispatcher';

export const outreachRouter = Router();

// GET outreach sending queue & history
outreachRouter.get('/queue', (req: Request, res: Response) => {
  const messages = storageService.getMessages();
  const leads = storageService.getLeads();
  const leadMap = new Map(leads.map(l => [l.id, l]));

  const queue = messages
    .filter(m => ['approved', 'queued', 'sending', 'sent', 'failed'].includes(m.status))
    .map(m => ({
      ...m,
      lead: leadMap.get(m.leadId) || null
    }));

  res.json(queue);
});

// POST queue messages for sending
outreachRouter.post('/queue-approved', (req: Request, res: Response) => {
  const { campaignId, messageIds } = req.body;
  const messages = storageService.getMessages();
  const leads = storageService.getLeads();

  let queuedCount = 0;
  for (let i = 0; i < messages.length; i++) {
    const isTarget = messageIds ? messageIds.includes(messages[i].id) : (!campaignId || messages[i].campaignId === campaignId);
    if (messages[i].status === 'approved' && isTarget) {
      messages[i].status = 'queued';
      messages[i].updatedAt = new Date().toISOString();
      queuedCount++;

      // Update lead
      const lIndex = leads.findIndex(l => l.id === messages[i].leadId);
      if (lIndex !== -1) {
        leads[lIndex].status = 'queued';
        leads[lIndex].updatedAt = new Date().toISOString();
      }
    }
  }

  storageService.saveMessages(messages);
  storageService.saveLeads(leads);

  wsManager.broadcast('OUTREACH_QUEUE_UPDATED', { queuedCount });
  res.json({ success: true, queuedCount });
});

// POST start dispatching queued messages
outreachRouter.post('/dispatch', async (req: Request, res: Response) => {
  // Fire and return progress via WebSockets
  outreachDispatcher.startQueueProcessing().catch(err => {
    console.error('[Dispatch Error]:', err);
  });

  res.json({ success: true, message: 'Outreach dispatch started' });
});
