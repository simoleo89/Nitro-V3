import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';

export interface CatalogAdminIconBrowserProps
{
    currentIconId: number;
    onSelect: (iconId: number) => void;
    onClose: () => void;
}

interface IconResult
{
    icons: number[];
    total: number;
    offset: number;
    limit: number;
}

export const CatalogAdminIconBrowser: FC<CatalogAdminIconBrowserProps> = props =>
{
    const { currentIconId, onSelect, onClose } = props;

    const [ icons, setIcons ] = useState<number[]>([]);
    const [ total, setTotal ] = useState(0);
    const [ offset, setOffset ] = useState(0);
    const [ search, setSearch ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ selected, setSelected ] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const limit = 120;

    const fetchIcons = useCallback(async (searchQuery: string, newOffset: number, append: boolean) =>
    {
        setLoading(true);

        try
        {
            const params = new URLSearchParams({ limit: String(limit), offset: String(newOffset) });

            if(searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/catalog/icons?${ params.toString() }`);
            const data: IconResult = await res.json();

            setIcons(prev => append ? [ ...prev, ...data.icons ] : data.icons);
            setTotal(data.total);
            setOffset(newOffset);
        }
        catch(e)
        {
            console.error('Failed to fetch catalog icons', e);
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    useEffect(() =>
    {
        fetchIcons('', 0, false);
    }, [ fetchIcons ]);

    const handleSearchChange = useCallback((value: string) =>
    {
        setSearch(value);

        if(debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() =>
        {
            setSelected(null);
            fetchIcons(value, 0, false);
        }, 300);
    }, [ fetchIcons ]);

    const handleLoadMore = useCallback(() =>
    {
        fetchIcons(search, offset + limit, true);
    }, [ offset, search, fetchIcons ]);

    const handleConfirm = useCallback(() =>
    {
        if(selected !== null) onSelect(selected);
    }, [ selected, onSelect ]);

    const hasMore = icons.length < total;

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={ { zIndex: 1000 } } onClick={ onClose }>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

            <div className="relative bg-light rounded-lg w-[560px] h-[460px] border-2 border-card-border overflow-hidden shadow-lg flex flex-col" onClick={ e => e.stopPropagation() }>
                { /* Header */ }
                <div className="flex items-center justify-between px-3 py-2 bg-card-header shrink-0">
                    <span className="text-sm font-bold text-white">
                        Choose Icon
                    </span>
                    <div className="cursor-pointer" onClick={ onClose }>
                        <FaTimes className="text-white/70 hover:text-white text-xs" />
                    </div>
                </div>

                { /* Search */ }
                <div className="flex items-center gap-2 px-3 py-2 border-b border-card-grid-item-border bg-card-grid-item shrink-0">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-600" />
                        <input
                            autoFocus
                            className="w-full text-[13px] border border-card-grid-item-border rounded pl-7 pr-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Search by ID..."
                            type="text"
                            value={ search }
                            onChange={ e => handleSearchChange(e.target.value) }
                        />
                    </div>
                    <span className="text-[12px] text-gray-600 shrink-0">{ total } icons</span>
                </div>

                { /* Grid */ }
                <div className="flex-1 overflow-y-auto p-2">
                    { icons.length === 0 && !loading
                        ? <div className="flex items-center justify-center h-full text-[13px] text-gray-600">
                            { search ? 'No icons found' : 'No icons available' }
                        </div>
                        : <div className="grid grid-cols-10 gap-1">
                            { icons.map(id =>
                            {
                                const isSelected = selected === id;
                                const isCurrent = currentIconId === id;

                                return (
                                    <div
                                        key={ id }
                                        className={ `relative flex flex-col items-center justify-center p-1 rounded border-2 cursor-pointer transition-all h-[44px]
                                            ${ isSelected ? 'border-primary bg-primary/10 shadow-md' : isCurrent ? 'border-success/60 bg-success/5' : 'border-card-grid-item-border bg-white hover:border-primary/40 hover:shadow-sm' }` }
                                        title={ `Icon ${ id }` }
                                        onClick={ () => setSelected(id) }
                                        onDoubleClick={ () => onSelect(id) }
                                    >
                                        <CatalogIconView icon={ id } className="w-6 h-6" />
                                        <span className="text-[9px] text-gray-600 font-mono">{ id }</span>
                                        { isCurrent && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full border border-white" /> }
                                    </div>
                                );
                            }) }
                        </div> }

                    { loading &&
                        <div className="flex items-center justify-center py-4">
                            <FaSpinner className="text-primary animate-spin" />
                        </div> }

                    { hasMore && !loading &&
                        <div className="flex justify-center mt-2">
                            <button
                                className="text-[12px] text-primary hover:text-secondary font-bold cursor-pointer transition-colors"
                                onClick={ handleLoadMore }
                            >
                                Load more ({ icons.length }/{ total })
                            </button>
                        </div> }
                </div>

                { /* Footer */ }
                <div className="flex items-center justify-between px-3 py-2 border-t border-card-grid-item-border bg-card-grid-item shrink-0">
                    <div className="text-[12px] text-gray-600 truncate flex-1 mr-2">
                        { selected !== null ? `Icon #${ selected }` : 'Click an icon to select' }
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            className="px-3 py-1 rounded text-[12px] font-bold bg-card-grid-item-border text-gray-700 hover:bg-gray-400 transition-colors cursor-pointer"
                            onClick={ onClose }
                        >
                            { LocalizeText('generic.cancel') }
                        </button>
                        <button
                            className="px-3 py-1 rounded text-[12px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                            disabled={ selected === null }
                            onClick={ handleConfirm }
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
