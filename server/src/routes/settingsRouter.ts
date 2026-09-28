import { Router, Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';

export const settingsRouter = Router();

settingsRouter.get('/', (req: Request, res: Response) => {
  const settings = storageService.getSettings();
  res.json(settings);
});

settingsRouter.put('/', (req: Request, res: Response) => {
  const settings = storageService.getSettings();
  const updatedSettings = {
    ...settings,
    ...req.body
  };

  storageService.saveSettings(updatedSettings);
  wsManager.broadcast('SETTINGS_UPDATED', updatedSettings);
  res.json(updatedSettings);
});
