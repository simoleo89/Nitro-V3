import { FC, MouseEvent } from 'react';
import { IMentionEntry, LocalizeText, MentionType } from '../../api';
import { Flex, Text } from '../../common';
import { MentionMessageView } from './MentionMessageView';
import { formatMentionTime } from './mentionsFormat';

interface MentionRowViewProps
{
    mention: IMentionEntry;
    ownUsername: string;
    onOpen: (mention: IMentionEntry) => void;
    onGoto?: (mention: IMentionEntry) => void;
    onRemove?: (mention: IMentionEntry) => void;
}

export const MentionRowView: FC<MentionRowViewProps> = props =>
{
    const { mention, ownUsername, onOpen, onGoto = null, onRemove = null } = props;

    const isRoom = (mention.mentionType === MentionType.ROOM);
    const typeTitle = LocalizeText(isRoom ? 'mentions.type.room' : 'mentions.type.direct');
    const time = formatMentionTime(mention.timestamp);

    const stop = (event: MouseEvent, action: () => void) =>
    {
        event.stopPropagation();
        action();
    };

    return (
        <Flex pointer alignItems="center" className="group relative px-1 py-[3px] rounded hover:bg-black/5" gap={ 2 } onClick={ () => onOpen(mention) }>
            <span
                className={ `inline-block w-[8px] h-[8px] rounded-full shrink-0 ${ mention.read ? 'bg-transparent' : 'bg-[#1e7295]' }` }
                title={ mention.read ? '' : LocalizeText('mentions.filter.unread') } />
            <span
                title={ typeTitle }
                className={ `flex items-center justify-center shrink-0 w-[18px] h-[18px] rounded text-[10px] font-bold leading-none text-white ${ isRoom ? 'bg-[#d08a1e]' : 'bg-[#1e7295]' }` }>
                { isRoom ? '@∗' : '@' }
            </span>
            <Flex grow column className="min-w-0" gap={ 0 }>
                <Flex alignItems="center" gap={ 1 } className="min-w-0">
                    <Text bold={ !mention.read } truncate variant="primary">{ mention.senderUsername }</Text>
                    { (mention.roomName && mention.roomName.length > 0) &&
                        <Text small truncate variant="gray">· { mention.roomName }</Text> }
                </Flex>
                <MentionMessageView className="block truncate text-black text-sm" ownUsername={ ownUsername } text={ mention.message } />
            </Flex>
            <Flex alignItems="center" gap={ 1 } className="shrink-0">
                { (time.length > 0) &&
                    <Text small variant="gray" className="tabular-nums group-hover:hidden">{ time }</Text> }
                <Flex alignItems="center" gap={ 1 } className="hidden group-hover:flex">
                    { onGoto &&
                        <span
                            title={ LocalizeText('mentions.action.goto') }
                            className="flex items-center justify-center w-[18px] h-[18px] rounded bg-black/10 hover:bg-black/20 text-[12px] leading-none"
                            onClick={ event => stop(event, () => onGoto(mention)) }>→</span> }
                    { onRemove &&
                        <span
                            title={ LocalizeText('mentions.action.remove') }
                            className="flex items-center justify-center w-[18px] h-[18px] rounded bg-black/10 hover:bg-red-500 hover:text-white text-[11px] leading-none"
                            onClick={ event => stop(event, () => onRemove(mention)) }>✕</span> }
                </Flex>
            </Flex>
        </Flex>
    );
};
