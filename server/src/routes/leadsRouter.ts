import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import { storageService } from '../services/storageService';
import { wsManager } from '../services/wsService';
import { Lead } from '../types';

export const leadsRouter = Router();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads dir exists
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/', { recursive: true });
}

// GET leads with optional filters
leadsRouter.get('/', (req: Request, res: Response) => {
  const { campaignId, status, search } = req.query;
  let leads = storageService.getLeads();

  if (campaignId && typeof campaignId === 'string') {
    leads = leads.filter(l => l.campaignId === campaignId);
  }

  if (status && typeof status === 'string') {
    leads = leads.filter(l => l.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    leads = leads.filter(l =>
      l.contactName?.toLowerCase().includes(q) ||
      l.businessName?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q)
    );
  }

  res.json(leads);
});

// GET single lead
leadsRouter.get('/:id', (req: Request, res: Response) => {
  const leads = storageService.getLeads();
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
});

// POST create single lead
leadsRouter.post('/', (req: Request, res: Response) => {
  const {
    campaignId,
    businessName,
    contactName,
    email,
    phone,
    website,
    category,
    location,
    notes
  } = req.body;

  if (!contactName && !businessName && !email && !phone) {
    return res.status(400).json({ error: 'Please provide at least a contact name, business name, email or phone.' });
  }

  const newLead: Lead = {
    id: uuidv4(),
    campaignId: campaignId || '',
    businessName: businessName || '',
    contactName: contactName || '',
    email: email || '',
    phone: phone || '',
    website: website || '',
    category: category || '',
    location: location || '',
    notes: notes || '',
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const leads = storageService.getLeads();
  leads.unshift(newLead);
  storageService.saveLeads(leads);

  wsManager.broadcast('LEAD_CREATED', newLead);
  res.status(201).json(newLead);
});

// POST populate sample leads for instant testing
leadsRouter.post('/sample', (req: Request, res: Response) => {
  const { campaignId } = req.body;
  const campaigns = storageService.getCampaigns();
  const targetCampaignId = campaignId || (campaigns.length > 0 ? campaigns[0].id : '');

  const sampleLeads: Lead[] = [
    {
      id: uuidv4(),
      campaignId: targetCampaignId,
      businessName: 'Apex Defense Solutions',
      contactName: 'Alex Mercer',
      email: 'alex.mercer@apexdefense.tech',
      phone: '+1 555-234-8901',
      website: 'https://apexdefense.tech',
      category: 'Defense Technology',
      location: 'Arlington, VA',
      notes: 'Looking for automated candidate screening to scale hiring for top secret cleared engineers.',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      campaignId: targetCampaignId,
      businessName: 'FinVault Capital',
      contactName: 'Priya Sharma',
      email: 'priya.sharma@finvaultcap.com',
      phone: '+1 555-789-4321',
      website: 'https://finvaultcap.com',
      category: 'FinTech / Venture',
      location: 'New York, NY',
      notes: 'Needs streamlined recruitment workflows for compliance and quant engineering teams.',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      campaignId: targetCampaignId,
      businessName: 'Nordic Cold Logistics',
      contactName: 'Marcus Vance',
      email: 'marcus.v@nordiccoldlogistics.com',
      phone: '+1 555-456-1122',
      website: 'https://nordiccoldlogistics.com',
      category: 'Cold Chain Logistics',
      location: 'Chicago, IL',
      notes: 'Managing 14 cold storage facilities; interested in wireless temp monitoring & fast reporting.',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const leads = storageService.getLeads();
  leads.unshift(...sampleLeads);
  storageService.saveLeads(leads);

  wsManager.broadcast('LEADS_IMPORTED', { count: sampleLeads.length });
  res.status(201).json({ success: true, count: sampleLeads.length, leads: sampleLeads });
});

// POST import CSV leads
leadsRouter.post('/import-csv', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file provided.' });
  }

  const campaignId = req.body.campaignId || '';
  const results: any[] = [];
  const filePath = req.file.path;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Cleanup uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // ignore
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or formatted incorrectly.' });
    }

    const leads = storageService.getLeads();
    const importedLeads: Lead[] = [];

    for (const row of results) {
      // Map common header variations
      const businessName = row['Business Name'] || row['businessName'] || row['Company'] || row['company'] || row['Business'] || '';
      const contactName = row['Contact Name'] || row['contactName'] || row['Name'] || row['name'] || row['Full Name'] || '';
      const email = row['Email'] || row['email'] || row['Email Address'] || '';
      const phone = row['Phone'] || row['phone'] || row['Phone Number'] || row['Mobile'] || '';
      const website = row['Website'] || row['website'] || row['URL'] || row['url'] || '';
      const category = row['Category'] || row['category'] || row['Industry'] || row['industry'] || '';
      const location = row['Location'] || row['location'] || row['City'] || row['Address'] || '';
      const notes = row['Notes'] || row['notes'] || '';

      if (businessName || contactName || email || phone) {
        const lead: Lead = {
          id: uuidv4(),
          campaignId,
          businessName: String(businessName).trim(),
          contactName: String(contactName).trim(),
          email: String(email).trim(),
          phone: String(phone).trim(),
          website: String(website).trim(),
          category: String(category).trim(),
          location: String(location).trim(),
          notes: String(notes).trim(),
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        importedLeads.push(lead);
      }
    }

    leads.unshift(...importedLeads);
    storageService.saveLeads(leads);

    wsManager.broadcast('LEADS_IMPORTED', { count: importedLeads.length });
    return res.json({
      success: true,
      importedCount: importedLeads.length,
      leads: importedLeads
    });
  } catch (error: any) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({ error: 'Failed to process CSV file: ' + error.message });
  }
});

// PUT update lead
leadsRouter.put('/:id', (req: Request, res: Response) => {
  const leads = storageService.getLeads();
  const index = leads.findIndex(l => l.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const updatedLead: Lead = {
    ...leads[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  leads[index] = updatedLead;
  storageService.saveLeads(leads);

  wsManager.broadcast('LEAD_UPDATED', updatedLead);
  res.json(updatedLead);
});

// DELETE single lead
leadsRouter.delete('/:id', (req: Request, res: Response) => {
  const leads = storageService.getLeads();
  const filtered = leads.filter(l => l.id !== req.params.id);

  if (filtered.length === leads.length) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  storageService.saveLeads(filtered);
  wsManager.broadcast('LEAD_DELETED', { id: req.params.id });
  res.json({ success: true, message: 'Lead deleted successfully' });
});

// DELETE bulk leads
leadsRouter.post('/bulk-delete', (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid lead IDs array.' });
  }

  const idSet = new Set(ids);
  const leads = storageService.getLeads();
  const filtered = leads.filter(l => !idSet.has(l.id));

  storageService.saveLeads(filtered);
  wsManager.broadcast('LEADS_BULK_DELETED', { count: ids.length });
  res.json({ success: true, count: ids.length });
});
