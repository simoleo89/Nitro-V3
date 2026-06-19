import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cssPath = join(process.cwd(), 'src/css/nitrocard/NitroCardView.css');

describe('NitroCardView.css', () =>
{
    it('targets the card classes rendered by shared card components', () =>
    {
        const css = readFileSync(cssPath, 'utf8');

        expect(css).toContain('.nitro-card-shell');
        expect(css).toContain('.nitro-card-shell:not(.nitro-wired)');
        expect(css).toContain('.nitro-card-header-shell');
        expect(css).toContain('.nitro-card-content-shell');
        expect(css).toContain('.nitro-card-tabs-shell');
        expect(css).toContain('.nitro-card-tab-item');
    });
});
