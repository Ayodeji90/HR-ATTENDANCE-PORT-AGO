import React from 'react';

type Props = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

const DefaultIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-ink-300">
    <path
      d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EmptyState: React.FC<Props> = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
    {icon ?? <DefaultIcon />}
    <div>
      <p className="font-medium text-ink-800">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
    </div>
    {action}
  </div>
);

export default EmptyState;
