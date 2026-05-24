import { FC, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HEIGHT_BRUSH_MAX, HEIGHT_BRUSH_MIN } from '../state/constants';
import { tileFill } from '../state/selectors';

type Props = {
    selectedH: number;
    onSelect: (h: number) => void;
};

const TRACK_W = 18;
const TRACK_H = 260;
const THUMB_DIAM = 28;
const RAIL_GUTTER = 4;

/**
 * Vertical brush-height slider.
 *
 * Track   - discrete-step gradient built from the real tile-fill
 *           colours, top = HEIGHT_BRUSH_MAX, bottom = HEIGHT_BRUSH_MIN.
 *           Each height owns a clear band so colour <-> height stays
 *           legible at a glance, exactly like the swatch column it
 *           replaces.
 * Min/max - small chip labels float above and below the rail so the
 *           user knows what the endpoints mean without trial and
 *           error.
 * Thumb   - amber radial gradient on a soft drop shadow, white ring
 *           when hovered, darker ring while dragging. Renders the
 *           current value in the middle so the user reads the
 *           number directly off the handle.
 * Gesture - click the rail to jump, click-and-drag the thumb (or
 *           rail) to scrub. Window-level pointer listeners keep
 *           the drag alive even when the cursor leaves the narrow
 *           strip. Vertical scroll on touch is suppressed.
 */
export const FloorplanHeightPicker: FC<Props> = ({ selectedH, onSelect }) =>
{
    const count = HEIGHT_BRUSH_MAX - HEIGHT_BRUSH_MIN + 1;
    const trackRef = useRef<HTMLDivElement>(null);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ isHovering, setIsHovering ] = useState(false);

    const gradient = useMemo(() =>
    {
        const stops: string[] = [];
        for(let i = 0; i < count; i++)
        {
            const h = HEIGHT_BRUSH_MAX - i;
            const fill = tileFill({ h, blocked: false });
            const startPct = (i / count) * 100;
            const endPct = ((i + 1) / count) * 100;

            stops.push(`${ fill } ${ startPct.toFixed(2) }%`);
            stops.push(`${ fill } ${ endPct.toFixed(2) }%`);
        }

        return `linear-gradient(to bottom, ${ stops.join(', ') })`;
    }, [ count ]);

    const heightFromClientY = useCallback((clientY: number): number | null =>
    {
        const track = trackRef.current;

        if(!track) return null;

        const rect = track.getBoundingClientRect();

        if(rect.height === 0) return null;

        const local = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        const idx = Math.round(local * (count - 1));

        return HEIGHT_BRUSH_MAX - idx;
    }, [ count ]);

    const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) =>
    {
        if(e.button !== 0) return;

        const next = heightFromClientY(e.clientY);

        if(next !== null && next !== selectedH) onSelect(next);

        setIsDragging(true);
    }, [ heightFromClientY, onSelect, selectedH ]);

    useEffect(() =>
    {
        if(!isDragging) return;

        const onMove = (e: PointerEvent) =>
        {
            const next = heightFromClientY(e.clientY);
            if(next !== null && next !== selectedH) onSelect(next);
        };
        const onUp = () => setIsDragging(false);

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);

        return () =>
        {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [ isDragging, heightFromClientY, onSelect, selectedH ]);

    const thumbPct = ((HEIGHT_BRUSH_MAX - selectedH) / (count - 1)) * 100;

    return (
        <div
            className="relative shrink-0 select-none touch-none flex flex-col items-center"
            style={ { width: THUMB_DIAM + RAIL_GUTTER * 2, height: TRACK_H + 32 } }
            role="slider"
            aria-label="Altezza pennello"
            aria-valuemin={ HEIGHT_BRUSH_MIN }
            aria-valuemax={ HEIGHT_BRUSH_MAX }
            aria-valuenow={ selectedH }
        >
            <span className="text-[9px] font-bold tabular-nums text-zinc-500 leading-none mb-1">
                { HEIGHT_BRUSH_MAX }
            </span>
            <div className="relative flex-1" style={ { width: THUMB_DIAM } }>
                <div
                    ref={ trackRef }
                    data-testid="height-track"
                    className={ `absolute left-1/2 -translate-x-1/2 top-0 bottom-0 rounded-full border border-zinc-400 cursor-pointer overflow-hidden transition-shadow ${ isHovering || isDragging ? 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4),0_0_0_2px_rgba(250,204,21,0.35)]' : 'shadow-inner' }` }
                    style={ {
                        width: TRACK_W,
                        background: gradient
                    } }
                    onPointerDown={ onPointerDown }
                    onPointerEnter={ () => setIsHovering(true) }
                    onPointerLeave={ () => setIsHovering(false) }
                />
                <div
                    data-testid="height-thumb"
                    className={ `absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-[11px] font-bold text-zinc-900 tabular-nums pointer-events-none transition-shadow ${ isDragging ? 'ring-2 ring-zinc-900' : isHovering ? 'ring-2 ring-white/80' : '' }` }
                    style={ {
                        width: THUMB_DIAM,
                        height: THUMB_DIAM,
                        top: `${ thumbPct }%`,
                        background: 'radial-gradient(circle at 35% 30%, #fff7c4 0%, #facc15 55%, #ca8a04 100%)',
                        border: '2px solid #78350f',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 -2px 3px rgba(0, 0, 0, 0.18)'
                    } }
                >
                    { selectedH }
                </div>
            </div>
            <span className="text-[9px] font-bold tabular-nums text-zinc-500 leading-none mt-1">
                { HEIGHT_BRUSH_MIN }
            </span>
        </div>
    );
};
