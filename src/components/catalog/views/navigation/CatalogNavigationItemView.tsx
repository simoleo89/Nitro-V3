import { FC, useState } from 'react';
import { FaCaretDown, FaCaretUp, FaStar } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { useCatalog, useCatalogFavorites } from '../../../../hooks';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationItemViewProps
{
    node: ICatalogNode;
    child?: boolean;
}

export const CatalogNavigationItemView: FC<CatalogNavigationItemViewProps> = props =>
{
    const { node = null, child = false } = props;
    const { activateNode = null } = useCatalog();
    const { isFavoritePage, toggleFavoritePage } = useCatalogFavorites();
    const isFav = node ? isFavoritePage(node.pageId) : false;

    return (
        <div className={ child ? 'pl-1.5 ml-1.5 border-l-2 border-card-grid-item-border' : '' }>
            <div
                className={ `group/nav flex items-center gap-1.5 px-1.5 py-[3px] mx-0.5 rounded cursor-pointer transition-all duration-100 text-[11px] ${ node.isActive ? 'bg-card-grid-item-active border border-card-grid-item-border-active shadow-inner1px font-bold' : 'border border-transparent hover:bg-card-grid-item-active' }` }
                onClick={ () => activateNode(node) }
            >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <CatalogIconView icon={ node.iconId } />
                </div>
                <span className="flex-1 truncate" title={ node.localization }>{ node.localization }</span>
                { node.pageId > 0 &&
                    <FaStar
                        className={ `text-[8px] transition-all duration-100 cursor-pointer shrink-0 ${ isFav ? 'text-warning opacity-100' : 'text-muted opacity-0 group-hover/nav:opacity-100 hover:text-warning' }` }
                        onClick={ e => { e.stopPropagation(); toggleFavoritePage(node.pageId); } }
                    /> }
                { node.isBranch &&
                    <span className="text-[9px] text-muted shrink-0">
                        { node.isOpen ? <FaCaretUp /> : <FaCaretDown /> }
                    </span> }
            </div>
            { node.isOpen && node.isBranch &&
                <CatalogNavigationSetView child={ true } node={ node } /> }
        </div>
    );
};
