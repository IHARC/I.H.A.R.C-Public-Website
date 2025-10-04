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
      className="rounded-full border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      disabled={pending}
      onClick={() => startTransition(action)}
    >
      {pending ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
