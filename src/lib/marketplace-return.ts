export function getMarketplaceReturnPath(value: string | null, fallback: '/projects' | '/freelancers'): string {
  if (!value) return fallback;
  try {
    const url = new URL(value, 'https://frontend.local');
    if (url.origin !== 'https://frontend.local' || url.pathname !== fallback) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
