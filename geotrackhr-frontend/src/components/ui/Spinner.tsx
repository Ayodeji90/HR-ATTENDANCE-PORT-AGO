import React from 'react';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZES: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

const Spinner: React.FC<Props> = ({ size = 'md', className = '' }) => (
  <div
    role="status"
    aria-label="Loading"
    className={`inline-block animate-spin rounded-full border-ink-200 border-t-primary-600 ${SIZES[size]} ${className}`}
  />
);

export default Spinner;
