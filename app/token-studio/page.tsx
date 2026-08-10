import { notFound } from 'next/navigation';
import { TokenStudio } from '@/components/token-studio/TokenStudio';
import { tokens } from '@/tokens/design-tokens';

export const metadata = {
  title: 'Token Studio | Rastaak',
  robots: { index: false, follow: false },
};

/**
 * Local design tool only. Token changes remain version-controlled edits to
 * tokens/design-tokens.ts; this browser UI never writes to the repository.
 */
export default function TokenStudioPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <TokenStudio colorTokens={tokens.colors} />;
}
