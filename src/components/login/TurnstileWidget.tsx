import { FC, useEffect, useRef } from 'react';

declare global
{
    interface Window
    {
        turnstile?: {
            render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId?: string) => void;
            remove: (widgetId?: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

const loadTurnstileScript = (): Promise<void> =>
{
    if(typeof window === 'undefined') return Promise.resolve();
    if(window.turnstile) return Promise.resolve();
    if(scriptPromise) return scriptPromise;

    scriptPromise = new Promise<void>((resolve, reject) =>
    {
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

        if(existing)
        {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Turnstile failed to load')));
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Turnstile failed to load'));
        document.head.appendChild(script);
    });

    return scriptPromise;
};

export interface TurnstileWidgetProps
{
    siteKey: string;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
    onToken: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    resetSignal?: number;
}

export const TurnstileWidget: FC<TurnstileWidgetProps> = props =>
{
    const { siteKey, theme = 'light', size = 'normal', onToken, onExpire, onError, resetSignal = 0 } = props;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() =>
    {
        if(!siteKey || !containerRef.current) return;

        let cancelled = false;

        loadTurnstileScript()
            .then(() =>
            {
                if(cancelled || !window.turnstile || !containerRef.current) return;

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme,
                    size,
                    callback: (token: string) => onToken(token),
                    'expired-callback': () => onExpire?.(),
                    'error-callback': () => onError?.()
                });
            })
            .catch(err =>
            {
                console.error('[Turnstile] script load failed', err);
                onError?.();
            });

        return () =>
        {
            cancelled = true;

            if(widgetIdRef.current && window.turnstile)
            {
                try { window.turnstile.remove(widgetIdRef.current); } catch { }
                widgetIdRef.current = null;
            }
        };
    }, [ siteKey, theme, size ]);

    useEffect(() =>
    {
        if(resetSignal <= 0) return;
        if(widgetIdRef.current && window.turnstile)
        {
            try { window.turnstile.reset(widgetIdRef.current); } catch { }
        }
    }, [ resetSignal ]);

    if(!siteKey) return null;

    return <div ref={ containerRef } className="turnstile-slot" />;
};
