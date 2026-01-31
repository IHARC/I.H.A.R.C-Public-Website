/** @type {import('next').NextConfig} */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

const resourceEmbedOrigins = [
  'https://docs.google.com',
  'https://drive.google.com',
  'https://www.youtube.com',
  'https://youtube.com',
  'https://youtu.be',
  'https://player.vimeo.com',
  'https://vimeo.com',
];

const analyticsOrigins = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://region1.google-analytics.com',
];

const stripeOrigins = ['https://js.stripe.com', 'https://checkout.stripe.com', 'https://api.stripe.com'];

const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `script-src 'self' 'unsafe-inline' ${[...analyticsOrigins, ...stripeOrigins].join(' ')}`.trim(),
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${[supabaseOrigin].filter(Boolean).join(' ')}`.trim(),
  `font-src 'self' data:`,
  `connect-src 'self' ${[...analyticsOrigins, supabaseOrigin, ...stripeOrigins].filter(Boolean).join(' ')}`.trim(),
  `frame-src 'self' ${[...resourceEmbedOrigins, ...stripeOrigins].join(' ')}`.trim(),
  `form-action 'self' ${stripeOrigins.join(' ')}`.trim(),
  `upgrade-insecure-requests`,
]
  .map((directive) => directive.replace(/\s+/g, ' ').trim())
  .filter(Boolean)
  .join('; ');

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  output: 'standalone',
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
