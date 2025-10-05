'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';

type SignOutButtonProps = {
  action: () => Promise<void>;
};

export function SignOutButton({ action }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full border border-outline/40 bg-surface px-3 py-1 text-sm font-medium text-on-surface/80 hover:bg-brand-soft hover:text-brand focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      disabled={pending}
      onClick={() => startTransition(action)}
    >
      {pending ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
