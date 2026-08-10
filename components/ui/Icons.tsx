import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const ChevronDown: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 40 24"
    fill="none"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <path d="M14 9L20 15L26 9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const ArrowRight: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 23 32"
    fill="none"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <path d="M8.095 0 3.449 4.575l8.327 8.191H0v6.468h11.781l-8.332 8.196L8.095 32l13.942-13.715a3.211 3.211 0 0 0 0-4.57L8.095 0Z" fill="currentColor" />
  </svg>
);

type FeatureIconName = 'rapid' | 'selection' | 'verified' | 'outcomes';

interface FeatureIconProps extends IconProps {
  name: FeatureIconName;
  label?: string;
}

/**
 * Inline artwork keeps feature-icon colors inherited from semantic CSS tokens.
 * It replaces externally referenced SVGs that embedded a second palette.
 */
export const FeatureIcon: React.FC<FeatureIconProps> = ({ name, label, className, ...props }) => {
  const shared = {
    stroke: 'var(--color-content-dark)',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      className={className}
      {...props}
    >
      {name === 'rapid' && (
        <>
          <path d="m12 43 28-28 18 10-28 28-18-10Z" fill="var(--color-content-light)" {...shared} />
          <path d="m30 53 28-28v27L30 80V53Z" fill="var(--color-surface-dark)" {...shared} />
          <path d="m12 43 18 10v27L12 70V43Z" fill="var(--color-edge-light)" {...shared} />
          <path d="m57 36 12-12 15 9-12 12-15-9Z" fill="var(--color-content-light)" {...shared} />
        </>
      )}
      {name === 'selection' && (
        <>
          <path d="m14 63 34-20 34 20-34 20-34-20Z" fill="var(--color-content-light)" {...shared} />
          <path d="M14 63v9l34 20v-9L14 63Z" fill="var(--color-edge-light)" {...shared} />
          <path d="M82 63v9L48 92v-9l34-20Z" fill="var(--color-surface-dark)" {...shared} />
          <circle cx="48" cy="33" r="22" fill="var(--color-content-light)" {...shared} />
          <path d="M28 33h40M48 11v44M33 17c10 8 20 8 30 0M33 49c10-8 20-8 30 0" {...shared} />
        </>
      )}
      {name === 'verified' && (
        <>
          <path d="m15 34 33-19 33 19v38L48 91 15 72V34Z" fill="var(--color-content-light)" {...shared} />
          <path d="m15 34 33 19 33-19M48 53v38" {...shared} />
          <path d="m35 58 9 9 18-20" stroke="var(--color-brand-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'outcomes' && (
        <>
          <path d="m8 29 32-18 12 7-32 18-12-7Z" fill="var(--color-content-light)" {...shared} />
          <path d="M20 36v37l32-18V18L20 36Z" fill="var(--color-surface-dark)" {...shared} />
          <path d="M8 29v37l12 7V36L8 29Z" fill="var(--color-edge-light)" {...shared} />
          <path d="m44 51 32-18 12 7-32 18-12-7Z" fill="var(--color-content-light)" {...shared} />
          <path d="M56 58v30l32-18V40L56 58Z" fill="var(--color-surface-dark)" {...shared} />
        </>
      )}
    </svg>
  );
};
