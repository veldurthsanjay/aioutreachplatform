import React, { useState, useEffect } from 'react';
import {
  Plus,
  Target,
  Edit2,
  Trash2,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  Layers,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { Campaign, ChannelType, NavigationTab } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useWebSocket } from '../context/WebSocketContext';

interface CampaignsPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const { subscribe } = useWebSocket();

  // Form State
  const [name, setName] = useState('');
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [objective, setObjective] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('Professional & Direct');
  const [channel, setChannel] = useState<ChannelType>('email');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();

    const unsubCreate = subscribe('CAMPAIGN_CREATED', loadCampaigns);
    const unsubUpdate = subscribe('CAMPAIGN_UPDATED', loadCampaigns);
    const unsubDelete = subscribe('CAMPAIGN_DELETED', loadCampaigns);

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, [subscribe]);

  const openCreateModal = () => {
    setEditingCampaign(null);
    setName('');
    setProduct('');
    setAudience('');
    setObjective('');
    setInstructions('');
    setTone('Professional & Direct');
    setChannel('email');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Campaign) => {
    setEditingCampaign(c);
    setName(c.name);
    setProduct(c.product);
    setAudience(c.audience);
    setObjective(c.objective);
    setInstructions(c.instructions);
    setTone(c.tone);
    setChannel(c.channel);
    setError(null);
    setIsModalOpen(true);
  };

  const applyPresetAndOpen = (presetType: string) => {
    setEditingCampaign(null);
    setError(null);
    if (presetType === 'recruiter') {
      setName('SecureVitae Recruiter Pitch');
      setProduct('SecureVitae (AI Cybersecurity Candidate Screening Platform)');
      setAudience('Talent Acquisition & Recruiting Leads at Defense & FinTech firms');
      setObjective('Book a 15-minute live platform demonstration call');
      setInstructions('Emphasize automated security clearance matching, instant technical screening, and 60% faster shortlisting.');
      setTone('Professional & Direct');
      setChannel('email');
    } else if (presetType === 'freelance') {
      setName('Freelance Web Development');
      setProduct('Full-Stack Web App Development & Performance Optimization');
      setAudience('Founders and CTOs at early-stage tech startups');
      setObjective('Offer a complimentary 1-page codebase & UI/UX performance audit');
      setInstructions('Highlight React/Next.js and Node.js expertise, 2-week turnaround, and zero technical debt.');
      setTone('Friendly & Consultative');
      setChannel('email');
    } else if (presetType === 'coldstorage') {
      setName('Cold-Storage Temperature Monitoring');
      setProduct('IoT Wireless Temperature & Humidity Sensors + Alert Cloud');
      setAudience('Cold storage facility managers, pharma logistics operators, food distributors');
      setObjective('Schedule an on-site sensor kit trial');
      setInstructions('Highlight 24/7 automated SMS/Email alerts, compliance audit logs, and prevention of inventory spoilage.');
      setTone('Urgent & High Value');
      setChannel('email');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !product.trim() || !objective.trim()) {
      setError('Please fill in Name, Product/Service, and Objective.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingCampaign) {
        await api.updateCampaign(editingCampaign.id, {
          name,
          product,
          audience,
          objective,
          instructions,
          tone,
          channel
        });
      } else {
        await api.createCampaign({
          name,
          product,
          audience,
          objective,
          instructions,
          tone,
          channel
        });
      }
      setIsModalOpen(false);
      loadCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete campaign "${name}"?`)) {
      try {
        await api.deleteCampaign(id);
        loadCampaigns();
      } catch (err: any) {
        alert(err.message || 'Failed to delete campaign');
      }
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.audience.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Quick Presets Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Quick Campaign Presets</span>
          </div>
          <span className="text-[11px] text-slate-400">Click to instantly create a ready-to-use campaign</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => applyPresetAndOpen('recruiter')}
            className="p-3 text-left rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/60 hover:bg-blue-950/20 text-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-blue-400 group-hover:text-blue-300">SecureVitae Recruiter</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
            </div>
            <p className="text-[11px] text-slate-400">Target tech recruiters with AI resume screening</p>
          </button>

          <button
            onClick={() => applyPresetAndOpen('freelance')}
            className="p-3 text-left rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/20 text-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-indigo-400 group-hover:text-indigo-300">Freelance Web Dev</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
            </div>
            <p className="text-[11px] text-slate-400">Offer free speed & UX audits to startup CTOs</p>
          </button>

          <button
            onClick={() => applyPresetAndOpen('coldstorage')}
            className="p-3 text-left rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/60 hover:bg-purple-950/20 text-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-purple-400 group-hover:text-purple-300">Cold-Storage Sensors</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400">IoT wireless temperature alert trials</p>
          </button>
        </div>
      </div>

      {/* 2. Search & Create */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Custom Campaign</span>
        </button>
      </div>

      {/* 3. Campaign List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={Target}
          title={searchQuery ? 'No matching campaigns' : 'No campaigns created yet'}
          description={
            searchQuery
              ? 'Try changing your search keywords.'
              : 'Choose one of the quick presets above or click "+ Custom Campaign" to define your product offer.'
          }
          actionLabel={searchQuery ? undefined : '+ Create First Campaign'}
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{c.name}</h3>
                    <p className="text-xs text-blue-400 font-medium mt-0.5">{c.product}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {c.channel}
                  </span>
                </div>

                <div className="space-y-2 my-4 text-xs">
                  <div>
                    <span className="text-slate-400">Target: </span>
                    <span className="text-slate-200">{c.audience || 'General B2B'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Objective: </span>
                    <span className="text-slate-200">{c.objective}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tone: </span>
                    <span className="text-indigo-300 font-medium">{c.tone}</span>
                  </div>
                  {c.instructions && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 text-xs line-clamp-2">
                      <span className="text-slate-300 font-medium">Guidance: </span>
                      {c.instructions}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onNavigate && onNavigate('leads')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <span>Add Leads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Campaign"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? 'Edit Campaign' : 'Create Outreach Campaign'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Campaign Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SecureVitae Q4 Recruiter Pitch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product / Service <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AI Resume Screening Platform"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g. Talent Acquisition Leads"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Objective / Call-to-Action <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Book a 15-minute demo call"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Professional & Direct">Professional & Direct</option>
                <option value="Friendly & Warm">Friendly & Warm</option>
                <option value="Consultative">Consultative</option>
                <option value="Urgent & Value-Driven">Urgent & Value-Driven</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Key Value Points & Guidance (AI Prompt Context)
            </label>
            <textarea
              rows={3}
              placeholder="Highlight key advantages, clearance matching, speed, free trial offer, etc."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
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
              {saving ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
