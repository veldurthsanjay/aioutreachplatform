import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';
import { FollowUpSequence } from '../types';

export const followupsRouter = Router();

// GET all sequences
followupsRouter.get('/', (req: Request, res: Response) => {
  const sequences = storageService.getFollowUps();
  const campaigns = storageService.getCampaigns();
  const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

  const enriched = sequences.map(s => ({
    ...s,
    campaignName: campaignMap.get(s.campaignId) || 'Unassigned Campaign'
  }));

  res.json(enriched);
});

// POST create sequence
followupsRouter.post('/', (req: Request, res: Response) => {
  const { campaignId, name, steps } = req.body;

  if (!name || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'Name and steps are required' });
  }

  const newSequence: FollowUpSequence = {
    id: uuidv4(),
    campaignId: campaignId || '',
    name,
    steps,
    active: true,
    createdAt: new Date().toISOString()
  };

  const sequences = storageService.getFollowUps();
  sequences.unshift(newSequence);
  storageService.saveFollowUps(sequences);

  wsManager.broadcast('FOLLOWUP_CREATED', newSequence);
  res.status(201).json(newSequence);
});

// PUT update sequence
followupsRouter.put('/:id', (req: Request, res: Response) => {
  const sequences = storageService.getFollowUps();
  const index = sequences.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Sequence not found' });
  }

  const updatedSequence = {
    ...sequences[index],
    ...req.body
  };

  sequences[index] = updatedSequence;
  storageService.saveFollowUps(sequences);

  wsManager.broadcast('FOLLOWUP_UPDATED', updatedSequence);
  res.json(updatedSequence);
});

// DELETE sequence
followupsRouter.delete('/:id', (req: Request, res: Response) => {
  const sequences = storageService.getFollowUps();
  const filtered = sequences.filter(s => s.id !== req.params.id);

  if (filtered.length === sequences.length) {
    return res.status(404).json({ error: 'Sequence not found' });
  }

  storageService.saveFollowUps(filtered);
  wsManager.broadcast('FOLLOWUP_DELETED', { id: req.params.id });
  res.json({ success: true });
});
