type TurnstileClientEnv = Record<string, string | undefined>;

function isLocalHostname(hostname?: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function isTurnstileClientDisabled(
  env: TurnstileClientEnv = process.env,
  hostname = typeof window === 'undefined' ? undefined : window.location.hostname
): boolean {
  return env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true' || isLocalHostname(hostname);
}
