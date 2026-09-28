import React from 'react';
import {
  Target,
  Users,
  Sparkles,
  CheckCircle2,
  Send,
  ArrowRight,
  ShieldCheck,
  Mail,
  Zap,
  Check
} from 'lucide-react';
import { Modal } from './Modal';
import type { NavigationTab } from '../../types';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const guideSteps = [
    {
      step: '1',
      title: 'Create a Campaign',
      desc: 'Set your value proposition, audience, tone, and objective (e.g., SecureVitae recruiter pitch, Freelance web dev, or Cold-storage sensors).',
      actionTab: 'campaigns' as NavigationTab,
      actionText: 'Go to Campaigns'
    },
    {
      step: '2',
      title: 'Add Target Leads',
      desc: 'Add contacts manually or upload a CSV with columns like Business Name, Contact Name, Email, and Location.',
      actionTab: 'leads' as NavigationTab,
      actionText: 'Go to Leads'
    },
    {
      step: '3',
      title: 'Generate AI Messages',
      desc: 'The AI synthesizes the lead’s company & location with your campaign value proposition to write hyper-personalized cold copy.',
      actionTab: 'messages' as NavigationTab,
      actionText: 'Go to Messages'
    },
    {
      step: '4',
      title: 'Review & Approve',
      desc: 'Edit or regenerate copy before sending. Nothing is dispatched without your explicit approval.',
      actionTab: 'messages' as NavigationTab,
      actionText: 'Review Drafts'
    },
    {
      step: '5',
      title: 'Real Delivery via WebSockets',
      desc: 'Watch real-time delivery status (Queued → Sending → Sent) via verified Gmail SMTP or WhatsApp Cloud API.',
      actionTab: 'outreach' as NavigationTab,
      actionText: 'Go to Outreach'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 How the AI Outreach Engine Works"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <p className="text-xs text-slate-300 leading-relaxed">
          The platform follows a safe 5-step loop from defining your offer to tracking real replies:
        </p>

        <div className="space-y-3.5">
          {guideSteps.map((gs) => (
            <div
              key={gs.step}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {gs.step}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">{gs.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{gs.desc}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onNavigate(gs.actionTab);
                }}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 mt-1 cursor-pointer"
              >
                <span>{gs.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Automatic Stop Protection: Any lead reply immediately stops pending follow-up sequences.</span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            Got it, Let's Start!
          </button>
        </div>
      </div>
    </Modal>
  );
};
