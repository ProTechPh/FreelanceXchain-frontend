import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileCaptchaProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  siteKey: string;
  theme?: 'light' | 'dark' | 'auto';
}

export function TurnstileCaptcha({ 
  onSuccess, 
  onError,
  onExpire,
  siteKey,
  theme = 'auto'
}: TurnstileCaptchaProps) {
  return (
    <div className="flex justify-center">
      <Turnstile
        siteKey={siteKey}
        onSuccess={(token) => {
          onSuccess(token);
        }}
        onError={() => {
          onError?.();
        }}
        onExpire={() => {
          onExpire?.();
        }}
        options={{
          theme,
        }}
      />
    </div>
  );
}
