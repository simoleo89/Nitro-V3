import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText } from '../../../../api';

export interface CatalogAdminImageBrowserProps
{
    type: 'header' | 'teaser';
    currentImage?: string;
    onSelect: (filename: string) => void;
    onClose: () => void;
}

interface ImageResult
{
    images: string[];
    total: number;
    offset: number;
    limit: number;
}

export const CatalogAdminImageBrowser: FC<CatalogAdminImageBrowserProps> = props =>
{
    const { type, currentImage, onSelect, onClose } = props;

    const [ images, setImages ] = useState<string[]>([]);
    const [ total, setTotal ] = useState(0);
    const [ offset, setOffset ] = useState(0);
    const [ search, setSearch ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ selected, setSelected ] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const limit = 80;

    const buildImageUrl = useCallback((name: string) =>
    {
        const assetUrl = GetConfigurationValue<string>('catalog.asset.image.url');

        return assetUrl.replace('%name%', name);
    }, []);

    const fetchImages = useCallback(async (searchQuery: string, newOffset: number, append: boolean) =>
    {
        setLoading(true);

        try
        {
            const params = new URLSearchParams({ type, limit: String(limit), offset: String(newOffset) });

            if(searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/catalog/images?${ params.toString() }`);
            const data: ImageResult = await res.json();

            setImages(prev => append ? [ ...prev, ...data.images ] : data.images);
            setTotal(data.total);
            setOffset(newOffset);
        }
        catch(e)
        {
            console.error('Failed to fetch catalog images', e);
        }
        finally
        {
            setLoading(false);
        }
    }, [ type ]);

    useEffect(() =>
    {
        fetchImages('', 0, false);
    }, [ fetchImages ]);

    const handleSearchChange = useCallback((value: string) =>
    {
        setSearch(value);

        if(debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() =>
        {
            setSelected(null);
            fetchImages(value, 0, false);
        }, 300);
    }, [ fetchImages ]);

    const handleLoadMore = useCallback(() =>
    {
        const newOffset = offset + limit;

        fetchImages(search, newOffset, true);
    }, [ offset, search, fetchImages ]);

    const handleSelect = useCallback((name: string) =>
    {
        setSelected(name);
    }, []);

    const handleConfirm = useCallback(() =>
    {
        if(selected) onSelect(selected);
    }, [ selected, onSelect ]);

    const handleDoubleClick = useCallback((name: string) =>
    {
        onSelect(name);
    }, [ onSelect ]);

    const hasMore = images.length < total;

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={ { zIndex: 1000 } } onClick={ onClose }>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

            <div className="relative bg-light rounded-lg w-[520px] h-[420px] border-2 border-card-border overflow-hidden shadow-lg flex flex-col" onClick={ e => e.stopPropagation() }>
                { /* Header */ }
                <div className="flex items-center justify-between px-3 py-2 bg-card-header shrink-0">
                    <span className="text-sm font-bold text-white">
                        { type === 'header' ? LocalizeText('catalog.admin.browse.header') : LocalizeText('catalog.admin.browse.teaser') }
                    </span>
                    <div className="cursor-pointer" onClick={ onClose }>
                        <FaTimes className="text-white/70 hover:text-white text-xs" />
                    </div>
                </div>

                { /* Search */ }
                <div className="flex items-center gap-2 px-3 py-2 border-b border-card-grid-item-border bg-card-grid-item shrink-0">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-600" />
                        <input
                            autoFocus
                            className="w-full text-[11px] border border-card-grid-item-border rounded pl-7 pr-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder={ LocalizeText('catalog.admin.search.images') }
                            type="text"
                            value={ search }
                            onChange={ e => handleSearchChange(e.target.value) }
                        />
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">{ total } { LocalizeText('catalog.admin.images.found') }</span>
                </div>

                { /* Grid */ }
                <div className="flex-1 overflow-y-auto p-2">
                    { images.length === 0 && !loading
                        ? <div className="flex items-center justify-center h-full text-[11px] text-gray-600">
                            { search ? LocalizeText('catalog.admin.images.noresults') : LocalizeText('catalog.admin.images.empty') }
                        </div>
                        : <div className="grid grid-cols-5 gap-1.5">
                            { images.map(name =>
                            {
                                const url = buildImageUrl(name);
                                const isSelected = selected === name;
                                const isCurrent = currentImage && currentImage.includes(name);

                                return (
                                    <div
                                        key={ name }
                                        className={ `relative flex flex-col items-center justify-center p-1.5 rounded border-2 cursor-pointer transition-all min-h-[70px]
                                            ${ isSelected ? 'border-primary bg-primary/10 shadow-md' : isCurrent ? 'border-success/60 bg-success/5' : 'border-card-grid-item-border bg-white hover:border-primary/40 hover:shadow-sm' }` }
                                        title={ name }
                                        onClick={ () => handleSelect(name) }
                                        onDoubleClick={ () => handleDoubleClick(name) }
                                    >
                                        <img
                                            alt={ name }
                                            className="max-w-full max-h-[48px] object-contain"
                                            src={ url }
                                            onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } }
                                        />
                                        <span className="text-[7px] text-gray-600 truncate w-full text-center mt-0.5">{ name }</span>
                                        { isCurrent && <span className="absolute top-0.5 right-0.5 text-[7px] bg-success text-white px-1 rounded">current</span> }
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
                                className="text-[10px] text-primary hover:text-secondary font-bold cursor-pointer transition-colors"
                                onClick={ handleLoadMore }
                            >
                                { LocalizeText('catalog.admin.images.loadmore') } ({ images.length }/{ total })
                            </button>
                        </div> }
                </div>

                { /* Footer */ }
                <div className="flex items-center justify-between px-3 py-2 border-t border-card-grid-item-border bg-card-grid-item shrink-0">
                    <div className="text-[10px] text-gray-600 truncate flex-1 mr-2">
                        { selected ? selected : LocalizeText('catalog.admin.images.selecthint') }
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            className="px-3 py-1 rounded text-[10px] font-bold bg-card-grid-item-border text-gray-700 hover:bg-gray-400 transition-colors cursor-pointer"
                            onClick={ onClose }
                        >
                            { LocalizeText('generic.cancel') }
                        </button>
                        <button
                            className="px-3 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                            disabled={ !selected }
                            onClick={ handleConfirm }
                        >
                            { LocalizeText('catalog.admin.images.confirm') }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
