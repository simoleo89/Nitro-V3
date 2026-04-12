import { CatalogAdminCreateOfferComposer, CatalogAdminCreatePageComposer, CatalogAdminDeleteOfferComposer, CatalogAdminDeletePageComposer, CatalogAdminMoveOfferComposer, CatalogAdminMovePageComposer, CatalogAdminPublishComposer, CatalogAdminResultEvent, CatalogAdminSaveOfferComposer, CatalogAdminSavePageComposer, CatalogAdminSavePageImagesComposer } from '@nitrots/nitro-renderer';
import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ICatalogNode, IPurchasableOffer, NotificationAlertType, SendMessageComposer } from '../../api';
import { useMessageEvent, useNotification } from '../../hooks';

export type AdminManageTab = 'pages' | 'offers' | 'publish';

export interface IPageEditData
{
    pageId?: number;
    caption: string;
    parentId: number;
    pageLayout: string;
    enabled: string;
    visible: string;
    minRank: number;
    clubOnly?: string;
    orderNum: number;
    iconId?: number;
    pageHeadline?: string;
    pageTeaser?: string;
    pageSpecial?: string;
    pageText1?: string;
    pageText2?: string;
    pageTextDetails?: string;
    pageTextTeaser?: string;
}

export interface IOfferEditData
{
    offerId?: number;
    pageId: number;
    itemIds: string;
    catalogName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number;
    amount: number;
    clubOnly: string;
    extradata: string;
    haveOffer: string;
    offerId_group: number;
    limitedStack: number;
    orderNumber: number;
}

interface ICatalogAdminContext
{
    adminMode: boolean;
    setAdminMode: (value: boolean) => void;
    activeManageTab: AdminManageTab;
    setActiveManageTab: (tab: AdminManageTab) => void;
    editingOffer: IPurchasableOffer | null;
    setEditingOffer: (offer: IPurchasableOffer | null) => void;
    editingPageData: boolean;
    setEditingPageData: (value: boolean) => void;
    editingRootPage: boolean;
    setEditingRootPage: (value: boolean) => void;
    editingPageNode: ICatalogNode | null;
    setEditingPageNode: (node: ICatalogNode | null) => void;
    selectedOfferIds: Set<number>;
    toggleOfferSelection: (id: number, multi?: boolean) => void;
    selectAllOffers: (ids: number[]) => void;
    clearOfferSelection: () => void;
    offerSearchQuery: string;
    setOfferSearchQuery: (query: string) => void;
    loading: boolean;
    lastError: string | null;
    savePage: (data: IPageEditData) => void;
    createPage: (data: IPageEditData) => void;
    deletePage: (pageId: number) => void;
    savePageImages: (pageId: number, headerImage: string, teaserImage: string) => void;
    saveOffer: (data: IOfferEditData) => void;
    createOffer: (data: IOfferEditData) => void;
    deleteOffer: (offerId: number) => void;
    duplicateOffer: (offer: IPurchasableOffer, pageId: number) => void;
    batchUpdateOfferPrices: (offerIds: number[], credits: number, points: number, pointsType: number, pageId: number) => void;
    reorderOffers: (orders: { id: number; orderNumber: number }[]) => void;
    reorderPage: (pageId: number, newParentId: number, newIndex: number) => void;
    togglePageEnabled: (pageId: number) => void;
    togglePageVisible: (pageId: number) => void;
    publishCatalog: () => void;
    hasPendingChanges: boolean;
}

const CatalogAdminContext = createContext<ICatalogAdminContext>(null);

export const useCatalogAdmin = () => useContext(CatalogAdminContext);

