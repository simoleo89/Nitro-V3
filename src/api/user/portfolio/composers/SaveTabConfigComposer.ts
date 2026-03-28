import { IMessageComposer } from '@nitrots/nitro-renderer';
import { ProfilePortfolioOutgoing } from '../ProfilePortfolioMessageIds';

export class SaveTabConfigComposer implements IMessageComposer<[string]>
{
    private _data: [string];

    constructor(configJson: string)
    {
        this._data = [ configJson ];
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
        return ProfilePortfolioOutgoing.SAVE_TAB_CONFIG;
    }
}
