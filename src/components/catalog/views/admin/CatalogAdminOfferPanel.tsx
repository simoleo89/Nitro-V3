import { FC, useCallback, useMemo, useState } from 'react';
import { FaCheckSquare, FaDollarSign, FaExchangeAlt, FaPlus, FaSearch, FaStar, FaTrash } from 'react-icons/fa';
import { IPurchasableOffer, LocalizeText } from '../../../../api';
import { useCatalog } from '../../../../hooks';
import { useCatalogAdmin } from '../../CatalogAdminContext';
import { CatalogAdminOfferForm } from './CatalogAdminOfferForm';

export const CatalogAdminOfferPanel: FC<{}> = () =>
{
    const { currentPage = null, activeNodes = [], rootNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const selectedOfferIds = catalogAdmin?.selectedOfferIds ?? new Set<number>();
    const toggleOfferSelection = catalogAdmin?.toggleOfferSelection;
    const clearOfferSelection = catalogAdmin?.clearOfferSelection;
    const offerSearchQuery = catalogAdmin?.offerSearchQuery ?? '';
    const setOfferSearchQuery = catalogAdmin?.setOfferSearchQuery;

    const [ editingOffer, setEditingOffer ] = useState<IPurchasableOffer | null>(null);
    const [ isNewOffer, setIsNewOffer ] = useState(false);

    // Batch pricing state
    const [ showBatchPrice, setShowBatchPrice ] = useState(false);
    const [ batchCredits, setBatchCredits ] = useState(0);
    const [ batchPoints, setBatchPoints ] = useState(0);
    const [ batchPointsType, setBatchPointsType ] = useState(0);

    const offers = currentPage?.offers ?? [];
    const pageId = currentPage?.pageId ?? 0;

    const filteredOffers = useMemo(() =>
    {
        if(!offerSearchQuery) return offers;
        const q = offerSearchQuery.toLowerCase();
        return offers.filter(o =>
            o.localizationName?.toLowerCase().includes(q) ||
            o.localizationId?.toLowerCase().includes(q) ||
            String(o.offerId).includes(q)
        );
    }, [ offers, offerSearchQuery ]);

    const handleSelectOffer = useCallback((offer: IPurchasableOffer, e: React.MouseEvent) =>
    {
        if(e.ctrlKey || e.metaKey)
        {
            toggleOfferSelection?.(offer.offerId, true);
        }
        else
        {
            setEditingOffer(offer);
            setIsNewOffer(false);
            clearOfferSelection?.();
        }
    }, [ toggleOfferSelection, clearOfferSelection ]);

    const handleNewOffer = useCallback(() =>
    {
        setEditingOffer({ offerId: -1 } as IPurchasableOffer);
        setIsNewOffer(true);
    }, []);

    const handleBulkDelete = useCallback(() =>
    {
        if(selectedOfferIds.size === 0) return;
        if(!confirm(`Delete ${ selectedOfferIds.size } selected offer(s)?`)) return;
        for(const id of selectedOfferIds) catalogAdmin?.deleteOffer(id);
        clearOfferSelection?.();
    }, [ catalogAdmin, selectedOfferIds, clearOfferSelection ]);

    const handleBatchPriceApply = useCallback(() =>
    {
        if(selectedOfferIds.size === 0) return;
        catalogAdmin?.batchUpdateOfferPrices(
            Array.from(selectedOfferIds), batchCredits, batchPoints, batchPointsType, pageId
        );
        setShowBatchPrice(false);
        clearOfferSelection?.();
    }, [ catalogAdmin, selectedOfferIds, batchCredits, batchPoints, batchPointsType, pageId, clearOfferSelection ]);

    const handleSelectAll = useCallback(() =>
    {
        catalogAdmin?.selectAllOffers(offers.map(o => o.offerId));
    }, [ catalogAdmin, offers ]);

    const breadcrumb = activeNodes?.map(n => n.localization).join(' > ') || 'No page selected';
    const inputClass = 'text-[11px] border-2 border-card-grid-item-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors w-full';

    return (
        <div className="flex h-full overflow-hidden">
            { /* Left: Offer grid */ }
            <div className="flex-1 min-w-0 border-r-2 border-card-grid-item-border flex flex-col overflow-hidden">
                { /* Top bar */ }
                <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-card-grid-item-border bg-card-grid-item shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-black/60 min-w-0 flex-1">
                        <FaStar className="text-[8px] text-primary shrink-0" />
                        <span className="truncate">{ breadcrumb }</span>
                        <span className="text-[9px] text-muted shrink-0">({ filteredOffers.length })</span>
                    </div>

                    <div className="relative w-[120px] shrink-0">
                        <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-muted" />
                        <input
                            className="w-full text-[10px] border border-card-grid-item-border rounded pl-6 pr-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Search..."
                            type="text"
                            value={ offerSearchQuery }
                            onChange={ e => setOfferSearchQuery(e.target.value) }
                        />
                    </div>

                    <button className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold bg-success/10 text-success border border-success/30 hover:bg-success/20 cursor-pointer transition-colors shrink-0" onClick={ handleNewOffer }>
                        <FaPlus className="text-[7px]" />
                    </button>
                </div>

                { /* Selection bar */ }
                { selectedOfferIds.size > 0 &&
                    <div className="flex items-center gap-2 px-2 py-1 bg-primary/20 border-b-2 border-primary/30 shrink-0">
                        <span className="text-[10px] font-bold text-primary">{ selectedOfferIds.size } selected</span>
                        <button className="text-[9px] text-muted hover:text-dark cursor-pointer" onClick={ handleSelectAll }>
                            <FaCheckSquare className="inline text-[8px] mr-0.5" /> All
                        </button>
                        <button className="text-[9px] text-danger hover:text-red-700 cursor-pointer" onClick={ handleBulkDelete }>
                            <FaTrash className="inline text-[8px] mr-0.5" /> Delete
                        </button>
                        <button className="text-[9px] text-info hover:text-blue-700 cursor-pointer" onClick={ () => setShowBatchPrice(!showBatchPrice) }>
                            <FaDollarSign className="inline text-[8px] mr-0.5" /> Price
                        </button>
                        <button className="text-[9px] text-muted hover:text-dark cursor-pointer ml-auto" onClick={ () => clearOfferSelection?.() }>
                            Clear
                        </button>
                    </div> }

                { /* Batch price editor */ }
                { showBatchPrice && selectedOfferIds.size > 0 &&
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-info/5 border-b border-info/20 shrink-0">
                        <span className="text-[9px] font-bold text-info">Set price for { selectedOfferIds.size } offers:</span>
                        <input className="text-[10px] border border-card-grid-item-border rounded px-2 py-0.5 w-16 bg-white" min={ 0 } placeholder="Credits" type="number" value={ batchCredits } onChange={ e => setBatchCredits(parseInt(e.target.value) || 0) } />
                        <input className="text-[10px] border border-card-grid-item-border rounded px-2 py-0.5 w-16 bg-white" min={ 0 } placeholder="Points" type="number" value={ batchPoints } onChange={ e => setBatchPoints(parseInt(e.target.value) || 0) } />
                        <select className="text-[10px] border border-card-grid-item-border rounded px-1 py-0.5 bg-white" value={ batchPointsType } onChange={ e => setBatchPointsType(parseInt(e.target.value)) }>
                            <option value={ 0 }>Duckets</option>
                            <option value={ 5 }>Diamonds</option>
                            <option value={ 101 }>Seasonal</option>
                        </select>
                        <button className="px-2 py-0.5 rounded text-[9px] font-bold bg-info text-white hover:bg-blue-700 cursor-pointer transition-colors" onClick={ handleBatchPriceApply }>
                            Apply
                        </button>
                    </div> }

                { /* Offer grid */ }
                <div className="flex-1 overflow-y-auto p-2">
                    { !currentPage
                        ? <div className="flex items-center justify-center h-full text-[11px] text-black/40">
                            Select a page from Browse tab to see its offers
                        </div>
                        : filteredOffers.length === 0
                            ? <div className="flex items-center justify-center h-full text-[11px] text-black/40">
                                { offerSearchQuery ? 'No matches' : 'No offers on this page' }
                            </div>
                            : <div className="grid grid-cols-6 gap-1">
                                { filteredOffers.map((offer, index) =>
                                {
                                    const isSelected = selectedOfferIds.has(offer.offerId);
                                    const isEditing = editingOffer?.offerId === offer.offerId && !isNewOffer;
                                    const iconUrl = offer.product?.getIconUrl?.(offer);

                                    return (
                                        <div
                                            key={ `${ offer.offerId }-${ index }` }
                                            className={ `group/offer relative flex flex-col items-center justify-center p-1 rounded border-2 cursor-pointer transition-all h-[52px]
                                                ${ isEditing ? 'border-primary bg-primary/10' : isSelected ? 'border-success bg-success/10' : 'border-card-grid-item-border bg-white hover:border-primary/50' }` }
                                            title={ `${ offer.localizationName || offer.localizationId || '' } (#${ offer.offerId })` }
                                            onClick={ e => handleSelectOffer(offer, e) }
                                        >
                                            <div className={ `absolute top-0.5 left-0.5 ${ isSelected ? 'opacity-100' : 'opacity-30 group-hover/offer:opacity-70' } transition-opacity` }>
                                                <input
                                                    checked={ isSelected }
                                                    className="accent-success w-3 h-3 cursor-pointer"
                                                    type="checkbox"
                                                    onChange={ () => toggleOfferSelection?.(offer.offerId, true) }
                                                    onClick={ e => e.stopPropagation() }
                                                />
                                            </div>

                                            { iconUrl
                                                ? <img alt="" className="max-w-[32px] max-h-[32px] object-contain" src={ iconUrl } />
                                                : <div className="w-8 h-8 bg-card-grid-item rounded flex items-center justify-center text-[8px] text-muted">?</div> }

                                            <span className="text-[7px] text-muted truncate w-full text-center">#{ offer.offerId }</span>
                                        </div>
                                    );
                                }) }
                            </div> }
                </div>
            </div>

            { /* Right: Offer edit form */ }
            <div className="w-[280px] min-w-[280px] overflow-y-auto p-2.5 bg-card-content-area">
                { editingOffer
                    ? <CatalogAdminOfferForm isNew={ isNewOffer } offer={ editingOffer } pageId={ pageId } onClose={ () => setEditingOffer(null) } />
                    : <div className="flex items-center justify-center h-full text-[11px] text-black/40 text-center px-4">
                        Click an offer to edit<br />Ctrl+click to multi-select
                    </div> }
            </div>
        </div>
    );
};
