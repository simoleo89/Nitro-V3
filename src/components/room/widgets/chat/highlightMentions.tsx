/**
 * Cosmetic-only mention highlighting for in-room chat bubbles.
 *
 * The bubble text is rendered through {@link RoomChatFormatter}, which emits
 * an HTML string (wired markup `<strong>`/`<em>`/`<u>`, font-colour
 * `<span style>`, `<br />`, plus HTML-entity-encoded special characters) and
 * is injected via `dangerouslySetInnerHTML`. We therefore operate on the
 * already-formatted HTML string and wrap mention tokens that appear in the
 * TEXT regions (never inside a `<tag>`), returning a new HTML string. This
 * keeps every existing formatting behaviour intact and is purely visual — it
 * does not touch `chat.text`, parsing, chat history, or any wire payload.
 *
 * Token detection mirrors the server's `MentionManager.process` exactly:
 *   - split on whitespace
 *   - a candidate token has length >= 2 and starts with `@`
 *   - strip the `@`, remove every char that is not [A-Za-z0-9_], lowercase
 *   - match against the local username or a room-broadcast alias
 *
 * This means `@Bob!`, `@bob,` etc. all match the nick `Bob` (case-insensitive)
 * just like the server, while the highlighted span keeps the original token
 * text (`@` + original casing + trailing punctuation) verbatim.
 */

// Mirror of `mentions.room.aliases` default in Arcturus
// (com.eu.habbo.habbohotel.mentions.MentionManager#roomAliases).
export const MENTION_ROOM_ALIASES: ReadonlyArray<string> = [
    'amici', 'friends', 'all', 'everyone', 'tutti', 'room', 'stanza'
];

const NON_NICK_CHARS = /[^A-Za-z0-9_]/g;

/**
 * Normalise a raw `@token` the same way the server does: drop the leading `@`,
 * strip any non-nick characters (trailing punctuation, etc.), lowercase.
 * Returns an empty string when nothing usable remains.
 */
const normalizeToken = (token: string): string =>
{
    if(!token || token.length < 2 || token.charAt(0) !== '@') return '';

    return token.substring(1).replace(NON_NICK_CHARS, '').toLowerCase();
};

/**
 * Whether the given raw whitespace-delimited token mentions the local user
 * or a room-broadcast alias.
 */
const isMentionToken = (token: string, ownUsernameLower: string, aliases: ReadonlySet<string>): boolean =>
{
    const nick = normalizeToken(token);

    if(!nick) return false;

    if(ownUsernameLower && nick === ownUsernameLower) return true;

    return aliases.has(nick);
};

/**
 * Public predicate: does this raw whitespace-delimited token mention the given
 * user or a room-broadcast alias? Mirrors the server's detection. Reusable by
 * UI that renders mention previews as React nodes (e.g. the mentions box).
 */
export const tokenIsMention = (
    token: string,
    ownUsername: string,
    aliases: ReadonlyArray<string> = MENTION_ROOM_ALIASES
): boolean =>
{
    const ownUsernameLower = (ownUsername || '').replace(NON_NICK_CHARS, '').toLowerCase();
    return isMentionToken(token, ownUsernameLower, new Set(aliases.map(a => a.toLowerCase())));
};

const HIGHLIGHT_OPEN = '<span class="mention-highlight">';
const HIGHLIGHT_CLOSE = '</span>';

/**
 * Wrap mention tokens in a single text chunk (no HTML tags inside it).
 * Whitespace runs between tokens are preserved verbatim by re-using the
 * original substrings around each match.
 */
const highlightTextChunk = (chunk: string, ownUsernameLower: string, aliases: ReadonlySet<string>): string =>
{
    if(chunk.indexOf('@') < 0) return chunk;

    // Split into alternating [whitespace, token, whitespace, token, ...]
    // segments so the exact original spacing is rebuilt unchanged.
    const segments = chunk.split(/(\s+)/);

    let result = '';

    for(const segment of segments)
    {
        if(segment.length === 0) continue;

        // Whitespace runs and non-mention tokens pass through untouched.
        if(/^\s+$/.test(segment) || !isMentionToken(segment, ownUsernameLower, aliases))
        {
            result += segment;
            continue;
        }

        result += `${ HIGHLIGHT_OPEN }${ segment }${ HIGHLIGHT_CLOSE }`;
    }

    return result;
};

/**
 * Take the formatted bubble HTML and return new HTML where every mention
 * token (own nick or room alias) in the text regions is wrapped in
 * `<span class="mention-highlight">…</span>`. HTML tags are passed through
 * untouched so existing markup keeps working.
 *
 * Returns the input unchanged when there is no `@`, no own username, and no
 * possibility of a match (fast path), or when nothing matches.
 */
export const highlightMentions = (
    formattedHtml: string,
    ownUsername: string,
    aliases: ReadonlyArray<string> = MENTION_ROOM_ALIASES
): string =>
{
    if(!formattedHtml || formattedHtml.indexOf('@') < 0) return formattedHtml;

    const ownUsernameLower = (ownUsername || '').replace(NON_NICK_CHARS, '').toLowerCase();
    const aliasSet = new Set(aliases.map(a => a.toLowerCase()));

    // Nothing could ever match → return verbatim.
    if(!ownUsernameLower && aliasSet.size === 0) return formattedHtml;

    // Walk the string, only highlighting inside text regions (outside `<...>`).
    let result = '';
    let cursor = 0;

    while(cursor < formattedHtml.length)
    {
        const tagStart = formattedHtml.indexOf('<', cursor);

        if(tagStart < 0)
        {
            result += highlightTextChunk(formattedHtml.slice(cursor), ownUsernameLower, aliasSet);
            break;
        }

        // Text region before the next tag.
        if(tagStart > cursor)
        {
            result += highlightTextChunk(formattedHtml.slice(cursor, tagStart), ownUsernameLower, aliasSet);
        }

        const tagEnd = formattedHtml.indexOf('>', tagStart);

        if(tagEnd < 0)
        {
            // Malformed trailing `<` with no closing `>` — emit the rest verbatim.
            result += formattedHtml.slice(tagStart);
            break;
        }

        // Emit the tag (including the angle brackets) untouched.
        result += formattedHtml.slice(tagStart, tagEnd + 1);
        cursor = tagEnd + 1;
    }

    return result;
};
