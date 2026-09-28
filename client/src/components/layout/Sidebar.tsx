import React from 'react';
import {
  LayoutDashboard,
  Target,
  Users,
  MessageSquareText,
  Send,
  MessagesSquare,
  History,
  Plug,
  Settings,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { NavigationTab } from '../../types';
import { useWebSocket } from '../../context/WebSocketContext';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { isConnected } = useWebSocket();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Target className="w-5 h-5" /> },
    { id: 'leads', label: 'Leads', icon: <Users className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquareText className="w-5 h-5" /> },
    { id: 'outreach', label: 'Outreach', icon: <Send className="w-5 h-5" /> },
    { id: 'conversations', label: 'Conversations', icon: <MessagesSquare className="w-5 h-5" /> },
    { id: 'followups', label: 'Follow-ups', icon: <History className="w-5 h-5" /> },
    { id: 'integrations', label: 'Integrations', icon: <Plug className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Outreach<span className="text-blue-400">AI</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">B2B Lead Engine</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Real-time System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-300">Live WS Sync</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-400">Connecting...</span>
              </>
            )}
          </div>
          <div className="text-slate-500">
            {isConnected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
          </div>
        </div>
      </div>
    </aside>
  );
};
