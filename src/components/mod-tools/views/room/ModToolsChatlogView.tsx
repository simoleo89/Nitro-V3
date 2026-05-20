import { ChatRecordData, GetRoomChatlogMessageComposer, RoomChatlogEvent } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useNitroQuery } from '../../../../api/nitro-query';
import { DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { ChatlogView } from '../chatlog/ChatlogView';

interface ModToolsChatlogViewProps
{
    roomId: number;
    onCloseClick: () => void;
}

export const ModToolsChatlogView: FC<ModToolsChatlogViewProps> = props =>
{
    const { roomId = null, onCloseClick = null } = props;

    const { data: roomChatlog } = useNitroQuery<RoomChatlogEvent, ChatRecordData>({
        key: [ 'nitro', 'mod-tools', 'room-chatlog', roomId ],
        request: () => new GetRoomChatlogMessageComposer(roomId),
        parser: RoomChatlogEvent,
        accept: e => e.getParser()?.data.roomId === roomId,
        select: e => e.getParser().data,
        enabled: roomId !== null
    });

    return (
        <NitroCardView className="nitro-mod-tools-chatlog min-w-[460px] max-w-[520px] max-h-[500px]" theme="primary-slim" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <NitroCardHeaderView headerText={ LocalizeText('modtools.room.chatlog.title') } onCloseClick={ onCloseClick } />
            <NitroCardContentView className="text-black" gap={ 1 } overflow="auto">
                { roomChatlog
                    ? <ChatlogView records={ [ roomChatlog ] } />
                    : <div className="flex flex-col items-center justify-center gap-2 py-8 opacity-50 text-sm">
                        <FaSpinner className="animate-spin" size={ 22 } />
                        <span>{ LocalizeText('modtools.user.chatlog.loading') }</span>
                    </div> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
