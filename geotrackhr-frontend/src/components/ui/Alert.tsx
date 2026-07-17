import React from 'react';

type Tone = 'danger' | 'success' | 'warning' | 'info';

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

const TONES: Record<Tone, string> = {
  danger: 'bg-primary-50 text-primary-800 border-primary-200',
  success: 'bg-success-50 text-success-700 border-success-100',
  warning: 'bg-warning-50 text-warning-700 border-warning-100',
  info: 'bg-info-50 text-info-700 border-info-100',
};

const Alert: React.FC<Props> = ({ children, tone = 'danger', className = '' }) => (
  <div role="alert" className={`rounded-md border px-4 py-3 text-sm ${TONES[tone]} ${className}`}>
    {children}
  </div>
);

export default Alert;
