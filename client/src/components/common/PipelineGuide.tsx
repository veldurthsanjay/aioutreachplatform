import React from 'react';
import {
  Target,
  Users,
  Sparkles,
  CheckCircle2,
  Send,
  ArrowRight,
  HelpCircle,
  Play
} from 'lucide-react';
import type { NavigationTab, DashboardStats } from '../../types';

interface PipelineGuideProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickStart?: () => void;
}

export const PipelineGuide: React.FC<PipelineGuideProps> = ({
  stats,
  onNavigate,
  onOpenQuickStart
}) => {
  const hasCampaigns = (stats?.totalCampaigns || 0) > 0;
  const hasLeads = (stats?.totalLeads || 0) > 0;
  const hasDrafts = (stats?.totalMessagesGenerated || 0) > 0;
  const hasApproved = (stats?.messagesApproved || 0) > 0;
  const hasSent = (stats?.messagesSent || 0) > 0;

  // Determine current active step
  let currentStep = 1;
  let nextActionLabel = 'Create Your First Campaign';
  let nextActionTab: NavigationTab = 'campaigns';

  if (!hasCampaigns) {
    currentStep = 1;
    nextActionLabel = 'Step 1: Create Campaign';
    nextActionTab = 'campaigns';
  } else if (!hasLeads) {
    currentStep = 2;
    nextActionLabel = 'Step 2: Add or Import Leads';
    nextActionTab = 'leads';
  } else if (!hasDrafts) {
    currentStep = 3;
    nextActionLabel = 'Step 3: Generate AI Messages';
    nextActionTab = 'messages';
  } else if (!hasApproved && !hasSent) {
    currentStep = 4;
    nextActionLabel = 'Step 4: Review & Approve Copy';
    nextActionTab = 'messages';
  } else if (!hasSent) {
    currentStep = 5;
    nextActionLabel = 'Step 5: Dispatch Outreach';
    nextActionTab = 'outreach';
  } else {
    currentStep = 6;
    nextActionLabel = 'View Inbound Replies';
    nextActionTab = 'conversations';
  }

  const steps = [
    {
      num: 1,
      title: 'Campaign',
      desc: hasCampaigns ? `${stats?.totalCampaigns} Active` : 'Define product & audience',
      done: hasCampaigns,
      active: currentStep === 1,
      tab: 'campaigns' as NavigationTab,
      icon: <Target className="w-4 h-4" />
    },
    {
      num: 2,
      title: 'Leads',
      desc: hasLeads ? `${stats?.totalLeads} Contacts` : 'Import CSV or add leads',
      done: hasLeads,
      active: currentStep === 2,
      tab: 'leads' as NavigationTab,
      icon: <Users className="w-4 h-4" />
    },
    {
      num: 3,
      title: 'AI Drafts',
      desc: hasDrafts ? `${stats?.totalMessagesGenerated} Drafted` : 'Generate tailored copy',
      done: hasDrafts,
      active: currentStep === 3,
      tab: 'messages' as NavigationTab,
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      num: 4,
      title: 'Approval',
      desc: hasApproved ? `${stats?.messagesApproved} Approved` : 'Review & approve',
      done: hasApproved || hasSent,
      active: currentStep === 4,
      tab: 'messages' as NavigationTab,
      icon: <CheckCircle2 className="w-4 h-4" />
    },
    {
      num: 5,
      title: 'Sending',
      desc: hasSent ? `${stats?.messagesSent} Sent` : 'Real delivery',
      done: hasSent,
      active: currentStep === 5,
      tab: 'outreach' as NavigationTab,
      icon: <Send className="w-4 h-4" />
    }
  ];

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-blue-900/40 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-400"></span>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Outreach Workflow Guide</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Follow this 5-step flow to take a campaign from idea to real verified deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenQuickStart && (
            <button
              onClick={onOpenQuickStart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>How it Works</span>
            </button>
          )}

          <button
            onClick={() => onNavigate(nextActionTab)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <span>{nextActionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5-Step Visual Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2">
        {steps.map((st) => (
          <button
            key={st.num}
            onClick={() => onNavigate(st.tab)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              st.active
                ? 'bg-blue-950/40 border-blue-500/80 shadow-sm ring-1 ring-blue-500/30'
                : st.done
                ? 'bg-slate-950/60 border-emerald-800/40 hover:border-emerald-700'
                : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                st.done
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  : st.active
                  ? 'bg-blue-900 text-blue-300 border border-blue-700'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                Step {st.num}
              </span>
              <span className={st.done ? 'text-emerald-400' : st.active ? 'text-blue-400' : 'text-slate-500'}>
                {st.icon}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-200 truncate">{st.title}</p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{st.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
