import { IMessageComposer } from '@nitrots/nitro-renderer';
import { ProfilePortfolioOutgoing } from '../ProfilePortfolioMessageIds';

export class RemovePhotoComposer implements IMessageComposer<[number]>
{
    private _data: [number];

    constructor(photoIndex: number)
    {
        this._data = [ photoIndex ];
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
        return ProfilePortfolioOutgoing.REMOVE_PHOTO;
    }
}
