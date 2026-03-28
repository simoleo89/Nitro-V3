import { ExtendedProfileChangedMessageEvent, GetSessionDataManager, NavigatorSearchComposer, NavigatorSearchEvent, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomDataParser, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { CreateRoomSession, GetRoomSession, GetUserProfile, LocalizeText, SendMessageComposer } from '../../api';
import { DEFAULT_TAB_CONFIG, IProfileComment, IProfilePhoto, IProfileTabConfig, IShowcaseItem, ProfileTabKey } from '../../api/user/ProfilePortfolioData';
import { LoadPortfolioComposer, PortfolioDataEvent, PortfolioUpdatedEvent, WallCommentAddedEvent } from '../../api/user/portfolio';
import { Flex, Text } from '../../common';
import { BadgeInfoView } from './BadgeInfoView';
import { useMessageEvent, useNitroEvent } from '../../hooks';
import { NitroCard } from '../../layout';
import { FriendsContainerView } from './FriendsContainerView';
import { GroupsContainerView } from './GroupsContainerView';
import { PhotoGalleryView } from './PhotoGalleryView';
import { ProfileTabSettingsView } from './ProfileTabSettingsView';
import { ProfileWallView } from './ProfileWallView';
import { RareShowcaseView } from './RareShowcaseView';
import { UserContainerView } from './UserContainerView';

type ProfileTab = ProfileTabKey | 'impostazioni';

const TAB_LABELS: Record<ProfileTabKey, string> = {
    badge: 'Badge',
    amici: 'Amici',
    stanze: 'Stanze',
    gruppi: 'Gruppi',
    foto: 'Foto',
    bacheca: 'Bacheca',
    showcase: 'Vetrina'
};

export const UserProfileView: FC<{}> = props =>
{
    const [ userProfile, setUserProfile ] = useState<UserProfileParser>(null);
    const [ userBadges, setUserBadges ] = useState<string[]>([]);
    const [ userRelationships, setUserRelationships ] = useState<RelationshipStatusInfoMessageParser>(null);
    const [ activeTab, setActiveTab ] = useState<ProfileTab>('badge');
    const [ userRooms, setUserRooms ] = useState<RoomDataParser[]>(null);
    const [ profilePhotos, setProfilePhotos ] = useState<IProfilePhoto[]>([]);
    const [ wallComments, setWallComments ] = useState<IProfileComment[]>([]);
    const [ showcaseItems, setShowcaseItems ] = useState<IShowcaseItem[]>([]);
    const [ tabConfig, setTabConfig ] = useState<IProfileTabConfig>({ ...DEFAULT_TAB_CONFIG });

    const isOwnProfile = userProfile && (userProfile.id === GetSessionDataManager().userId);

    const onClose = () =>
    {
        setUserProfile(null);
        setUserBadges([]);
        setUserRelationships(null);
        setActiveTab('badge');
        setUserRooms(null);
        setProfilePhotos([]);
        setWallComments([]);
        setShowcaseItems([]);
        setTabConfig({ ...DEFAULT_TAB_CONFIG });
    };

    const onLeaveGroup = () =>
    {
        if(!userProfile || (userProfile.id !== GetSessionDataManager().userId)) return;

        GetUserProfile(userProfile.id);
    };

    const getFirstEnabledTab = (config: IProfileTabConfig): ProfileTab =>
    {
        const keys = Object.keys(TAB_LABELS) as ProfileTabKey[];
        return keys.find(k => config[k]) ?? 'badge';
    };

    const onTabClick = (tab: ProfileTab) =>
    {
        setActiveTab(tab);

        if(tab === 'stanze' && !userRooms && userProfile)
        {
            SendMessageComposer(new NavigatorSearchComposer('hotel_view', `owner:${ userProfile.username }`));
        }
    };

    // --- Portfolio WebSocket events ---

    useMessageEvent<PortfolioDataEvent>(PortfolioDataEvent, event =>
    {
        const data = event.getParser();

        if(!userProfile || data.userId !== userProfile.id) return;

        setTabConfig(data.tabConfig ?? { ...DEFAULT_TAB_CONFIG });
        setProfilePhotos(data.photos ?? []);
        setWallComments(data.wallComments ?? []);
        setShowcaseItems(data.showcaseItems ?? []);
    });

    useMessageEvent<WallCommentAddedEvent>(WallCommentAddedEvent, event =>
    {
        const data = event.getParser();

        if(!userProfile || data.userId !== userProfile.id) return;

        setWallComments(prev => [ data.comment, ...prev ]);
    });

    useMessageEvent<PortfolioUpdatedEvent>(PortfolioUpdatedEvent, event =>
    {
        const data = event.getParser();

        if(!userProfile || data.userId !== userProfile.id) return;

        SendMessageComposer(new LoadPortfolioComposer(userProfile.id));
    });

    // --- Standard profile events ---

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
            setUserRooms(null);
            setProfilePhotos([]);
            setWallComments([]);
            setShowcaseItems([]);
            setTabConfig({ ...DEFAULT_TAB_CONFIG });
        }

        SendMessageComposer(new UserCurrentBadgesComposer(parser.id));
        SendMessageComposer(new UserRelationshipsComposer(parser.id));
        SendMessageComposer(new LoadPortfolioComposer(parser.id));
    });

    useMessageEvent<ExtendedProfileChangedMessageEvent>(ExtendedProfileChangedMessageEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId != userProfile?.id) return;

        GetUserProfile(parser.userId);
    });

    useMessageEvent<NavigatorSearchEvent>(NavigatorSearchEvent, event =>
    {
        if(!userProfile || activeTab !== 'stanze') return;

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

    useEffect(() =>
    {
        if(!tabConfig || !userProfile) return;

        if(activeTab !== 'impostazioni' && !(tabConfig as Record<string, boolean>)[activeTab])
        {
            setActiveTab(getFirstEnabledTab(tabConfig));
        }
    }, [ tabConfig ]);

    if(!userProfile) return null;

    const visibleTabs = (Object.keys(TAB_LABELS) as ProfileTabKey[]).filter(k => tabConfig[k]);

    return (
        <NitroCard className="w-[550px] h-[500px]" uniqueKey="nitro-user-profile">
            <NitroCard.Header
                headerText={ LocalizeText('extendedprofile.caption') }
                onCloseClick={ onClose } />
            <NitroCard.Content className="overflow-hidden !p-0 flex flex-col">
                <div className="p-2">
                    <UserContainerView userProfile={ userProfile } />
                </div>
                <NitroCard.Tabs>
                    { visibleTabs.map(tab => (
                        <NitroCard.TabItem
                            key={ tab }
                            isActive={ activeTab === tab }
                            count={ tab === 'badge' ? userBadges.length : tab === 'amici' ? userProfile.friendsCount : tab === 'gruppi' ? userProfile.groups?.length : tab === 'foto' ? profilePhotos.length : tab === 'bacheca' ? wallComments.length : tab === 'showcase' ? showcaseItems.length : 0 }
                            onClick={ () => onTabClick(tab) }>
                            { TAB_LABELS[tab] }
                        </NitroCard.TabItem>
                    )) }
                    { isOwnProfile && (
                        <NitroCard.TabItem
                            isActive={ activeTab === 'impostazioni' }
                            onClick={ () => onTabClick('impostazioni') }>
                            ⚙
                        </NitroCard.TabItem>
                    ) }
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
                                        <Text small variant="muted">Nessun badge da mostrare</Text>
                                    </Flex>
                                )
                            }
                        </div>
                    ) }
                    { activeTab === 'amici' && (
                        <div className="flex flex-col gap-2 h-full">
                            { userRelationships ? (
                                <FriendsContainerView friendsCount={ userProfile.friendsCount } relationships={ userRelationships } />
                            ) : (
                                <Flex center className="h-full">
                                    <Text small variant="muted">Caricamento...</Text>
                                </Flex>
                            ) }
                        </div>
                    ) }
                    { activeTab === 'stanze' && (
                        <div className="flex flex-col gap-1 h-full">
                            { !userRooms && (
                                <Flex center className="h-full">
                                    <Text small variant="muted">Caricamento stanze...</Text>
                                </Flex>
                            ) }
                            { userRooms && userRooms.length === 0 && (
                                <Flex center className="h-full">
                                    <Text small variant="muted">Nessuna stanza trovata</Text>
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
                    { activeTab === 'gruppi' && (
                        <div className="h-full">
                            <GroupsContainerView fullWidth groups={ userProfile.groups } itsMe={ userProfile.id === GetSessionDataManager().userId } onLeaveGroup={ onLeaveGroup } />
                        </div>
                    ) }
                    { activeTab === 'foto' && (
                        <div className="h-full">
                            <PhotoGalleryView
                                isOwnProfile={ isOwnProfile }
                                photos={ profilePhotos }
                                userId={ userProfile.id }
                            />
                        </div>
                    ) }
                    { activeTab === 'bacheca' && (
                        <div className="h-full">
                            <ProfileWallView
                                comments={ wallComments }
                                userId={ userProfile.id }
                            />
                        </div>
                    ) }
                    { activeTab === 'showcase' && (
                        <div className="h-full">
                            <RareShowcaseView
                                isOwnProfile={ isOwnProfile }
                                items={ showcaseItems }
                                userId={ userProfile.id }
                            />
                        </div>
                    ) }
                    { activeTab === 'impostazioni' && isOwnProfile && (
                        <div className="h-full">
                            <ProfileTabSettingsView
                                tabConfig={ tabConfig }
                                userId={ userProfile.id }
                                onConfigChange={ setTabConfig }
                            />
                        </div>
                    ) }
                </div>
            </NitroCard.Content>
        </NitroCard>
    );
};
