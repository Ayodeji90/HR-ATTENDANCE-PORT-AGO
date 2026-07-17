import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
};

const Card: React.FC<Props> = ({ children, className = '', title, action }) => (
  <div className={`rounded-lg border border-ink-100 bg-white shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        {title && <h3 className="text-base font-semibold text-ink-900">{title}</h3>}
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

export default Card;
