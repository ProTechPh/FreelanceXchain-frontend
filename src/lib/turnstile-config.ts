type TurnstileClientEnv = Record<string, string | undefined>;

function isLocalHostname(hostname?: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function isTurnstileClientDisabled(
  env?: TurnstileClientEnv,
  hostname = typeof window === 'undefined' ? undefined : window.location.hostname
): boolean {
  const isExplicitlyDisabled = env
    ? env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'
    : process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true';
  return isExplicitlyDisabled || isLocalHostname(hostname);
}
