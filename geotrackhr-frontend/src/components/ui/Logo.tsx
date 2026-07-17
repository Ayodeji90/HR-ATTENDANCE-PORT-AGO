import React from 'react';

type Props = {
  /** 'full' shows the logo mark + wordmark image; 'mark' crops to just the diamond emblem (collapsed sidebar) */
  variant?: 'full' | 'mark';
  className?: string;
};

/**
 * The source logo file (public/logo.png) is a wide horizontal lockup
 * centered on a mostly-white square canvas — the actual artwork is a thin
 * band in the middle. Rendering it directly at small sizes leaves it
 * illegibly tiny, so both variants use pre-cropped, upscaled assets instead:
 * 'full' = public/logo-full.png (tight crop of the whole lockup),
 * 'mark' = public/logo-mark.png (tight crop of just the diamond emblem).
 */
const Logo: React.FC<Props> = ({ variant = 'full', className = '' }) => {
  if (variant === 'mark') {
    return <img src="/logo-mark.png" alt="Port-Ago" className={`object-contain ${className}`} />;
  }

  return (
    <img
      src="/logo-full.png"
      alt="Port-Ago Construction Limited"
      className={`object-contain ${className}`}
    />
  );
};

export default Logo;
