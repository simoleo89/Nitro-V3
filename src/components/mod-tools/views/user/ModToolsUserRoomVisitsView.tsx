import { GetRoomVisitsMessageComposer, RoomVisitsData, RoomVisitsEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, SendMessageComposer, TryVisitRoom } from '../../../../api';
import { Column, DraggableWindowPosition, Grid, InfiniteScroll, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';

interface ModToolsUserRoomVisitsViewProps
{
    userId: number;
    onCloseClick: () => void;
}

export const ModToolsUserRoomVisitsView: FC<ModToolsUserRoomVisitsViewProps> = props =>
{
    const { userId = null, onCloseClick = null } = props;
    const [ roomVisitData, setRoomVisitData ] = useState<RoomVisitsData>(null);

    useMessageEvent<RoomVisitsEvent>(RoomVisitsEvent, event =>
    {
        const parser = event.getParser();

        if(parser.data.userId !== userId) return;

        setRoomVisitData(parser.data);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetRoomVisitsMessageComposer(userId));
    }, [ userId ]);

    if(!userId) return null;

    return (
        <NitroCardView className="nitro-mod-tools-user-visits" theme="primary-slim" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <NitroCardHeaderView headerText={ LocalizeText('moderation.roomvisits.title') } onCloseClick={ onCloseClick } />
            <NitroCardContentView className="text-black" gap={ 1 }>
                <Column fullHeight gap={ 0 } overflow="hidden">
                    <Column gap={ 2 }>
                        <Grid className="text-black font-bold	 border-bottom pb-1" gap={ 1 }>
                            <div className="col-span-2">{ LocalizeText('moderation.roomvisits.col.time') }</div>
                            <div className="col-span-7">{ LocalizeText('moderation.roomvisits.col.roomname') }</div>
                            <div className="col-span-3">{ LocalizeText('moderation.roomvisits.col.visit') }</div>
                        </Grid>
                    </Column>
                    <InfiniteScroll rowRender={ row =>
                    {
                        return (
                            <Grid alignItems="center" className="text-black py-1 border-bottom" fullHeight={ false } gap={ 1 }>
                                <Text className="col-span-2">{ row.enterHour.toString().padStart(2, '0') }: { row.enterMinute.toString().padStart(2, '0') }</Text>
                                <Text className="col-span-7">{ row.roomName }</Text>
                                <Text bold pointer underline className="col-span-3" variant="primary" onClick={ event => TryVisitRoom(row.roomId) }>{ LocalizeText('moderation.roomvisits.visitroom') }</Text>
                            </Grid>
                        );
                    } } rows={ roomVisitData?.rooms ?? [] } />
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
};
