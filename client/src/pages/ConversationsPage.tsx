import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Building,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Zap,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import type { Conversation, NavigationTab } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { useWebSocket } from '../context/WebSocketContext';

interface ConversationsPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const ConversationsPage: React.FC<ConversationsPageProps> = ({ onNavigate }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);

  const { subscribe } = useWebSocket();

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    const unsub = subscribe('CONVERSATION_UPDATED', loadConversations);
    return () => unsub();
  }, [subscribe]);

  const activeConv = conversations.find(c => c.id === selectedId);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;

    setSending(true);
    try {
      await api.sendMessageInConversation(selectedId, replyText, 'user');
      setReplyText('');
      loadConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleSimulateReply = async () => {
    setSimulating(true);
    try {
      const res = await api.simulateInboundReply();
      setSelectedId(res.id);
      loadConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to simulate lead reply');
    } finally {
      setSimulating(false);
    }
  };

  const useSuggestedReply = (suggestion: string) => {
    setReplyText(suggestion);
  };

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'interested':
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <ThumbsUp className="w-3 h-3" /> Interested / Call Request
          </span>
        );
      case 'question':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950/60 text-blue-400 border border-blue-800/60">
            <HelpCircle className="w-3 h-3" /> Inquiry / Product Question
          </span>
        );
      case 'objection':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3" /> Price / Timing Objection
          </span>
        );
      case 'negative':
      case 'unsubscribe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-800/60">
            <ThumbsDown className="w-3 h-3" /> Not Interested / Unsubscribe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Neutral Response
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Step 5 Guidance & Quick Action Header */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 shrink-0">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Step 5: Inbox & Inbound Lead Replies</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prospect replies are automatically categorized with AI sentiment and populated with 1-click meeting response suggestions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateReply}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Simulate an interested prospect reply to test sentiment tags and AI reply assistant"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{simulating ? 'Simulating...' : '⚡ Simulate Inbound Lead Reply'}</span>
          </button>
        </div>
      </div>

      {/* 2. Inbox Content */}
      <div className="h-[calc(100vh-250px)] min-h-[500px] flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-20 flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessagesSquare}
              title="No Inbound Replies Yet"
              description="When prospects reply to your sent emails or WhatsApp messages, active threads will appear here with AI sentiment analysis and auto-drafted responses."
              actionLabel="⚡ Simulate 1-Click Prospect Reply"
              onAction={handleSimulateReply}
            />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Conversations List Sidebar */}
            <div className="border-r border-slate-800 flex flex-col">
              <div className="p-4 border-b border-slate-800 bg-slate-950/40">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Inbox Threads ({conversations.length})
                </h3>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
                {conversations.map((c) => {
                  const isSelected = c.id === selectedId;
                  const lastMsg = c.messages[c.messages.length - 1];

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/30 border-l-2 border-blue-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {c.lead?.contactName || c.lead?.businessName || 'Lead Reply'}
                        </p>
                        <span className="text-[11px] text-slate-500">
                          {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                        {lastMsg?.content || 'No messages'}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                          {c.campaign?.name || 'Outreach'}
                        </span>
                        {c.sentiment && getSentimentBadge(c.sentiment)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Conversation Detail */}
            {activeConv ? (
              <div className="md:col-span-2 flex flex-col justify-between h-full bg-slate-950/30">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-white">
                        {activeConv.lead?.contactName || 'Lead'}
                      </h4>
                      {activeConv.lead?.businessName && (
                        <span className="text-xs text-slate-400">({activeConv.lead.businessName})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeConv.lead?.email || activeConv.lead?.phone || ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSentimentBadge(activeConv.sentiment)}
                  </div>
                </div>

                {/* Message History */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {activeConv.messages.map((m) => {
                    const isUser = m.sender === 'user';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                          {isUser ? <span>You</span> : <span>{activeConv.lead?.contactName || 'Lead'}</span>}
                          <span>•</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div
                          className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Suggested Response Box */}
                {activeConv.suggestedReply && (
                  <div className="mx-4 mb-3 p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Suggested Follow-up Response</span>
                      </div>
                      <button
                        onClick={() => useSuggestedReply(activeConv.suggestedReply!)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                      >
                        Insert into reply →
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 italic">{activeConv.suggestedReply}</p>
                  </div>
                )}

                {/* Reply Input Box */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-slate-950/80">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type your reply to this lead..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="md:col-span-2 flex items-center justify-center text-slate-500 text-sm">
                Select a conversation thread on the left to view history
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
