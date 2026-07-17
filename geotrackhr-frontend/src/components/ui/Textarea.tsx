import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

const Textarea: React.FC<Props> = ({ label, error, id, className = '', ...rest }) => {
  const textareaId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`focus-ring w-full rounded-md border px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 ${
          error ? 'border-primary-400' : 'border-ink-200'
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-primary-700">{error}</p>}
    </div>
  );
};

export default Textarea;
