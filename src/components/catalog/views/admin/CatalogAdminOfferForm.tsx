import { FC, useCallback, useEffect, useState } from 'react';
import { FaCopy, FaSave, FaSpinner, FaTrash } from 'react-icons/fa';
import { IPurchasableOffer, LocalizeText } from '../../../../api';
import { IOfferEditData, useCatalogAdmin } from '../../CatalogAdminContext';

export interface CatalogAdminOfferFormProps
{
    offer: IPurchasableOffer | null;
    pageId: number;
    isNew?: boolean;
    onClose?: () => void;
}

export const CatalogAdminOfferForm: FC<CatalogAdminOfferFormProps> = props =>
{
    const { offer, pageId, isNew = false, onClose } = props;
    const catalogAdmin = useCatalogAdmin();
    const loading = catalogAdmin?.loading ?? false;

    const [ itemIds, setItemIds ] = useState('0');
    const [ catalogName, setCatalogName ] = useState('');
    const [ costCredits, setCostCredits ] = useState(0);
    const [ costPoints, setCostPoints ] = useState(0);
    const [ pointsType, setPointsType ] = useState(0);
    const [ amount, setAmount ] = useState(1);
    const [ clubOnly, setClubOnly ] = useState('0');
    const [ extradata, setExtradata ] = useState('');
    const [ haveOffer, setHaveOffer ] = useState('1');
    const [ offerIdGroup, setOfferIdGroup ] = useState(-1);
    const [ limitedStack, setLimitedStack ] = useState(0);
    const [ orderNumber, setOrderNumber ] = useState(0);

    useEffect(() =>
    {
        if(!offer) return;

        if(isNew || offer.offerId === -1)
        {
            setItemIds('0'); setCatalogName(''); setCostCredits(0); setCostPoints(0);
            setPointsType(0); setAmount(1); setClubOnly('0'); setExtradata('');
            setHaveOffer('1'); setOfferIdGroup(-1); setLimitedStack(0); setOrderNumber(0);
        }
        else
        {
            setItemIds(String(offer.product?.productClassId || 0));
            setCatalogName(offer.localizationId || '');
            setCostCredits(offer.priceInCredits);
            setCostPoints(offer.priceInActivityPoints);
            setPointsType(offer.activityPointType);
            setAmount(offer.product?.productCount || 1);
            setClubOnly(offer.clubLevel > 0 ? '1' : '0');
            setExtradata(offer.product?.extraParam || '');
            setHaveOffer('1'); setOfferIdGroup(offer.offerId || -1);
            setLimitedStack(0); setOrderNumber(0);
        }
    }, [ offer, isNew ]);

    const handleSave = useCallback(() =>
    {
        if(!catalogAdmin) return;

        const data: IOfferEditData = {
            offerId: isNew ? undefined : offer?.offerId,
            pageId, itemIds, catalogName, costCredits, costPoints, pointsType,
            amount, clubOnly, extradata, haveOffer, offerId_group: offerIdGroup,
            limitedStack, orderNumber,
        };

        if(isNew) catalogAdmin.createOffer(data);
        else catalogAdmin.saveOffer(data);
    }, [ catalogAdmin, offer, isNew, pageId, itemIds, catalogName, costCredits, costPoints, pointsType, amount, clubOnly, extradata, haveOffer, offerIdGroup, limitedStack, orderNumber ]);

    const handleDelete = useCallback(() =>
    {
        if(isNew || !offer || !catalogAdmin?.deleteOffer) return;
        if(!confirm(LocalizeText('catalog.admin.delete.offer.confirm'))) return;
        catalogAdmin.deleteOffer(offer.offerId);
        onClose?.();
    }, [ isNew, offer, catalogAdmin, onClose ]);

    const handleDuplicate = useCallback(() =>
    {
        if(!offer || !catalogAdmin?.duplicateOffer) return;
        catalogAdmin.duplicateOffer(offer, pageId);
    }, [ offer, catalogAdmin, pageId ]);

    if(!offer) return null;

    const iconUrl = !isNew && offer.product?.getIconUrl?.(offer);
    const inputClass = 'text-[11px] border-2 border-card-grid-item-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors w-full';

    return (
        <div className="flex flex-col gap-2">
            { /* Header with icon preview */ }
            <div className="flex items-center gap-2">
                { iconUrl &&
                    <div className="w-10 h-10 bg-card-grid-item rounded border border-card-grid-item-border flex items-center justify-center shrink-0">
                        <img alt="" className="max-w-[36px] max-h-[36px] object-contain" src={ iconUrl } />
                    </div> }
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-primary truncate">
                        { isNew ? 'New Offer' : `Offer #${ offer.offerId }` }
                    </div>
                    { !isNew && offer.localizationName &&
                        <div className="text-[9px] text-black/50 font-mono truncate">{ offer.localizationName }</div> }
                </div>
            </div>

            { /* Identity */ }
            <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Identity</div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-black/50 uppercase font-bold">Catalog Name</label>
                        <input className={ inputClass } placeholder="rare_dragon_lamp" type="text" value={ catalogName } onChange={ e => setCatalogName(e.target.value) } />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-black/50">Item IDs</label>
                            <input className={ inputClass } type="text" value={ itemIds } onChange={ e => setItemIds(e.target.value) } />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-black/50">Quantity</label>
                            <input className={ inputClass } min={ 1 } type="number" value={ amount } onChange={ e => setAmount(parseInt(e.target.value) || 1) } />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-black/50">Order</label>
                            <input className={ inputClass } min={ 0 } type="number" value={ orderNumber } onChange={ e => setOrderNumber(parseInt(e.target.value) || 0) } />
                        </div>
                    </div>
                </div>
            </div>

            { /* Pricing */ }
            <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Pricing</div>
                <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-black/50">Credits</label>
                        <input className={ inputClass } min={ 0 } type="number" value={ costCredits } onChange={ e => setCostCredits(parseInt(e.target.value) || 0) } />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-black/50">Points</label>
                        <input className={ inputClass } min={ 0 } type="number" value={ costPoints } onChange={ e => setCostPoints(parseInt(e.target.value) || 0) } />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-black/50">Points Type</label>
                        <select className={ inputClass } value={ pointsType } onChange={ e => setPointsType(parseInt(e.target.value)) }>
                            <option value={ 0 }>Duckets</option>
                            <option value={ 5 }>Diamonds</option>
                            <option value={ 101 }>Seasonal</option>
                        </select>
                    </div>
                </div>
            </div>

            { /* Options */ }
            <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Options</div>
                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-black/50">Club Only</label>
                        <select className={ inputClass } value={ clubOnly } onChange={ e => setClubOnly(e.target.value) }>
                            <option value="0">No</option>
                            <option value="1">Yes</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-black/50">Limited</label>
                        <input className={ inputClass } min={ 0 } type="number" value={ limitedStack } onChange={ e => setLimitedStack(parseInt(e.target.value) || 0) } />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-black/50">Offer Group</label>
                        <input className={ inputClass } type="number" value={ offerIdGroup } onChange={ e => setOfferIdGroup(parseInt(e.target.value) || -1) } />
                    </div>
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-black/50">Extra Data</label>
                    <input className={ inputClass } placeholder="optional" type="text" value={ extradata } onChange={ e => setExtradata(e.target.value) } />
                </div>
                <label className="flex items-center gap-1.5 text-[10px] cursor-pointer mt-1.5">
                    <input className="accent-primary" checked={ haveOffer === '1' } type="checkbox" onChange={ e => setHaveOffer(e.target.checked ? '1' : '0') } />
                    Have Offer
                </label>
            </div>

            { /* Actions */ }
            <div className="flex justify-between">
                <div className="flex items-center gap-1">
                    { !isNew &&
                        <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors cursor-pointer" onClick={ handleDelete }>
                            <FaTrash className="text-[8px]" /> Delete
                        </button> }
                    { !isNew &&
                        <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-info/10 text-info border border-info/30 hover:bg-info/20 transition-colors cursor-pointer" title="Duplicate" onClick={ handleDuplicate }>
                            <FaCopy className="text-[8px]" /> Copy
                        </button> }
                </div>
                <button className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50" disabled={ loading } onClick={ handleSave }>
                    { loading ? <FaSpinner className="text-[8px] animate-spin" /> : <FaSave className="text-[8px]" /> }
                    { isNew ? 'Create' : 'Save' }
                </button>
            </div>
        </div>
    );
};
