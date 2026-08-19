'use client';

import { useNavigation } from '../layout/NavigationContext';

interface ApplyNowButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function ApplyNowButton({ children, className = 'pill-btn pill-btn--dark' }: ApplyNowButtonProps) {
  const { openApplyModal } = useNavigation();

  return (
    <button type="button" className={className} onClick={openApplyModal}>
      <span className="pill-btn-span">{children}</span>
    </button>
  );
}
