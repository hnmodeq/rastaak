import React from 'react';
import Link from 'next/link';

interface PillButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: 'dark' | 'light' | 'glass';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const PillButton: React.FC<PillButtonProps> = ({
  children,
  href,
  variant = 'dark',
  onClick,
  className = '',
  type = 'button',
  disabled = false,
}) => {
  const variantClass = {
    dark: 'pill-btn--dark',
    light: 'pill-btn--light',
    glass: 'pill-btn--glass',
  }[variant];

  const combinedClasses = `pill-btn ${variantClass} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses} onClick={onClick}>
        <span className="pill-btn-span">{children}</span>
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="pill-btn-span">{children}</span>
    </button>
  );
};
