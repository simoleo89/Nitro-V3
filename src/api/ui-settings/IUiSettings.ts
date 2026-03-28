export interface IUiSettings
{
    colorMode: 'color' | 'image' | 'default';
    headerColor: string;
    headerImageUrl: string;
    headerAlpha: number;
    toolbarColor: string;
    darkPanelColor: string;
    ctxBgColor: string;
    borderRadius: number;
    glassMode: boolean;
}

export const DEFAULT_UI_SETTINGS: IUiSettings = {
    colorMode: 'default',
    headerColor: '#1E7295',
    headerImageUrl: '',
    headerAlpha: 100,
    toolbarColor: '#1c1c20',
    darkPanelColor: '#212131',
    ctxBgColor: '#1c323f',
    borderRadius: 4,
    glassMode: false
};

export const PRESET_COLORS: string[] = [
    '#1E7295', '#185D79', '#0077B6', '#00B4D8', '#0096C7',
    '#2D6A4F', '#40916C', '#52B788', '#059669', '#10B981',
    '#E76F51', '#F4A261', '#E9C46A', '#FF6B6B', '#FF8FA3',
    '#7B2CBF', '#9D4EDD', '#C77DFF', '#6A4C93', '#B5179E',
    '#1B1B2F', '#162447', '#1F4068', '#283F5D', '#475569',
    '#C1121F', '#DC2626', '#B8860B', '#DAA520', '#FF69B4'
];

export interface IThemePreset
{
    name: string;
    colors: Partial<IUiSettings>;
}

export const THEME_PRESETS: IThemePreset[] = [
    {
        name: 'default',
        colors: { headerColor: '#1E7295', toolbarColor: '#1c1c20', darkPanelColor: '#212131', ctxBgColor: '#1c323f', glassMode: false }
    },
    {
        name: 'ocean',
        colors: { headerColor: '#0077B6', toolbarColor: '#023E8A', darkPanelColor: '#03045E', ctxBgColor: '#0077B6', glassMode: false }
    },
    {
        name: 'forest',
        colors: { headerColor: '#2D6A4F', toolbarColor: '#1B4332', darkPanelColor: '#1B4332', ctxBgColor: '#2D6A4F', glassMode: false }
    },
    {
        name: 'sunset',
        colors: { headerColor: '#E76F51', toolbarColor: '#4A1E0A', darkPanelColor: '#3D1308', ctxBgColor: '#7A3422', glassMode: false }
    },
    {
        name: 'royal',
        colors: { headerColor: '#7B2CBF', toolbarColor: '#3C096C', darkPanelColor: '#240046', ctxBgColor: '#5A189A', glassMode: false }
    },
    {
        name: 'midnight',
        colors: { headerColor: '#1B1B2F', toolbarColor: '#0F0F1A', darkPanelColor: '#0A0A14', ctxBgColor: '#162447', glassMode: false }
    },
    {
        name: 'cherry',
        colors: { headerColor: '#C1121F', toolbarColor: '#3D0C10', darkPanelColor: '#2B0A0D', ctxBgColor: '#780000', glassMode: false }
    },
    {
        name: 'gold',
        colors: { headerColor: '#B8860B', toolbarColor: '#3D2E06', darkPanelColor: '#2B2004', ctxBgColor: '#8B6914', glassMode: false }
    },
    {
        name: 'slate',
        colors: { headerColor: '#475569', toolbarColor: '#1E293B', darkPanelColor: '#0F172A', ctxBgColor: '#334155', glassMode: false }
    },
    {
        name: 'candy',
        colors: { headerColor: '#FF69B4', toolbarColor: '#4A0E2E', darkPanelColor: '#3D0A25', ctxBgColor: '#C2185B', glassMode: false }
    },
    {
        name: 'emerald',
        colors: { headerColor: '#059669', toolbarColor: '#064E3B', darkPanelColor: '#022C22', ctxBgColor: '#047857', glassMode: false }
    },
    {
        name: 'volcano',
        colors: { headerColor: '#DC2626', toolbarColor: '#450A0A', darkPanelColor: '#2D0606', ctxBgColor: '#991B1B', glassMode: false }
    },
    {
        name: 'neon',
        colors: { headerColor: '#00F5D4', toolbarColor: '#0A0A0A', darkPanelColor: '#111111', ctxBgColor: '#1A1A2E', glassMode: true }
    },
    {
        name: 'arctic',
        colors: { headerColor: '#A8DADC', toolbarColor: '#1D3557', darkPanelColor: '#14213D', ctxBgColor: '#457B9D', glassMode: false }
    },
    {
        name: 'glass',
        colors: { headerColor: '#1E7295', toolbarColor: '#1c1c20', darkPanelColor: '#212131', ctxBgColor: '#1c323f', glassMode: true }
    },
    {
        name: 'sakura',
        colors: { headerColor: '#FFB7C5', toolbarColor: '#2D1B24', darkPanelColor: '#1F1318', ctxBgColor: '#8B4558', glassMode: false }
    },
    {
        name: 'cyberpunk',
        colors: { headerColor: '#F72585', toolbarColor: '#10002B', darkPanelColor: '#0A0018', ctxBgColor: '#3A0CA3', glassMode: true }
    },
    {
        name: 'earth',
        colors: { headerColor: '#8B6F47', toolbarColor: '#2C1A0E', darkPanelColor: '#1A1008', ctxBgColor: '#5C4033', glassMode: false }
    },
];
