import { AddLinkEventTracker, CreateLinkEvent, ILinkEventTracker, RemoveLinkEventTracker, RoomEngineEvent, RoomId, RoomObjectCategory, RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { GetRoomSession, ISelectedUser, LocalizeText } from '../../api';
import { Button, DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useModTools, useNitroEvent, useObjectSelectedEvent, useRoomUserListSnapshot } from '../../hooks';
import { ModToolsChatlogView } from './views/room/ModToolsChatlogView';
import { ModToolsRoomView } from './views/room/ModToolsRoomView';
import { ModToolsTicketsView } from './views/tickets/ModToolsTicketsView';
import { ModToolsUserChatlogView } from './views/user/ModToolsUserChatlogView';
import { ModToolsUserView } from './views/user/ModToolsUserView';

export const ModToolsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentRoomId, setCurrentRoomId ] = useState<number>(-1);
    const [ selectedUser, setSelectedUser ] = useState<ISelectedUser>(null);
    const [ isTicketsVisible, setIsTicketsVisible ] = useState(false);
    const { tickets = [], openRooms = [], openRoomChatlogs = [], openUserChatlogs = [], openUserInfos = [], openRoomInfo = null, closeRoomInfo = null, toggleRoomInfo = null, openRoomChatlog = null, closeRoomChatlog = null, toggleRoomChatlog = null, openUserInfo = null, closeUserInfo = null, toggleUserInfo = null, openUserChatlog = null, closeUserChatlog = null, toggleUserChatlog = null } = useModTools();
    const elementRef = useRef<HTMLDivElement>(null);
    // Reactive room roster — used to auto-clear the selected user if
    // they leave the room while the panel is open, and to show an
    // online dot on the selected-user button without going through
    // userDataManager imperatively on every render.
    const roomUserList = useRoomUserListSnapshot();
    // Count of OPEN tickets the moderator hasn't picked yet — shown
    // as a badge on the Report Tool button so a new ticket is visible
    // immediately, without forcing the user to click through.
    const openTicketsCount = useMemo(
        () => tickets.filter(ticket => ticket && (ticket.state === 1)).length,
        [ tickets ]
    );
    const isSelectedUserPresent = useMemo(
        () => !!(selectedUser && roomUserList.some(user => user && (user.webID === selectedUser.userId))),
        [ selectedUser, roomUserList ]
    );

    useNitroEvent<RoomEngineEvent>([
        RoomEngineEvent.INITIALIZED,
        RoomEngineEvent.DISPOSED
    ], event =>
    {
        if(RoomId.isRoomPreviewerId(event.roomId)) return;

        switch(event.type)
        {
            case RoomEngineEvent.INITIALIZED:
                setCurrentRoomId(event.roomId);
                return;
            case RoomEngineEvent.DISPOSED:
                setCurrentRoomId(-1);
                return;
        }
    });

    useObjectSelectedEvent(event =>
    {
        if(event.category !== RoomObjectCategory.UNIT) return;

        const roomSession = GetRoomSession();

        if(!roomSession) return;

        const userData = roomSession.userDataManager.getUserDataByIndex(event.id);

        if(!userData || userData.type !== RoomObjectType.USER) return;

        setSelectedUser({ userId: userData.webID, username: userData.name });
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                    case 'open-room-info':
                        openRoomInfo(Number(parts[2]));
                        return;
                    case 'close-room-info':
                        closeRoomInfo(Number(parts[2]));
                        return;
                    case 'toggle-room-info':
                        toggleRoomInfo(Number(parts[2]));
                        return;
                    case 'open-room-chatlog':
                        openRoomChatlog(Number(parts[2]));
                        return;
                    case 'close-room-chatlog':
                        closeRoomChatlog(Number(parts[2]));
                        return;
                    case 'toggle-room-chatlog':
                        toggleRoomChatlog(Number(parts[2]));
                        return;
                    case 'open-user-info':
                        openUserInfo(Number(parts[2]));
                        return;
                    case 'close-user-info':
                        closeUserInfo(Number(parts[2]));
                        return;
                    case 'toggle-user-info':
                        toggleUserInfo(Number(parts[2]));
                        return;
                    case 'open-user-chatlog':
                        openUserChatlog(Number(parts[2]));
                        return;
                    case 'close-user-chatlog':
                        closeUserChatlog(Number(parts[2]));
                        return;
                    case 'toggle-user-chatlog':
                        toggleUserChatlog(Number(parts[2]));
                        return;
                }
            },
            eventUrlPrefix: 'mod-tools/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ openRoomInfo, closeRoomInfo, toggleRoomInfo, openRoomChatlog, closeRoomChatlog, toggleRoomChatlog, openUserInfo, closeUserInfo, toggleUserInfo, openUserChatlog, closeUserChatlog, toggleUserChatlog ]);

    const isRoomInfoOpen = currentRoomId > 0 && openRooms.includes(currentRoomId);
    const isRoomChatlogOpen = currentRoomId > 0 && openRoomChatlogs.includes(currentRoomId);
    const isUserInfoOpen = selectedUser && openUserInfos.includes(selectedUser.userId);
    const noRoomHint = LocalizeText('mod.tools.no.room') || 'Enter a room first';

    return (
        <>
            { isVisible &&
                <NitroCardView className="nitro-mod-tools min-w-[220px]" theme="primary-slim" uniqueKey="mod-tools" windowPosition={ DraggableWindowPosition.TOP_LEFT } >
                    <NitroCardHeaderView headerText={ 'Mod Tools' } onCloseClick={ event => setIsVisible(false) } />
                    <NitroCardContentView className="text-black" gap={ 2 }>
                        <Button active={ isRoomInfoOpen } disabled={ (currentRoomId <= 0) } gap={ 2 } justifyContent="start" title={ (currentRoomId <= 0) ? noRoomHint : undefined } onClick={ event => CreateLinkEvent(`mod-tools/toggle-room-info/${ currentRoomId }`) }>
                            <div className="nitro-icon icon-small-room shrink-0" />
                            <span className="grow text-start">Room Tool</span>
                        </Button>
                        <Button active={ isRoomChatlogOpen } disabled={ (currentRoomId <= 0) } gap={ 2 } innerRef={ elementRef } justifyContent="start" title={ (currentRoomId <= 0) ? noRoomHint : undefined } onClick={ event => CreateLinkEvent(`mod-tools/toggle-room-chatlog/${ currentRoomId }`) }>
                            <div className="nitro-icon icon-chat-history shrink-0" />
                            <span className="grow text-start">Chatlog Tool</span>
                        </Button>
                        <Button active={ !!isUserInfoOpen } disabled={ !selectedUser } gap={ 2 } justifyContent="start" onClick={ () => selectedUser && CreateLinkEvent(`mod-tools/toggle-user-info/${ selectedUser.userId }`) }>
                            <div className="nitro-icon icon-user shrink-0" />
                            { selectedUser
                                ? (
                                    <>
                                        <span className="truncate grow text-start">{ selectedUser.username }</span>
                                        <span
                                            aria-label={ isSelectedUserPresent ? 'In room' : 'Left room' }
                                            className={ `inline-block w-2 h-2 rounded-full shrink-0 ${ isSelectedUserPresent ? 'bg-emerald-500' : 'bg-zinc-400' }` }
                                            title={ isSelectedUserPresent ? 'Still in this room' : 'No longer in this room' }
                                        />
                                        <span
                                            className="inline-flex items-center justify-center w-4 h-4 rounded text-xs text-zinc-500 hover:text-rose-600 hover:bg-rose-100 shrink-0"
                                            onClick={ event =>
                                            {
                                                event.stopPropagation();
                                                setSelectedUser(null);
                                            } }
                                            role="button"
                                            tabIndex={ 0 }
                                            title="Clear selection">
                                            <FaTimes />
                                        </span>
                                    </>
                                )
                                : <span className="opacity-50 italic grow text-start">Select a user</span>
                            }
                        </Button>
                        <Button active={ isTicketsVisible } gap={ 2 } justifyContent="start" onClick={ () => setIsTicketsVisible(prevValue => !prevValue) }>
                            <div className="nitro-icon icon-tickets shrink-0" />
                            <span className="grow text-start">Report Tool</span>
                            { (openTicketsCount > 0) &&
                                <span
                                    className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-xs font-semibold shrink-0"
                                    title={ `${ openTicketsCount } open ticket${ openTicketsCount === 1 ? '' : 's' }` }>
                                    { openTicketsCount > 99 ? '99+' : openTicketsCount }
                                </span> }
                        </Button>
                    </NitroCardContentView>
                </NitroCardView> }
            { (openRooms.length > 0) && openRooms.map(roomId => <ModToolsRoomView key={ roomId } roomId={ roomId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-room-info/${ roomId }`) } />) }
            { (openRoomChatlogs.length > 0) && openRoomChatlogs.map(roomId => <ModToolsChatlogView key={ roomId } roomId={ roomId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-room-chatlog/${ roomId }`) } />) }
            { (openUserInfos.length > 0) && openUserInfos.map(userId => <ModToolsUserView key={ userId } userId={ userId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-user-info/${ userId }`) } />) }
            { (openUserChatlogs.length > 0) && openUserChatlogs.map(userId => <ModToolsUserChatlogView key={ userId } userId={ userId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-user-chatlog/${ userId }`) } />) }
            { isTicketsVisible && <ModToolsTicketsView onCloseClick={ () => setIsTicketsVisible(false) } /> }
        </>
    );
};
