import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cssPath = join(process.cwd(), 'src/css/purse/PurseView.css');

describe('PurseView.css', () => {
    it('lets shortened currency tooltips escape the compact purse frame', () => {
        const css = readFileSync(cssPath, 'utf8');
        const purseBlock = css.match(/\.nitro-purse\s*\{[^}]*\}/)?.[0] ?? '';

        expect(purseBlock).toContain('overflow: visible;');
    });
});
