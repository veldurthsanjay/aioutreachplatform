import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Upload,
  Users,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Mail,
  Phone,
  Globe,
  MapPin,
  Tag,
  Building,
  FileSpreadsheet,
  Sparkles,
  Zap,
  ArrowRight,
  Download,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import type { Lead, Campaign, LeadStatus, NavigationTab } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useWebSocket } from '../context/WebSocketContext';

interface LeadsPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [populating, setPopulating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Manual Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [leadCampaignId, setLeadCampaignId] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvCampaignId, setCsvCampaignId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showCsvTemplate, setShowCsvTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { subscribe } = useWebSocket();

  const loadData = async () => {
    try {
      const [leadsData, campaignsData] = await Promise.all([
        api.getLeads({
          campaignId: selectedCampaign || undefined,
          status: selectedStatus || undefined,
          search: searchQuery || undefined
        }),
        api.getCampaigns()
      ]);
      setLeads(leadsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Failed to load leads data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsub1 = subscribe('LEAD_CREATED', loadData);
    const unsub2 = subscribe('LEADS_IMPORTED', loadData);
    const unsub3 = subscribe('LEAD_UPDATED', loadData);
    const unsub4 = subscribe('LEAD_DELETED', loadData);
    const unsub5 = subscribe('LEADS_BULK_DELETED', loadData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [selectedCampaign, selectedStatus, searchQuery, subscribe]);

  const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

  // Open Create Manual Lead Modal
  const openCreateModal = () => {
    setEditingLead(null);
    setBusinessName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setCategory('');
    setLocation('');
    setLeadCampaignId(selectedCampaign || campaigns[0]?.id || '');
    setLeadStatus('new');
    setNotes('');
    setFormError(null);
    setIsManualModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setBusinessName(lead.businessName || '');
    setContactName(lead.contactName || '');
    setEmail(lead.email || '');
    setPhone(lead.phone || '');
    setWebsite(lead.website || '');
    setCategory(lead.category || '');
    setLocation(lead.location || '');
    setLeadCampaignId(lead.campaignId || '');
    setLeadStatus(lead.status || 'new');
    setNotes(lead.notes || '');
    setFormError(null);
    setIsManualModalOpen(true);
  };

  const handlePopulateSample = async () => {
    setPopulating(true);
    try {
      const res = await api.populateSampleLeads(selectedCampaign || undefined);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to populate sample leads');
    } finally {
      setPopulating(false);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() && !businessName.trim() && !email.trim() && !phone.trim()) {
      setFormError('Please provide at least a contact name, company name, email or phone.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingLead) {
        await api.updateLead(editingLead.id, {
          campaignId: leadCampaignId,
          businessName,
          contactName,
          email,
          phone,
          website,
          category,
          location,
          status: leadStatus,
          notes
        });
      } else {
        await api.createLead({
          campaignId: leadCampaignId,
          businessName,
          contactName,
          email,
          phone,
          website,
          category,
          location,
          notes
        });
      }
      setIsManualModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead "${name || 'Unnamed'}"?`)) {
      try {
        await api.deleteLead(id);
        setSelectedLeadIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete lead');
      }
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    if (confirm(`Are you sure you want to delete ${ids.length} selected leads?`)) {
      try {
        await api.bulkDeleteLeads(ids);
        setSelectedLeadIds(new Set());
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete leads');
      }
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setImportError('Please select a CSV file.');
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      await api.importCsvLeads(csvFile, csvCampaignId);
      setIsCsvModalOpen(false);
      setCsvFile(null);
      loadData();
    } catch (err: any) {
      setImportError(err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === leads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(leads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sampleCsvContent = `Contact Name,Business Name,Email,Phone,Website,Category,Location,Notes
Alex Mercer,Apex Defense Solutions,alex.mercer@apexdefense.tech,+1 555-234-8901,https://apexdefense.tech,Defense Tech,Arlington VA,Looking for automated screening for cleared engineers
Priya Sharma,FinVault Capital,priya.sharma@finvaultcap.com,+1 555-789-4321,https://finvaultcap.com,FinTech,New York NY,Scaling engineering team rapidly
Marcus Vance,Nordic Logistics,marcus.v@nordiccoldlogistics.com,+1 555-456-1122,https://nordiccoldlogistics.com,Cold Chain,Chicago IL,Facility manager evaluating sensors`;

  const copySampleCsv = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    alert('Sample CSV template copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Top Quick Guidance & Action Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Step 2: Add Target Prospects</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {leads.length === 0
                ? 'Add prospects manually, import a CSV file, or click 1-Click Demo Leads.'
                : `You have ${leads.length} prospect(s) ready. Next: generate tailored AI outreach messages.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePopulateSample}
            disabled={populating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Instant 1-click sample leads to test the workflow"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{populating ? 'Adding...' : '⚡ 1-Click Demo Leads'}</span>
          </button>

          {leads.length > 0 && onNavigate && (
            <button
              onClick={() => onNavigate('messages')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next: Generate AI Copy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & CRM Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search leads by name, company, email, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Campaign Filter */}
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New (Unprocessed)</option>
            <option value="message_generated">Draft Ready</option>
            <option value="approved">Approved</option>
            <option value="queued">Queued for Send</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="failed">Delivery Failed</option>
            <option value="do_not_contact">Do Not Contact</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {selectedLeadIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-medium transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedLeadIds.size})</span>
            </button>
          )}

          <button
            onClick={() => {
              setCsvFile(null);
              setCsvCampaignId(selectedCampaign || campaigns[0]?.id || '');
              setImportError(null);
              setIsCsvModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* 3. Leads Table / Zero State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery || selectedCampaign || selectedStatus ? 'No matching leads found' : 'No target leads in CRM'}
          description={
            searchQuery || selectedCampaign || selectedStatus
              ? 'Try clearing your search query or filters to see all contacts.'
              : 'Add your target prospects manually, upload a CSV file, or click 1-Click Demo Leads for instant sample data.'
          }
          actionLabel={searchQuery || selectedCampaign || selectedStatus ? undefined : '⚡ Add 3 Demo Leads'}
          onAction={handlePopulateSample}
        />
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className="cursor-pointer text-slate-400 hover:text-white">
                      {selectedLeadIds.size === leads.length && leads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Contact & Company</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Category & Location</th>
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {leads.map((lead) => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-4">
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          className="cursor-pointer text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-200 text-sm">
                            {lead.contactName || 'Unnamed Contact'}
                          </p>
                          {lead.businessName && (
                            <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{lead.businessName}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 space-y-1">
                        {lead.category && (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{lead.category}</span>
                          </div>
                        )}
                        {lead.location && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{lead.location}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 font-medium">
                          {campaignMap.get(lead.campaignId) || 'Unassigned'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge status={lead.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={async () => {
                              try {
                                await api.generateSingleMessage(lead.id, lead.campaignId);
                                alert(`Generated AI outreach message for ${lead.contactName || lead.businessName}!`);
                                loadData();
                              } catch (err: any) {
                                alert(err.message || 'AI generation failed');
                              }
                            }}
                            className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors cursor-pointer"
                            title="Generate AI Message for this lead"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.contactName || lead.businessName)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Lead Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title={editingLead ? 'Edit Prospect Lead' : 'Add New Prospect Lead'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveLead} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Assign to Campaign
            </label>
            <select
              value={leadCampaignId}
              onChange={(e) => setLeadCampaignId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- No Campaign (General) --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.product})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Mercer"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Defense Solutions"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="alex.mercer@apexdefense.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="+1 555-234-8901"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Website
              </label>
              <input
                type="text"
                placeholder="https://apexdefense.tech"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Industry / Category
              </label>
              <input
                type="text"
                placeholder="Defense / FinTech"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                City / Location
              </label>
              <input
                type="text"
                placeholder="Arlington, VA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {editingLead && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pipeline Status
              </label>
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="new">New (Unprocessed)</option>
                <option value="message_generated">Draft Ready</option>
                <option value="approved">Approved</option>
                <option value="queued">Queued for Send</option>
                <option value="sent">Sent</option>
                <option value="replied">Replied</option>
                <option value="failed">Failed</option>
                <option value="do_not_contact">Do Not Contact</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Personalized Notes / Talking Points
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Scaling engineering team, hiring top secret cleared developers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editingLead ? 'Update Lead' : 'Save Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Leads via CSV"
        maxWidth="lg"
      >
        <form onSubmit={handleImportCsv} className="space-y-4">
          {importError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {importError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Assign to Campaign
            </label>
            <select
              value={csvCampaignId}
              onChange={(e) => setCsvCampaignId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- No Campaign (General) --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* File dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-slate-800 hover:border-blue-500/60 rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-10 h-10 text-blue-400 mb-2" />
            <p className="text-sm font-medium text-slate-200">
              {csvFile ? csvFile.name : 'Click to select or drag CSV file here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports: Contact Name, Business Name, Email, Phone, Website, Category, Location
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setCsvFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* CSV Template Helper */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">Need the standard CSV format?</span>
            </div>
            <button
              type="button"
              onClick={copySampleCsv}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Copy Sample CSV
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing || !csvFile}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {importing ? 'Importing CSV...' : 'Upload & Import'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
