import { AddLinkEventTracker, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaCog } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useCatalog } from '../../hooks';
import { CatalogAdminProvider, useCatalogAdmin } from './CatalogAdminContext';
import { CatalogAdminEditorView } from './views/admin/CatalogAdminEditorView';
import { CatalogAdminOfferEditView } from './views/admin/CatalogAdminOfferEditView';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const CatalogClassicViewInner: FC<{}> = () =>
{
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const setAdminMode = catalogAdmin?.setAdminMode ?? (() => {});

    const isMod = GetSessionDataManager().isModerator;

    // Resizable nav column
    const [ navWidth, setNavWidth ] = useState(() =>
    {
        try { const s = localStorage.getItem('catalog.classic.nav.width'); return s ? Math.min(350, Math.max(100, parseInt(s))) : 220; }
        catch { return 220; }
    });
    const isResizing = useRef(false);

    const handleResizeStart = useCallback((e: React.MouseEvent) =>
    {
        e.preventDefault();
        isResizing.current = true;
        const startX = e.clientX;
        const startWidth = navWidth;

        const onMouseMove = (ev: MouseEvent) =>
        {
            if(!isResizing.current) return;
            setNavWidth(Math.min(300, Math.max(100, startWidth + (ev.clientX - startX))));
        };

        const onMouseUp = () =>
        {
            isResizing.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setNavWidth(w => { try { localStorage.setItem('catalog.classic.nav.width', String(w)); } catch {} return w; });
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [ navWidth ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(prevValue => !prevValue); return;
                    case 'open':
                        if(parts.length > 2)
                        {
                            if(parts.length === 4 && parts[2] === 'offerId') { openPageByOfferId(parseInt(parts[3])); return; }
                            else { openPageByName(parts[2]); }
                        }
                        else { setIsVisible(true); }
                        return;
                }
            },
            eventUrlPrefix: 'catalog/'
        };

        AddLinkEventTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [ setIsVisible, openPageByOfferId, openPageByName ]);

    return (
        <>
            { isVisible &&
                <NitroCardView className="w-[630px] h-[400px]" style={ GetConfigurationValue('catalog.headers') ? { width: 710 } : {} } uniqueKey="catalog">
                    <NitroCardHeaderView headerText={ LocalizeText('catalog.title') } onCloseClick={ () => setIsVisible(false) } />
                    <NitroCardTabsView>
                        { rootNode && (rootNode.children.length > 0) && rootNode.children.map((child, index) =>
                        {
                            if(!child.isVisible) return null;

                            return (
                                <NitroCardTabsItemView key={ `${ child.pageId }-${ child.pageName }-${ index }` } isActive={ child.isActive } onClick={ () =>
                                {
                                    if(searchResult) setSearchResult(null);
                                    activateNode(child);
                                } } >
                                    <div className={ `flex items-center gap-${ GetConfigurationValue('catalog.tab.icons') ? 1 : 0 }` }>
                                        { GetConfigurationValue('catalog.tab.icons') && <CatalogIconView icon={ child.iconId } /> }
                                        { child.localization }
                                    </div>
                                </NitroCardTabsItemView>
                            );
                        }) }
                        { isMod &&
                            <NitroCardTabsItemView isActive={ adminMode } onClick={ () => setAdminMode(!adminMode) }>
                                <FaCog className={ `text-[10px] ${ adminMode ? 'animate-spin' : '' }` } style={ adminMode ? { animationDuration: '3s' } : {} } />
                            </NitroCardTabsItemView> }
                    </NitroCardTabsView>
                    <NitroCardContentView>
                        <div className="flex h-full overflow-hidden">
                            { !navigationHidden && activeNodes && activeNodes.length > 0 &&
                                <>
                                    <div className="border-r-2 border-card-grid-item-border bg-card-grid-item overflow-y-auto py-1 shrink-0" style={ { width: navWidth } }>
                                        <CatalogNavigationView node={ activeNodes[0] } />
                                    </div>
                                    <div className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors" onMouseDown={ handleResizeStart } />
                                </> }
                            <div className="flex-1 overflow-auto">
                                { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
                            </div>
                        </div>
                    </NitroCardContentView>
                </NitroCardView> }
            { /* External windows */ }
            <CatalogAdminEditorView />
            <CatalogAdminOfferEditView />
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
};

export const CatalogClassicView: FC<{}> = () =>
{
    return (
        <CatalogAdminProvider>
            <CatalogClassicViewInner />
        </CatalogAdminProvider>
    );
};
