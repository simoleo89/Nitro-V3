import { IMessageComposer } from '@nitrots/nitro-renderer';
import { ProfilePortfolioOutgoing } from '../ProfilePortfolioMessageIds';

export class SavePhotoComposer implements IMessageComposer<[string]>
{
    private _data: [string];

    constructor(photoJson: string)
    {
        this._data = [ photoJson ];
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
        return ProfilePortfolioOutgoing.SAVE_PHOTO;
    }
}
