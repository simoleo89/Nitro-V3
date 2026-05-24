import { Dispatch, FC, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState, WheelEvent } from 'react';
import { FaCrosshairs, FaSearchMinus, FaSearchPlus } from 'react-icons/fa';
import { FloorplanAction, FloorplanState } from '../state/types';
import { FloorplanTile } from './FloorplanTile';
import { tileToScreen, usePointerToTile } from '../hooks/usePointerToTile';
import { useTool } from '../hooks/useTool';
import { TILE_SIZE, MAX_NUM_TILE_PER_AXIS } from '../state/constants';

type Props = {
    state: FloorplanState;
    dispatch: Dispatch<FloorplanAction>;
    /**
     * When true, left-click + drag pans the canvas instead of
     * brushing. Driven by the hand-tool toggle in the toolbar.
     * Shift+drag and middle-mouse drag always pan regardless of
     * this flag.
     */
    panMode?: boolean;
};

const VIEWBOX_W = 2048;
const VIEWBOX_H = (MAX_NUM_TILE_PER_AXIS * TILE_SIZE) / 2;

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 6;
const ZOOM_STEP = 0.2;
// Slack around the room bounding box when auto-fitting, so the tiles
// don't sit flush against the canvas edge.
const FIT_PADDING = TILE_SIZE * 2;

const clampZoom = (z: number): number => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));

/**
 * Compute the screen-space bounding box of the painted (= non-
 * blocked) tiles. Returns `null` if the room is fully blocked /
 * empty — caller can fall back to the centered default view.
 *
 * tileToScreen returns the TOP corner of the iso diamond; we
 * inflate by half a tile in every direction so the diamond's
 * extremities (left/right/bottom points) are included.
 */
const computeRoomBounds = (state: FloorplanState): { x: number; y: number; w: number; h: number } | null =>
{
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let found = false;

    for(let r = 0; r < state.tiles.length; r++)
    {
        const row = state.tiles[r];

        if(!row) continue;

        for(let c = 0; c < row.length; c++)
        {
            const tile = row[c];

            if(!tile || tile.blocked) continue;

            const [ x, y ] = tileToScreen(r, c);
            const tileLeft = x - TILE_SIZE / 2;
            const tileRight = x + TILE_SIZE / 2;
            const tileTop = y;
            const tileBottom = y + TILE_SIZE / 2;

            if(tileLeft < minX) minX = tileLeft;
            if(tileRight > maxX) maxX = tileRight;
            if(tileTop < minY) minY = tileTop;
            if(tileBottom > maxY) maxY = tileBottom;
            found = true;
        }
    }

    if(!found) return null;

    return {
        x: minX - FIT_PADDING,
        y: minY - FIT_PADDING,
        w: (maxX - minX) + FIT_PADDING * 2,
        h: (maxY - minY) + FIT_PADDING * 2
    };
};

