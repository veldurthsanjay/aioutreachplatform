import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';
import { Campaign } from '../types';

export const campaignsRouter = Router();

// GET all campaigns
campaignsRouter.get('/', (req: Request, res: Response) => {
  const campaigns = storageService.getCampaigns();
  res.json(campaigns);
});

// GET single campaign
campaignsRouter.get('/:id', (req: Request, res: Response) => {
  const campaigns = storageService.getCampaigns();
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
});

// POST create campaign
campaignsRouter.post('/', (req: Request, res: Response) => {
  const { name, product, audience, objective, instructions, tone, channel } = req.body;

  if (!name || !product || !objective) {
    return res.status(400).json({ error: 'Name, Product, and Objective are required.' });
  }

  const newCampaign: Campaign = {
    id: uuidv4(),
    name,
    product,
    audience: audience || '',
    objective,
    instructions: instructions || '',
    tone: tone || 'Professional',
    channel: channel || 'email',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const campaigns = storageService.getCampaigns();
  campaigns.unshift(newCampaign);
  storageService.saveCampaigns(campaigns);

  wsManager.broadcast('CAMPAIGN_CREATED', newCampaign);
  res.status(201).json(newCampaign);
});

// PUT update campaign
campaignsRouter.put('/:id', (req: Request, res: Response) => {
  const campaigns = storageService.getCampaigns();
  const index = campaigns.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const updatedCampaign: Campaign = {
    ...campaigns[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  campaigns[index] = updatedCampaign;
  storageService.saveCampaigns(campaigns);

  wsManager.broadcast('CAMPAIGN_UPDATED', updatedCampaign);
  res.json(updatedCampaign);
});

// DELETE campaign
campaignsRouter.delete('/:id', (req: Request, res: Response) => {
  const campaigns = storageService.getCampaigns();
  const filtered = campaigns.filter(c => c.id !== req.params.id);

  if (filtered.length === campaigns.length) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  storageService.saveCampaigns(filtered);
  wsManager.broadcast('CAMPAIGN_DELETED', { id: req.params.id });
  res.json({ success: true, message: 'Campaign deleted successfully' });
});
