import { NavigatorSearchComposer, NavigatorSearchEvent,
    NavigatorSearchResultSet } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';
import { useNavigatorUiStore } from './navigatorUiStore';

/**
 * Navigator search hook.
 *
 * Fires NavigatorSearchComposer(tabCode, filter) whenever the active tab
 * or filter changes (skipped when tabCode is '' — initial state, before
 * metadata arrives). Holds the latest NavigatorSearchResultSet that
 * matches the active tab.
 *
 * The TanStack Query variant (see useNitroQuery) was tried earlier but
 * its one-shot listener doesn't always reach NavigatorSearchEvent in
 * production builds with older renderer SDKs; the persistent
 * useMessageEvent listener used here matches the rest of the codebase
 * and reliably catches every server push.
 */
export const useNavigatorSearch = () =>
{
    const tabCode = useNavigatorUiStore(s => s.currentTabCode);
    const filter  = useNavigatorUiStore(s => s.currentFilter);

    const [ searchResult, setSearchResult ] = useState<NavigatorSearchResultSet | null>(null);
    const [ isFetching, setIsFetching ] = useState(false);

    useEffect(() =>
    {
        if(!tabCode) return;

        setIsFetching(true);
        SendMessageComposer(new NavigatorSearchComposer(tabCode, filter));
    }, [ tabCode, filter ]);

    useMessageEvent<NavigatorSearchEvent>(NavigatorSearchEvent, event =>
    {
        const result = event.getParser()?.result;
        if(!result) return;

        // Accept any incoming result for the currently active tab. Server
        // can push extra results unprompted (e.g. after a room is
        // created); accepting them keeps the panel in sync.
        if(tabCode && result.code !== tabCode) return;

        setSearchResult(result);
        setIsFetching(false);
    });

    return {
        searchResult,
        isFetching,
        refetch: () =>
        {
            if(!tabCode) return;
            setIsFetching(true);
            SendMessageComposer(new NavigatorSearchComposer(tabCode, filter));
        }
    };
};
