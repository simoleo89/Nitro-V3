import { FC, useState } from 'react';
import { FaCheck, FaCloudUploadAlt, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { useCatalogAdmin } from '../../CatalogAdminContext';

export const CatalogAdminPublishPanel: FC<{}> = () =>
{
    const catalogAdmin = useCatalogAdmin();
    const hasPendingChanges = catalogAdmin?.hasPendingChanges ?? false;
    const loading = catalogAdmin?.loading ?? false;
    const publishCatalog = catalogAdmin?.publishCatalog;
    const [ confirmStep, setConfirmStep ] = useState(false);

    const handlePublish = () =>
    {
        if(!confirmStep) { setConfirmStep(true); return; }
        publishCatalog?.();
        setConfirmStep(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
            { hasPendingChanges
                ? <>
                    <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                        <FaExclamationTriangle className="text-2xl text-warning" />
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-dark mb-1">Unpublished Changes</div>
                        <div className="text-[11px] text-muted max-w-[300px]">
                            Publishing will update the catalog for all users immediately.
                        </div>
                    </div>
                    { confirmStep
                        ? <div className="flex flex-col items-center gap-2">
                            <div className="text-[11px] font-bold text-warning">Are you sure?</div>
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-1.5 rounded text-[11px] font-bold bg-card-grid-item text-gray-600 border border-card-grid-item-border hover:bg-card-grid-item-active cursor-pointer transition-colors" onClick={ () => setConfirmStep(false) }>
                                    Cancel
                                </button>
                                <button className="flex items-center gap-1.5 px-6 py-1.5 rounded text-[11px] font-bold bg-success text-white hover:bg-green-700 cursor-pointer transition-colors disabled:opacity-50" disabled={ loading } onClick={ handlePublish }>
                                    { loading ? <FaSpinner className="text-xs animate-spin" /> : <FaCloudUploadAlt className="text-xs" /> }
                                    Confirm
                                </button>
                            </div>
                        </div>
                        : <button className="flex items-center gap-2 px-8 py-2 rounded-lg text-sm font-bold bg-success text-white hover:bg-green-700 cursor-pointer transition-all shadow-md hover:shadow-lg animate-pulse disabled:opacity-50" disabled={ loading } onClick={ handlePublish }>
                            { loading ? <FaSpinner className="text-base animate-spin" /> : <FaCloudUploadAlt className="text-base" /> }
                            Publish Catalog
                        </button> }
                    <div className="text-[9px] text-muted">Ctrl+Shift+P</div>
                </>
                : <>
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                        <FaCheck className="text-2xl text-success" />
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-dark mb-1">All Published</div>
                        <div className="text-[11px] text-muted max-w-[300px]">The catalog is up to date.</div>
                    </div>
                </> }
        </div>
    );
};
