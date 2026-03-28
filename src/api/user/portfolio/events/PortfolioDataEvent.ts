import { MessageEvent } from '@nitrots/nitro-renderer';
import { ProfilePortfolioIncoming } from '../ProfilePortfolioMessageIds';
import { IProfileComment, IProfilePhoto, IProfileTabConfig, IShowcaseItem } from '../../../user/ProfilePortfolioData';

export interface IPortfolioDataParser
{
    userId: number;
    tabConfig: IProfileTabConfig;
    photos: IProfilePhoto[];
    wallComments: IProfileComment[];
    showcaseItems: IShowcaseItem[];
}

export class PortfolioDataEvent extends MessageEvent
{
    private _portfolioData: IPortfolioDataParser;

    static get PORTFOLIO_DATA(): number
    {
        return ProfilePortfolioIncoming.PORTFOLIO_DATA;
    }

    getParser(): IPortfolioDataParser
    {
        return this._portfolioData;
    }

    setData(data: IPortfolioDataParser): void
    {
        this._portfolioData = data;
    }
}
