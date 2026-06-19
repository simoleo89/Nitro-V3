import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('UI CSS ownership', () =>
{
    it('keeps static widget styles in css files instead of React style tags', () =>
    {
        const radioView = readSource('src/components/radio/RadioView.tsx');
        const toolbarView = readSource('src/components/toolbar/ToolbarView.tsx');
        const friendsBarView = readSource('src/components/friends/views/friends-bar/FriendsBarView.tsx');
        const wheelWinReveal = readSource('src/components/fortune-wheel/WheelWinReveal.tsx');

        expect(radioView).not.toContain('RADIO_STYLES');
        expect(toolbarView).not.toContain('TOOLBAR_STYLES');
        expect(friendsBarView).not.toContain('FRIENDBAR_STYLES');
        expect(wheelWinReveal).not.toContain('<style>');
    });

    it('keeps window-specific classes from repainting shared card chrome', () =>
    {
        const groupCreatorView = readSource('src/components/groups/views/GroupCreatorView.tsx');

        expect(groupCreatorView).not.toContain('border border-[solid] border-[#283F5D]');
    });
});
