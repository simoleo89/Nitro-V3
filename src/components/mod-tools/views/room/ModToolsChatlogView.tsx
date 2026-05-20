import { ChatRecordData, GetRoomChatlogMessageComposer, RoomChatlogEvent } from '@nitrots/nitro-renderer';
import { FC } from 'react';
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

    if(!roomChatlog) return null;

    return (
        <NitroCardView className="nitro-mod-tools-chatlog min-w-[400px] max-h-[500px]" theme="primary-slim" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <NitroCardHeaderView headerText={ 'Room Chatlog' } onCloseClick={ onCloseClick } />
            <NitroCardContentView className="text-black" overflow="auto">
                { roomChatlog &&
                    <ChatlogView records={ [ roomChatlog ] } /> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
