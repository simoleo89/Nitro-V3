import { GetCommunication, UiSettingsDataEvent, UiSettingsLoadComposer, UiSettingsSaveComposer } from '@nitrots/nitro-renderer';
import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DEFAULT_UI_SETTINGS, IUiSettings } from './IUiSettings';

const STORAGE_KEY = 'nitro.ui.settings';

// --- HSL color utilities ---

const hexToHsl = (hex: string): [number, number, number] =>
{
    const num = parseInt(hex.replace('#', ''), 16);
    const r = ((num >> 16) & 0xFF) / 255;
    const g = ((num >> 8) & 0xFF) / 255;
    const b = (num & 0xFF) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if(max === min) return [ 0, 0, l * 100 ];

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h = 0;
    if(max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if(max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;

    return [ h * 360, s * 100, l * 100 ];
};

const hslToHex = (h: number, s: number, l: number): string =>
{
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;
    if(h < 60) { r = c; g = x; }
    else if(h < 120) { r = x; g = c; }
    else if(h < 180) { g = c; b = x; }
    else if(h < 240) { g = x; b = c; }
    else if(h < 300) { r = x; b = c; }
    else { r = c; b = x; }

    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');

    return '#' + toHex(r) + toHex(g) + toHex(b);
};

const deriveColor = (hex: string, lightnessShift: number, saturationShift = 0): string =>
{
    const [ h, s, l ] = hexToHsl(hex);

    return hslToHex(h, s + saturationShift, l + lightnessShift);
};

const hexToRgb = (hex: string): [number, number, number] =>
{
    const num = parseInt(hex.replace('#', ''), 16);

    return [ (num >> 16) & 0xFF, (num >> 8) & 0xFF, num & 0xFF ];
};

// --- Context ---

interface IUiSettingsContext
{
    settings: IUiSettings;
    isCustomActive: boolean;
    updateSettings: (partial: Partial<IUiSettings>) => void;
    resetSettings: () => void;
}

const UiSettingsContext = createContext<IUiSettingsContext>({
    settings: DEFAULT_UI_SETTINGS,
    isCustomActive: false,
    updateSettings: () => {},
    resetSettings: () => {}
});

const loadSettings = (): IUiSettings =>
{
    try
    {
        const stored = localStorage.getItem(STORAGE_KEY);
        if(stored) return { ...DEFAULT_UI_SETTINGS, ...JSON.parse(stored) };
    }
    catch(e) {}

    return { ...DEFAULT_UI_SETTINGS };
};

const saveSettings = (settings: IUiSettings): void =>
{
    try
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    catch(e) {}
};

const sendComposer = (composer: any): void =>
{
    try
    {
        GetCommunication()?.connection?.send(composer);
    }
    catch(e) {}
};

const applyCssVariables = (settings: IUiSettings): void =>
{
    const root = document.documentElement;
    const primary = settings.colorMode !== 'default' ? settings.headerColor : DEFAULT_UI_SETTINGS.headerColor;
    const secondary = settings.secondaryColor || deriveColor(primary, -8);
    const [ r, g, b ] = hexToRgb(primary);

    // Primary color family
    root.style.setProperty('--ui-primary', primary);
    root.style.setProperty('--ui-primary-dark', secondary);
    root.style.setProperty('--ui-primary-hover', deriveColor(primary, -5));
    root.style.setProperty('--ui-primary-darker', deriveColor(primary, -12));

    // UI structure
    root.style.setProperty('--ui-border', deriveColor(primary, -15, -10));
    root.style.setProperty('--ui-content-dark-bg', deriveColor(primary, -25));
    root.style.setProperty('--ui-slim-top', deriveColor(primary, 10, 5));
    root.style.setProperty('--ui-slim-bottom', deriveColor(primary, 5, 5));

    // Scrollbar
    root.style.setProperty('--ui-scrollbar-thumb', `rgba(${ r }, ${ g }, ${ b }, 0.35)`);
    root.style.setProperty('--ui-scrollbar-hover', `rgba(${ r }, ${ g }, ${ b }, 0.6)`);
    root.style.setProperty('--ui-scrollbar-active', secondary);

    // Font
    root.style.setProperty('--ui-font-family', `'${ settings.fontFamily || 'Ubuntu' }', sans-serif`);

    // Font size
    const size = settings.fontSize || 14;
    root.style.setProperty('--ui-font-size', `${ size }px`);
};

export const UiSettingsProvider: FC<PropsWithChildren> = ({ children }) =>
{
    const [ settings, setSettings ] = useState<IUiSettings>(loadSettings);
    const serverSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    // Load from server on mount
    useEffect(() =>
    {
        sendComposer(new UiSettingsLoadComposer());

        const connection = GetCommunication()?.connection;

        if(!connection) return;

        const handler = (event: any) =>
        {
            try
            {
                const parser = event.getParser();
                const json = parser?.settingsJson;

                if(json && json !== '{}')
                {
                    const serverSettings = { ...DEFAULT_UI_SETTINGS, ...JSON.parse(json) };
                    setSettings(serverSettings);
                    saveSettings(serverSettings);
                }
            }
            catch(e) {}
        };

        connection.addMessageEvent(new UiSettingsDataEvent(handler));
    }, []);

    const syncToServer = useCallback((settingsToSave: IUiSettings) =>
    {
        if(serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);

        serverSaveTimerRef.current = setTimeout(() =>
        {
            sendComposer(new UiSettingsSaveComposer(JSON.stringify(settingsToSave)));
        }, 1000);
    }, []);

    const updateSettings = useCallback((partial: Partial<IUiSettings>) =>
    {
        setSettings(prev =>
        {
            const updated = { ...prev, ...partial };
            saveSettings(updated);
            syncToServer(updated);

            return updated;
        });
    }, [ syncToServer ]);

    const resetSettings = useCallback(() =>
    {
        setSettings({ ...DEFAULT_UI_SETTINGS });
        saveSettings(DEFAULT_UI_SETTINGS);
        syncToServer(DEFAULT_UI_SETTINGS);
    }, [ syncToServer ]);

    const isCustomActive = settings.colorMode !== 'default';

    // Apply CSS variables whenever settings change
    useEffect(() =>
    {
        applyCssVariables(settings);
    }, [ settings ]);

    return (
        <UiSettingsContext.Provider value={ { settings, isCustomActive, updateSettings, resetSettings } }>
            { children }
        </UiSettingsContext.Provider>
    );
};

export const useUiSettings = () => useContext(UiSettingsContext);
