import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

const Input: React.FC<Props> = ({ label, error, hint, id, className = '', ...rest }) => {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`focus-ring w-full rounded-md border px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 ${
          error ? 'border-primary-400' : 'border-ink-200'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-xs text-primary-700">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
};

export default Input;
