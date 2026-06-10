import { FC } from 'react';
import { FaExchangeAlt, FaSyncAlt } from 'react-icons/fa';
import { Column } from '../../../../../common';
import { useCatalogData, useUserGroups } from '../../../../../hooks';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogGuildBadgeWidgetView } from '../widgets/CatalogGuildBadgeWidgetView';
import { CatalogGuildSelectorWidgetView } from '../widgets/CatalogGuildSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayouGuildCustomFurniView: FC<CatalogLayoutProps> = () =>
{
    const { currentOffer = null, roomPreviewer = null } = useCatalogData();
    const { data: groups = null } = useUserGroups();
    const hasGroups = !!(groups && groups.length);

    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <Column fullHeight gap={ 1 } overflow="hidden">
                { !!currentOffer &&
                    <div className="relative shrink-0 overflow-hidden">
                        <button className="nitro-catalog-classic-preview-btn nitro-catalog-classic-preview-rotate" onClick={ () => roomPreviewer?.changeRoomObjectDirection() }>
                            <FaSyncAlt />
                        </button>
                        <button className="nitro-catalog-classic-preview-btn nitro-catalog-classic-preview-state" onClick={ () => roomPreviewer?.changeRoomObjectState() }>
                            <FaExchangeAlt />
                        </button>
                        <CatalogViewProductWidgetView height={ 210 } />
                        <div className="absolute bottom-1 left-1 z-10">
                            <CatalogGuildBadgeWidgetView />
                        </div>
                        <div className="nitro-catalog-preview-price absolute bottom-1 right-1">
                            <CatalogTotalPriceWidget alignItems="end" />
                        </div>
                    </div> }
                <div className="grow! min-h-0 overflow-auto">
                    <CatalogItemGridWidgetView columnCount={ 5 } columnMinWidth={ 36 } />
                </div>
                { !!currentOffer &&
                    <div className="flex shrink-0 flex-col gap-1">
                        <CatalogGuildSelectorWidgetView />
                        { hasGroups &&
                            <CatalogPurchaseWidgetView noGiftOption={ true } /> }
                    </div> }
            </Column>
        </>
    );
};

