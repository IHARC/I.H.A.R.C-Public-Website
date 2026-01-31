import Link from 'next/link';
import { cn } from '@/lib/utils';

type CrisisNoticeProps = {
  variant?: 'banner' | 'card';
  className?: string;
};

const VARIANT_STYLES: Record<NonNullable<CrisisNoticeProps['variant']>, string> = {
  banner: 'border-destructive/40 bg-destructive/5 text-destructive-foreground',
  card: 'border-outline/20 bg-surface-container text-on-surface/80',
};

export function CrisisNotice({ variant = 'banner', className }: CrisisNoticeProps) {
  return (
    <section
      className={cn(
        'rounded-3xl border p-6 text-sm',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <div className="space-y-2">
        <p className="font-semibold">In an emergency call 911.</p>
        <p>
          The Good Samaritan Drug Overdose Act protects the caller and the person receiving help. For same-day
          support, visit the RAAM clinic Tuesdays, 12–3 pm at 1011 Elgin St. W. The text line is offline; email{' '}
          <Link href="mailto:outreach@iharc.ca" className="font-semibold underline underline-offset-4">
            outreach@iharc.ca
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
