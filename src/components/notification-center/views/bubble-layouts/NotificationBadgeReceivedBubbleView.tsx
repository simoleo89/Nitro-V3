import { RequestBadgesComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { LocalizeText, NotificationBubbleItem, SendMessageComposer } from '../../../../api';
import { Flex, LayoutNotificationBubbleView, LayoutNotificationBubbleViewProps, Text } from '../../../../common';
import { useInventoryBadges } from '../../../../hooks';

export interface NotificationBadgeReceivedBubbleViewProps extends LayoutNotificationBubbleViewProps
{
    item: NotificationBubbleItem;
}

export const NotificationBadgeReceivedBubbleView: FC<NotificationBadgeReceivedBubbleViewProps> = props =>
{
    const { item = null, onClose = null, ...rest } = props;
    const { badgeCodes = [], toggleBadge = null } = useInventoryBadges();

    useEffect(() =>
    {
        if(badgeCodes.length === 0) SendMessageComposer(new RequestBadgesComposer());
    }, []);

    const handleWear = (event: React.MouseEvent) =>
    {
        event.stopPropagation();

        if(item.linkUrl)
        {
            toggleBadge(item.linkUrl);
        }

        if(onClose) onClose();
    };

    const handleDismiss = (event: React.MouseEvent) =>
    {
        event.stopPropagation();
        if(onClose) onClose();
    };

    return (
        <LayoutNotificationBubbleView className="flex-col" onClose={ onClose } { ...rest }>
            <div onClick={ (e) => e.stopPropagation() }>
                <Flex alignItems="center" gap={ 2 } className="mb-2">
                    <Flex center className="w-[50px] h-[50px] shrink-0">
                        { item.iconUrl && <img alt="" className="no-select" src={ item.iconUrl } /> }
                    </Flex>
                    <Flex column gap={ 0 }>
                        <Text bold variant="white">
                            { item.senderName
                                ? LocalizeText('notifications.text.received.badge', [ 'user_name' ], [ item.senderName ])
                                : LocalizeText('prereg.reward.you.received') }
                        </Text>
                        <Text variant="white" small>{ item.message }</Text>
                    </Flex>
                </Flex>
                <Flex alignItems="center" justifyContent="end" gap={ 2 }>
                    <button
                        className="btn btn-success w-full btn-sm"
                        type="button"
                        onClick={ handleWear }>
                        { LocalizeText('inventory.badges.wearbadge') }
                    </button>
                    <span className="underline cursor-pointer text-nowrap" onClick={ handleDismiss }>
                        { LocalizeText('notifications.button.later') }
                    </span>
                </Flex>
            </div>
        </LayoutNotificationBubbleView>
    );
};
