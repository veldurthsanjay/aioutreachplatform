import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Shield,
  Clock,
  Mail,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';
import type { AppSettings, NavigationTab } from '../types';
import { useWebSocket } from '../context/WebSocketContext';

interface SettingsPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const { subscribe } = useWebSocket();

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    const unsub = subscribe('SETTINGS_UPDATED', loadSettings);
    return () => unsub();
  }, [subscribe]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fadeIn">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Rate Limiting & Safety */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <Shield className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-semibold text-white">Outreach Rate Limits & Safety Controls</h3>
              <p className="text-xs text-slate-400">Protects email deliverability and avoids WhatsApp spam bans</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Daily Email Sending Limit</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={settings.dailyEmailLimit}
                onChange={(e) => setSettings({ ...settings, dailyEmailLimit: parseInt(e.target.value) || 50 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Recommended 30–50 per day for new mailboxes</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Daily WhatsApp Sending Limit</span>
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={settings.dailyWhatsAppLimit}
                onChange={(e) => setSettings({ ...settings, dailyWhatsAppLimit: parseInt(e.target.value) || 50 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Regulated by Meta Business tier</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Delay Between Dispatched Messages (Seconds)</span>
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={settings.delayBetweenMessagesSec}
              onChange={(e) => setSettings({ ...settings, delayBetweenMessagesSec: parseInt(e.target.value) || 5 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Spacing messages prevents throttling by spam filters</p>
          </div>
        </div>

        {/* AI & Automation Settings */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-semibold text-white">AI Personalization & Automation Preferences</h3>
              <p className="text-xs text-slate-400">Controls message variation creativity and reply handling</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  AI Creativity Temperature ({settings.aiTemperature})
                </label>
                <span className="text-[11px] text-slate-400">
                  {settings.aiTemperature < 0.4 ? 'Strict & Direct' : settings.aiTemperature > 0.8 ? 'Highly Creative' : 'Balanced Personalization'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.aiTemperature}
                onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Automatically Classify Incoming Lead Replies</p>
                <p className="text-xs text-slate-400">Uses AI to categorize replies (Positive, Question, Objection, Unsubscribe)</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoClassifyReplies}
                onChange={(e) => setSettings({ ...settings, autoClassifyReplies: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Auto-Stop Follow-up Sequences on Lead Reply</p>
                <p className="text-xs text-slate-400">Prevents embarrassing automated follow-ups after a prospect has already answered</p>
              </div>
              <input
                type="checkbox"
                checked={settings.stopFollowUpOnReply}
                onChange={(e) => setSettings({ ...settings, stopFollowUpOnReply: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Local Storage Info */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Persistence: Simple Atomic JSON files in <code className="text-slate-300">server/data/</code></span>
          </div>
          <span className="text-emerald-400 font-medium">Local JSON Database Active</span>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
