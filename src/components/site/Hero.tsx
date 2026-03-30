'use client';

import Image from 'next/image';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { HeroContent } from '@/data/marketing-content';

type HeroProps = {
  content: HeroContent;
};

const OVERLAY_CLASSES: Record<NonNullable<HeroContent['overlayStrength']>, string> = {
  soft: 'bg-[linear-gradient(110deg,rgba(18,7,13,0.72)_0%,rgba(18,7,13,0.46)_46%,rgba(18,7,13,0.18)_100%)]',
  medium:
    'bg-[linear-gradient(110deg,rgba(18,7,13,0.82)_0%,rgba(18,7,13,0.58)_42%,rgba(18,7,13,0.24)_100%)]',
  strong:
    'bg-[linear-gradient(110deg,rgba(18,7,13,0.92)_0%,rgba(18,7,13,0.72)_38%,rgba(18,7,13,0.34)_100%)]',
};

const HERO_POINTS = [
  {
    title: 'Get help without public forms',
    body: 'Urgent housing, overdose, and crisis contacts stay one tap away.',
  },
  {
    title: 'Track the public response',
    body: 'IHARC publishes updates, policies, and data in plain language.',
  },
  {
    title: 'Use STEVI for secure coordination',
    body: 'Clients and outreach teams move confidential work into the secure workspace.',
  },
];

export function Hero({ content }: HeroProps) {
  const {
    pill,
    headline,
    body,
  supporting,
  primaryCta,
  secondaryLink,
  imageUrl,
  mobileImageUrl,
  imageAlt,
  imageFocalPoint,
  overlayStrength,
  } = content;
  const resolvedOverlay = OVERLAY_CLASSES[overlayStrength ?? 'medium'];
  const backgroundPosition = imageFocalPoint?.trim() || 'center';
  const desktopHeroImageUrl = imageUrl || mobileImageUrl;
  const mobileHeroImageUrl = mobileImageUrl || imageUrl;

  return (
    <section className="relative isolate overflow-hidden bg-[#18070d] text-white">
      <div className="absolute inset-0">
        {mobileHeroImageUrl ? (
          <Image
            src={mobileHeroImageUrl}
            alt={imageAlt || ''}
            fill
            priority
            sizes="100vw"
            className="object-cover md:hidden"
            style={{ objectPosition: backgroundPosition }}
          />
        ) : null}
        {desktopHeroImageUrl ? (
          <Image
            src={desktopHeroImageUrl}
            alt={imageAlt || ''}
            fill
            priority
            sizes="100vw"
            className="hidden object-cover md:block"
            style={{ objectPosition: backgroundPosition }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(207,18,63,0.42),transparent_26%),radial-gradient(circle_at_15%_22%,rgba(255,255,255,0.12),transparent_20%),linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_30%),linear-gradient(180deg,#13070b_0%,#18070d_60%,#241018_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:6rem_6rem]"
        />
        <div aria-hidden className={`absolute inset-0 ${resolvedOverlay}`} />
      </div>

      <div className="relative">
        <div className="mx-auto grid min-h-[calc(100svh-11rem)] w-full max-w-7xl items-end gap-10 px-4 pb-12 pt-16 sm:pt-20 lg:min-h-[44rem] lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12 lg:px-6 lg:pb-20">
          <div className="max-w-3xl space-y-6 lg:space-y-7 motion-safe:animate-[hero-rise_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/88">
              {pill}
            </p>
            <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-[0.96] tracking-[-0.04em] text-white text-balance sm:text-6xl lg:text-7xl">
              {headline}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
              {body}
            </p>
            <p className="max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
              {supporting}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
              <Link
                href={primaryCta.href}
                className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 py-3 text-on-primary shadow-[0_14px_40px_rgba(207,18,63,0.34)] transition hover:bg-primary/92 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#18070d]"
                onClick={() => trackEvent('hero_click', primaryCta.analytics ?? { cta: primaryCta.label })}
              >
                {primaryCta.label}
              </Link>
              {secondaryLink ? (
                <Link
                  href={secondaryLink.href}
                  className="inline-flex min-h-12 items-center rounded-full border border-white/18 bg-white/6 px-5 py-3 text-white/88 transition hover:bg-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#18070d]"
                  onClick={() => trackEvent('hero_click', secondaryLink.analytics ?? { cta: secondaryLink.label })}
                >
                  {secondaryLink.label}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="hidden self-end lg:block motion-safe:animate-[hero-rise_900ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="space-y-6 border-l border-white/14 pl-6">
              {HERO_POINTS.map((point) => (
                <div key={point.title} className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/54">IHARC response</p>
                  <h2 className="font-heading text-2xl font-medium leading-tight text-white">{point.title}</h2>
                  <p className="text-sm leading-6 text-white/70">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/12 bg-black/18 backdrop-blur-md lg:hidden">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-3 md:px-6">
            {HERO_POINTS.map((point) => (
              <div key={point.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Public promise</p>
                <h2 className="font-heading text-lg font-medium text-white">{point.title}</h2>
                <p className="text-sm leading-6 text-white/68">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
