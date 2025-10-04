'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export function SearchBar({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  useEffect(() => {
    setValue(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value) {
        next.set('q', value);
      } else {
        next.delete('q');
      }
      next.set('page', '1');
      router.replace(`?${next.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
  }, [value, params, router]);

  return (
    <Input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder ?? 'Search community solutions'}
      aria-label="Search ideas"
    />
  );
}
