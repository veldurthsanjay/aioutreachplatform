import React, { useState, useEffect } from 'react';
import {
  History,
  Plus,
  Trash2,
  Edit2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Mail,
  MessageSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '../services/api';
import type { FollowUpSequence, Campaign, FollowUpStep, NavigationTab } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useWebSocket } from '../context/WebSocketContext';

interface FollowUpsPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({ onNavigate }) => {
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSequence, setEditingSequence] = useState<FollowUpSequence | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [steps, setSteps] = useState<FollowUpStep[]>([
    { stepNumber: 1, waitDays: 3, channel: 'email', instructions: 'Gentle follow-up checking if they had a chance to review the previous proposal.' },
    { stepNumber: 2, waitDays: 5, channel: 'email', instructions: 'Share a relevant 1-minute case study or ROI statistic and propose a quick 10-min call.' }
  ]);
  const [saving, setSaving] = useState(false);

  const { subscribe } = useWebSocket();

  const loadData = async () => {
    try {
      const [seqs, camps] = await Promise.all([
        api.getFollowUps(),
        api.getCampaigns()
      ]);
      setSequences(seqs);
      setCampaigns(camps);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsub1 = subscribe('FOLLOWUP_CREATED', loadData);
    const unsub2 = subscribe('FOLLOWUP_UPDATED', loadData);
    const unsub3 = subscribe('FOLLOWUP_DELETED', loadData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [subscribe]);

  const openCreateModal = () => {
    setEditingSequence(null);
    setName('');
    setCampaignId(campaigns[0]?.id || '');
    setSteps([
      { stepNumber: 1, waitDays: 3, channel: 'email', instructions: 'Gentle check-in referring to previous email.' },
      { stepNumber: 2, waitDays: 4, channel: 'email', instructions: 'Short value add / breakup email.' }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (seq: FollowUpSequence) => {
    setEditingSequence(seq);
    setName(seq.name);
    setCampaignId(seq.campaignId);
    setSteps(seq.steps);
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    const nextStepNum = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepNumber: nextStepNum,
        waitDays: 3,
        channel: 'email',
        instructions: `Follow-up ${nextStepNum} instructions...`
      }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(updated);
  };

  const handleUpdateStep = (index: number, field: keyof FollowUpStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingSequence) {
        await api.updateFollowUp(editingSequence.id, {
          name,
          campaignId,
          steps
        });
      } else {
        await api.createFollowUp({
          name,
          campaignId,
          steps,
          active: true
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save sequence');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (seq: FollowUpSequence) => {
    try {
      await api.updateFollowUp(seq.id, { active: !seq.active });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle sequence');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this follow-up sequence?')) {
      try {
        await api.deleteFollowUp(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete sequence');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Automatic Stop Protection: Any reply detected instantly stops all pending follow-ups for that lead.</span>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Sequence</span>
        </button>
      </div>

      {/* Sequences List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : sequences.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Follow-up Sequences Configured"
          description="Create automated multi-step cadences (Initial Message → Wait X days → Follow-up 1 → Wait Y days → Follow-up 2) with safety reply triggers."
          actionLabel="+ Create Follow-up Sequence"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">{seq.name}</h3>
                    <p className="text-xs text-blue-400 font-medium mt-0.5">{seq.campaignName}</p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(seq)}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {seq.active ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ToggleRight className="w-6 h-6 text-emerald-400" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <ToggleLeft className="w-6 h-6 text-slate-500" /> Paused
                      </span>
                    )}
                  </button>
                </div>

                {/* Sequence Step Visualizer */}
                <div className="space-y-3 my-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      0
                    </span>
                    <span>Initial Outreach Dispatched</span>
                  </div>

                  {seq.steps.map((st, idx) => (
                    <div key={idx} className="pl-3 border-l-2 border-slate-800 space-y-2 py-1">
                      <div className="flex items-center gap-2 text-xs text-amber-400/90 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Wait {st.waitDays} days (no reply)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-200">Step {st.stepNumber} Follow-up</span>
                          <span className="text-[11px] uppercase text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {st.channel}
                          </span>
                        </div>
                        <p className="text-slate-400">{st.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {seq.steps.length} Follow-up Step{seq.steps.length > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(seq)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Sequence"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(seq.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sequence Builder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSequence ? 'Edit Follow-up Sequence' : 'Create Follow-up Sequence'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Sequence Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Touch Enterprise Cadence"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Target Campaign
            </label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Apply to all campaigns --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Follow-up Cadence Steps
              </label>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((st, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Step {st.stepNumber}</span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Wait Delay (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={st.waitDays}
                        onChange={(e) => handleUpdateStep(idx, 'waitDays', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Channel</label>
                      <select
                        value={st.channel}
                        onChange={(e) => handleUpdateStep(idx, 'channel', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">AI Prompt Instructions for this step</label>
                    <input
                      type="text"
                      value={st.instructions}
                      onChange={(e) => handleUpdateStep(idx, 'instructions', e.target.value)}
                      placeholder="e.g. Reference the initial email, highlight security ROI..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Sequence'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
