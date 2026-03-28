import { IMessageComposer } from '@nitrots/nitro-renderer';
import { ProfilePortfolioOutgoing } from '../ProfilePortfolioMessageIds';

export class SaveShowcaseComposer implements IMessageComposer<[string]>
{
    private _data: [string];

    constructor(showcaseJson: string)
    {
        this._data = [ showcaseJson ];
    }

    getMessageArray(): [string]
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
        return ProfilePortfolioOutgoing.SAVE_SHOWCASE;
    }
}
