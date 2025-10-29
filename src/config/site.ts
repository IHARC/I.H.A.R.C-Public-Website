export const siteConfig = {
  emergency: {
    enabled: process.env.NEXT_PUBLIC_STATE_OF_EMERGENCY === 'true',
    briefPath: '/emergency',
    supportHref: '/petition',
  },
};