export const FloorplanCanvasSVG: FC<Props> = ({ state, dispatch, panMode }) =>
{
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [ zoom, setZoom ] = useState(1);
    const [ pan, setPan ] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [ isPanning, setIsPanning ] = useState(false);
    const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
    // First-paint flag: once we've seen a non-empty room we
    // auto-fit (zoom in/out until the room fills the canvas with
    // a small margin) exactly once. Manual zoom/pan afterwards is
    // preserved.
    const centeredRef = useRef(false);

    const roomBounds = useMemo(() => computeRoomBounds(state), [ state.tiles ]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pan a given zoom level so the room centre sits in the
    // viewport centre. With zoom kept, the formula reduces to
    // `roomCenter - VIEWBOX_center` because the (VIEWBOX - visible)
    // / 2 base offset terms cancel.
    const centerPanForRoom = useCallback((): { x: number; y: number } | null =>
    {
        if(!roomBounds) return null;
        return {
            x: roomBounds.x + roomBounds.w / 2 - VIEWBOX_W / 2,
            y: roomBounds.y + roomBounds.h / 2 - VIEWBOX_H / 2
        };
    }, [ roomBounds ]);

    // Fit-to-room: zooms IN/OUT until the whole room is visible
    // (with a 5 % margin), then centres the pan. This is the
    // default view — running on first paint and on every click of
    // the %% / 'reset' label.
    const fitToRoom = useCallback(() =>
    {
        if(!roomBounds) return;
        const zoomFitX = VIEWBOX_W / roomBounds.w;
        const zoomFitY = VIEWBOX_H / roomBounds.h;
        const targetZoom = clampZoom(Math.min(zoomFitX, zoomFitY) * 0.95);
        const next = centerPanForRoom();
        if(!next) return;
        setZoom(targetZoom);
        setPan(next);
    }, [ roomBounds, centerPanForRoom ]);

    // Auto-fit the FIRST time we see a non-empty room (typically
    // right after the server-driven load). The literal 100 % zoom
    // leaves too much empty space around small rooms, so the
    // 'default view' is fit-to-room (~95 % of the smaller axis
    // so tiles don't sit flush against the edge). The user's
    // subsequent manual zoom / pan adjustments are preserved.
    useEffect(() =>
    {
        if(centeredRef.current) return;
        if(!roomBounds) return;
        centeredRef.current = true;
        fitToRoom();
    }, [ roomBounds, fitToRoom ]);

    const visW = VIEWBOX_W / zoom;
    const visH = VIEWBOX_H / zoom;
    const baseX = (VIEWBOX_W - visW) / 2;
    const baseY = (VIEWBOX_H - visH) / 2;
    const viewX = baseX + pan.x;
    const viewY = baseY + pan.y;
    const viewBox = `${ viewX } ${ viewY } ${ visW } ${ visH }`;

    const projection = usePointerToTile(svgRef, { width: visW, height: visH, x: viewX, y: viewY });
    const tool = useTool(state, dispatch, projection);

    const rows = useMemo(() => state.tiles.map((row, r) =>
    {
        const cells = row.map((tile, c) =>
        {
            const isDoor = state.door.x === c && state.door.y === r && !tile.blocked;
            const selected = state.selection.has(`${ r },${ c }`);
            return <FloorplanTile key={ `${ r }-${ c }` } row={ r } col={ c } tile={ tile } selected={ selected } isDoor={ isDoor } />;
        });
        return <g key={ `row-${ r }` }>{ cells }</g>;
    }), [ state.tiles, state.door.x, state.door.y, state.selection ]);

    const zoomIn = useCallback(() => setZoom(z => clampZoom(z + ZOOM_STEP)), []);
    const zoomOut = useCallback(() => setZoom(z => clampZoom(z - ZOOM_STEP)), []);
    // The %% label button restores the default view: fit-to-room
    // (the same auto-fit that runs on first paint). Clicking it
    // after manual zoom always gets you back to "room fills the
    // canvas, room centred".
    const resetView = useCallback(() =>
    {
        fitToRoom();
    }, [ fitToRoom ]);

    const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) =>
    {
        if(!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        setZoom(z => clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
    }, []);

    useEffect(() =>
    {
        const onMove = (e: PointerEvent) =>
        {
            const start = panStartRef.current;
            if(!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            const rect = svgRef.current?.getBoundingClientRect();
            if(!rect) return;
            const scale = visW / rect.width;
            setPan({
                x: start.panX - dx * scale,
                y: start.panY - dy * scale
            });
        };
        const onUp = () =>
        {
            panStartRef.current = null;
            setIsPanning(false);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () =>
        {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, [ visW ]);

    // Pan gestures: middle-mouse, Shift+left-click, and (when the
    // hand-tool is active) plain left-click. The hand-tool toggle
    // is the toolbar affordance — Shift / middle still work even
    // when the hand isn't on, so power users keep their muscle
    // memory.
    const isPanGesture = (e: ReactPointerEvent): boolean =>
        e.button === 1
        || (e.button === 0 && e.shiftKey)
        || (e.button === 0 && Boolean(panMode));

    const cursorClass = isPanning ? 'cursor-grabbing' : panMode ? 'cursor-grab' : '';

    return (
        <div className="relative w-full h-full">
            <svg
                ref={ svgRef }
                viewBox={ viewBox }
                className={ `w-full h-full select-none rounded-md border border-zinc-300 bg-[url('@/assets/images/floorplaneditor/canvas_floor_pattern.png')] bg-repeat [image-rendering:pixelated] ${ cursorClass }` }
                onWheel={ onWheel }
                onPointerDown={ e =>
                {
                    if(isPanGesture(e))
                    {
                        e.preventDefault();
                        panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
                        setIsPanning(true);
                        return;
                    }
                    tool.onPointerDown(e);
                } }
                onPointerMove={ e =>
                {
                    if(panStartRef.current) return;
                    tool.onPointerMove(e);
                } }
                onPointerUp={ e =>
                {
                    if(panStartRef.current) return;
                    tool.onPointerUp(e);
                } }
            >
                { rows }
            </svg>
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-white/95 border border-zinc-300 shadow-sm px-1 py-1 text-zinc-700">
                <button
                    type="button"
                    data-testid="zoom-out"
                    title="Riduci (Ctrl+rotellina)"
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={ zoom <= ZOOM_MIN + 1e-3 }
                    onClick={ zoomOut }
                >
                    <FaSearchMinus size={ 12 } />
                </button>
                <button
                    type="button"
                    data-testid="zoom-reset"
                    title="Inquadra la stanza"
                    className="px-2 h-7 min-w-[3rem] flex items-center justify-center rounded hover:bg-zinc-100 text-xs font-bold tabular-nums"
                    onClick={ resetView }
                >
                    { Math.round(zoom * 100) }%
                </button>
                <button
                    type="button"
                    data-testid="zoom-in"
                    title="Ingrandisci (Ctrl+rotellina)"
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={ zoom >= ZOOM_MAX - 1e-3 }
                    onClick={ zoomIn }
                >
                    <FaSearchPlus size={ 12 } />
                </button>
                <span className="w-px h-5 bg-zinc-300 mx-1" />
                <button
                    type="button"
                    data-testid="zoom-recenter"
                    title="Centra sulla stanza (mantiene lo zoom)"
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={ !roomBounds }
                    onClick={ () =>
                    {
                        const next = centerPanForRoom();
                        if(next) setPan(next);
                    } }
                >
                    <FaCrosshairs size={ 12 } />
                </button>
            </div>
        </div>
    );
};
