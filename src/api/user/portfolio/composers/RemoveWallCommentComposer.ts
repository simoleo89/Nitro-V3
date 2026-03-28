import { IMessageComposer } from '@nitrots/nitro-renderer';
import { ProfilePortfolioOutgoing } from '../ProfilePortfolioMessageIds';

export class RemoveWallCommentComposer implements IMessageComposer<[number, string]>
{
    private _data: [number, string];

    constructor(targetUserId: number, commentId: string)
    {
        this._data = [ targetUserId, commentId ];
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
        return ProfilePortfolioOutgoing.REMOVE_WALL_COMMENT;
    }
}
