type TurnstileClientEnv = Record<string, string | undefined>;

export function isTurnstileClientDisabled(env: TurnstileClientEnv = process.env): boolean {
  return env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true';
}
