import { AddLinkEventTracker, ILinkEventTracker, NitroSettingsEvent, RemoveLinkEventTracker, UserSettingsCameraFollowComposer, UserSettingsEvent, UserSettingsOldChatComposer, UserSettingsRoomInvitesComposer, UserSettingsSoundComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaVolumeDown, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { DispatchMainEvent, DispatchUiEvent, LocalizeText, SendMessageComposer } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useCatalogPlaceMultipleItems, useCatalogSkipPurchaseConfirmation, useChatWindow, useMessageEvent } from '../../hooks';
import { classNames } from '../../layout';
import { UserAccountSettingsView } from './UserAccountSettingsView';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return (text && text !== key) ? text : fallback;
};

type SettingsTab = 'audio' | 'chat' | 'other' | 'account';

export const UserSettingsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<SettingsTab>('audio');
    const [ userSettings, setUserSettings ] = useState<NitroSettingsEvent>(null);
    const [ catalogPlaceMultipleObjects, setCatalogPlaceMultipleObjects ] = useCatalogPlaceMultipleItems();
    const [ catalogSkipPurchaseConfirmation, setCatalogSkipPurchaseConfirmation ] = useCatalogSkipPurchaseConfirmation();
    const [ chatWindowEnabled, setChatWindowEnabled ] = useChatWindow();

    const processAction = (type: string, value?: boolean | number | string) =>
    {
        let doUpdate = true;

        const clone = userSettings.clone();

        switch(type)
        {
            case 'close_view':
                setIsVisible(false);
                doUpdate = false;
                return;
            case 'oldchat':
                clone.oldChat = value as boolean;
                SendMessageComposer(new UserSettingsOldChatComposer(clone.oldChat));
                break;
            case 'room_invites':
                clone.roomInvites = value as boolean;
                SendMessageComposer(new UserSettingsRoomInvitesComposer(clone.roomInvites));
                break;
            case 'camera_follow':
                clone.cameraFollow = value as boolean;
                SendMessageComposer(new UserSettingsCameraFollowComposer(clone.cameraFollow));
                break;
            case 'system_volume':
                clone.volumeSystem = value as number;
                clone.volumeSystem = Math.max(0, clone.volumeSystem);
                clone.volumeSystem = Math.min(100, clone.volumeSystem);
                break;
            case 'furni_volume':
                clone.volumeFurni = value as number;
                clone.volumeFurni = Math.max(0, clone.volumeFurni);
                clone.volumeFurni = Math.min(100, clone.volumeFurni);
                break;
            case 'trax_volume':
                clone.volumeTrax = value as number;
                clone.volumeTrax = Math.max(0, clone.volumeTrax);
                clone.volumeTrax = Math.min(100, clone.volumeTrax);
                break;
        }

        if(doUpdate) setUserSettings(clone);

        DispatchMainEvent(clone);
    };

    const saveRangeSlider = (type: string) =>
    {
        switch(type)
        {
            case 'volume':
                SendMessageComposer(new UserSettingsSoundComposer(Math.round(userSettings.volumeSystem), Math.round(userSettings.volumeFurni), Math.round(userSettings.volumeTrax)));
                break;
        }
    };

    useMessageEvent<UserSettingsEvent>(UserSettingsEvent, event =>
    {
        const parser = event.getParser();
        const settingsEvent = new NitroSettingsEvent();

        settingsEvent.volumeSystem = parser.volumeSystem;
        settingsEvent.volumeFurni = parser.volumeFurni;
        settingsEvent.volumeTrax = parser.volumeTrax;
        settingsEvent.oldChat = parser.oldChat;
        settingsEvent.roomInvites = parser.roomInvites;
        settingsEvent.cameraFollow = parser.cameraFollow;
        settingsEvent.flags = parser.flags;
        settingsEvent.chatType = parser.chatType;

        setUserSettings(settingsEvent);
        DispatchMainEvent(settingsEvent);
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                const tab = parts[2] as SettingsTab;

                switch(parts[1])
                {
                    case 'show':
                        if(tab) setActiveTab(tab);
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        if(tab) setActiveTab(tab);
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'user-settings/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!userSettings) return;

        DispatchUiEvent(userSettings);
    }, [ userSettings ]);

    if(!isVisible || !userSettings) return null;

    return (
        <NitroCardView className="user-settings-window w-[340px]" theme="primary-slim" uniqueKey="user-settings">
            <NitroCardHeaderView headerText={ LocalizeText('widget.memenu.settings.title') } onCloseClick={ event => processAction('close_view') } />
            <NitroCardTabsView>
                <NitroCardTabsItemView isActive={ activeTab === 'audio' } onClick={ () => setActiveTab('audio') }>
                    { localizeWithFallback('widget.memenu.settings.volume', 'Audio') }
                </NitroCardTabsItemView>
                <NitroCardTabsItemView isActive={ activeTab === 'chat' } onClick={ () => setActiveTab('chat') }>
                    { localizeWithFallback('room.chat.settings.title', 'Chat') }
                </NitroCardTabsItemView>
                <NitroCardTabsItemView isActive={ activeTab === 'other' } onClick={ () => setActiveTab('other') }>
                    { localizeWithFallback('memenu.settings.other', 'Altre') }
                </NitroCardTabsItemView>
                <NitroCardTabsItemView isActive={ activeTab === 'account' } onClick={ () => setActiveTab('account') }>
                    { localizeWithFallback('usersettings.account.label', 'Account') }
                </NitroCardTabsItemView>
            </NitroCardTabsView>
            { (activeTab === 'account')
                ? <UserAccountSettingsView embedded />
                : (
                    <NitroCardContentView className="flex flex-col gap-2 text-black">
                        { (activeTab === 'chat') &&
                            <>
                                <Text small className="text-black/60 uppercase tracking-wider px-1">{ localizeWithFallback('room.chat.settings.title', 'Chat') }</Text>
                                <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 cursor-pointer hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors">
                                    <input checked={ userSettings.oldChat } className="form-check-input" type="checkbox" onChange={ event => processAction('oldchat', event.target.checked) } />
                                    <Text>{ LocalizeText('memenu.settings.chat.prefer.old.chat') }</Text>
                                </label>
                                <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 cursor-pointer hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors">
                                    <input checked={ chatWindowEnabled } className="form-check-input" type="checkbox" onChange={ event => setChatWindowEnabled(event.target.checked) } />
                                    <Text>{ LocalizeText('memenu.settings.other.enable.chat.window') }</Text>
                                </label>
                            </> }
                        { (activeTab === 'other') &&
                            <>
                                <Text small className="text-black/60 uppercase tracking-wider px-1">{ localizeWithFallback('memenu.settings.other', 'Altre') }</Text>
                                <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 cursor-pointer hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors">
                                    <input checked={ userSettings.roomInvites } className="form-check-input" type="checkbox" onChange={ event => processAction('room_invites', event.target.checked) } />
                                    <Text>{ LocalizeText('memenu.settings.other.ignore.room.invites') }</Text>
                                </label>
                                <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 cursor-pointer hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors">
                                    <input checked={ userSettings.cameraFollow } className="form-check-input" type="checkbox" onChange={ event => processAction('camera_follow', event.target.checked) } />
                                    <Text>{ LocalizeText('memenu.settings.other.disable.room.camera.follow') }</Text>
                                </label>
                                <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 cursor-pointer hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors">
                                    <input checked={ catalogPlaceMultipleObjects } className="form-check-input" type="checkbox" onChange={ event => setCatalogPlaceMultipleObjects(event.target.checked) } />
                                    <Text>{ LocalizeText('memenu.settings.other.place.multiple.objects') }</Text>
                                </label>
                                <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 cursor-pointer hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors">
                                    <input checked={ catalogSkipPurchaseConfirmation } className="form-check-input" type="checkbox" onChange={ event => setCatalogSkipPurchaseConfirmation(event.target.checked) } />
                                    <Text>{ LocalizeText('memenu.settings.other.skip.purchase.confirmation') }</Text>
                                </label>
                            </> }
                        { (activeTab === 'audio') &&
                            <>
                                <Text small className="text-black/60 uppercase tracking-wider px-1">{ localizeWithFallback('widget.memenu.settings.volume', 'Audio') }</Text>
                                <div className="flex flex-col gap-1 rounded-md border border-black/10 bg-white px-3 py-2">
                                    <Text bold>{ LocalizeText('widget.memenu.settings.volume.ui') }</Text>
                                    <div className="flex items-center gap-1">
                                        { (userSettings.volumeSystem === 0) && <FaVolumeMute className={ classNames((userSettings.volumeSystem >= 50) && 'text-muted', 'fa-icon') } /> }
                                        { (userSettings.volumeSystem > 0) && <FaVolumeDown className={ classNames((userSettings.volumeSystem >= 50) && 'text-muted', 'fa-icon') } /> }
                                        <input className="custom-range w-full" id="volumeSystem" max="100" min="0" step="1" type="range" value={ userSettings.volumeSystem } onChange={ event => processAction('system_volume', event.target.value) } onMouseUp={ () => saveRangeSlider('volume') } />
                                        <FaVolumeUp className={ classNames((userSettings.volumeSystem < 50) && 'text-muted', 'fa-icon') } />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 rounded-md border border-black/10 bg-white px-3 py-2">
                                    <Text bold>{ LocalizeText('widget.memenu.settings.volume.furni') }</Text>
                                    <div className="flex items-center gap-1">
                                        { (userSettings.volumeFurni === 0) && <FaVolumeMute className={ classNames((userSettings.volumeFurni >= 50) && 'text-muted', 'fa-icon') } /> }
                                        { (userSettings.volumeFurni > 0) && <FaVolumeDown className={ classNames((userSettings.volumeFurni >= 50) && 'text-muted', 'fa-icon') } /> }
                                        <input className="custom-range w-full" id="volumeFurni" max="100" min="0" step="1" type="range" value={ userSettings.volumeFurni } onChange={ event => processAction('furni_volume', event.target.value) } onMouseUp={ () => saveRangeSlider('volume') } />
                                        <FaVolumeUp className={ classNames((userSettings.volumeFurni < 50) && 'text-muted', 'fa-icon') } />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 rounded-md border border-black/10 bg-white px-3 py-2">
                                    <Text bold>{ LocalizeText('widget.memenu.settings.volume.trax') }</Text>
                                    <div className="flex items-center gap-1">
                                        { (userSettings.volumeTrax === 0) && <FaVolumeMute className={ classNames((userSettings.volumeTrax >= 50) && 'text-muted', 'fa-icon') } /> }
                                        { (userSettings.volumeTrax > 0) && <FaVolumeDown className={ classNames((userSettings.volumeTrax >= 50) && 'text-muted', 'fa-icon') } /> }
                                        <input className="custom-range w-full" id="volumeTrax" max="100" min="0" step="1" type="range" value={ userSettings.volumeTrax } onChange={ event => processAction('trax_volume', event.target.value) } onMouseUp={ () => saveRangeSlider('volume') } />
                                        <FaVolumeUp className={ classNames((userSettings.volumeTrax < 50) && 'text-muted', 'fa-icon') } />
                                    </div>
                                </div>
                            </> }
                    </NitroCardContentView>
                ) }
        </NitroCardView>
    );
};
