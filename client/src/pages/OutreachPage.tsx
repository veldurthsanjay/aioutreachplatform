import React, { useState, useEffect } from 'react';
import {
  Send,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  MessageSquare,
  Building,
  User,
  Filter,
  RefreshCw,
  ArrowRight,
  Zap,
  MessagesSquare,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import type { Campaign, NavigationTab } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useWebSocket } from '../context/WebSocketContext';

interface OutreachPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const OutreachPage: React.FC<OutreachPageProps> = ({ onNavigate }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [dispatching, setDispatching] = useState<boolean>(false);

  const { subscribe } = useWebSocket();

  const loadData = async () => {
    try {
      const [queueData, campaignsData] = await Promise.all([
        api.getOutreachQueue(),
        api.getCampaigns()
      ]);
      setQueue(queueData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Failed to load outreach queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsub1 = subscribe('OUTREACH_QUEUE_UPDATED', loadData);
    const unsub2 = subscribe('MESSAGE_UPDATED', loadData);
    const unsub3 = subscribe('OUTREACH_PROGRESS', loadData);
    const unsub4 = subscribe('OUTREACH_BATCH_COMPLETED', (data) => {
      alert(`Outreach dispatch finished! Sent: ${data.successes} | Failures: ${data.failures}`);
      loadData();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [subscribe]);

  const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

  const handleQueueApproved = async () => {
    setDispatching(true);
    try {
      const res = await api.queueApproved(selectedCampaign || undefined);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to queue approved messages');
    } finally {
      setDispatching(false);
    }
  };

  const handleStartSending = async () => {
    if (queuedCount === 0) {
      alert('No queued messages ready to send. First click "1. Queue Approved Drafts".');
      return;
    }

    if (!confirm(`Start sending ${queuedCount} queued message(s) through live Gmail SMTP / WhatsApp transports?`)) {
      return;
    }

    setDispatching(true);
    try {
      await api.startDispatch();
    } catch (err: any) {
      alert(err.message || 'Failed to start sending');
    } finally {
      setDispatching(false);
    }
  };

  const filteredQueue = queue.filter(item => {
    if (selectedCampaign && item.campaignId !== selectedCampaign) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const queuedCount = queue.filter(i => i.status === 'queued').length;
  const sendingCount = queue.filter(i => i.status === 'sending').length;
  const sentCount = queue.filter(i => i.status === 'sent').length;
  const failedCount = queue.filter(i => i.status === 'failed').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Step 4 Guidance & Quick Actions Header */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Step 4: Live Outreach Dispatcher</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute live email delivery via Gmail SMTP (dnkn93044@gmail.com) and WhatsApp Cloud API.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQueueApproved}
            disabled={dispatching}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Load all approved messages from Step 3 into the sending queue"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Queue Approved Drafts</span>
          </button>

          <button
            onClick={handleStartSending}
            disabled={dispatching || queuedCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            {sendingCount > 0 ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>2. Start Live Sending ({queuedCount})</span>
          </button>

          {sentCount > 0 && onNavigate && (
            <button
              onClick={() => onNavigate('conversations')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <MessagesSquare className="w-3.5 h-3.5" />
              <span>Next: View Inbox ({sentCount} Sent)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Live Outreach Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Queued for Dispatch', count: queuedCount, color: 'text-amber-400', icon: <Clock className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-950/20 border-amber-900/40' },
          { label: 'Currently Sending', count: sendingCount, color: 'text-blue-400', icon: <Send className="w-4 h-4 text-blue-400 animate-pulse" />, bg: 'bg-blue-950/20 border-blue-900/40' },
          { label: 'Successfully Sent', count: sentCount, color: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-950/20 border-emerald-900/40' },
          { label: 'Failed Deliveries', count: failedCount, color: 'text-rose-400', icon: <XCircle className="w-4 h-4 text-rose-400" />, bg: 'bg-rose-950/20 border-rose-900/40' }
        ].map((m, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${m.bg} flex items-center justify-between`}>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">{m.label}</p>
              <p className={`text-2xl font-bold ${m.color}`}>{m.count}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Queue Statuses</option>
            <option value="queued">Queued (Ready to Dispatch)</option>
            <option value="sending">Sending Live</option>
            <option value="sent">Successfully Sent</option>
            <option value="failed">Failed Delivery</option>
          </select>
        </div>
      </div>

      {/* 4. Queue Table / Zero State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredQueue.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Outreach Queue is Empty"
          description="Approve messages in Step 3 (AI Copy) then click '1. Queue Approved Drafts' above to load the delivery queue."
          actionLabel={onNavigate ? 'Go to Step 3: Review AI Messages' : undefined}
          onAction={() => onNavigate && onNavigate('messages')}
        />
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Recipient Prospect</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Message Snippet</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">
                          {item.lead?.contactName || 'Lead'}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {item.channel === 'email' ? item.lead?.email : item.lead?.phone || 'No destination'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-slate-300">
                        {item.channel === 'email' ? (
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="capitalize">{item.channel}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {campaignMap.get(item.campaignId) || 'Outreach'}
                    </td>
                    <td className="p-4 max-w-[280px]">
                      <p className="truncate text-slate-300">{item.subject || item.body}</p>
                      {item.errorReason && (
                        <p className="text-[11px] text-rose-400 truncate mt-0.5">{item.errorReason}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge status={item.status} />
                    </td>
                    <td className="p-4 text-slate-400">
                      {item.sentAt ? new Date(item.sentAt).toLocaleTimeString() : new Date(item.updatedAt).toLocaleTimeString()}
                    </td>
                    <td className="p-4 text-right">
                      {item.channel === 'whatsapp' && (
                        <button
                          onClick={async () => {
                            let phone = item.lead?.phone || '';
                            let clean = phone.replace(/[^0-9]/g, '');
                            if (clean.length === 10) clean = '91' + clean;
                            if (!clean) {
                              alert('This lead has no phone number.');
                              return;
                            }
                            const url = `https://wa.me/${clean}?text=${encodeURIComponent(item.body)}`;
                            window.open(url, '_blank');
                            if (confirm('Mark this message as Sent?')) {
                              try {
                                await api.markMessageSent(item.id);
                                loadData();
                              } catch (e) {
                                // ignore
                              }
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Open WhatsApp Web to chat with this lead"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp Web</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
