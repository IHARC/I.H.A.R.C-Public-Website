import type { Metadata } from 'next';
import { getBrandingAssets, getHeroContent } from '@/data/marketing-content';

export const DEFAULT_SOCIAL_IMAGE = '/og-default.png';
export const DEFAULT_SOCIAL_ALT = 'IHARC — Integrated Homelessness and Addictions Response Centre';

export async function getMarketingSocialImage() {
  const [branding, hero] = await Promise.all([getBrandingAssets(), getHeroContent()]);

  return {
    url: branding?.ogImageUrl || hero.mobileImageUrl || hero.imageUrl || branding?.logoLightUrl || DEFAULT_SOCIAL_IMAGE,
    alt: hero.imageAlt || DEFAULT_SOCIAL_ALT,
  };
}

export async function buildMarketingMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Promise<Metadata> {
  const socialImage = await getMarketingSocialImage();

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: path,
      images: [
        {
          url: socialImage.url,
          alt: socialImage.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage.url],
    },
  };
}
