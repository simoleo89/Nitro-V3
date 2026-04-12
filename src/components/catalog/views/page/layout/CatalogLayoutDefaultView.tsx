import { FC } from 'react';
import { GetConfigurationValue, ProductTypeEnum, SanitizeHtml } from '../../../../../api';
import { Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLimitedItemWidgetView } from '../widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from '../widgets/CatalogSpinnerWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null, currentPage = null } = useCatalog();

    return (
        <div className="flex flex-col h-full gap-2">
            { /* Product detail card */ }
            { currentOffer &&
                <div className="flex gap-0 bg-white rounded border-2 border-card-grid-item-border overflow-hidden">
                    { /* Preview area */ }
                    <div className="w-[140px] min-w-[140px] bg-card-grid-item relative flex items-center justify-center border-r-2 border-card-grid-item-border">
                        { (currentOffer.product.productType !== ProductTypeEnum.BADGE) &&
                            <>
                                <CatalogViewProductWidgetView />
                                <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-1 right-1 absolute" />
                            </> }
                        { (currentOffer.product.productType === ProductTypeEnum.BADGE) &&
                            <CatalogAddOnBadgeWidgetView className="scale-2" /> }
                    </div>
                    { /* Product info + purchase */ }
                    <div className="flex flex-col flex-1 min-w-0 p-2.5 gap-2">
                        <div>
                            <Text className="text-[13px]! font-bold text-dark leading-tight">{ currentOffer.localizationName }</Text>
                            <CatalogLimitedItemWidgetView />
                        </div>
                        <CatalogTotalPriceWidget />
                        <CatalogSpinnerWidgetView />
                        <div className="flex gap-1.5 mt-auto">
                            <CatalogPurchaseWidgetView />
                        </div>
                    </div>
                </div> }

            { /* Welcome/description card */ }
            { !currentOffer &&
                <div className="flex items-center gap-3 p-2.5 bg-white rounded border-2 border-card-grid-item-border">
                    { !!page.localization.getImage(1) &&
                        <img className="w-[70px] h-[70px] object-contain rounded shrink-0" src={ page.localization.getImage(1) } /> }
                    <Text className="text-[11px]! text-muted" dangerouslySetInnerHTML={ { __html: SanitizeHtml(page.localization.getText(0)) } } />
                </div> }

            { /* Item grid */ }
            <div className="flex-1 overflow-auto min-h-0">
                { GetConfigurationValue('catalog.headers') &&
                    <CatalogHeaderView imageUrl={ currentPage.localization.getImage(0) } /> }
                <CatalogItemGridWidgetView columnCount={ 7 } columnMinHeight={ 50 } columnMinWidth={ 50 } />
            </div>
        </div>
    );
};
