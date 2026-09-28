import React, { useState } from 'react';
import type { NavigationTab } from './types';
import { WebSocketProvider } from './context/WebSocketContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { WorkflowBanner } from './components/common/WorkflowBanner';
import { QuickStartModal } from './components/common/QuickStartModal';

import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { LeadsPage } from './pages/LeadsPage';
import { MessagesPage } from './pages/MessagesPage';
import { OutreachPage } from './pages/OutreachPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'campaigns':
        return <CampaignsPage onNavigate={setActiveTab} />;
      case 'leads':
        return <LeadsPage onNavigate={setActiveTab} />;
      case 'messages':
        return <MessagesPage onNavigate={setActiveTab} />;
      case 'outreach':
        return <OutreachPage onNavigate={setActiveTab} />;
      case 'conversations':
        return <ConversationsPage onNavigate={setActiveTab} />;
      case 'followups':
        return <FollowUpsPage onNavigate={setActiveTab} />;
      case 'integrations':
        return <IntegrationsPage onNavigate={setActiveTab} />;
      case 'settings':
        return <SettingsPage onNavigate={setActiveTab} />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <WebSocketProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header activeTab={activeTab} onOpenHelp={() => setIsQuickStartOpen(true)} />
          <WorkflowBanner
            activeTab={activeTab}
            onNavigate={setActiveTab}
            onOpenQuickStart={() => setIsQuickStartOpen(true)}
          />
          <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
            {renderActivePage()}
          </main>
        </div>

        {/* Global Interactive Quick Start Modal */}
        <QuickStartModal
          isOpen={isQuickStartOpen}
          onClose={() => setIsQuickStartOpen(false)}
          onNavigate={setActiveTab}
        />
      </div>
    </WebSocketProvider>
  );
}

export default App;