export const CatalogAdminProvider: FC<{ children: ReactNode }> = ({ children }) =>
{
    const [ adminMode, setAdminMode ] = useState(false);
    const [ activeManageTab, setActiveManageTab ] = useState<AdminManageTab>('pages');
    const [ editingOffer, setEditingOffer ] = useState<IPurchasableOffer | null>(null);
    const [ editingPageData, setEditingPageData ] = useState(false);
    const [ editingRootPage, setEditingRootPage ] = useState(false);
    const [ editingPageNode, setEditingPageNode ] = useState<ICatalogNode | null>(null);
    const [ selectedOfferIds, setSelectedOfferIds ] = useState<Set<number>>(new Set());
    const [ offerSearchQuery, setOfferSearchQuery ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ lastError, setLastError ] = useState<string | null>(null);
    const [ hasPendingChanges, setHasPendingChanges ] = useState(false);
    const pendingActionRef = useRef<string | null>(null);
    const { simpleAlert = null } = useNotification();

    const toggleOfferSelection = useCallback((id: number, multi = false) =>
    {
        setSelectedOfferIds(prev =>
        {
            const next = new Set(multi ? prev : []);
            if(next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const selectAllOffers = useCallback((ids: number[]) =>
    {
        setSelectedOfferIds(new Set(ids));
    }, []);

    const clearOfferSelection = useCallback(() =>
    {
        setSelectedOfferIds(new Set());
    }, []);

    useMessageEvent(CatalogAdminResultEvent, (event: CatalogAdminResultEvent) =>
    {
        const parser = event.getParser();
        const action = pendingActionRef.current;

        pendingActionRef.current = null;
        setLoading(false);

        if(!parser.success)
        {
            setLastError(parser.message || 'Operation failed');

            if(simpleAlert)
            {
                simpleAlert(parser.message || 'Operation failed', NotificationAlertType.ALERT, null, null, 'Admin Error');
            }
        }
        else
        {
            setLastError(null);
            setEditingOffer(null);
            setEditingPageData(false);
            setEditingRootPage(false);
            setEditingPageNode(null);

            if(action === 'publish')
            {
                setHasPendingChanges(false);
            }
            else
            {
                setHasPendingChanges(true);
            }

            if(simpleAlert && action)
            {
                const messages: Record<string, string> = {
                    'savePage': 'Page saved (publish to apply)',
                    'createPage': 'Page created (publish to apply)',
                    'deletePage': 'Page deleted (publish to apply)',
                    'saveImages': 'Images saved (publish to apply)',
                    'saveOffer': 'Offer saved (publish to apply)',
                    'createOffer': 'Offer created (publish to apply)',
                    'deleteOffer': 'Offer deleted (publish to apply)',
                    'reorder': 'Order updated (publish to apply)',
                    'toggleEnabled': 'Page toggled (publish to apply)',
                    'toggleVisible': 'Visibility toggled (publish to apply)',
                    'movePage': 'Page moved (publish to apply)',
                    'publish': 'Catalog published! All users updated.',
                    'batchPrice': 'Prices updated (publish to apply)',
                };

                simpleAlert(messages[action] || 'Operation completed', NotificationAlertType.DEFAULT, null, null, 'Catalog Admin');
            }
        }
    });

    const savePage = useCallback((data: IPageEditData) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'savePage';
        SendMessageComposer(new CatalogAdminSavePageComposer(
            data.pageId || 0, data.caption, data.caption, data.pageLayout, data.iconId ?? 0,
            data.minRank, data.visible === '1', data.enabled === '1',
            data.orderNum, data.parentId,
            data.pageHeadline || '', data.pageTeaser || '', data.pageTextDetails || ''
        ));
    }, []);

    const createPage = useCallback((data: IPageEditData) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'createPage';
        SendMessageComposer(new CatalogAdminCreatePageComposer(
            data.caption, data.caption, data.pageLayout, data.iconId ?? 0,
            data.minRank, data.visible === '1', data.enabled === '1',
            data.orderNum, data.parentId
        ));
    }, []);

    const deletePage = useCallback((pageId: number) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'deletePage';
        SendMessageComposer(new CatalogAdminDeletePageComposer(pageId));
    }, []);

    const savePageImages = useCallback((pageId: number, headerImage: string, teaserImage: string) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'saveImages';
        SendMessageComposer(new CatalogAdminSavePageImagesComposer(pageId, headerImage, teaserImage));
    }, []);

    const saveOffer = useCallback((data: IOfferEditData) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'saveOffer';
        SendMessageComposer(new CatalogAdminSaveOfferComposer(
            data.offerId || 0, data.pageId, parseInt(data.itemIds) || 0,
            data.catalogName, data.costCredits, data.costPoints, data.pointsType,
            data.amount, data.clubOnly === '1' ? 1 : 0, data.extradata,
            data.haveOffer === '1', data.offerId_group, data.limitedStack, data.orderNumber
        ));
    }, []);

    const createOffer = useCallback((data: IOfferEditData) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'createOffer';
        SendMessageComposer(new CatalogAdminCreateOfferComposer(
            data.pageId, parseInt(data.itemIds) || 0,
            data.catalogName, data.costCredits, data.costPoints, data.pointsType,
            data.amount, data.clubOnly === '1' ? 1 : 0, data.extradata,
            data.haveOffer === '1', data.offerId_group, data.limitedStack, data.orderNumber
        ));
    }, []);

    const deleteOffer = useCallback((offerId: number) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'deleteOffer';
        SendMessageComposer(new CatalogAdminDeleteOfferComposer(offerId));
    }, []);

    const duplicateOffer = useCallback((offer: IPurchasableOffer, pageId: number) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'createOffer';
        SendMessageComposer(new CatalogAdminCreateOfferComposer(
            pageId, offer.product?.productClassId || 0,
            offer.localizationId || '', offer.priceInCredits, offer.priceInActivityPoints, offer.activityPointType,
            offer.product?.productCount || 1, offer.clubLevel > 0 ? 1 : 0, offer.product?.extraParam || '',
            true, -1, 0, 0
        ));
    }, []);

    const batchUpdateOfferPrices = useCallback((offerIds: number[], credits: number, points: number, pointsType: number, pageId: number) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'batchPrice';

        for(const offerId of offerIds)
        {
            SendMessageComposer(new CatalogAdminSaveOfferComposer(
                offerId, pageId, 0, '', credits, points, pointsType,
                1, 0, '', true, -1, 0, 0
            ));
        }
    }, []);

    const reorderOffers = useCallback((orders: { id: number; orderNumber: number }[]) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'reorder';

        for(const order of orders)
        {
            SendMessageComposer(new CatalogAdminMoveOfferComposer(order.id, order.orderNumber));
        }
    }, []);

    const reorderPage = useCallback((pageId: number, newParentId: number, newIndex: number) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'movePage';
        SendMessageComposer(new CatalogAdminMovePageComposer(pageId, newParentId, newIndex));
    }, []);

    const togglePageEnabled = useCallback((pageId: number) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'toggleEnabled';
        SendMessageComposer(new CatalogAdminMovePageComposer(pageId, -1, -1));
    }, []);

    const togglePageVisible = useCallback((pageId: number) =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'toggleVisible';
        SendMessageComposer(new CatalogAdminMovePageComposer(pageId, -2, -1));
    }, []);

    const publishCatalog = useCallback(() =>
    {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = 'publish';
        SendMessageComposer(new CatalogAdminPublishComposer());
    }, []);

    // Keyboard shortcuts
    useEffect(() =>
    {
        if(!adminMode) return;

        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if(e.key === 'Escape')
            {
                if(editingOffer) { setEditingOffer(null); e.preventDefault(); return; }
                if(editingPageData || editingRootPage || editingPageNode)
                {
                    setEditingPageData(false);
                    setEditingRootPage(false);
                    setEditingPageNode(null);
                    e.preventDefault();
                    return;
                }
                if(selectedOfferIds.size > 0) { clearOfferSelection(); e.preventDefault(); return; }
            }

            if(e.ctrlKey && e.shiftKey && e.key === 'P')
            {
                e.preventDefault();
                if(hasPendingChanges && !loading) publishCatalog();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ adminMode, editingOffer, editingPageData, editingRootPage, editingPageNode, selectedOfferIds, clearOfferSelection, hasPendingChanges, loading, publishCatalog ]);

    return (
        <CatalogAdminContext.Provider value={ {
            adminMode, setAdminMode,
            activeManageTab, setActiveManageTab,
            editingOffer, setEditingOffer,
            editingPageData, setEditingPageData,
            editingRootPage, setEditingRootPage,
            editingPageNode, setEditingPageNode,
            selectedOfferIds, toggleOfferSelection, selectAllOffers, clearOfferSelection,
            offerSearchQuery, setOfferSearchQuery,
            loading, lastError, hasPendingChanges,
            savePage, createPage, deletePage, savePageImages,
            saveOffer, createOffer, deleteOffer, duplicateOffer, batchUpdateOfferPrices,
            reorderOffers, reorderPage, togglePageEnabled, togglePageVisible,
            publishCatalog
        } }>
            { children }
        </CatalogAdminContext.Provider>
    );
};
