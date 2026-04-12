import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaEdit, FaFileAlt, FaFolderOpen, FaImage, FaInfoCircle, FaPlus, FaSave, FaSearch, FaSpinner, FaTimes, FaTrash } from 'react-icons/fa';
import { GetConfigurationValue, ICatalogNode, LocalizeText } from '../../../../api';
import { useCatalog } from '../../../../hooks';
import { IPageEditData, useCatalogAdmin } from '../../CatalogAdminContext';
import { CatalogAdminImageBrowser } from './CatalogAdminImageBrowser';
import { CatalogAdminPageTreeItem } from './CatalogAdminPageTreeItem';

const LAYOUT_OPTIONS = [
    { value: 'default_3x3', label: 'Default 3x3' },
    { value: 'frontpage4', label: 'Frontpage' },
    { value: 'pets', label: 'Pets' },
    { value: 'pets2', label: 'Pets 2' },
    { value: 'pets3', label: 'Pets 3' },
    { value: 'spaces_new', label: 'Spaces (Floor/Wall)' },
    { value: 'soundmachine', label: 'Sound Machine' },
    { value: 'trophies', label: 'Trophies' },
    { value: 'roomads', label: 'Room Ads' },
    { value: 'guild_frontpage', label: 'Guild Frontpage' },
    { value: 'guild_forum', label: 'Guild Forum' },
    { value: 'guild_custom_furni', label: 'Guild Custom Furni' },
    { value: 'vip_buy', label: 'VIP Buy' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'marketplace_own_items', label: 'Marketplace Own' },
    { value: 'recycler', label: 'Recycler' },
    { value: 'info_loyalty', label: 'Info Loyalty' },
    { value: 'badge_display', label: 'Badge Display' },
    { value: 'bots', label: 'Bots' },
    { value: 'single_bundle', label: 'Single Bundle' },
    { value: 'room_bundle', label: 'Room Bundle' },
    { value: 'default_3x3_color_grouping', label: 'Color Grouping' },
    { value: 'recent_purchases', label: 'Recent Purchases' },
    { value: 'custom_prefix', label: 'Custom Prefix' },
];

type FormSection = 'identity' | 'content' | 'images' | 'info';

