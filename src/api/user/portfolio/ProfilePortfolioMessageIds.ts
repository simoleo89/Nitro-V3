/**
 * Custom message IDs for the profile portfolio system.
 * These IDs must match the server-side emulator implementation.
 *
 * Outgoing (Client → Server):
 * - LOAD_PORTFOLIO: Request portfolio data for a user
 * - SAVE_TAB_CONFIG: Save tab visibility configuration
 * - ADD_WALL_COMMENT: Post a comment on a user's wall
 * - REMOVE_WALL_COMMENT: Remove a comment from a wall
 * - SAVE_SHOWCASE: Save showcase items
 * - SAVE_PHOTO: Save a photo to gallery
 * - REMOVE_PHOTO: Remove a photo from gallery
 *
 * Incoming (Server → Client):
 * - PORTFOLIO_DATA: Full portfolio data response
 * - WALL_COMMENT_ADDED: Confirmation of new comment
 * - PORTFOLIO_UPDATED: Portfolio was updated
 */
export const ProfilePortfolioOutgoing = {
    LOAD_PORTFOLIO: 8100,
    SAVE_TAB_CONFIG: 8101,
    ADD_WALL_COMMENT: 8102,
    REMOVE_WALL_COMMENT: 8103,
    SAVE_SHOWCASE: 8104,
    SAVE_PHOTO: 8105,
    REMOVE_PHOTO: 8106
};

export const ProfilePortfolioIncoming = {
    PORTFOLIO_DATA: 9100,
    WALL_COMMENT_ADDED: 9101,
    PORTFOLIO_UPDATED: 9102
};
