import type {
  Campaign,
  Lead,
  MessageItem,
  Conversation,
  FollowUpSequence,
  IntegrationConfig,
  AppSettings,
  DashboardStats
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const err = await res.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Stats
  getStats: () => fetchJson<DashboardStats>('/stats'),

  // Campaigns
  getCampaigns: () => fetchJson<Campaign[]>('/campaigns'),
  getCampaign: (id: string) => fetchJson<Campaign>(`/campaigns/${id}`),
  createCampaign: (data: Partial<Campaign>) =>
    fetchJson<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCampaign: (id: string, data: Partial<Campaign>) =>
    fetchJson<Campaign>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCampaign: (id: string) =>
    fetchJson<{ success: boolean }>(`/campaigns/${id}`, {
      method: 'DELETE'
    }),

  // Leads
  getLeads: (params?: { campaignId?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return fetchJson<Lead[]>(`/leads?${query.toString()}`);
  },
  createLead: (data: Partial<Lead>) =>
    fetchJson<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  populateSampleLeads: (campaignId?: string) =>
    fetchJson<{ success: boolean; count: number; leads: Lead[] }>('/leads/sample', {
      method: 'POST',
      body: JSON.stringify({ campaignId })
    }),
  importCsvLeads: async (file: File, campaignId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (campaignId) formData.append('campaignId', campaignId);

    const res = await fetch(`${BASE_URL}/leads/import-csv`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      let errorMsg = 'Failed to import CSV';
      try {
        const err = await res.json();
        if (err.error) errorMsg = err.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }
    return res.json();
  },
  updateLead: (id: string, data: Partial<Lead>) =>
    fetchJson<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteLead: (id: string) =>
    fetchJson<{ success: boolean }>(`/leads/${id}`, {
      method: 'DELETE'
    }),
  bulkDeleteLeads: (ids: string[]) =>
    fetchJson<{ success: boolean; count: number }>('/leads/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }),

  // Messages
  getMessages: (params?: { campaignId?: string; leadId?: string; status?: string; channel?: string }) => {
    const query = new URLSearchParams();
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.leadId) query.set('leadId', params.leadId);
    if (params?.status) query.set('status', params.status);
    if (params?.channel) query.set('channel', params.channel);
    return fetchJson<MessageItem[]>(`/messages?${query.toString()}`);
  },
  createMessage: (data: Partial<MessageItem>) =>
    fetchJson<MessageItem>('/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateMessage: (id: string, data: Partial<MessageItem>) =>
    fetchJson<MessageItem>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  approveMessage: (id: string) =>
    fetchJson<MessageItem>(`/messages/${id}/approve`, {
      method: 'POST'
    }),
  markMessageSent: (id: string) =>
    fetchJson<MessageItem>(`/messages/${id}/mark-sent`, {
      method: 'POST'
    }),
  rejectMessage: (id: string) =>
    fetchJson<MessageItem>(`/messages/${id}/reject`, {
      method: 'POST'
    }),
  bulkApproveMessages: (messageIds: string[]) =>
    fetchJson<{ success: boolean; count: number }>('/messages/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ messageIds })
    }),
  generateSingleMessage: (leadId: string, campaignId?: string, channel?: 'email' | 'whatsapp') =>
    fetchJson<MessageItem>('/messages/generate-single', {
      method: 'POST',
      body: JSON.stringify({ leadId, campaignId, channel })
    }),
  generateBatchMessages: (params: { campaignId?: string; leadIds?: string[]; channel?: 'email' | 'whatsapp' }) =>
    fetchJson<{ success: boolean; generatedCount: number; messages: MessageItem[]; errors?: string[] }>('/messages/generate-batch', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  deleteMessage: (id: string) =>
    fetchJson<{ success: boolean }>(`/messages/${id}`, {
      method: 'DELETE'
    }),

  // Outreach
  getOutreachQueue: () => fetchJson<any[]>('/outreach/queue'),
  queueApproved: (campaignId?: string, messageIds?: string[]) =>
    fetchJson<{ success: boolean; queuedCount: number }>('/outreach/queue-approved', {
      method: 'POST',
      body: JSON.stringify({ campaignId, messageIds })
    }),
  startDispatch: () =>
    fetchJson<{ success: boolean; message: string }>('/outreach/dispatch', {
      method: 'POST'
    }),

  // Conversations
  getConversations: () => fetchJson<Conversation[]>('/conversations'),
  getConversation: (id: string) => fetchJson<Conversation>(`/conversations/${id}`),
  sendMessageInConversation: (id: string, content: string, sender: 'user' | 'lead' = 'user') =>
    fetchJson<Conversation>(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, sender })
    }),
  simulateInboundReply: () =>
    fetchJson<Conversation>('/conversations/simulate-reply', {
      method: 'POST'
    }),

  // Follow-ups
  getFollowUps: () => fetchJson<FollowUpSequence[]>('/followups'),
  createFollowUp: (data: Partial<FollowUpSequence>) =>
    fetchJson<FollowUpSequence>('/followups', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateFollowUp: (id: string, data: Partial<FollowUpSequence>) =>
    fetchJson<FollowUpSequence>(`/followups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteFollowUp: (id: string) =>
    fetchJson<{ success: boolean }>(`/followups/${id}`, {
      method: 'DELETE'
    }),

  // Integrations
  getIntegrations: () => fetchJson<IntegrationConfig>('/integrations'),
  saveAiIntegration: (data: any) =>
    fetchJson<{ success: boolean; config: any }>('/integrations/ai', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  saveEmailIntegration: (data: any) =>
    fetchJson<{ success: boolean; config: any }>('/integrations/email', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  saveWhatsAppIntegration: (data: any) =>
    fetchJson<{ success: boolean; config: any }>('/integrations/whatsapp', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Settings
  getSettings: () => fetchJson<AppSettings>('/settings'),
  updateSettings: (data: Partial<AppSettings>) =>
    fetchJson<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};
