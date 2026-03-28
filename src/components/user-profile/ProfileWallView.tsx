import DOMPurify from 'dompurify';
import { FC, useState } from 'react';
import { GetUserProfile, SendMessageComposer } from '../../api';
import { IProfileComment } from '../../api/user/ProfilePortfolioData';
import { AddWallCommentComposer } from '../../api/user/portfolio';
import { Flex, LayoutAvatarImageView, Text } from '../../common';

interface ProfileWallViewProps
{
    userId: number;
    comments: IProfileComment[];
}

export const ProfileWallView: FC<ProfileWallViewProps> = props =>
{
    const { userId, comments } = props;
    const [ message, setMessage ] = useState('');

    const onSubmit = () =>
    {
        const trimmed = message.trim();
        if(!trimmed || trimmed.length > 200) return;

        const sanitized = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
        if(!sanitized) return;

        SendMessageComposer(new AddWallCommentComposer(userId, sanitized));
        setMessage('');
    };

    const onKeyDown = (e: React.KeyboardEvent) =>
    {
        if(e.key === 'Enter' && !e.shiftKey)
        {
            e.preventDefault();
            onSubmit();
        }
    };

    const formatTime = (timestamp: number): string =>
    {
        const diff = Math.floor((Date.now() - timestamp) / 1000);
        if(diff < 60) return 'ora';
        if(diff < 3600) return `${ Math.floor(diff / 60) }m fa`;
        if(diff < 86400) return `${ Math.floor(diff / 3600) }h fa`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 overflow-auto flex flex-col gap-1.5">
                { (!comments || comments.length === 0) && (
                    <Flex center fullWidth className="h-full">
                        <Text small variant="muted">Nessun commento sulla bacheca</Text>
                    </Flex>
                ) }
                { comments && comments.map(comment => (
                    <div key={ comment.id } className="flex gap-2 px-2 py-1.5 rounded bg-white/50">
                        <div
                            className="w-[30px] h-[30px] shrink-0 rounded overflow-hidden cursor-pointer"
                            onClick={ () => GetUserProfile(comment.userId) }>
                            <LayoutAvatarImageView direction={ 2 } figure={ comment.figure } headOnly={ true } />
                        </div>
                        <div className="flex flex-col min-w-0 grow">
                            <div className="flex items-center gap-1">
                                <Text bold small className="cursor-pointer hover:underline" onClick={ () => GetUserProfile(comment.userId) }>
                                    { comment.username }
                                </Text>
                                <Text small variant="muted">{ formatTime(comment.timestamp) }</Text>
                            </div>
                            <Text small className="break-words">{ comment.message }</Text>
                        </div>
                    </div>
                )) }
            </div>
            <div className="flex gap-2 pt-1 border-t border-muted">
                <input
                    className="flex-1 px-2 py-1 rounded border border-muted text-sm outline-none focus:border-blue-400"
                    maxLength={ 200 }
                    placeholder="Scrivi un commento..."
                    type="text"
                    value={ message }
                    onChange={ e => setMessage(e.target.value) }
                    onKeyDown={ onKeyDown }
                />
                <button
                    className="px-3 py-1 rounded bg-card-header text-white text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-default"
                    disabled={ !message.trim() }
                    onClick={ onSubmit }>
                    Invia
                </button>
            </div>
        </div>
    );
};
