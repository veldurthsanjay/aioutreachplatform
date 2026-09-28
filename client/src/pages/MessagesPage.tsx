import React, { useState, useEffect } from 'react';
import {
  MessageSquareText,
  Sparkles,
  CheckCircle,
  XCircle,
  Edit3,
  Mail,
  MessageSquare,
  Search,
  CheckSquare,
  Square,
  Trash2,
  Building,
  RefreshCw,
  Loader2,
  Wand2,
  ArrowRight,
  Send,
  Zap,
  CheckCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { MessageItem, Lead, Campaign, NavigationTab } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useWebSocket } from '../context/WebSocketContext';

interface MessagesPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());

  // Edit/Draft Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingMsg, setEditingMsg] = useState<MessageItem | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);

  // Generate Message Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [targetLeadId, setTargetLeadId] = useState('');
  const [targetCampaignId, setTargetCampaignId] = useState('');
  const [targetChannel, setTargetChannel] = useState<'email' | 'whatsapp'>('email');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const { subscribe } = useWebSocket();

  const loadData = async () => {
    try {
      const [messagesData, leadsData, campaignsData] = await Promise.all([
        api.getMessages({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          campaignId: campaignFilter || undefined
        }),
        api.getLeads(),
        api.getCampaigns()
      ]);
      setMessages(messagesData);
      setLeads(leadsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Failed to load messages data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsub1 = subscribe('MESSAGE_CREATED', loadData);
    const unsub2 = subscribe('MESSAGE_UPDATED', loadData);
    const unsub3 = subscribe('MESSAGE_DELETED', loadData);
    const unsub4 = subscribe('MESSAGES_BULK_APPROVED', loadData);
    const unsub5 = subscribe('MESSAGES_BATCH_GENERATED', loadData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [statusFilter, campaignFilter, subscribe]);

  const leadMap = new Map(leads.map(l => [l.id, l]));
  const campaignMap = new Map(campaigns.map(c => [c.id, c]));

  const draftCount = messages.filter(m => m.status === 'draft').length;
  const approvedCount = messages.filter(m => m.status === 'approved').length;
  const sentCount = messages.filter(m => m.status === 'sent').length;

  const handleApprove = async (id: string) => {
    try {
      await api.approveMessage(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve message');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectMessage(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject message');
    }
  };

  const handleBulkApprove = async () => {
    const ids = selectedMsgIds.size > 0
      ? Array.from(selectedMsgIds)
      : messages.filter(m => m.status === 'draft').map(m => m.id);

    if (ids.length === 0) return;
    try {
      await api.bulkApproveMessages(ids);
      setSelectedMsgIds(new Set());
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to bulk approve');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this message draft?')) {
      try {
        await api.deleteMessage(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  const handleRegenerate = async (msg: MessageItem) => {
    setRegeneratingId(msg.id);
    try {
      await api.generateSingleMessage(msg.leadId, msg.campaignId, msg.channel);
      await api.deleteMessage(msg.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate message');
    } finally {
      setRegeneratingId(null);
    }
  };

  const openEdit = (msg: MessageItem) => {
    setEditingMsg(msg);
    setEditSubject(msg.subject || '');
    setEditBody(msg.body);
    setIsEditModalOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMsg) return;
    setSaving(true);
    try {
      await api.updateMessage(editingMsg.id, {
        subject: editSubject,
        body: editBody
      });
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save message');
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setMode('ai');
    setTargetLeadId(leads[0]?.id || '');
    setTargetCampaignId(campaigns[0]?.id || '');
    setTargetChannel('email');
    setCustomSubject('');
    setCustomBody('');
    setGenError(null);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateOrSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);

    if (mode === 'ai') {
      if (!targetLeadId) {
        setGenError('Please select a target lead');
        return;
      }

      setGenerating(true);
      try {
        await api.generateSingleMessage(targetLeadId, targetCampaignId, targetChannel);
        setIsGenerateModalOpen(false);
        loadData();
      } catch (err: any) {
        setGenError(err.message || 'Failed to generate message with AI');
      } finally {
        setGenerating(false);
      }
    } else {
      if (!targetLeadId || !customBody.trim()) {
        setGenError('Please select a lead and enter the message body');
        return;
      }
      setSaving(true);
      try {
        await api.createMessage({
          leadId: targetLeadId,
          campaignId: targetCampaignId,
          channel: targetChannel,
          subject: customSubject,
          body: customBody,
          status: 'draft'
        });
        setIsGenerateModalOpen(false);
        loadData();
      } catch (err: any) {
        setGenError(err.message || 'Failed to create draft');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBatchAiGeneration = async () => {
    const uncontacted = leads.filter(l => l.status === 'new');
    if (uncontacted.length === 0) {
      alert('No new uncontacted leads found to generate messages for. Add leads in the Leads tab first.');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.generateBatchMessages({
        campaignId: campaignFilter || undefined
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Batch AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const filteredMessages = messages.filter(m => {
    const lead = leadMap.get(m.leadId);
    const text = `${m.subject || ''} ${m.body} ${lead?.contactName || ''} ${lead?.businessName || ''}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Step Guidance & Action Header */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Step 3: Review & Approve AI Messages</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review personalized AI drafts, edit any wording, and click Approve to queue them for live delivery.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {draftCount > 0 && (
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Approve All Drafts ({draftCount})</span>
            </button>
          )}

          {approvedCount > 0 && onNavigate && (
            <button
              onClick={() => onNavigate('outreach')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Next: Send Outreach ({approvedCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & Tab Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          {[
            { id: 'all', label: `All (${messages.length})` },
            { id: 'draft', label: `Needs Review (${draftCount})` },
            { id: 'approved', label: `Approved (${approvedCount})` },
            { id: 'sent', label: `Sent (${sentCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search drafts & recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleBatchAiGeneration}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Generate AI copy for all new uncontacted leads"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Wand2 className="w-3.5 h-3.5 text-purple-400" />}
            <span>{generating ? 'Generating AI Copy...' : '✨ Batch AI Generate'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Draft Message</span>
          </button>
        </div>
      </div>

      {/* 3. Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredMessages.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title={searchQuery || statusFilter !== 'all' ? 'No matching messages' : 'No messages drafted yet'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try changing your search keywords or switching tabs.'
              : 'Click "Batch AI Generate" to automatically write tailored cold outreach for your leads using OpenRouter AI.'
          }
          actionLabel={searchQuery || statusFilter !== 'all' ? undefined : '✨ Batch AI Generate'}
          onAction={handleBatchAiGeneration}
        />
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => {
            const lead = leadMap.get(msg.leadId);
            const campaign = campaignMap.get(msg.campaignId);
            const isSelected = selectedMsgIds.has(msg.id);
            const isRegenerating = regeneratingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`p-5 rounded-2xl bg-slate-900/70 border transition-all ${
                  isSelected ? 'border-blue-500/60 bg-blue-950/15' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedMsgIds(prev => {
                          const next = new Set(prev);
                          if (next.has(msg.id)) next.delete(msg.id);
                          else next.add(msg.id);
                          return next;
                        });
                      }}
                      className="cursor-pointer text-slate-400 hover:text-white"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {lead?.contactName || 'Target Lead'}
                        </span>
                        {lead?.businessName && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            • <Building className="w-3.5 h-3.5 text-slate-500" /> {lead.businessName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Campaign: <span className="text-slate-400">{campaign?.name || 'General Outreach'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {msg.channel === 'email' ? <Mail className="w-3.5 h-3.5 text-blue-400" /> : <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="capitalize">{msg.channel}</span>
                    </span>
                    <Badge status={msg.status} />
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="py-4 space-y-2">
                  {msg.channel === 'email' && msg.subject && (
                    <div className="text-xs font-medium text-slate-300">
                      <span className="text-slate-400">Subject: </span>
                      <span className="text-slate-100 font-semibold">{msg.subject}</span>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.body}
                  </div>
                  {msg.errorReason && (
                    <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg">
                      Delivery note: {msg.errorReason}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Created: {new Date(msg.createdAt).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {msg.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleRegenerate(msg)}
                          disabled={isRegenerating}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors cursor-pointer"
                          title="Regenerate with OpenRouter AI"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                        </button>
                        <button
                          onClick={() => handleReject(msg.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleApprove(msg.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      </>
                    )}

                    {msg.channel === 'whatsapp' && (
                      <button
                        onClick={async () => {
                          let phone = lead?.phone || '';
                          let clean = phone.replace(/[^0-9]/g, '');
                          if (clean.length === 10) clean = '91' + clean;
                          if (!clean) {
                            alert('This lead has no phone number entered.');
                            return;
                          }
                          const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg.body)}`;
                          window.open(url, '_blank');
                          if (confirm('Mark this WhatsApp message as Sent in the CRM?')) {
                            try {
                              await api.markMessageSent(msg.id);
                              loadData();
                            } catch (e) {
                              // ignore
                            }
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 font-medium transition-colors cursor-pointer"
                        title="Open directly in WhatsApp Web / App with pre-filled message"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Send on WhatsApp</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEdit(msg)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Message"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Outreach Message"
        maxWidth="2xl"
      >
        <form onSubmit={saveEdit} className="space-y-4">
          {editingMsg?.channel === 'email' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Subject
              </label>
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Message Body
            </label>
            <textarea
              rows={8}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate / Create Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title={mode === 'ai' ? 'Generate Personalized AI Message' : 'Create Custom Outreach Draft'}
        maxWidth="2xl"
      >
        <form onSubmit={handleGenerateOrSave} className="space-y-4">
          {genError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {genError}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                mode === 'ai'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Generate with AI
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                mode === 'manual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Manual Custom Draft
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Lead <span className="text-rose-400">*</span>
              </label>
              <select
                value={targetLeadId}
                onChange={(e) => setTargetLeadId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.contactName || l.businessName} ({l.email || l.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Campaign Proposition
              </label>
              <select
                value={targetCampaignId}
                onChange={(e) => setTargetCampaignId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Use Lead Campaign or Default --</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetChannel('email')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer ${
                  targetChannel === 'email'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => setTargetChannel('whatsapp')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer ${
                  targetChannel === 'whatsapp'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </button>
            </div>
          </div>

          {mode === 'ai' ? (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-300 space-y-1.5">
              <p className="font-semibold text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" /> AI Personalization Logic:
              </p>
              <p className="text-slate-400 leading-relaxed">
                OpenRouter AI will synthesize the lead’s business name, industry, contact name, location, and campaign value proposition into a high-converting message.
              </p>
            </div>
          ) : (
            <>
              {targetChannel === 'email' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quick question regarding candidate screening"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Message Body <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Draft your personalized message body here..."
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating || saving}
              className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer ${
                mode === 'ai'
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              }`}
            >
              {generating ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...
                </span>
              ) : mode === 'ai' ? (
                'Generate Message'
              ) : (
                'Save Draft'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
