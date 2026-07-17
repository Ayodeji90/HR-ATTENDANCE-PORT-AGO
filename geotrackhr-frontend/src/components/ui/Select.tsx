import React from 'react';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  children: React.ReactNode;
};

const Select: React.FC<Props> = ({ label, error, id, className = '', children, ...rest }) => {
  const selectId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`focus-ring w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900 ${
          error ? 'border-primary-400' : 'border-ink-200'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-primary-700">{error}</p>}
    </div>
  );
};

export default Select;
