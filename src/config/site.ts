export const siteConfig = {
  emergency: {
    enabled: process.env.NEXT_PUBLIC_STATE_OF_EMERGENCY !== 'false',
    briefPath: '/emergency',
    supportHref: '/petition',
  },
};
