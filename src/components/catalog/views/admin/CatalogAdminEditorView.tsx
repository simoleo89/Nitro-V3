import { FC } from 'react';
import { FaBoxOpen, FaCloudUploadAlt, FaSitemap } from 'react-icons/fa';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { AdminManageTab, useCatalogAdmin } from '../../CatalogAdminContext';
import { CatalogAdminOfferPanel } from './CatalogAdminOfferPanel';
import { CatalogAdminPagePanel } from './CatalogAdminPagePanel';
import { CatalogAdminPublishPanel } from './CatalogAdminPublishPanel';

const TABS: { key: AdminManageTab; label: string; icon: FC<{ className?: string }> }[] = [
    { key: 'pages', label: 'Pages', icon: FaSitemap },
    { key: 'offers', label: 'Offers', icon: FaBoxOpen },
    { key: 'publish', label: 'Publish', icon: FaCloudUploadAlt },
];

export const CatalogAdminEditorView: FC<{}> = () =>
{
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const setAdminMode = catalogAdmin?.setAdminMode;
    const activeTab = catalogAdmin?.activeManageTab ?? 'pages';
    const setActiveTab = catalogAdmin?.setActiveManageTab;
    const hasPendingChanges = catalogAdmin?.hasPendingChanges ?? false;
    const loading = catalogAdmin?.loading ?? false;
    const publishCatalog = catalogAdmin?.publishCatalog;

    if(!adminMode) return null;

    return (
        <NitroCardView className="w-[900px] h-[600px]" uniqueKey="catalog-admin">
            <NitroCardHeaderView headerText="Catalog Admin Editor" onCloseClick={ () => setAdminMode(false) } />

            { /* Tab bar */ }
            <div className="flex items-center gap-1 px-2 py-1.5 bg-card-tab-item border-b-2 border-card-grid-item-border shrink-0">
                { TABS.map(tab =>
                {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={ tab.key }
                            className={ `flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${ isActive
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-black/60 hover:bg-black/10 hover:text-black' }` }
                            onClick={ () => setActiveTab(tab.key) }
                        >
                            <Icon className="text-[9px]" />
                            { tab.label }
                            { tab.key === 'publish' && hasPendingChanges &&
                                <span className="min-w-[6px] h-[6px] bg-warning rounded-full animate-pulse" /> }
                        </button>
                    );
                }) }

                <div className="flex-1" />

                { hasPendingChanges &&
                    <button
                        className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold bg-success text-white hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                        disabled={ loading }
                        onClick={ () => publishCatalog() }
                    >
                        <FaCloudUploadAlt className="text-[9px]" />
                        Publish
                    </button> }
            </div>

            <NitroCardContentView classNames={ [ 'p-0!', 'overflow-hidden!' ] }>
                { activeTab === 'pages' && <CatalogAdminPagePanel /> }
                { activeTab === 'offers' && <CatalogAdminOfferPanel /> }
                { activeTab === 'publish' && <CatalogAdminPublishPanel /> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
