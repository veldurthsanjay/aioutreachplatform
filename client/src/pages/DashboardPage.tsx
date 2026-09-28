import React, { useEffect, useState } from 'react';
import {
  Target,
  Users,
  Send,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Plug,
  CheckCircle2,
  AlertCircle,
  Mail,
  Zap,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { DashboardStats, NavigationTab } from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import { PipelineGuide } from '../components/common/PipelineGuide';
import { QuickStartModal } from '../components/common/QuickStartModal';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const { subscribe } = useWebSocket();

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const unsub1 = subscribe('CAMPAIGN_CREATED', loadStats);
    const unsub2 = subscribe('CAMPAIGN_DELETED', loadStats);
    const unsub3 = subscribe('LEAD_CREATED', loadStats);
    const unsub4 = subscribe('LEADS_IMPORTED', loadStats);
    const unsub5 = subscribe('MESSAGE_UPDATED', loadStats);
    const unsub6 = subscribe('OUTREACH_QUEUE_UPDATED', loadStats);
    const unsub7 = subscribe('CONVERSATION_UPDATED', loadStats);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  }, [subscribe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Campaigns',
      value: stats?.totalCampaigns || 0,
      icon: <Target className="w-5 h-5 text-blue-400" />,
      action: () => onNavigate('campaigns'),
      actionText: 'Manage'
    },
    {
      label: 'Target Leads',
      value: stats?.totalLeads || 0,
      icon: <Users className="w-5 h-5 text-indigo-400" />,
      action: () => onNavigate('leads'),
      actionText: 'View CRM'
    },
    {
      label: 'Emails Sent',
      value: stats?.messagesSent || 0,
      icon: <Send className="w-5 h-5 text-emerald-400" />,
      action: () => onNavigate('outreach'),
      actionText: 'Queue'
    },
    {
      label: 'Reply Rate',
      value: `${stats?.replyRatePercent || 0}%`,
      icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
      action: () => onNavigate('conversations'),
      actionText: 'Inbox'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Step-by-Step Interactive Pipeline Guide Banner */}
      <PipelineGuide
        stats={stats}
        onNavigate={onNavigate}
        onOpenQuickStart={() => setIsGuideModalOpen(true)}
      />

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                {kpi.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight my-2">{kpi.value}</div>
            <button
              onClick={kpi.action}
              className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer pt-2 border-t border-slate-800/60"
            >
              <span>{kpi.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 3. Pipeline Stages & Live Integration Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline Funnel */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pipeline Funnel</h3>
              <p className="text-xs text-slate-400 mt-0.5">Leads moving through each outreach stage</p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              View All Leads <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '1. New Leads', count: stats?.leadsByStatus?.new || 0, color: 'text-slate-300', bg: 'bg-slate-950/60' },
              { label: '2. Draft Ready', count: stats?.leadsByStatus?.message_generated || 0, color: 'text-purple-400', bg: 'bg-purple-950/20' },
              { label: '3. Approved', count: stats?.leadsByStatus?.approved || 0, color: 'text-emerald-400', bg: 'bg-emerald-950/20' },
              { label: '4. Queued', count: stats?.leadsByStatus?.queued || 0, color: 'text-amber-400', bg: 'bg-amber-950/20' },
              { label: '5. Sent', count: stats?.leadsByStatus?.sent || 0, color: 'text-blue-400', bg: 'bg-blue-950/20' },
              { label: '6. Replied', count: stats?.leadsByStatus?.replied || 0, color: 'text-emerald-300', bg: 'bg-emerald-900/30' },
              { label: '7. Failed', count: stats?.leadsByStatus?.failed || 0, color: 'text-rose-400', bg: 'bg-rose-950/20' },
              { label: '8. Do Not Contact', count: stats?.leadsByStatus?.do_not_contact || 0, color: 'text-slate-500', bg: 'bg-slate-950' }
            ].map((stage, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border border-slate-800/80 ${stage.bg}`}>
                <p className="text-[11px] text-slate-400 font-medium mb-1 truncate">{stage.label}</p>
                <p className={`text-xl font-bold ${stage.color}`}>{stage.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Integration Health */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Providers</h3>
              <button
                onClick={() => onNavigate('integrations')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                Configure
              </button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'AI Engine', desc: 'OpenRouter (Gemini / GPT-4o)', status: stats?.integrationsStatus.ai },
                { name: 'Email Delivery', desc: 'Gmail SMTP (Verified)', status: stats?.integrationsStatus.email },
                { name: 'WhatsApp API', desc: 'Official Cloud API', status: stats?.integrationsStatus.whatsapp }
              ].map((intg, idx) => {
                const isConn = intg.status === 'connected';
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{intg.name}</p>
                      <p className="text-[11px] text-slate-400">{intg.desc}</p>
                    </div>
                    <div>
                      {isConn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : intg.status === 'requires_config' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/50">
                          <AlertCircle className="w-3 h-3" /> Needs Token
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
                          Not Setup
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('integrations')}
            className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plug className="w-3.5 h-3.5 text-blue-400" />
            <span>Manage Integrations</span>
          </button>
        </div>
      </div>

      {/* Quick Start Guide Modal */}
      <QuickStartModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
