'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          'error-callback'?: (error?: unknown) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  action: 'signup' | 'login' | 'password_reset';
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

const DEFAULT_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAExVpenR8yWwEyTb';

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ action, onVerify, onExpire, onError, className = 'my-3 flex justify-center', theme = 'auto' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);

    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
      onErrorRef.current = onError;
    });

    const reset = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // Ignore if widget not yet ready
        }
      }
    }, []);

    useImperativeHandle(ref, () => ({
      reset,
    }), [reset]);

    useEffect(() => {
      let isMounted = true;

      const renderWidget = () => {
        if (!isMounted || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) return; // already rendered

        containerRef.current.innerHTML = '';

        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: DEFAULT_SITE_KEY,
            action,
            theme,
            callback: (token: string) => {
              if (isMounted) onVerifyRef.current(token);
            },
            'expired-callback': () => {
              if (isMounted) onExpireRef.current?.();
            },
            'error-callback': (err?: unknown) => {
              if (isMounted) onErrorRef.current?.(err);
            },
          });
        } catch {
          // Handled gracefully
        }
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (isMounted) renderWidget();
          };
          document.head.appendChild(script);
        } else {
          // Script tag exists, wait for turnstile object to be ready
          const interval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(interval);
              if (isMounted) renderWidget();
            }
          }, 100);

          return () => {
            clearInterval(interval);
            isMounted = false;
            if (widgetIdRef.current && window.turnstile) {
              try {
                window.turnstile.remove(widgetIdRef.current);
              } catch {
                // ignore
              }
              widgetIdRef.current = null;
            }
          };
        }
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
    }, [action, theme]);

    return (
      <div className={className}>
        <div ref={containerRef} className="min-h-[65px]" />
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
