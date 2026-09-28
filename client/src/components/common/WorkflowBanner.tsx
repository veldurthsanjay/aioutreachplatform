import React from 'react';
import {
  Target,
  Users,
  Sparkles,
  Send,
  MessagesSquare,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import type { NavigationTab } from '../../types';

interface WorkflowBannerProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickStart: () => void;
}

const steps: { id: NavigationTab; stepNum: number; title: string; subtitle: string; icon: React.ReactNode }[] = [
  { id: 'campaigns', stepNum: 1, title: 'Campaign', subtitle: 'Offer & Persona', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'leads', stepNum: 2, title: 'Leads CRM', subtitle: 'Target Contacts', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'messages', stepNum: 3, title: 'AI Copy', subtitle: 'Generate & Review', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'outreach', stepNum: 4, title: 'Outreach', subtitle: 'Send Live', icon: <Send className="w-3.5 h-3.5" /> },
  { id: 'conversations', stepNum: 5, title: 'Inbox', subtitle: 'Replies & AI Help', icon: <MessagesSquare className="w-3.5 h-3.5" /> },
];

const guidanceMap: Record<NavigationTab, { stepText: string; nextTab?: NavigationTab; nextLabel?: string }> = {
  dashboard: {
    stepText: 'Follow the 5-step pipeline below to launch tailored outreach campaigns in minutes.',
    nextTab: 'campaigns',
    nextLabel: 'Start Step 1: Campaigns'
  },
  campaigns: {
    stepText: 'Step 1 of 5: Create your target audience and value proposition (or use 1-click presets).',
    nextTab: 'leads',
    nextLabel: 'Next: Add Leads'
  },
  leads: {
    stepText: 'Step 2 of 5: Add leads manually, import CSV, or 1-click add sample leads.',
    nextTab: 'messages',
    nextLabel: 'Next: Generate AI Copy'
  },
  messages: {
    stepText: 'Step 3 of 5: Review AI-crafted personalized messages, edit if needed, and click Approve.',
    nextTab: 'outreach',
    nextLabel: 'Next: Send Outreach'
  },
  outreach: {
    stepText: 'Step 4 of 5: Queue approved messages and trigger live sequential sending via Gmail/WhatsApp.',
    nextTab: 'conversations',
    nextLabel: 'Next: View Inbox'
  },
  conversations: {
    stepText: 'Step 5 of 5: Manage incoming prospect replies with AI sentiment analysis and smart auto-drafts.',
    nextTab: 'followups',
    nextLabel: 'Configure Follow-ups'
  },
  followups: {
    stepText: 'Automate multi-touch follow-up cadences with automatic stop-on-reply safety.',
    nextTab: 'dashboard',
    nextLabel: 'Back to Dashboard'
  },
  integrations: {
    stepText: 'Manage your connected OpenRouter AI, Gmail SMTP (Active), and WhatsApp API accounts.',
    nextTab: 'dashboard',
    nextLabel: 'Back to Dashboard'
  },
  settings: {
    stepText: 'Tune sending rates, cooldown intervals, and global workspace parameters.',
    nextTab: 'dashboard',
    nextLabel: 'Back to Dashboard'
  }
};

export const WorkflowBanner: React.FC<WorkflowBannerProps> = ({
  activeTab,
  onNavigate,
  onOpenQuickStart
}) => {
  const guide = guidanceMap[activeTab] || guidanceMap.dashboard;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Step Indicator Pills */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {steps.map((s, index) => {
            const isCurrent = activeTab === s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => onNavigate(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400 font-semibold'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent ? 'bg-white text-blue-600' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {s.stepNum}
                  </span>
                  <span>{s.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Guidance & Help */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={onOpenQuickStart}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>How it Works</span>
          </button>

          {guide.nextTab && guide.nextLabel && (
            <button
              onClick={() => onNavigate(guide.nextTab!)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <span>{guide.nextLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
