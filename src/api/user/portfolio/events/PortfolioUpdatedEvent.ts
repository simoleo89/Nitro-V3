import { MessageEvent } from '@nitrots/nitro-renderer';
import { ProfilePortfolioIncoming } from '../ProfilePortfolioMessageIds';

export interface IPortfolioUpdatedParser
{
    userId: number;
    section: 'photos' | 'showcase' | 'tabConfig' | 'wall';
}

export class PortfolioUpdatedEvent extends MessageEvent
{
    private _data: IPortfolioUpdatedParser;

    static get PORTFOLIO_UPDATED(): number
    {
        return ProfilePortfolioIncoming.PORTFOLIO_UPDATED;
    }

    getParser(): IPortfolioUpdatedParser
    {
        return this._data;
    }

    setData(data: IPortfolioUpdatedParser): void
    {
        this._data = data;
    }
}
