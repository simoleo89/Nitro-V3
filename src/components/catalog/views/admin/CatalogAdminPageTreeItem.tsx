import { FC, useCallback, useState } from 'react';
import { FaCaretDown, FaCaretRight, FaEyeSlash, FaGripVertical, FaPlus, FaTrash } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';

export interface CatalogAdminPageTreeItemProps
{
    node: ICatalogNode;
    depth?: number;
    selectedPageId?: number;
    onSelect: (node: ICatalogNode) => void;
    onCreateChild: (parentId: number) => void;
    onDelete: (pageId: number, name: string) => void;
    onToggleVisible: (pageId: number) => void;
    onReorder: (pageId: number, newParentId: number, newIndex: number) => void;
}

export const CatalogAdminPageTreeItem: FC<CatalogAdminPageTreeItemProps> = props =>
{
    const { node, depth = 0, selectedPageId, onSelect, onCreateChild, onDelete, onToggleVisible, onReorder } = props;
    const [ isOpen, setIsOpen ] = useState(node.isOpen);
    const [ isDragOver, setIsDragOver ] = useState<'above' | 'on' | 'below' | null>(null);

    const isSelected = selectedPageId === node.pageId;
    const isHidden = !node.isVisible;
    const hasBranch = node.children && node.children.length > 0;

    const handleDragStart = useCallback((e: React.DragEvent) =>
    {
        e.dataTransfer.setData('text/plain', JSON.stringify({ pageId: node.pageId, parentId: node.parent?.pageId ?? -1 }));
        e.dataTransfer.effectAllowed = 'move';
    }, [ node ]);

    const handleDragOver = useCallback((e: React.DragEvent) =>
    {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const third = rect.height / 3;

        if(y < third) setIsDragOver('above');
        else if(y > third * 2) setIsDragOver('below');
        else setIsDragOver('on');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) =>
    {
        e.preventDefault();
        setIsDragOver(null);

        try
        {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if(!data.pageId || data.pageId === node.pageId) return;

            if(isDragOver === 'on' && hasBranch)
            {
                onReorder(data.pageId, node.pageId, 0);
            }
            else
            {
                const parentId = node.parent?.pageId ?? -1;
                const index = node.parent?.children?.indexOf(node) ?? 0;
                const targetIndex = isDragOver === 'below' ? index + 1 : index;
                onReorder(data.pageId, parentId, targetIndex);
            }
        }
        catch {}
    }, [ node, isDragOver, hasBranch, onReorder ]);

    return (
        <div>
            { isDragOver === 'above' &&
                <div className="h-1 bg-primary rounded-full mx-1" style={ { marginLeft: depth * 16 + 4 } } /> }

            <div
                className={ `group/tree flex items-center gap-1 px-1.5 py-[3px] mx-0.5 rounded cursor-pointer transition-all text-[11px]
                    ${ isSelected ? 'bg-primary/15 border border-primary/40 font-bold' : 'border border-transparent hover:bg-card-grid-item-active' }
                    ${ isHidden ? 'opacity-50' : '' }
                    ${ isDragOver === 'on' ? 'ring-2 ring-primary bg-primary/5' : '' }` }
                draggable
                style={ { paddingLeft: depth * 16 + 6 } }
                onClick={ () => onSelect(node) }
                onDragLeave={ () => setIsDragOver(null) }
                onDragOver={ handleDragOver }
                onDragStart={ handleDragStart }
                onDrop={ handleDrop }
            >
                <FaGripVertical className="text-[7px] text-black/25 shrink-0 group-hover/tree:text-black/50 cursor-grab" />

                { hasBranch
                    ? <span
                        className="text-[9px] text-muted shrink-0 cursor-pointer hover:text-primary"
                        onClick={ e => { e.stopPropagation(); setIsOpen(!isOpen); } }
                    >
                        { isOpen ? <FaCaretDown /> : <FaCaretRight /> }
                    </span>
                    : <span className="w-[9px] shrink-0" /> }

                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <CatalogIconView icon={ node.iconId } />
                </div>

                <span className="flex-1 truncate" title={ `${ node.localization } (ID: ${ node.pageId })` }>
                    { node.localization }
                </span>

                { isHidden && <FaEyeSlash className="text-[10px] text-danger shrink-0" title="Page is hidden" /> }

                <span className="text-[8px] text-black/40 group-hover/tree:text-black/60 shrink-0">
                    #{ node.pageId }
                </span>

                <div className="flex items-center gap-0.5 opacity-0 group-hover/tree:opacity-100 shrink-0">
                    <FaPlus
                        className="text-[8px] text-success hover:text-green-700 cursor-pointer"
                        title="Create child page"
                        onClick={ e => { e.stopPropagation(); onCreateChild(node.pageId); } }
                    />
                    <FaEyeSlash
                        className={ `text-[8px] cursor-pointer ${ isHidden ? 'text-success hover:text-green-700' : 'text-muted hover:text-danger' }` }
                        title={ isHidden ? 'Show page' : 'Hide page' }
                        onClick={ e => { e.stopPropagation(); onToggleVisible(node.pageId); } }
                    />
                    <FaTrash
                        className="text-[8px] text-danger/50 hover:text-danger cursor-pointer"
                        title="Delete page"
                        onClick={ e => { e.stopPropagation(); onDelete(node.pageId, node.localization); } }
                    />
                </div>
            </div>

            { isDragOver === 'below' &&
                <div className="h-1 bg-primary rounded-full mx-1" style={ { marginLeft: depth * 16 + 4 } } /> }

            { isOpen && hasBranch && node.children.map((child, index) =>
                <CatalogAdminPageTreeItem
                    key={ `${ child.pageId }-${ index }` }
                    depth={ depth + 1 }
                    node={ child }
                    selectedPageId={ selectedPageId }
                    onCreateChild={ onCreateChild }
                    onDelete={ onDelete }
                    onReorder={ onReorder }
                    onSelect={ onSelect }
                    onToggleVisible={ onToggleVisible }
                />
            ) }
        </div>
    );
};
