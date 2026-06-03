import { describe, expect, it } from 'vitest';
import { highlightMentions, MENTION_ROOM_ALIASES } from './highlightMentions';

const OPEN = '<span class="mention-highlight">';
const CLOSE = '</span>';

describe('highlightMentions', () =>
{
    it('highlights the own-nick token', () =>
    {
        const out = highlightMentions('hello @Bob how are you', 'Bob');

        expect(out).toBe(`hello ${ OPEN }@Bob${ CLOSE } how are you`);
    });

    it('highlights a room-broadcast alias token', () =>
    {
        const out = highlightMentions('@all party time', 'Bob');

        expect(out).toBe(`${ OPEN }@all${ CLOSE } party time`);
    });

    it('highlights every configured room alias', () =>
    {
        for(const alias of MENTION_ROOM_ALIASES)
        {
            const out = highlightMentions(`hey @${ alias }!`, 'Bob');

            expect(out).toBe(`hey ${ OPEN }@${ alias }!${ CLOSE }`);
        }
    });

    it('leaves non-mention text untouched', () =>
    {
        const text = 'just a normal sentence with no at signs';

        expect(highlightMentions(text, 'Bob')).toBe(text);
    });

    it('returns the message unchanged when there is no mention of me or an alias', () =>
    {
        const text = 'hi @Charlie and @Dave';

        // Neither @Charlie nor @Dave is the local user or a room alias.
        expect(highlightMentions(text, 'Bob')).toBe(text);
    });

    it('matches a token with trailing punctuation (mirrors server stripping)', () =>
    {
        const out = highlightMentions('watch out @Bob! seriously', 'Bob');

        // The original token text (including the `!`) is kept inside the span.
        expect(out).toBe(`watch out ${ OPEN }@Bob!${ CLOSE } seriously`);
    });

    it('matches case-insensitively but preserves the original casing', () =>
    {
        const out = highlightMentions('yo @bOb whatup', 'BOB');

        expect(out).toBe(`yo ${ OPEN }@bOb${ CLOSE } whatup`);
    });

    it('preserves the original spacing verbatim', () =>
    {
        const out = highlightMentions('a   @Bob\tb', 'Bob');

        expect(out).toBe(`a   ${ OPEN }@Bob${ CLOSE }\tb`);
    });

    it('does not highlight inside HTML tags produced by the formatter', () =>
    {
        // Formatter output: wired bold markup around a mention.
        const out = highlightMentions('<strong>hi @Bob</strong>', 'Bob');

        expect(out).toBe(`<strong>hi ${ OPEN }@Bob${ CLOSE }</strong>`);
    });

    it('leaves font-colour spans and line breaks intact', () =>
    {
        const html = '<span style="color:red">hi @Bob</span><br />bye';
        const out = highlightMentions(html, 'Bob');

        expect(out).toBe(`<span style="color:red">hi ${ OPEN }@Bob${ CLOSE }</span><br />bye`);
    });

    it('highlights multiple distinct mentions in one message', () =>
    {
        const out = highlightMentions('@Bob and @all listen', 'Bob');

        expect(out).toBe(`${ OPEN }@Bob${ CLOSE } and ${ OPEN }@all${ CLOSE } listen`);
    });

    it('ignores a bare @ with no nick', () =>
    {
        const text = 'email me @ home';

        expect(highlightMentions(text, 'Bob')).toBe(text);
    });

    it('returns input verbatim when there is no @ at all (fast path)', () =>
    {
        const text = 'plain message';

        expect(highlightMentions(text, 'Bob')).toBe(text);
    });

    it('returns input verbatim when own username is empty and no alias matches', () =>
    {
        const text = 'hi @Charlie';

        expect(highlightMentions(text, '')).toBe(text);
    });

    it('still highlights aliases when own username is empty', () =>
    {
        const out = highlightMentions('@everyone hi', '');

        expect(out).toBe(`${ OPEN }@everyone${ CLOSE } hi`);
    });
});
