/* @vitest-environment jsdom */

import { act, cleanup, render, renderHook } from '@testing-library/react';
import { Component, ReactNode, useSyncExternalStore } from 'react';
import { useBetween } from 'use-between';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetEventDispatcher, GetSessionDataManager } from '../../nitro-renderer.mock';
import { useHasRankLevel, useIsRank, useUserRank } from './useSessionSnapshots';

// Regression guard for the rolled-back snapshot-consumer migration.
//
// `use-between` (v1.x) ships its own dispatcher that proxies a subset of
// React hooks (useState, useReducer, useEffect, useLayoutEffect,
// useCallback, useMemo, useRef, useImperativeHandle). It does NOT
// implement `useSyncExternalStore`. When a state function runs inside
// `useBetween(stateFn)` and that state function calls
// `useSyncExternalStore` (directly or via a wrapper like
// `useExternalSnapshot` / `useUserDataSnapshot`), React resolves the
// dispatcher to use-between's proxy, finds `useSyncExternalStore`
// missing, and throws "(intermediate value)() is undefined" on the
// first render — that's the exact production error reported at
// ToolbarView.tsx:46 last session.
//
// The fix is structural: snapshot hooks must run OUTSIDE the useBetween
// scope (i.e. in the exported wrapper, not in the inner state
// function). These tests pin the constraint so a future migration
// doesn't reintroduce the broken pattern.

class CaptureBoundary extends Component<{ children: ReactNode }, { error: Error | null }>
{
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error)
    {
        return { error };
    }

    componentDidCatch()
    {
    }

    render()
    {
        return this.state.error ? null : this.props.children;
    }
}

describe('use-between + useSyncExternalStore incompatibility', () =>
{
    afterEach(() =>
    {
        cleanup();
    });

    it('crashes when useSyncExternalStore is called inside a useBetween scope', () =>
    {
        // React 19 logs every render-time error to console.error before
        // forwarding to the error boundary. Suppress the noise to keep
        // the test output readable, then assert the error fingerprint.
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const Broken = () =>
        {
            // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional: this test asserts the runtime crash
            useBetween(() => useSyncExternalStore(() => () => undefined, () => 'v', () => 'v'));
            return null;
        };

        let captured: Error | null = null;
        const boundaryRef = (instance: CaptureBoundary | null) =>
        {
            if(instance) captured = instance.state.error;
        };

        render(
            <CaptureBoundary ref={boundaryRef as any}>
                <Broken />
            </CaptureBoundary>
        );

        expect(captured).not.toBeNull();
        expect(captured!.message).toMatch(/useSyncExternalStore is not a function|intermediate value/);

        consoleError.mockRestore();
    });

    it('works when useSyncExternalStore is called OUTSIDE the useBetween scope', () =>
    {
        const sharedState = () => ({ count: 0 });

        // Lowercase intentionally — this is a custom hook named like a
        // regular function so the test reproduces the exact call shape
        // a refactor might land on. The eslint disable below silences
        // the "hooks must start with use" lint that flags the body.
        const safeHook = () =>
        {
            // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional: function named like a hook to mirror real call sites
            const shared = useBetween(sharedState);
            // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional: same reason as above
            const external = useSyncExternalStore(() => () => undefined, () => 'value', () => 'value');

            return { ...shared, external };
        };

        const { result } = renderHook(() => safeHook());

        expect(result.current.external).toBe('value');
        expect(result.current.count).toBe(0);
    });
});

// ============================================================================
// useHasRankLevel / useIsRank / useUserRank — reactive flip on snapshot
// invalidation, tied to the permission_ranks DB table (rankId / rankName /
// rankBadge / rankPrefix / rankPrefixColor are mirrored on the wire by
// the extended UserPermissionsComposer in Arcturus ≥ 4.2.10).
// ============================================================================

