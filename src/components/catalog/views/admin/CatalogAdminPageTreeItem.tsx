import { FC, useCallback, useState } from 'react';
import { FaCaretDown, FaCaretRight, FaEyeSlash, FaGripVertical } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';

export interface CatalogAdminPageTreeItemProps
{
    node: ICatalogNode;
    depth?: number;
    selectedPageId?: number;
    onSelect: (node: ICatalogNode) => void;
    onReorder: (pageId: number, newParentId: number, newIndex: number) => void;
}

export const CatalogAdminPageTreeItem: FC<CatalogAdminPageTreeItemProps> = props =>
{
    const { node, depth = 0, selectedPageId, onSelect, onReorder } = props;
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
                <div className="h-[3px] bg-primary rounded-full mx-1" style={ { marginLeft: depth * 18 + 4 } } /> }

            <div
                className={ `group/tree flex items-center gap-1.5 px-2 py-1 mx-1 my-[1px] rounded cursor-pointer transition-all text-[13px]
                    ${ isSelected ? 'bg-primary/20 border border-primary/40 font-semibold shadow-sm' : 'border border-transparent hover:bg-white/50' }
                    ${ isHidden ? 'opacity-40' : '' }
                    ${ isDragOver === 'on' ? 'ring-2 ring-primary bg-primary/5' : '' }` }
                draggable
                style={ { paddingLeft: depth * 18 + 8 } }
                onClick={ () => onSelect(node) }
                onDragLeave={ () => setIsDragOver(null) }
                onDragOver={ handleDragOver }
                onDragStart={ handleDragStart }
                onDrop={ handleDrop }
            >
                <FaGripVertical className="text-[12px] text-slate-500 shrink-0 group-hover/tree:text-slate-800 cursor-grab" />

                { hasBranch
                    ? <span
                        className="text-[15px] text-slate-700 shrink-0 cursor-pointer hover:text-primary w-4 flex items-center justify-center"
                        onClick={ e => { e.stopPropagation(); setIsOpen(!isOpen); } }
                    >
                        { isOpen ? <FaCaretDown /> : <FaCaretRight /> }
                    </span>
                    : <span className="w-4 shrink-0" /> }

                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <CatalogIconView icon={ node.iconId } />
                </div>

                <span className="flex-1 truncate text-dark" title={ `${ node.localization } (ID: ${ node.pageId })` }>
                    { node.localization }
                </span>

                { isHidden && <FaEyeSlash className="text-[12px] text-danger shrink-0" title="Page is hidden" /> }

                <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                    #{ node.pageId }
                </span>

            </div>

            { isDragOver === 'below' &&
                <div className="h-[3px] bg-primary rounded-full mx-1" style={ { marginLeft: depth * 18 + 4 } } /> }

            { isOpen && hasBranch && node.children.map((child, index) =>
                <CatalogAdminPageTreeItem
                    key={ `${ child.pageId }-${ index }` }
                    depth={ depth + 1 }
                    node={ child }
                    selectedPageId={ selectedPageId }
                    onReorder={ onReorder }
                    onSelect={ onSelect }
                />
            ) }
        </div>
    );
};
