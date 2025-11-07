const DEFAULT_STEVI_PORTAL_ORIGIN = 'https://stevi.iharc.ca';

function getConfiguredOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_STEVI_PORTAL_URL ??
    process.env.PUBLIC_STEVI_PORTAL_URL ??
    DEFAULT_STEVI_PORTAL_ORIGIN;

  try {
    const url = new URL(raw);
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_STEVI_PORTAL_ORIGIN;
  }
}

const ORIGIN = getConfiguredOrigin();

export function steviPortalUrl(path: string | URL = '/'): string {
  const base = ORIGIN;
  const pathString =
    typeof path === 'string'
      ? path
      : `${path.pathname}${path.search ?? ''}${path.hash ?? ''}`;
  const normalized =
    !pathString || pathString === '/'
      ? ''
      : pathString.startsWith('/')
        ? pathString
        : `/${pathString}`;

  return `${base}${normalized}` || base;
}

export { ORIGIN as STEVI_PORTAL_ORIGIN };
