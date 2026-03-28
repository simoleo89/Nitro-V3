export interface IProfileComment
{
    id: string;
    userId: number;
    username: string;
    figure: string;
    message: string;
    timestamp: number;
}

export interface IShowcaseItem
{
    itemId: number;
    classId: number;
    name: string;
    category: number;
    isRare: boolean;
    imageUrl: string;
}

export interface IProfilePhoto
{
    url: string;
    caption: string;
    timestamp: number;
    roomId: number;
}

export type ProfileTabKey = 'badge' | 'amici' | 'stanze' | 'gruppi' | 'foto' | 'bacheca' | 'showcase';

export interface IProfileTabConfig
{
    [key: string]: boolean;
    badge: boolean;
    amici: boolean;
    stanze: boolean;
    gruppi: boolean;
    foto: boolean;
    bacheca: boolean;
    showcase: boolean;
}

export const DEFAULT_TAB_CONFIG: IProfileTabConfig = {
    badge: true,
    amici: true,
    stanze: true,
    gruppi: true,
    foto: true,
    bacheca: true,
    showcase: true
};
