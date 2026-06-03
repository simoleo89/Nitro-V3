import { FC, Fragment, ReactNode } from 'react';
import { tokenIsMention } from '../room/widgets/chat/highlightMentions';

interface MentionMessageViewProps
{
    text: string;
    ownUsername: string;
    className?: string;
}

/**
 * Renders a mention's message text as React nodes, wrapping the token(s) that
 * mention the local user or a room-broadcast alias in a `.mention-highlight`
 * span. Pure text segmentation (no innerHTML) → no XSS risk from other users'
 * chat content. Original spacing is preserved verbatim.
 */
export const MentionMessageView: FC<MentionMessageViewProps> = props =>
{
    const { text, ownUsername, className } = props;

    if(!text) return <span className={ className } />;

    const nodes: ReactNode[] = text.split(/(\s+)/).map((segment, index) =>
    {
        if(segment.length === 0) return null;

        if(/^\s+$/.test(segment) || !tokenIsMention(segment, ownUsername))
        {
            return <Fragment key={ index }>{ segment }</Fragment>;
        }

        return <span key={ index } className="mention-highlight">{ segment }</span>;
    });

    return <span className={ className }>{ nodes }</span>;
};