const makeFakeDispatcher = () =>
{
    const listeners = new Map<string, Set<() => void>>();

    return {
        subscribe(type: string, cb: () => void): () => void
        {
            let bucket = listeners.get(type);
            if(!bucket)
            {
                bucket = new Set();
                listeners.set(type, bucket);
            }
            bucket.add(cb);
            return () => bucket!.delete(cb);
        },
        dispatch(type: string): void
        {
            listeners.get(type)?.forEach(cb => cb());
        }
    };
};

interface FakeSnapshot
{
    securityLevel: number;
    rankId: number;
    rankName: string;
    rankBadge: string;
    rankPrefix: string;
    rankPrefixColor: string;
}

const makeSnapshot = (overrides: Partial<FakeSnapshot> = {}): FakeSnapshot => ({
    securityLevel: 0,
    rankId: 0,
    rankName: '',
    rankBadge: '',
    rankPrefix: '',
    rankPrefixColor: '',
    ...overrides
});

describe('useHasRankLevel + useIsRank + useUserRank', () =>
{
    let snapshot: FakeSnapshot;
    let fakeDispatcher: ReturnType<typeof makeFakeDispatcher>;

    beforeEach(() =>
    {
        snapshot = makeSnapshot();
        fakeDispatcher = makeFakeDispatcher();

        vi.mocked(GetSessionDataManager).mockReturnValue({
            getUserDataSnapshot: () => snapshot
        } as any);

        vi.mocked(GetEventDispatcher).mockReturnValue(fakeDispatcher as any);
    });

    afterEach(() =>
    {
        cleanup();
        vi.mocked(GetSessionDataManager).mockReset();
        vi.mocked(GetEventDispatcher).mockReset();
    });

    it('useUserRank surfaces the full rank metadata from the snapshot', () =>
    {
        snapshot = makeSnapshot({
            securityLevel: 5,
            rankId: 5,
            rankName: 'Moderator',
            rankBadge: 'ADM',
            rankPrefix: '[MOD]',
            rankPrefixColor: '#327fa8'
        });

        const { result } = renderHook(() => useUserRank());

        expect(result.current).toEqual({
            id: 5,
            name: 'Moderator',
            level: 5,
            badge: 'ADM',
            prefix: '[MOD]',
            prefixColor: '#327fa8'
        });
    });

    it('useHasRankLevel compares >= the threshold (5=Mod, 7=Admin in default seed)', () =>
    {
        snapshot = makeSnapshot({ securityLevel: 5 });
        expect(renderHook(() => useHasRankLevel(5)).result.current).toBe(true);
        expect(renderHook(() => useHasRankLevel(6)).result.current).toBe(false);
        expect(renderHook(() => useHasRankLevel(7)).result.current).toBe(false);
    });

    it('useIsRank matches the exact rank_name from permission_ranks', () =>
    {
        snapshot = makeSnapshot({ rankName: 'Moderator' });
        expect(renderHook(() => useIsRank('Moderator')).result.current).toBe(true);
        expect(renderHook(() => useIsRank('Super Mod')).result.current).toBe(false);
        expect(renderHook(() => useIsRank('Administrator')).result.current).toBe(false);
    });

    it('re-renders when SESSION_DATA_UPDATED fires after a runtime promote', () =>
    {
        snapshot = makeSnapshot({ securityLevel: 1, rankName: 'Member' });
        const { result } = renderHook(() => useHasRankLevel(5));
        expect(result.current).toBe(false);

        act(() =>
        {
            // Renderer invariant: every invalidation produces a NEW
            // frozen snapshot object. The mock's NitroEventType proxy
            // resolves any property to `mock:NitroEventType:<PROP>`, so
            // that's the wire string useSessionSnapshots subscribes against.
            snapshot = makeSnapshot({ securityLevel: 5, rankName: 'Moderator' });
            fakeDispatcher.dispatch('mock:NitroEventType:SESSION_DATA_UPDATED');
        });

        expect(result.current).toBe(true);
    });
});
