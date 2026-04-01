import { ExtendedProfileChangedMessageEvent, GetSessionDataManager, NavigatorSearchComposer, NavigatorSearchEvent, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomDataParser, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { CreateRoomSession, GetRoomSession, GetUserProfile, LocalizeText, SendMessageComposer } from '../../api';
import { Flex, Text } from '../../common';
import { BadgeInfoView } from './BadgeInfoView';
import { useMessageEvent, useNitroEvent } from '../../hooks';
import { NitroCard } from '../../layout';
import { FriendsContainerView } from './FriendsContainerView';
import { GroupsContainerView } from './GroupsContainerView';
import { UserContainerView } from './UserContainerView';

type ProfileTab = 'badge' | 'friends' | 'rooms' | 'groups';

export const UserProfileView: FC<{}> = props =>
{
    const [ userProfile, setUserProfile ] = useState<UserProfileParser>(null);
    const [ userBadges, setUserBadges ] = useState<string[]>([]);
    const [ userRelationships, setUserRelationships ] = useState<RelationshipStatusInfoMessageParser>(null);
    const [ activeTab, setActiveTab ] = useState<ProfileTab>('badge');
    const [ userRooms, setUserRooms ] = useState<RoomDataParser[]>(null);

    const onClose = () =>
    {
        setUserProfile(null);
        setUserBadges([]);
        setUserRelationships(null);
        setActiveTab('badge');
        setUserRooms(null);
    };

    const onLeaveGroup = () =>
    {
        if(!userProfile || (userProfile.id !== GetSessionDataManager().userId)) return;

        GetUserProfile(userProfile.id);
    };

    const onTabClick = (tab: ProfileTab) =>
    {
        setActiveTab(tab);

        if(tab === 'rooms' && !userRooms && userProfile)
        {
            SendMessageComposer(new NavigatorSearchComposer('hotel_view', `owner:${ userProfile.username }`));
        }
    };

    useMessageEvent<UserCurrentBadgesEvent>(UserCurrentBadgesEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setUserBadges(parser.badges);
    });

    useMessageEvent<RelationshipStatusInfoEvent>(RelationshipStatusInfoEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setUserRelationships(parser);
    });

    useMessageEvent<UserProfileEvent>(UserProfileEvent, event =>
    {
        const parser = event.getParser();

        let isSameProfile = false;

        setUserProfile(prevValue =>
        {
            if(prevValue && prevValue.id) isSameProfile = (prevValue.id === parser.id);

            return parser;
        });

        if(!isSameProfile)
        {
            setUserBadges([]);
            setUserRelationships(null);
            setActiveTab('badge');
            setUserRooms(null);
        }

        SendMessageComposer(new UserCurrentBadgesComposer(parser.id));
        SendMessageComposer(new UserRelationshipsComposer(parser.id));
    });

    useMessageEvent<ExtendedProfileChangedMessageEvent>(ExtendedProfileChangedMessageEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId != userProfile?.id) return;

        GetUserProfile(parser.userId);
    });

    useMessageEvent<NavigatorSearchEvent>(NavigatorSearchEvent, event =>
    {
        if(!userProfile || activeTab !== 'rooms') return;

        const parser = event.getParser();
        const result = parser.result;

        if(!result) return;

        const rooms: RoomDataParser[] = [];

        for(const resultList of result.results)
        {
            if(resultList.rooms && resultList.rooms.length)
            {
                for(const room of resultList.rooms) rooms.push(room);
            }
        }

        setUserRooms(rooms);
    });

    useNitroEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.SELECTED, event =>
    {
        if(!userProfile) return;

        if(event.category !== RoomObjectCategory.UNIT) return;

        const userData = GetRoomSession().userDataManager.getUserDataByIndex(event.objectId);

        if(userData.type !== RoomObjectType.USER) return;

        GetUserProfile(userData.webID);
    });

    if(!userProfile) return null;

    return (
        <NitroCard className="w-[470px] h-[460px]" uniqueKey="nitro-user-profile">
            <NitroCard.Header
                headerText={ LocalizeText('extendedprofile.caption') }
                onCloseClick={ onClose } />
            <NitroCard.Content className="overflow-hidden !p-0 flex flex-col">
                <div className="p-2">
                    <UserContainerView userProfile={ userProfile } />
                </div>
                <NitroCard.Tabs>
                    <NitroCard.TabItem isActive={ activeTab === 'badge' } count={ userBadges.length } onClick={ () => onTabClick('badge') }>
                        { LocalizeText('levelinfo.category.badge') }
                    </NitroCard.TabItem>
                    <NitroCard.TabItem isActive={ activeTab === 'friends' } count={ userProfile.friendsCount } onClick={ () => onTabClick('friends') }>
                        { LocalizeText('navigator.tab.3') }
                    </NitroCard.TabItem>
                    <NitroCard.TabItem isActive={ activeTab === 'rooms' } onClick={ () => onTabClick('rooms') }>
                        { LocalizeText('navigator.tab.2') }
                    </NitroCard.TabItem>
                    <NitroCard.TabItem isActive={ activeTab === 'groups' } count={ userProfile.groups?.length } onClick={ () => onTabClick('groups') }>
                        { LocalizeText('navigator.searchcode.title.groups') }
                    </NitroCard.TabItem>
                </NitroCard.Tabs>
                <div className="flex-1 overflow-auto p-2">
                    { activeTab === 'badge' && (
                        <div className="flex flex-wrap content-start gap-2 p-2 rounded bg-muted h-full">
                            { userBadges && (userBadges.length > 0)
                                ? userBadges.map((badge, index) => (
                                    <BadgeInfoView key={ badge + index } badgeCode={ badge } />
                                ))
                                : (
                                    <Flex center fullWidth className="h-full">
                                        <Text small variant="muted">{ LocalizeText('extendedprofile.badge.empty') }</Text>
                                    </Flex>
                                )
                            }
                        </div>
                    ) }
                    { activeTab === 'friends' && (
                        <div className="flex flex-col gap-2 h-full">
                            { userRelationships ? (
                                <FriendsContainerView friendsCount={ userProfile.friendsCount } relationships={ userRelationships } />
                            ) : (
                                <Flex center className="h-full">
                                    <Text small variant="muted">{ LocalizeText('generic.loading') }</Text>
                                </Flex>
                            ) }
                        </div>
                    ) }
                    { activeTab === 'rooms' && (
                        <div className="flex flex-col gap-1 h-full">
                            { !userRooms && (
                                <Flex center className="h-full">
                                    <Text small variant="muted">{ LocalizeText('extendedprofile.rooms.loading') }</Text>
                                </Flex>
                            ) }
                            { userRooms && userRooms.length === 0 && (
                                <Flex center className="h-full">
                                    <Text small variant="muted">{ LocalizeText('extendedprofile.rooms.empty') }</Text>
                                </Flex>
                            ) }
                            { userRooms && userRooms.length > 0 && userRooms.map(room => (
                                <Flex key={ room.roomId } alignItems="center" gap={ 2 } className="px-2 py-1.5 rounded bg-white/50 cursor-pointer hover:bg-white/80" onClick={ () => CreateRoomSession(room.roomId) }>
                                    <div className="flex flex-col min-w-0 grow">
                                        <Text bold small truncate>{ room.roomName }</Text>
                                        { room.description && <Text small truncate variant="muted">{ room.description }</Text> }
                                    </div>
                                    <Text small variant="muted" className="shrink-0">{ room.userCount }/{ room.maxUserCount }</Text>
                                </Flex>
                            )) }
                        </div>
                    ) }
                    { activeTab === 'groups' && (
                        <div className="h-full">
                            <GroupsContainerView fullWidth groups={ userProfile.groups } itsMe={ userProfile.id === GetSessionDataManager().userId } onLeaveGroup={ onLeaveGroup } />
                        </div>
                    ) }
                </div>
            </NitroCard.Content>
        </NitroCard>
    );
};
