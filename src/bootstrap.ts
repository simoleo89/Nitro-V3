import { GetConfiguration } from '@nitrots/configuration';
import { configFileUrl, getClientMode, installSecureFetch } from './secure-assets';

const ensureMobileViewport = () =>
{
    let viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');

    if(!viewport)
    {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }

    viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
};

ensureMobileViewport();

const setBootDebug = (message: string) =>
{
    try
    {
        (window as any).__nitroBootDebug = message;
        const secureNode = document.getElementById('nitro-secure-debug');

        if(secureNode) secureNode.textContent = `${ secureNode.textContent }\n${ message }`;
    }
    catch
    {}
};

const deployBaseUrl = (): string =>
{
    try
    {
        const loaderBase = (window as any).__nitroLoaderBase;
        if(typeof loaderBase === 'string' && loaderBase.length) return new URL('..', loaderBase).toString();
    }
    catch
    {}

    try
    {
        const moduleUrl = (import.meta as any).url;
        if(typeof moduleUrl === 'string' && moduleUrl.length) return new URL('..', new URL('.', moduleUrl)).toString();
    }
    catch
    {}

    try
    {
        const base = (import.meta as any).env?.BASE_URL;
        if(typeof base === 'string' && base.length)
        {
            const trimmed = base.replace(/^\/+/, '').replace(/\/+$/, '');
            return trimmed ? `${ window.location.origin }/${ trimmed }/` : `${ window.location.origin }/`;
        }
    }
    catch
    {}

    return `${ window.location.origin }/`;
};

const loadClientMode = async () =>
{
    try
    {
        if((window as any).__nitroClientMode) return;

        const url = new URL('configuration/client-mode.json', deployBaseUrl());
        url.searchParams.set('v', Date.now().toString(36));

        const response = await fetch(url.toString());

        if(!response.ok) throw new Error(`HTTP ${ response.status }`);

        (window as any).__nitroClientMode = await response.json();
        setBootDebug('boot: client-mode loaded');
    }
    catch(error)
    {
        setBootDebug(`boot: client-mode fallback ${ error?.message || error }`);
    }
};

await loadClientMode();

installSecureFetch();
setBootDebug('boot: secure fetch installed');

const search = new URLSearchParams(window.location.search);
const clientMode = getClientMode();

(window as any).NitroSecureApiUrl = clientMode.apiBaseUrl || window.location.origin;
(window as any).NitroClientMode = clientMode;
(window as any).NitroConfig = {
    'config.urls': [
        configFileUrl('renderer-config.json', true),
        configFileUrl('ui-config.json', true)
    ],
    'sso.ticket': search.get('sso') || null,
    'forward.type': search.get('room') ? 2 : -1,
    'forward.id': search.get('room') || 0,
    'friend.id': search.get('friend') || 0
};

setBootDebug('boot: NitroConfig assigned');

// Load renderer-config.json + ui-config.json BEFORE rendering React. Otherwise
// the first paint triggers a flood of "Missing configuration key" warnings for
// every key components read synchronously (asset.url, login.endpoint, …) until
// prepare()'s deferred init() finally lands. Doing it here makes the config
// already populated by the time index.tsx mounts <App/>.
try
{
    await GetConfiguration().init();
    setBootDebug('boot: configuration init done');
}
catch(error)
{
    setBootDebug(`boot: configuration init failed ${ error?.message || error }`);
}

import('./index')
    .then(() => setBootDebug('boot: app bundle imported'))
    .catch(error =>
    {
        setBootDebug(`boot: import failed ${ error?.message || error }`);
        throw error;
    });
