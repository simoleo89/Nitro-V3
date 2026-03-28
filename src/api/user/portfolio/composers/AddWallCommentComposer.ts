import { IMessageComposer } from '@nitrots/nitro-renderer';
import { ProfilePortfolioOutgoing } from '../ProfilePortfolioMessageIds';

export class AddWallCommentComposer implements IMessageComposer<[number, string]>
{
    private _data: [number, string];

    constructor(targetUserId: number, message: string)
    {
        this._data = [ targetUserId, message ];
    }

    getMessageArray(): [number, string]
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
        return ProfilePortfolioOutgoing.ADD_WALL_COMMENT;
    }
}
