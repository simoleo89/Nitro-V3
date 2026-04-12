import { AddLinkEventTracker, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaCog, FaHeart, FaStar } from 'react-icons/fa';
import { LocalizeText } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useCatalog, useCatalogFavorites } from '../../hooks';
import { CatalogAdminProvider, useCatalogAdmin } from './CatalogAdminContext';
import { CatalogAdminEditorView } from './views/admin/CatalogAdminEditorView';
import { CatalogAdminOfferEditView } from './views/admin/CatalogAdminOfferEditView';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogFavoritesView } from './views/favorites/CatalogFavoritesView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { CatalogSearchView } from './views/page/common/CatalogSearchView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const CatalogModernViewInner: FC<{}> = () =>
{
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const setAdminMode = catalogAdmin?.setAdminMode ?? (() => {});
    const { favoriteOfferIds, favoritePageIds } = useCatalogFavorites();
    const [ showFavorites, setShowFavorites ] = useState(false);

    const isMod = GetSessionDataManager().isModerator;
    const totalFavs = favoriteOfferIds.length + favoritePageIds.length;

    // Resizable nav column
    const [ navWidth, setNavWidth ] = useState(() =>
    {
        try { const s = localStorage.getItem('catalog.nav.width'); return s ? Math.min(350, Math.max(140, parseInt(s))) : 250; }
        catch { return 250; }
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
            setNavWidth(Math.min(350, Math.max(140, startWidth + (ev.clientX - startX))));
        };

        const onMouseUp = () =>
        {
            isResizing.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setNavWidth(w => { try { localStorage.setItem('catalog.nav.width', String(w)); } catch {} return w; });
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
                <NitroCardView className="nitro-catalog w-[780px] h-[520px]" uniqueKey="catalog">
                    <NitroCardHeaderView headerText={ LocalizeText('catalog.title') } onCloseClick={ () => setIsVisible(false) } />
                    <NitroCardContentView classNames={ [ 'p-0!', 'overflow-hidden!' ] }>
                        <div className="flex h-full">
                            { /* === LEFT SIDEBAR === */ }
                            <div className="group/rail flex flex-col w-[52px] hover:w-[175px] min-w-[52px] bg-card-grid-item border-r-2 border-card-grid-item-border py-1.5 gap-px overflow-y-auto overflow-x-hidden transition-[width] duration-200 ease-in-out">
                                { /* Favorites */ }
                                <div
                                    className={ `flex items-center gap-2 mx-1 px-1.5 py-1.5 rounded cursor-pointer transition-all duration-150 ${ showFavorites ? 'bg-primary text-white' : 'hover:bg-card-grid-item-active' }` }
                                    onClick={ () => setShowFavorites(!showFavorites) }
                                >
                                    <div className="w-7 h-6 flex items-center justify-center shrink-0 relative">
                                        <FaHeart className={ `text-xs ${ showFavorites ? 'text-white' : totalFavs > 0 ? 'text-danger' : 'text-muted' }` } />
                                        { totalFavs > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">{ totalFavs }</span> }
                                    </div>
                                    <span className={ `text-[11px] font-bold whitespace-nowrap opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 ${ showFavorites ? 'text-white' : '' }` }>{ LocalizeText('catalog.favorites') }</span>
                                </div>

                                <div className="border-b border-card-grid-item-border mx-2 my-0.5" />

                                { /* Categories */ }
                                { rootNode && rootNode.children.length > 0 && rootNode.children.map((child, index) =>
                                {
                                    if(!child.isVisible) return null;

                                    return (
                                        <div
                                            key={ `${ child.pageId }-${ index }` }
                                            className={ `group/cat flex items-center gap-2 mx-1 px-1.5 py-1 rounded cursor-pointer transition-all duration-150 ${ child.isActive ? 'bg-card-grid-item-active border border-card-grid-item-border-active shadow-inner1px' : 'border border-transparent hover:bg-card-grid-item-active' }` }
                                            title={ child.localization }
                                            onClick={ () =>
                                            {
                                                if(searchResult) setSearchResult(null);
                                                if(showFavorites) setShowFavorites(false);
                                                activateNode(child);
                                            } }
                                        >
                                            <div className="w-7 h-6 flex items-center justify-center shrink-0">
                                                <CatalogIconView icon={ child.iconId } />
                                            </div>
                                            <span className={ `text-[11px] whitespace-nowrap overflow-hidden truncate opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 flex-1 ${ child.isActive ? 'font-bold text-dark' : 'text-gray-700' }` }>
                                                { child.localization }
                                            </span>
                                        </div>
                                    );
                                }) }
                            </div>

                            { /* === MAIN AREA === */ }
                            <div className="flex flex-col flex-1 overflow-hidden bg-light">
                                { /* Toolbar */ }
                                <div className="flex items-center gap-2 px-2 py-1.5 bg-card-tab-item border-b border-card-grid-item-border shrink-0">
                                    <div className="flex items-center gap-1 text-[11px] text-gray-600 min-w-0 flex-1">
                                        <FaStar className="text-[9px] text-primary shrink-0" />
                                        { activeNodes && activeNodes.length > 0
                                            ? activeNodes.map((node, i) => (
                                                <span key={ `${ node.pageId }-${ i }` } className="flex items-center gap-1 min-w-0">
                                                    { i > 0 && <span className="text-[8px] opacity-30">{ '\u203A' }</span> }
                                                    <span className={ `truncate ${ i === activeNodes.length - 1 ? 'font-bold text-dark' : 'cursor-pointer hover:text-primary' }` }
                                                        onClick={ i < activeNodes.length - 1 ? () => activateNode(node) : undefined }>
                                                        { node.localization }
                                                    </span>
                                                </span>
                                            ))
                                            : <span className="text-muted">{ LocalizeText('catalog.title') }</span> }
                                    </div>
                                    <div className="w-[180px] shrink-0"><CatalogSearchView /></div>
                                    { isMod &&
                                        <button
                                            className={ `flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all border ${ adminMode ? 'bg-warning text-dark border-warning shadow-inner1px' : 'bg-card-grid-item text-gray-600 border-card-grid-item-border hover:bg-primary hover:text-white hover:border-primary' }` }
                                            onClick={ () => setAdminMode(!adminMode) }
                                        >
                                            <FaCog className={ `${ adminMode ? 'animate-spin' : '' }` } style={ adminMode ? { animationDuration: '3s' } : {} } />
                                            { LocalizeText('catalog.admin') }
                                        </button> }
                                </div>

                                { /* Content */ }
                                <div className="flex flex-1 overflow-hidden">
                                    { showFavorites
                                        ? <div className="flex-1 overflow-auto bg-card-content-area"><CatalogFavoritesView onClose={ () => setShowFavorites(false) } /></div>
                                        : <>
                                            { !navigationHidden && activeNodes && activeNodes.length > 0 &&
                                                <>
                                                    <div className="border-r-2 border-card-grid-item-border bg-card-grid-item overflow-y-auto py-1 shrink-0" style={ { width: navWidth } }>
                                                        <CatalogNavigationView node={ activeNodes[0] } />
                                                    </div>
                                                    <div className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors" onMouseDown={ handleResizeStart } />
                                                </> }
                                            <div className="flex-1 overflow-auto p-2 bg-card-content-area">
                                                { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
                                            </div>
                                        </> }
                                </div>
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

export const CatalogModernView: FC<{}> = () =>
{
    return (
        <CatalogAdminProvider>
            <CatalogModernViewInner />
        </CatalogAdminProvider>
    );
};
