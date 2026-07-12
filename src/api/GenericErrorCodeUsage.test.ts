import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('generic error protocol usage', () => {
    it('uses the renderer catalog instead of protocol number literals', () => {
        const doorState = readSource('src/hooks/rooms/widgets/useDoorState.ts');
        const navigator = readSource('src/hooks/navigator/useNavigatorStore.ts');
        const sources = doorState + navigator;

        expect(doorState).toContain('GenericErrorEnum.WRONG_ROOM_PASSWORD');
        expect(navigator).toContain('GenericErrorEnum.VIP_REQUIRED');
        expect(navigator).toContain('GenericErrorEnum.ROOM_NAME_UNACCEPTABLE');
        expect(sources).not.toMatch(/parser\.errorCode\s*!==\s*-100002/);
        expect(sources).not.toMatch(/case\s+4009:/);
        expect(sources).not.toMatch(/case\s+4010:/);
    });
});
