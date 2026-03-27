import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { useCatalogAdmin } from '../../CatalogAdminContext';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';

export interface CatalogNavigationSetViewProps
{
    node: ICatalogNode;
    child?: boolean;
}

export const CatalogNavigationSetView: FC<CatalogNavigationSetViewProps> = props =>
{
    const { node = null, child = false } = props;
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;

    return (
        <>
            { node && (node.children.length > 0) && node.children.map((n, index) =>
            {
                if(!adminMode && !n.isVisible) return null;

                return <CatalogNavigationItemView key={ index } child={ child } node={ n } />;
            }) }
        </>
    );
};
