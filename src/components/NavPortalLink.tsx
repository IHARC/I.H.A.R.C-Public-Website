'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackEvent } from '@/lib/analytics';

type NavPortalLinkProps = ComponentProps<typeof Link>;

export function NavPortalLink({ onClick, ...props }: NavPortalLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          trackEvent('portal_click', { source: 'nav' });
        }
      }}
    />
  );
}
