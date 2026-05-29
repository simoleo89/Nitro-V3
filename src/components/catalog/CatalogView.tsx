import { FC, useEffect } from 'react';
import { useCatalogClassicStyle, useCatalogData } from '../../hooks';
import { CatalogClassicView } from './CatalogClassicView';

export const CatalogView: FC<{}> = () =>
{
    const { catalogLocalizationVersion = 0 } = useCatalogData();
    const [ catalogClassicStyle ] = useCatalogClassicStyle();

    // Toggle the legacy-skin marker on <body> so the scoped overrides in
    // CatalogClassicLegacy.css (the pre-merge catalog look) take effect for
    // every catalog element without touching the modern stylesheet.
    useEffect(() =>
    {
        document.body.classList.toggle('catalog-skin-legacy', !!catalogClassicStyle);

        return () => document.body.classList.remove('catalog-skin-legacy');
    }, [ catalogClassicStyle ]);

    return (
        <>
            <div className="hidden" data-catalog-localization-version={ catalogLocalizationVersion } />
            <CatalogClassicView />
        </>
    );
};
