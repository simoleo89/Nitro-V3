export interface IUiSettings
{
    colorMode: 'color' | 'image' | 'default';
    headerColor: string;
    headerImageUrl: string;
    headerAlpha: number;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    fontSize?: number;
}

export const DEFAULT_UI_SETTINGS: IUiSettings = {
    colorMode: 'default',
    headerColor: '#1E7295',
    headerImageUrl: '',
    headerAlpha: 100,
    secondaryColor: undefined,
    accentColor: undefined,
    fontFamily: 'Ubuntu',
    fontSize: 14
};

export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 20;

export const AVAILABLE_FONTS = [
    { name: 'Ubuntu', label: 'Ubuntu' },
    { name: 'Inter', label: 'Inter' },
    { name: 'Poppins', label: 'Poppins' },
    { name: 'Roboto', label: 'Roboto' },
];
