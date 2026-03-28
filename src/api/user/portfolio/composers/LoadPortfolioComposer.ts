import { IMessageComposer } from '@nitrots/nitro-renderer';
import { ProfilePortfolioOutgoing } from '../ProfilePortfolioMessageIds';

export class LoadPortfolioComposer implements IMessageComposer<[number]>
{
    private _data: [number];

    constructor(userId: number)
    {
        this._data = [ userId ];
    }

    getMessageArray(): [number]
    {
        return this._data;
    }

    dispose(): void
    {
        this._data = null;
    }

    get disposed(): boolean
    {
        return this._data === null;
    }

    get header(): number
    {
        return ProfilePortfolioOutgoing.LOAD_PORTFOLIO;
    }
}
