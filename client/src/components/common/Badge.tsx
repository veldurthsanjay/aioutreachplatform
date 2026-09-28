import React from 'react';
import type { LeadStatus, MessageStatus } from '../../types';

interface BadgeProps {
  status: LeadStatus | MessageStatus | 'connected' | 'not_connected' | 'requires_config' | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = status;

  switch (status) {
    case 'new':
      colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700';
      label = 'New Lead';
      break;
    case 'message_generated':
      colorClasses = 'bg-purple-950/50 text-purple-300 border-purple-800/50';
      label = 'Draft Ready';
      break;
    case 'approved':
      colorClasses = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50';
      label = 'Approved';
      break;
    case 'queued':
      colorClasses = 'bg-amber-950/50 text-amber-300 border-amber-800/50';
      label = 'Queued';
      break;
    case 'sending':
      colorClasses = 'bg-blue-950/50 text-blue-300 border-blue-800/50 animate-pulse';
      label = 'Sending...';
      break;
    case 'sent':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60';
      label = 'Sent';
      break;
    case 'replied':
      colorClasses = 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60';
      label = 'Replied';
      break;
    case 'rejected':
    case 'failed':
      colorClasses = 'bg-rose-950/50 text-rose-300 border-rose-800/50';
      label = status === 'failed' ? 'Failed' : 'Rejected';
      break;
    case 'do_not_contact':
      colorClasses = 'bg-slate-900 text-slate-400 border-slate-800';
      label = 'Do Not Contact';
      break;
    case 'connected':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60';
      label = 'Connected';
      break;
    case 'requires_config':
      colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-700/60';
      label = 'Requires Config';
      break;
    case 'not_connected':
      colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
      label = 'Not Connected';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center rounded-full border capitalize ${colorClasses} ${sizeClasses}`}>
      {label}
    </span>
  );
};
