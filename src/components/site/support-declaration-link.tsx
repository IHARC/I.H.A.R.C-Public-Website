'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackEvent } from '@/lib/analytics';

type SupportDeclarationLinkProps = ComponentProps<typeof Link> & {
  source: 'banner' | 'home_hero' | 'emergency_page' | 'petition_page' | 'petition_signers';
};

export function SupportDeclarationLink({ source, onClick, ...props }: SupportDeclarationLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          trackEvent('petition_opened', { source });
        }
      }}
    />
  );
}
