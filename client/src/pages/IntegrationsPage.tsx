import React, { useState, useEffect } from 'react';
import {
  Plug,
  Sparkles,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Key,
  Server,
  Globe,
  Lock,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import type { IntegrationConfig, NavigationTab } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useWebSocket } from '../context/WebSocketContext';

interface IntegrationsPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ onNavigate }) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini' | 'openai' | 'anthropic'>('openrouter');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('google/gemini-2.5-flash');

  // Email Modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailProvider, setEmailProvider] = useState<'resend' | 'smtp'>('resend');
  const [emailApiKey, setEmailApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');

  // WhatsApp Modal
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waToken, setWaToken] = useState('');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waBusinessAccountId, setWaBusinessAccountId] = useState('');

  const [saving, setSaving] = useState(false);
  const { subscribe } = useWebSocket();

  const loadIntegrations = async () => {
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error('Failed to load integrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();

    const unsub = subscribe('INTEGRATIONS_UPDATED', loadIntegrations);
    return () => unsub();
  }, [subscribe]);

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveAiIntegration({
        provider: aiProvider,
        apiKey: aiApiKey,
        model: aiModel
      });
      setIsAiModalOpen(false);
      setAiApiKey('');
      loadIntegrations();
    } catch (err: any) {
      alert(err.message || 'Failed to save AI configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveEmailIntegration({
        provider: emailProvider,
        apiKey: emailApiKey,
        senderEmail,
        senderName,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword
      });
      setIsEmailModalOpen(false);
      setEmailApiKey('');
      setSmtpPassword('');
      loadIntegrations();
    } catch (err: any) {
      alert(err.message || 'Failed to save Email configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveWhatsAppIntegration({
        apiKey: waToken,
        phoneNumberId: waPhoneNumberId,
        businessAccountId: waBusinessAccountId
      });
      setIsWaModalOpen(false);
      setWaToken('');
      loadIntegrations();
    } catch (err: any) {
      alert(err.message || 'Failed to save WhatsApp configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !integrations) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Security notice */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-white">Zero Client-Side Keys & Real Confirmation Guarantee</p>
          <p className="text-slate-400">
            All API credentials and tokens are strictly stored and executed on the Node.js backend via environment variables.
            The platform never displays "Sent" unless the official API provider positively confirms successful dispatch.
          </p>
        </div>
      </div>

      {/* 3 Core Integrations Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. AI Engine */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/50">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <Badge status={integrations.ai.status} />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">AI Personalization Engine</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Generates hyper-personalized outreach copy tailored to each lead and campaign objective.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Provider:</span>
                <span className="font-medium text-slate-200 capitalize">{integrations.ai.provider || 'Not configured'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>API Key:</span>
                <span className="font-medium text-slate-200">{integrations.ai.apiKeySet ? '•••••••• (Stored securely in .env)' : 'Not Set'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Model:</span>
                <span className="font-medium text-slate-200">{integrations.ai.model || 'gemini-1.5-flash'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
            >
              Configure AI Provider
            </button>
          </div>
        </div>

        {/* 2. Email Integration */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/50">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <Badge status={integrations.email.status} />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">Real Email Integration</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Sends verified cold emails via Resend API, custom SMTP, or Gmail API with delivery tracking.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Provider:</span>
                <span className="font-medium text-slate-200 uppercase">{integrations.email.provider || 'Resend / SMTP'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sender:</span>
                <span className="font-medium text-slate-200 truncate max-w-[150px]">{integrations.email.senderEmail || 'Not configured'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Credentials:</span>
                <span className="font-medium text-slate-200">{integrations.email.apiKeySet ? '•••••••• (Stored in .env)' : 'Not Set'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Configure Email Provider
            </button>
          </div>
        </div>

        {/* 3. WhatsApp Integration */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/50">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>

            <h3 className="text-base font-semibold text-white mb-1">WhatsApp Outreach</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Send personalized WhatsApp messages with 1-click WhatsApp Web links or Meta Cloud API.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sender Number:</span>
                <span className="font-medium text-slate-200">9876543219</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>WhatsApp Web (wa.me):</span>
                <span className="font-semibold text-emerald-400">Ready (1-Click)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Meta Cloud API:</span>
                <span className="font-medium text-slate-300">{integrations.whatsapp.apiKeySet ? 'Configured' : 'Optional (Token needed)'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsWaModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Configure Meta Cloud API Keys
            </button>
          </div>
        </div>
      </div>

      {/* AI Configuration Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="Configure AI Provider"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAi} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select AI Engine
            </label>
            <select
              value={aiProvider}
              onChange={(e) => {
                const val = e.target.value as any;
                setAiProvider(val);
                if (val === 'openrouter') setAiModel('google/gemini-2.5-flash');
                else if (val === 'gemini') setAiModel('gemini-1.5-flash');
                else if (val === 'openai') setAiModel('gpt-4o-mini');
                else if (val === 'anthropic') setAiModel('claude-3-5-sonnet-20241022');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="openrouter">OpenRouter (Gemini, Claude, GPT-4o, Llama 3, DeepSeek via single key)</option>
              <option value="gemini">Google Gemini Direct</option>
              <option value="openai">OpenAI Direct</option>
              <option value="anthropic">Anthropic Claude Direct</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              API Key (Saved directly to backend .env)
            </label>
            <input
              type="password"
              placeholder={integrations.ai.apiKeySet ? 'Leave blank to keep existing key, or enter new key' : 'Paste your API key here'}
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Model Name
            </label>
            <input
              type="text"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Email Configuration Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Configure Email Delivery"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Provider Type
            </label>
            <select
              value={emailProvider}
              onChange={(e) => setEmailProvider(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="resend">Resend API (Recommended for modern deliverability)</option>
              <option value="smtp">Custom SMTP Server / Gmail SMTP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sender Email Address
              </label>
              <input
                type="email"
                placeholder="outreach@yourdomain.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sender Display Name
              </label>
              <input
                type="text"
                placeholder="Alex from SecureVitae"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {emailProvider === 'resend' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Resend API Key (re_...)
              </label>
              <input
                type="password"
                placeholder={integrations.email.apiKeySet ? 'Leave blank to keep existing key' : 're_123456789...'}
                value={emailApiKey}
                onChange={(e) => setEmailApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">SMTP Username</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">SMTP Password / App Password</label>
                  <input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Email Config'}
            </button>
          </div>
        </form>
      </Modal>

      {/* WhatsApp Configuration Modal */}
      <Modal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        title="Configure WhatsApp Cloud API"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveWhatsApp} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Phone Number ID (From Meta Developer Dashboard)
            </label>
            <input
              type="text"
              placeholder="e.g. 106548795412365"
              value={waPhoneNumberId}
              onChange={(e) => setWaPhoneNumberId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              WhatsApp Business Account ID (WABA ID)
            </label>
            <input
              type="text"
              placeholder="e.g. 209847123984123"
              value={waBusinessAccountId}
              onChange={(e) => setWaBusinessAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              System User Permanent Access Token (EAAB...)
            </label>
            <input
              type="password"
              placeholder={integrations.whatsapp.apiKeySet ? 'Leave blank to keep existing token' : 'EAAB...'}
              value={waToken}
              onChange={(e) => setWaToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsWaModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save WhatsApp Config'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
