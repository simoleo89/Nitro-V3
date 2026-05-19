/**
 * Deployment-specific rank-level constants.
 *
 * Mirrors the `level` column of `permission_ranks` for the operator's
 * Arcturus instance. Defined in ONE place so widget code can express
 * intent via `useHasRankLevel(STAFF_LEVELS.MOD)` instead of bare
 * integers, and so a deployment that re-numbers its ranks (e.g. adds
 * a "Super Admin" at level 8) only has to update this file.
 *
 * Default seed (Arcturus-Morningstar-Extended ≥ 4.2.10):
 *   1 Member       | 2 VIP    | 3 X
 *   4 Support      | 5 Moderator | 6 Super Mod
 *   7 Administrator
 *
 * Update the constants here to match `permission_ranks.level` in your
 * deployment if you customised them.
 */
export const STAFF_LEVELS = {
    /** Member level — the floor for non-staff users. */
    MEMBER: 1,
    /** Lowest staff tier — Support agents. */
    SUPPORT: 4,
    /** Moderator (covers in-room moderation actions). */
    MOD: 5,
    /** Super Mod (extended moderation surface). */
    SUPER_MOD: 6,
    /** Administrator — full staff privileges. */
    ADMIN: 7
} as const;