export const CatalogAdminPagePanel: FC<{}> = () =>
{
    const { rootNode = null, currentPage = null, activateNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const loading = catalogAdmin?.loading ?? false;

    const [ selectedNode, setSelectedNode ] = useState<ICatalogNode | null>(null);
    const [ searchQuery, setSearchQuery ] = useState('');
    const lastSelectedPageId = useRef<number>(-1);
    const [ activeSection, setActiveSection ] = useState<FormSection>('identity');

    // Form state
    const [ caption, setCaption ] = useState('');
    const [ pageLayout, setPageLayout ] = useState('default_3x3');
    const [ minRank, setMinRank ] = useState(1);
    const [ visible, setVisible ] = useState('1');
    const [ enabled, setEnabled ] = useState('1');
    const [ clubOnly, setClubOnly ] = useState('0');
    const [ orderNum, setOrderNum ] = useState(0);
    const [ pageHeadline, setPageHeadline ] = useState('');
    const [ pageTeaser, setPageTeaser ] = useState('');
    const [ pageTextDetails, setPageTextDetails ] = useState('');

    // Image previews
    const [ headerImage, setHeaderImage ] = useState<string | null>(null);
    const [ teaserImage, setTeaserImage ] = useState<string | null>(null);
    const [ browsingImageType, setBrowsingImageType ] = useState<'header' | 'teaser' | null>(null);

    const handleSelect = useCallback((node: ICatalogNode) =>
    {
        setSelectedNode(node);
        setCaption(node.localization || '');
        setVisible(node.isVisible ? '1' : '0');
        setEnabled('1');
        setMinRank(1);
        setClubOnly('0');
        setOrderNum(0);
        setPageHeadline('');
        setPageTeaser('');
        setPageTextDetails('');
        setPageLayout('default_3x3');
        setHeaderImage(null);
        setTeaserImage(null);

        if(activateNode && node.pageId !== lastSelectedPageId.current)
        {
            lastSelectedPageId.current = node.pageId;
            activateNode(node);
        }
    }, [ activateNode ]);

    // Populate from currentPage when it loads
    useEffect(() =>
    {
        if(!currentPage || !selectedNode) return;
        if(currentPage.pageId !== selectedNode.pageId) return;

        setPageLayout(currentPage.layoutCode || 'default_3x3');

        if(currentPage.localization)
        {
            const h = currentPage.localization.getText(0) || '';
            const t = currentPage.localization.getText(1) || '';
            const d = currentPage.localization.getText(2) || '';

            if(h) setPageHeadline(h.replace(/<br\s*\/?>/g, '\n'));
            if(t) setPageTeaser(t.replace(/<br\s*\/?>/g, '\n'));
            if(d) setPageTextDetails(d.replace(/<br\s*\/?>/g, '\n'));

            setHeaderImage(currentPage.localization.getImage(0) || null);
            setTeaserImage(currentPage.localization.getImage(1) || null);
        }
    }, [ currentPage, selectedNode ]);

    const handleCreateChild = useCallback((parentId: number) =>
    {
        catalogAdmin?.createPage({
            caption: 'New Page', pageLayout: 'default_3x3', minRank: 1,
            visible: '1', enabled: '1', orderNum: 0, parentId,
        });
    }, [ catalogAdmin ]);

    const handleDelete = useCallback((pageId: number, name: string) =>
    {
        if(!confirm(LocalizeText('catalog.admin.delete.page.confirm', [ 'name' ], [ name ]))) return;
        catalogAdmin?.deletePage(pageId);
        if(selectedNode?.pageId === pageId) setSelectedNode(null);
    }, [ catalogAdmin, selectedNode ]);

    const handleToggleVisible = useCallback((pageId: number) =>
    {
        catalogAdmin?.togglePageVisible(pageId);
    }, [ catalogAdmin ]);

    const handleReorder = useCallback((pageId: number, newParentId: number, newIndex: number) =>
    {
        catalogAdmin?.reorderPage(pageId, newParentId, newIndex);
    }, [ catalogAdmin ]);

    const handleSave = useCallback(() =>
    {
        if(!selectedNode || !catalogAdmin?.savePage) return;

        const data: IPageEditData = {
            pageId: selectedNode.pageId, caption, pageLayout, minRank,
            visible, enabled, clubOnly, orderNum,
            parentId: selectedNode.parent?.pageId ?? -1,
            pageHeadline, pageTeaser, pageTextDetails,
        };

        catalogAdmin.savePage(data);
    }, [ selectedNode, catalogAdmin, caption, pageLayout, minRank, visible, enabled, clubOnly, orderNum, pageHeadline, pageTeaser, pageTextDetails ]);

    const handleDeleteSelected = useCallback(() =>
    {
        if(!selectedNode) return;
        if(!confirm(LocalizeText('catalog.admin.delete.page.confirm', [ 'name' ], [ selectedNode.localization ]))) return;
        catalogAdmin?.deletePage(selectedNode.pageId);
        setSelectedNode(null);
    }, [ selectedNode, catalogAdmin ]);

    const buildImageUrl = useCallback((name: string) =>
    {
        if(!name) return null;

        return GetConfigurationValue<string>('catalog.asset.image.url').replace('%name%', name);
    }, []);

    const handleImageSelect = useCallback((filename: string) =>
    {
        const url = buildImageUrl(filename);

        if(browsingImageType === 'header')
        {
            setHeaderImage(url);
        }
        else if(browsingImageType === 'teaser')
        {
            setTeaserImage(url);
        }

        setBrowsingImageType(null);
    }, [ browsingImageType, buildImageUrl ]);

    const handleSaveImages = useCallback(() =>
    {
        if(!selectedNode || !catalogAdmin?.savePageImages) return;

        // Extract filename from URL for the composer
        const extractName = (url: string | null) =>
        {
            if(!url) return '';

            const assetUrl = GetConfigurationValue<string>('catalog.asset.image.url');
            const prefix = assetUrl.split('%name%')[0];
            const suffix = assetUrl.split('%name%')[1];
            let name = url;

            if(prefix && name.startsWith(prefix)) name = name.substring(prefix.length);
            if(suffix && name.endsWith(suffix)) name = name.substring(0, name.length - suffix.length);

            return name;
        };

        catalogAdmin.savePageImages(selectedNode.pageId, extractName(headerImage), extractName(teaserImage));
    }, [ selectedNode, catalogAdmin, headerImage, teaserImage ]);

    const filterNodes = useCallback((node: ICatalogNode): boolean =>
    {
        if(!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if(node.localization?.toLowerCase().includes(q)) return true;
        if(String(node.pageId).includes(q)) return true;
        if(node.children?.some(c => filterNodes(c))) return true;
        return false;
    }, [ searchQuery ]);

    const pageInfo = useMemo(() =>
    {
        if(!selectedNode) return null;
        return {
            offerCount: currentPage?.offers?.length ?? 0,
            childCount: selectedNode.children?.length ?? 0,
            iconId: selectedNode.iconId,
            pageName: selectedNode.pageName,
        };
    }, [ selectedNode, currentPage ]);

    const inputClass = 'text-[11px] border-2 border-card-grid-item-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors w-full';

    const SECTION_TABS: { key: FormSection; label: string; icon: FC<{ className?: string }> }[] = [
        { key: 'identity', label: 'Edit', icon: FaEdit },
        { key: 'content', label: 'Content', icon: FaFileAlt },
        { key: 'images', label: 'Images', icon: FaImage },
        { key: 'info', label: 'Info', icon: FaInfoCircle },
    ];

    return (
        <div className="flex h-full overflow-hidden">
            { /* Left: Page tree */ }
            <div className="w-[240px] min-w-[240px] border-r-2 border-card-grid-item-border bg-card-grid-item flex flex-col overflow-hidden">
                <div className="flex items-center gap-1 px-2 py-1.5 border-b border-card-grid-item-border">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-muted" />
                        <input
                            className="w-full text-[10px] border border-card-grid-item-border rounded pl-6 pr-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Search pages..."
                            type="text"
                            value={ searchQuery }
                            onChange={ e => setSearchQuery(e.target.value) }
                        />
                    </div>
                    <button
                        className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold bg-success/10 text-success border border-success/30 hover:bg-success/20 cursor-pointer transition-colors shrink-0"
                        title="Create root category"
                        onClick={ () => rootNode && handleCreateChild(rootNode.pageId) }
                    >
                        <FaPlus className="text-[7px]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
                    { rootNode && rootNode.children.length > 0 && rootNode.children.map((child, index) =>
                    {
                        if(!filterNodes(child)) return null;
                        return (
                            <CatalogAdminPageTreeItem
                                key={ `${ child.pageId }-${ index }` }
                                node={ child }
                                selectedPageId={ selectedNode?.pageId }
                                onCreateChild={ handleCreateChild }
                                onDelete={ handleDelete }
                                onReorder={ handleReorder }
                                onSelect={ handleSelect }
                                onToggleVisible={ handleToggleVisible }
                            />
                        );
                    }) }
                </div>
            </div>

            { /* Right: Form */ }
            <div className="flex-1 overflow-y-auto bg-card-content-area flex flex-col">
                { !selectedNode
                    ? <div className="flex items-center justify-center h-full text-[11px] text-black/40">
                        Select a page from the tree to edit
                    </div>
                    : <>
                        { /* Page header */ }
                        <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-card-grid-item-border bg-card-grid-item shrink-0">
                            <span className="text-[11px] font-bold text-primary">
                                { selectedNode.localization }
                                <span className="text-muted font-normal ml-1">#{ selectedNode.pageId }</span>
                            </span>
                            <div className="flex items-center gap-0.5 bg-black/5 rounded-lg p-0.5">
                                { SECTION_TABS.map(tab =>
                                {
                                    const Icon = tab.icon;
                                    const isActive = activeSection === tab.key;

                                    return (
                                        <button
                                            key={ tab.key }
                                            className={ `flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${ isActive
                                                ? 'bg-white text-primary shadow-sm'
                                                : 'text-black/40 hover:text-black/70' }` }
                                            onClick={ () => setActiveSection(tab.key) }
                                        >
                                            <Icon className="text-[9px]" />
                                            { tab.label }
                                        </button>
                                    );
                                }) }
                            </div>
                        </div>

                        { /* Form content */ }
                        <div className="flex-1 overflow-y-auto p-3">
                            { activeSection === 'identity' && (
                                <div className="flex flex-col gap-2.5">
                                    { /* Identity */ }
                                    <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Identity</div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            <div className="flex flex-col gap-0.5 col-span-2">
                                                <label className="text-[9px] text-black/50 uppercase font-bold">Caption</label>
                                                <input className={ inputClass } value={ caption } onChange={ e => setCaption(e.target.value) } />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-[9px] text-black/50 uppercase font-bold">Min Rank</label>
                                                <input className={ inputClass } min={ 1 } type="number" value={ minRank } onChange={ e => setMinRank(parseInt(e.target.value) || 1) } />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-[9px] text-black/50 uppercase font-bold">Order</label>
                                                <input className={ inputClass } min={ 0 } type="number" value={ orderNum } onChange={ e => setOrderNum(parseInt(e.target.value) || 0) } />
                                            </div>
                                        </div>
                                    </div>

                                    { /* Layout */ }
                                    <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Layout</div>
                                        <select className={ inputClass } value={ pageLayout } onChange={ e => setPageLayout(e.target.value) }>
                                            { LAYOUT_OPTIONS.map(l => <option key={ l.value } value={ l.value }>{ l.label } ({ l.value })</option>) }
                                        </select>
                                    </div>

                                    { /* Visibility */ }
                                    <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Visibility</div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                                                <input className="accent-primary" checked={ visible === '1' } type="checkbox" onChange={ e => setVisible(e.target.checked ? '1' : '0') } />
                                                Visible
                                            </label>
                                            <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                                                <input className="accent-primary" checked={ enabled === '1' } type="checkbox" onChange={ e => setEnabled(e.target.checked ? '1' : '0') } />
                                                Enabled
                                            </label>
                                            <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                                                <input className="accent-primary" checked={ clubOnly === '1' } type="checkbox" onChange={ e => setClubOnly(e.target.checked ? '1' : '0') } />
                                                Club Only
                                            </label>
                                        </div>
                                    </div>

                                    { /* Actions */ }
                                    <div className="flex justify-between">
                                        <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors cursor-pointer" onClick={ handleDeleteSelected }>
                                            <FaTrash className="text-[8px]" /> Delete
                                        </button>
                                        <button className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50" disabled={ loading } onClick={ handleSave }>
                                            { loading ? <FaSpinner className="text-[8px] animate-spin" /> : <FaSave className="text-[8px]" /> } Save
                                        </button>
                                    </div>
                                </div>
                            ) }

                            { activeSection === 'content' && (
                                <div className="flex flex-col gap-2.5">
                                    <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Page Texts</div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-[9px] text-black/50 uppercase font-bold">Headline (text 0)</label>
                                                <input className={ inputClass } placeholder="Page headline" value={ pageHeadline } onChange={ e => setPageHeadline(e.target.value) } />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-[9px] text-black/50 uppercase font-bold">Teaser (text 1)</label>
                                                <input className={ inputClass } placeholder="Teaser text" value={ pageTeaser } onChange={ e => setPageTeaser(e.target.value) } />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-[9px] text-black/50 uppercase font-bold">Details (text 2)</label>
                                                <textarea className={ `${ inputClass } resize-none h-20` } placeholder="Detailed description" value={ pageTextDetails } onChange={ e => setPageTextDetails(e.target.value) } />
                                            </div>
                                        </div>
                                    </div>

                                    { /* Live preview */ }
                                    <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Preview</div>
                                        <div className="bg-card-content-area rounded p-2 border border-card-grid-item-border">
                                            { headerImage &&
                                                <img alt="" className="w-full h-auto rounded mb-1.5 max-h-[60px] object-contain" src={ headerImage } /> }
                                            <div className="flex gap-2">
                                                { teaserImage &&
                                                    <img alt="" className="w-[50px] h-[50px] object-contain shrink-0 rounded" src={ teaserImage } /> }
                                                <div className="text-[10px] text-dark flex-1">
                                                    { pageHeadline && <div className="font-bold mb-0.5">{ pageHeadline }</div> }
                                                    { pageTeaser && <div className="text-muted text-[9px]">{ pageTeaser }</div> }
                                                    { pageTextDetails && <div className="text-[9px] mt-1 text-gray-600" dangerouslySetInnerHTML={ { __html: pageTextDetails.replace(/\n/g, '<br />') } } /> }
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50" disabled={ loading } onClick={ handleSave }>
                                            { loading ? <FaSpinner className="text-[8px] animate-spin" /> : <FaSave className="text-[8px]" /> } Save
                                        </button>
                                    </div>
                                </div>
                            ) }

                            { activeSection === 'images' && (
                                <div className="flex flex-col gap-2.5">
                                    <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">{ LocalizeText('catalog.admin.section.images') }</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            { /* Header image */ }
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[9px] text-gray-700 uppercase font-bold">{ LocalizeText('catalog.admin.label.headerimage') }</label>
                                                <div className="bg-card-content-area rounded border border-card-grid-item-border p-2 min-h-[70px] flex items-center justify-center">
                                                    { headerImage
                                                        ? <img alt="header" className="max-w-full max-h-[80px] object-contain" src={ headerImage } />
                                                        : <span className="text-[9px] text-gray-600">{ LocalizeText('catalog.admin.noimage') }</span> }
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer"
                                                        onClick={ () => setBrowsingImageType('header') }
                                                    >
                                                        <FaFolderOpen className="text-[8px]" /> { LocalizeText('catalog.admin.browse') }
                                                    </button>
                                                    { headerImage &&
                                                        <button
                                                            className="px-2 py-1 rounded text-[10px] bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors cursor-pointer"
                                                            onClick={ () => setHeaderImage(null) }
                                                        >
                                                            <FaTimes className="text-[8px]" />
                                                        </button> }
                                                </div>
                                            </div>
                                            { /* Teaser image */ }
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[9px] text-gray-700 uppercase font-bold">{ LocalizeText('catalog.admin.label.teaserimage') }</label>
                                                <div className="bg-card-content-area rounded border border-card-grid-item-border p-2 min-h-[70px] flex items-center justify-center">
                                                    { teaserImage
                                                        ? <img alt="teaser" className="max-w-[70px] max-h-[70px] object-contain" src={ teaserImage } />
                                                        : <span className="text-[9px] text-gray-600">{ LocalizeText('catalog.admin.noimage') }</span> }
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer"
                                                        onClick={ () => setBrowsingImageType('teaser') }
                                                    >
                                                        <FaFolderOpen className="text-[8px]" /> { LocalizeText('catalog.admin.browse') }
                                                    </button>
                                                    { teaserImage &&
                                                        <button
                                                            className="px-2 py-1 rounded text-[10px] bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors cursor-pointer"
                                                            onClick={ () => setTeaserImage(null) }
                                                        >
                                                            <FaTimes className="text-[8px]" />
                                                        </button> }
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-2">
                                            <button className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50" disabled={ loading } onClick={ handleSaveImages }>
                                                { loading ? <FaSpinner className="text-[8px] animate-spin" /> : <FaSave className="text-[8px]" /> } { LocalizeText('catalog.admin.save.images') }
                                            </button>
                                        </div>
                                    </div>

                                    { browsingImageType &&
                                        <CatalogAdminImageBrowser
                                            currentImage={ browsingImageType === 'header' ? headerImage : teaserImage }
                                            type={ browsingImageType }
                                            onClose={ () => setBrowsingImageType(null) }
                                            onSelect={ handleImageSelect }
                                        /> }
                                </div>
                            ) }

                            { activeSection === 'info' && pageInfo && (
                                <div className="flex flex-col gap-2.5">
                                    <div className="bg-white rounded border border-card-grid-item-border p-2.5 shadow-sm">
                                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5 border-l-2 border-l-primary pl-1.5">Page Info</div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            { [
                                                [ 'Page ID', `${ selectedNode.pageId }` ],
                                                [ 'Page Name', pageInfo.pageName || '-' ],
                                                [ 'Icon ID', `${ pageInfo.iconId }` ],
                                                [ 'Layout', pageLayout ],
                                                [ 'Offers', `${ pageInfo.offerCount }` ],
                                                [ 'Children', `${ pageInfo.childCount }` ],
                                                [ 'Visible', visible === '1' ? 'Yes' : 'No' ],
                                                [ 'Enabled', enabled === '1' ? 'Yes' : 'No' ],
                                            ].map(([ label, value ]) => (
                                                <div key={ label } className="flex items-center justify-between bg-card-content-area rounded px-2 py-1 border border-card-grid-item-border">
                                                    <span className="text-[9px] text-muted font-bold uppercase">{ label }</span>
                                                    <span className="text-[10px] font-mono text-dark">{ value }</span>
                                                </div>
                                            )) }
                                        </div>
                                    </div>
                                </div>
                            ) }
                        </div>
                    </> }
            </div>
        </div>
    );
};
