import { GetCommunication } from '@nitrots/nitro-renderer';
import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DEFAULT_UI_SETTINGS, IUiSettings } from './IUiSettings';

const STORAGE_KEY = 'nitro.ui.theme';

interface IUiSettingsContext
{
    settings: IUiSettings;
    updateSettings: (partial: Partial<IUiSettings>) => void;
    resetSettings: () => void;
}

const UiSettingsContext = createContext<IUiSettingsContext>({
    settings: DEFAULT_UI_SETTINGS,
    updateSettings: () => {},
    resetSettings: () => {}
});

const darkenColor = (hex: string, amount: number): string =>
{
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const hexToRgba = (hex: string, alpha: number): string =>
{
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 0xFF;
    const g = (num >> 8) & 0xFF;
    const b = num & 0xFF;

    return `rgba(${ r }, ${ g }, ${ b }, ${ alpha })`;
};

const loadSettings = (): IUiSettings =>
{
    try
    {
        const stored = localStorage.getItem(STORAGE_KEY);
        if(stored) return { ...DEFAULT_UI_SETTINGS, ...JSON.parse(stored) };
    }
    catch(e) { /* ignore */ }

    return { ...DEFAULT_UI_SETTINGS };
};

const saveSettings = (settings: IUiSettings): void =>
{
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
    catch(e) { /* ignore */ }
};

const applyThemeToDOM = (settings: IUiSettings): void =>
{
    const root = document.documentElement;

    if(settings.colorMode === 'default')
    {
        // Remove all theme variables - CSS fallbacks kick in
        const vars = [
            '--theme-primary', '--theme-primary-dark', '--theme-primary-hover', '--theme-primary-border',
            '--theme-dark-bg', '--theme-dark-bg-95', '--theme-dark-panel', '--theme-dark-border',
            '--theme-ctx-bg', '--theme-ctx-header', '--theme-ctx-item1', '--theme-ctx-item2',
            '--theme-slider-track', '--theme-border', '--theme-header-image',
            '--theme-glass-blur', '--theme-glass-bg'
        ];
        vars.forEach(v => root.style.removeProperty(v));
        root.classList.remove('theme-glass');
        return;
    }

    if(settings.colorMode === 'color')
    {
        const c = settings.headerColor;
        const alpha = (settings.headerAlpha ?? 100) / 100;

        root.style.setProperty('--theme-primary', hexToRgba(c, alpha));
        root.style.setProperty('--theme-primary-dark', darkenColor(c, 30));
        root.style.setProperty('--theme-primary-hover', darkenColor(c, 20));
        root.style.setProperty('--theme-primary-border', darkenColor(c, 35));
        root.style.setProperty('--theme-dark-bg', settings.toolbarColor);
        root.style.setProperty('--theme-dark-bg-95', hexToRgba(settings.toolbarColor, 0.95));
        root.style.setProperty('--theme-dark-panel', settings.darkPanelColor);
        root.style.setProperty('--theme-dark-border', darkenColor(settings.darkPanelColor, 10));
        root.style.setProperty('--theme-ctx-bg', settings.ctxBgColor);
        root.style.setProperty('--theme-ctx-header', darkenColor(settings.ctxBgColor, -30));
        root.style.setProperty('--theme-ctx-item1', darkenColor(settings.ctxBgColor, 20));
        root.style.setProperty('--theme-ctx-item2', darkenColor(settings.ctxBgColor, 30));
        root.style.setProperty('--theme-slider-track', c);
        root.style.setProperty('--theme-border', darkenColor(c, 50));
        root.style.removeProperty('--theme-header-image');
    }

    if(settings.colorMode === 'image' && settings.headerImageUrl)
    {
        root.style.setProperty('--theme-header-image', `url(${ settings.headerImageUrl })`);
        // Keep other variables if they were set
    }

    if(settings.glassMode)
    {
        root.classList.add('theme-glass');
    }
    else
    {
        root.classList.remove('theme-glass');
    }

    // Font customization
    const fontFamily = settings.fontFamily || 'Ubuntu';
    const fontScale = (settings.fontScale ?? 100) / 100;

    root.style.setProperty('--theme-font-family', fontFamily);
    root.style.setProperty('--theme-font-scale', String(fontScale));

    if(fontFamily !== 'Ubuntu')
    {
        // Load Google Font dynamically
        const linkId = 'theme-google-font';
        let link = document.getElementById(linkId) as HTMLLinkElement;

        if(!link)
        {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        link.href = `https://fonts.googleapis.com/css2?family=${ fontFamily.replace(/\s+/g, '+') }:wght@400;500;700&display=swap`;
    }
    else
    {
        const link = document.getElementById('theme-google-font');
        if(link) link.remove();
    }

    root.style.setProperty('font-family', `${ fontFamily }, sans-serif`);
    root.style.fontSize = `${ fontScale * 100 }%`;
};

// WebSocket sync helpers
const SYNC_DEBOUNCE_MS = 1000;

const syncToServer = (settings: IUiSettings): void =>
{
    try
    {
        const connection = GetCommunication()?.connection;
        if(!connection) return;

        const json = JSON.stringify(settings);

        // Use dynamic import to check if composer exists in renderer
        // Packet header 10047 = UiSettingsSave
        try
        {
            const { UiSettingsSaveComposer } = require('@nitrots/nitro-renderer');
            if(UiSettingsSaveComposer) connection.send(new UiSettingsSaveComposer(json));
        }
        catch(e)
        {
            // Composer not available in this renderer version - skip server sync
        }
    }
    catch(e) { /* communication not ready */ }
};

const loadFromServer = (): void =>
{
    try
    {
        const connection = GetCommunication()?.connection;
        if(!connection) return;

        // Packet header 10048 = UiSettingsLoad
        try
        {
            const { UiSettingsLoadComposer } = require('@nitrots/nitro-renderer');
            if(UiSettingsLoadComposer) connection.send(new UiSettingsLoadComposer());
        }
        catch(e)
        {
            // Composer not available - skip server load
        }
    }
    catch(e) { /* communication not ready */ }
};

const listenForServerSettings = (onReceive: (settings: IUiSettings) => void): (() => void) =>
{
    try
    {
        const { UiSettingsDataEvent } = require('@nitrots/nitro-renderer');
        if(!UiSettingsDataEvent) return () => {};

        const connection = GetCommunication()?.connection;
        if(!connection) return () => {};

        const handler = (event: any) =>
        {
            try
            {
                const parser = event.getParser();
                const json = parser?.settingsJson;

                if(json && json !== '{}')
                {
                    const serverSettings = { ...DEFAULT_UI_SETTINGS, ...JSON.parse(json) };
                    onReceive(serverSettings);
                }
            }
            catch(e) { /* parse error */ }
        };

        const eventInstance = new UiSettingsDataEvent(handler);
        GetCommunication().registerMessageEvent(eventInstance);

        return () =>
        {
            try { GetCommunication().removeMessageEvent(eventInstance); }
            catch(e) { /* ignore */ }
        };
    }
    catch(e)
    {
        return () => {};
    }
};

export const UiSettingsProvider: FC<PropsWithChildren> = ({ children }) =>
{
    const [ settings, setSettings ] = useState<IUiSettings>(loadSettings);
    const initializedRef = useRef(false);
    const serverSyncTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    // Listen for server settings on mount
    useEffect(() =>
    {
        // Try to load from server
        loadFromServer();

        // Listen for server response
        const cleanup = listenForServerSettings((serverSettings) =>
        {
            setSettings(serverSettings);
            saveSettings(serverSettings);
        });

        return cleanup;
    }, []);

    // Apply theme on mount and whenever settings change
    useEffect(() =>
    {
        applyThemeToDOM(settings);

        if(initializedRef.current)
        {
            saveSettings(settings);

            // Debounced server sync
            if(serverSyncTimerRef.current) clearTimeout(serverSyncTimerRef.current);
            serverSyncTimerRef.current = setTimeout(() => syncToServer(settings), SYNC_DEBOUNCE_MS);
        }

        initializedRef.current = true;
    }, [ settings ]);

    const updateSettings = useCallback((partial: Partial<IUiSettings>) =>
    {
        setSettings(prev => ({ ...prev, ...partial }));
    }, []);

    const resetSettings = useCallback(() =>
    {
        setSettings({ ...DEFAULT_UI_SETTINGS });
    }, []);

    return (
        <UiSettingsContext.Provider value={ { settings, updateSettings, resetSettings } }>
            { children }
        </UiSettingsContext.Provider>
    );
};

export const useUiSettings = () => useContext(UiSettingsContext);
