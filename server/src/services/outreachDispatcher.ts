import { storageService } from './storageService';
import { emailService } from './emailService';
import { whatsappService } from './whatsappService';
import { wsManager } from './wsService';
import { MessageItem, Lead } from '../types';

class OutreachDispatcher {
  private isProcessing = false;

  public async startQueueProcessing(): Promise<{ totalProcessed: number; successes: number; failures: number }> {
    if (this.isProcessing) {
      console.log('[Dispatcher] Already running queue processing...');
      return { totalProcessed: 0, successes: 0, failures: 0 };
    }

    this.isProcessing = true;
    let successes = 0;
    let failures = 0;

    try {
      const messages = storageService.getMessages();
      const leads = storageService.getLeads();
      const settings = storageService.getSettings();
      const delayMs = Math.max((settings.delayBetweenMessagesSec || 3) * 1000, 1000);

      // Find all queued messages
      const queuedIndices: number[] = [];
      messages.forEach((m, idx) => {
        if (m.status === 'queued') {
          queuedIndices.push(idx);
        }
      });

      console.log(`[Dispatcher] Starting dispatch for ${queuedIndices.length} queued messages...`);

      for (const idx of queuedIndices) {
        const msg = messages[idx];
        const lead = leads.find(l => l.id === msg.leadId);

        // 1. Mark as SENDING
        msg.status = 'sending';
        msg.updatedAt = new Date().toISOString();
        storageService.saveMessages(messages);

        if (lead) {
          lead.status = 'sending';
          lead.updatedAt = new Date().toISOString();
          storageService.saveLeads(leads);
          wsManager.broadcast('LEAD_UPDATED', lead);
        }

        wsManager.broadcast('MESSAGE_UPDATED', msg);
        wsManager.broadcast('OUTREACH_PROGRESS', {
          messageId: msg.id,
          status: 'sending',
          leadName: lead?.contactName || lead?.businessName
        });

        // 2. Perform Real Sending
        try {
          if (msg.channel === 'email') {
            if (!lead?.email) {
              throw new Error('Lead has no valid email address');
            }
            const emailRes = await emailService.sendEmail({
              to: lead.email,
              subject: msg.subject || 'Outreach from our team',
              body: msg.body
            });
            msg.status = 'sent';
            msg.sentAt = new Date().toISOString();
            msg.errorReason = undefined;
            successes++;
          } else if (msg.channel === 'whatsapp') {
            if (!lead?.phone) {
              throw new Error('Lead has no valid phone number');
            }
            const waRes = await whatsappService.sendMessage({
              to: lead.phone,
              text: msg.body
            });
            msg.status = 'sent';
            msg.sentAt = new Date().toISOString();
            msg.errorReason = undefined;
            successes++;
          }

          // Update lead status
          if (lead) {
            lead.status = 'sent';
            lead.updatedAt = new Date().toISOString();
          }
        } catch (error: any) {
          console.error(`[Dispatcher Error on Msg ${msg.id}]:`, error.message);
          msg.status = 'failed';
          msg.errorReason = error.message || 'Delivery error';
          failures++;

          if (lead) {
            lead.status = 'failed';
            lead.updatedAt = new Date().toISOString();
          }
        }

        // 3. Save state & broadcast results
        msg.updatedAt = new Date().toISOString();
        storageService.saveMessages(messages);
        storageService.saveLeads(leads);

        if (lead) {
          wsManager.broadcast('LEAD_UPDATED', lead);
        }
        wsManager.broadcast('MESSAGE_UPDATED', msg);
        wsManager.broadcast('OUTREACH_PROGRESS', {
          messageId: msg.id,
          status: msg.status,
          error: msg.errorReason
        });

        // Delay between dispatches to comply with rate limits
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      wsManager.broadcast('OUTREACH_BATCH_COMPLETED', {
        total: queuedIndices.length,
        successes,
        failures
      });

      return { totalProcessed: queuedIndices.length, successes, failures };
    } finally {
      this.isProcessing = false;
    }
  }
}

export const outreachDispatcher = new OutreachDispatcher();
