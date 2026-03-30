import Link from 'next/link';
import { cn } from '@/lib/utils';

type CrisisNoticeProps = {
  variant?: 'banner' | 'card';
  className?: string;
};

const VARIANT_STYLES: Record<NonNullable<CrisisNoticeProps['variant']>, string> = {
  banner: 'border-error/25 bg-error-container text-on-error-container',
  card: 'border-outline/16 bg-surface-container-low text-on-surface/82',
};

export function CrisisNotice({ variant = 'banner', className }: CrisisNoticeProps) {
  return (
    <section
      className={cn(
        'rounded-[2rem] border p-6 text-sm shadow-[0_16px_40px_rgba(17,12,16,0.08)]',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <div className="space-y-3">
        <p className="font-heading text-xl font-semibold tracking-[-0.02em]">In an emergency call 911.</p>
        <p className="leading-7">
          The Good Samaritan Drug Overdose Act protects the caller and the person receiving help. For same-day
          support, visit the RAAM clinic Tuesdays, 12–3 pm at 1011 Elgin St. W. The text line is offline; email{' '}
          <Link
            href="mailto:outreach@iharc.ca"
            className="support-link"
          >
            outreach@iharc.ca
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
