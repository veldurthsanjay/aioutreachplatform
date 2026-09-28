import React from 'react';
import type { NavigationTab } from '../../types';
import { Sparkles, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: NavigationTab;
  onOpenHelp?: () => void;
}

const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Platform Dashboard', subtitle: 'Live overview of your outreach pipeline and system metrics' },
  campaigns: { title: 'Campaigns', subtitle: 'Step 1: Manage value propositions, target audiences, and outreach instructions' },
  leads: { title: 'Leads CRM', subtitle: 'Step 2: Target prospects, CSV import, status tracking and segmentation' },
  messages: { title: 'AI Messages & Approvals', subtitle: 'Step 3: Generate, review, customize, and approve tailored outreach copy' },
  outreach: { title: 'Outreach Dispatcher', subtitle: 'Step 4: Real-time delivery monitor and queue execution' },
  conversations: { title: 'Conversations & Inbox', subtitle: 'Step 5: Incoming replies, sentiment classification, and AI reply assistance' },
  followups: { title: 'Follow-up Sequences', subtitle: 'Multi-step cadences with automatic stop-on-reply' },
  integrations: { title: 'Integrations & API Connections', subtitle: 'Live status and configuration for AI, Email, and WhatsApp' },
  settings: { title: 'System Settings', subtitle: 'Daily sending quotas, timeouts, and campaign parameters' }
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenHelp }) => {
  const current = titles[activeTab] || { title: 'AI Outreach', subtitle: '' };

  return (
    <header className="bg-slate-900/60 backdrop-blur border-b border-slate-800/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">{current.title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Local JSON Engine</span>
        </div>
      </div>
    </header>
  );
};
