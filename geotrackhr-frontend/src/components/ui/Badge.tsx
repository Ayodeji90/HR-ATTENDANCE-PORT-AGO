import React from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-primary-100 text-primary-700',
  info: 'bg-info-100 text-info-700',
};

const Badge: React.FC<Props> = ({ children, tone = 'neutral', className = '' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>
    {children}
  </span>
);

export default Badge;

/** Maps the backend's attendance/leave status strings to a badge tone + readable label */
const STATUS_MAP: Record<string, { tone: Tone; label: string }> = {
  pending: { tone: 'warning', label: 'Pending' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
  approved_by_supervisor: { tone: 'info', label: 'Awaiting HR' },
  approved_by_hr: { tone: 'success', label: 'Approved' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
};

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const entry = STATUS_MAP[status] ?? { tone: 'neutral' as Tone, label: status };
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
};
