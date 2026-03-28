import { MessageEvent } from '@nitrots/nitro-renderer';
import { ProfilePortfolioIncoming } from '../ProfilePortfolioMessageIds';
import { IProfileComment } from '../../../user/ProfilePortfolioData';

export interface IWallCommentAddedParser
{
    userId: number;
    comment: IProfileComment;
}

export class WallCommentAddedEvent extends MessageEvent
{
    private _data: IWallCommentAddedParser;

    static get WALL_COMMENT_ADDED(): number
    {
        return ProfilePortfolioIncoming.WALL_COMMENT_ADDED;
    }

    getParser(): IWallCommentAddedParser
    {
        return this._data;
    }

    setData(data: IWallCommentAddedParser): void
    {
        this._data = data;
    }
}
