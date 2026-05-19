import { GetEventDispatcher, GetRoomSessionManager, GetSessionDataManager, GetSoundManager, IRoomSessionSnapshot, IRoomUserData, ISoundVolumesSnapshot, IUserDataSnapshot, NitroEventType } from '@nitrots/nitro-renderer';
import { useMemo } from 'react';
import { useExternalSnapshot } from '../events/useExternalSnapshot';

/**
 * React-side consumers for the referentially-stable snapshot getters
 * the renderer exposes (Nitro_Render_V3 v2.1.0+ pattern).
 *
 * Every hook here is a thin `useSyncExternalStore` wrapper: it subscribes
 * to the corresponding `NitroEventType.*_UPDATED` invalidation event and
 * reads the matching `getXxxSnapshot()`. Because the renderer guarantees
 * snapshot reference invariance until invalidation, React's bailout logic
 * skips re-renders when the snapshot is unchanged — so widgets that read
 * the same slice across many components share a single subscription and
 * only re-paint when the underlying state actually changes.
 *
 * Prefer these over reaching into the manager directly with
 * `GetSessionDataManager().userId` etc., which never trigger a re-render
 * when the value changes.
 *
 * The hooks are intentionally defensive: every call site is wrapped in a
 * "is this method available?" guard so a renderer-version mismatch
 * (e.g. a stale `dist/` shadowing the source) degrades to a stable empty
 * fallback instead of crashing the React tree with `(intermediate value)()
 * is undefined` during the first paint.
 */

// Module-level frozen defaults — referentially stable so the React bailout
// keeps working when a manager method is unavailable.
const NOOP_UNSUBSCRIBE = (): void => undefined;

const DEFAULT_USER_DATA: Readonly<IUserDataSnapshot> = Object.freeze({
    userId: 0,
    userName: '',
    figure: '',
    gender: '',
    realName: '',
    respectsReceived: 0,
    respectsLeft: 0,
    respectsPetLeft: 0,
    canChangeName: false,
    clubLevel: 0,
    securityLevel: 0,
    isAmbassador: false,
    isEmailVerified: false,
    isNoob: false,
    isAuthenticHabbo: false,
    isSystemOpen: false,
    isSystemShutdown: false,
    uiFlags: 0,
    tags: Object.freeze<string[]>([]) as ReadonlyArray<string>,
    rankId: 0,
    rankName: '',
    rankBadge: '',
    rankPrefix: '',
    rankPrefixColor: ''
}) as Readonly<IUserDataSnapshot>;

const EMPTY_IGNORED_LIST: ReadonlyArray<string> = Object.freeze<string[]>([]) as ReadonlyArray<string>;
const EMPTY_GROUP_BADGES: ReadonlyMap<number, string> = new Map();
const EMPTY_USER_LIST: ReadonlyArray<IRoomUserData> = Object.freeze<IRoomUserData[]>([]) as ReadonlyArray<IRoomUserData>;

const DEFAULT_VOLUMES: Readonly<ISoundVolumesSnapshot> = Object.freeze({
    system: 0.5,
    furni: 0.5,
    trax: 0.5
}) as Readonly<ISoundVolumesSnapshot>;

const subscribeTo = (eventType: string) => (onChange: () => void): (() => void) =>
{
    const dispatcher = GetEventDispatcher();

    // Stale renderer (no v2.1.0 subscribe API) — return a no-op
    // unsubscribe so useSyncExternalStore stays mounted cleanly.
    if(!dispatcher || typeof dispatcher.subscribe !== 'function') return NOOP_UNSUBSCRIBE;

    return dispatcher.subscribe(eventType, onChange);
};

export const useUserDataSnapshot = (): Readonly<IUserDataSnapshot> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.SESSION_DATA_UPDATED),
        () =>
        {
            const manager = GetSessionDataManager();

            if(!manager || typeof manager.getUserDataSnapshot !== 'function') return DEFAULT_USER_DATA;

            return manager.getUserDataSnapshot();
        }
    );

export const useActiveRoomSessionSnapshot = (): Readonly<IRoomSessionSnapshot> | null =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.ROOM_SESSION_UPDATED),
        () =>
        {
            const manager = GetRoomSessionManager();

            if(!manager || typeof manager.getActiveRoomSessionSnapshot !== 'function') return null;

            return manager.getActiveRoomSessionSnapshot();
        }
    );

export const useIgnoredUsersSnapshot = (): ReadonlyArray<string> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.IGNORED_USERS_UPDATED),
        () =>
        {
            const inner = GetSessionDataManager()?.ignoredUsersManager;

            if(!inner || typeof inner.getIgnoredUsersSnapshot !== 'function') return EMPTY_IGNORED_LIST;

            return inner.getIgnoredUsersSnapshot();
        }
    );

/**
 * Reactive predicate built on top of `useIgnoredUsersSnapshot`.
 * Re-renders only when the array reference flips (i.e. someone is added
 * or removed) — not on unrelated session updates.
 */
