import { FC, useEffect, useState } from 'react';
import { GetConfigurationValue } from '../../api';
import { subscribePlugins } from './NitroPluginApi';

// Force the global API to be initialized
import './NitroPluginApi';

export const ExternalPluginLoader: FC<{}> = () =>
{
    const [, forceUpdate] = useState(0);

    useEffect(() =>
    {
        return subscribePlugins(() => forceUpdate(n => n + 1));
    }, []);

    // MainView only renders after isReady=true in App.tsx,
    // so the configuration is guaranteed to be loaded at this point.
    useEffect(() =>
    {
        const scripts: HTMLScriptElement[] = [];

        let pluginUrls: string[] = [];

        try
        {
            pluginUrls = GetConfigurationValue<string[]>('external.plugins', []);
        }
        catch (e)
        {
            console.warn('[NitroPlugins] Could not read external.plugins config:', e);
            return;
        }

        if (!pluginUrls || pluginUrls.length === 0)
        {
            console.log('[NitroPlugins] No external plugins configured');
            return;
        }

        console.log('[NitroPlugins] Loading external plugins:', pluginUrls);

        for (const url of pluginUrls)
        {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => console.log(`[NitroPlugins] Loaded: ${url}`);
            script.onerror = () => console.warn(`[NitroPlugins] Failed to load: ${url}`);
            document.head.appendChild(script);
            scripts.push(script);
        }

        return () =>
        {
            scripts.forEach(s => s.remove());
        };
    }, []);

    return null;
};