export const useIsUserIgnored = (name: string): boolean =>
{
    const list = useIgnoredUsersSnapshot();

    return useMemo(() => list.includes(name), [ list, name ]);
};

/**
 * Reactive view of the current user's rank, mirrored from the
 * `permission_ranks` table via the extended `UserPermissionsComposer`
 * wire (Arcturus-Morningstar-Extended ≥ 4.2.10). Use this in UI code
 * that needs to display rank metadata (badge, prefix, prefix color)
 * or to gate behaviour on the actual deployment rank rather than the
 * generic SecurityLevel constants the renderer exposes — those don't
 * line up with the rank names operators actually use ("Moderator",
 * "Super Mod", "Administrator", …).
 */
export interface IUserRank
{
    readonly id: number;
    readonly name: string;
    readonly level: number;
    readonly badge: string;
    readonly prefix: string;
    readonly prefixColor: string;
}

export const useUserRank = (): IUserRank =>
{
    const userData = useUserDataSnapshot();

    return useMemo<IUserRank>(() => ({
        id: userData.rankId,
        name: userData.rankName,
        level: userData.securityLevel,
        badge: userData.rankBadge,
        prefix: userData.rankPrefix,
        prefixColor: userData.rankPrefixColor
    }), [ userData.rankId, userData.rankName, userData.securityLevel, userData.rankBadge, userData.rankPrefix, userData.rankPrefixColor ]);
};

/**
 * Reactive predicate: does the current user's rank level satisfy
 * `>= minLevel`? Use this when you want "at least <rank>" semantics
 * and have the rank id from your deployment's `permission_ranks`
 * table (e.g. 5 for Moderator in the default seed). Replaces the
 * older `useHasSecurityLevel` (same wire data, renamed to match the
 * DB table semantics).
 */
export const useHasRankLevel = (minLevel: number): boolean =>
    useUserDataSnapshot().securityLevel >= minLevel;

/**
 * Reactive exact-match predicate against the rank name from
 * `permission_ranks.rank_name`. Prefer `useHasRankLevel(min)` when
 * the gate is "this rank or higher"; reach for `useIsRank('Foo')`
 * only when an action must be specific to one rank.
 */
export const useIsRank = (name: string): boolean => useUserDataSnapshot().rankName === name;

/**
 * Reactive ambassador flag. Not derived from rank level — it's a
 * separate boolean on the snapshot (the emulator computes it server-
 * side from the `acc_ambassador` permission, which a deployment can
 * grant independently of the rank hierarchy).
 */
export const useIsAmbassador = (): boolean => useUserDataSnapshot().isAmbassador;

export const useGroupBadgesSnapshot = (): ReadonlyMap<number, string> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.GROUP_BADGES_UPDATED),
        () =>
        {
            const inner = GetSessionDataManager()?.groupInformationManager;

            if(!inner || typeof inner.getGroupBadgesSnapshot !== 'function') return EMPTY_GROUP_BADGES;

            return inner.getGroupBadgesSnapshot();
        }
    );

/**
 * Returns the badge id for a given group, reactive. Empty string when
 * the badge isn't known (matches the legacy `getGroupBadge` fallback).
 */
export const useGroupBadge = (groupId: number): string =>
{
    const badges = useGroupBadgesSnapshot();

    return useMemo(() => badges.get(groupId) ?? '', [ badges, groupId ]);
};

export const useVolumesSnapshot = (): Readonly<ISoundVolumesSnapshot> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.SOUND_VOLUMES_UPDATED),
        () =>
        {
            const manager = GetSoundManager();

            if(!manager || typeof manager.getVolumesSnapshot !== 'function') return DEFAULT_VOLUMES;

            return manager.getVolumesSnapshot();
        }
    );

/**
 * Returns the active room's user list, reactive. Returns an empty
 * frozen array when no room session is active (or when the renderer
 * doesn't expose the snapshot getter yet).
 *
 * Subscribes to BOTH `ROOM_USER_LIST_UPDATED` (join/leave/update inside
 * the active session) AND `ROOM_SESSION_UPDATED` (because the underlying
 * `userDataManager` reference flips when the active room changes).
 */
export const useRoomUserListSnapshot = (): ReadonlyArray<IRoomUserData> =>
    useExternalSnapshot(
        (onChange) =>
        {
            const dispatcher = GetEventDispatcher();

            if(!dispatcher || typeof dispatcher.subscribe !== 'function') return NOOP_UNSUBSCRIBE;

            const offList = dispatcher.subscribe(NitroEventType.ROOM_USER_LIST_UPDATED, onChange);
            const offSession = dispatcher.subscribe(NitroEventType.ROOM_SESSION_UPDATED, onChange);

            return () =>
            {
                offList();
                offSession();
            };
        },
        () =>
        {
            const userDataManager = GetRoomSessionManager()?.getActiveRoomSessionSnapshot?.()?.session?.userDataManager;

            if(!userDataManager || typeof userDataManager.getRoomUserListSnapshot !== 'function') return EMPTY_USER_LIST;

            return userDataManager.getRoomUserListSnapshot();
        }
    );
