import { GetRoomEngine } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, MouseEvent as ReactMouseEvent, useCallback, useEffect, useState } from 'react';
import { FaMinus, FaPlus, FaTimes } from 'react-icons/fa';
import { MdGridOn } from 'react-icons/md';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Button, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const SOURCE_USER_TRIGGER  = 0;
const SOURCE_USER_SIGNAL   = 1;
const SOURCE_USER_CLICKED  = 2;
const SOURCE_FURNI_TRIGGER = 3;
const SOURCE_FURNI_PICKED  = 4;
const SOURCE_FURNI_SIGNAL  = 5;

const USER_SOURCES  = [
    { value: SOURCE_USER_TRIGGER,  label: 'wiredfurni.params.sources.users.0'   },
    { value: SOURCE_USER_SIGNAL,   label: 'wiredfurni.params.sources.users.201' },
    { value: SOURCE_USER_CLICKED,  label: 'wiredfurni.params.sources.users.11'  },
];

const FURNI_SOURCES = [
    { value: SOURCE_FURNI_TRIGGER, label: 'wiredfurni.params.sources.furni.0'   },
    { value: SOURCE_FURNI_PICKED,  label: 'wiredfurni.params.sources.furni.100' },
    { value: SOURCE_FURNI_SIGNAL,  label: 'wiredfurni.params.sources.furni.201' },
];

const TILE_W     = 22;
const TILE_H     = 11;
const GRID_RANGE = 4;
const CX         = GRID_RANGE * TILE_W + TILE_W / 2;
const CY         = GRID_RANGE * TILE_H + TILE_H / 2;
const GRID_PX_W  = (GRID_RANGE * 2 + 1) * TILE_W;
const GRID_PX_H  = (GRID_RANGE * 2 + 1) * TILE_H;

type Tile = { x: number; y: number };

const tileIncluded = (tiles: Tile[], x: number, y: number) =>
    tiles.some(t => t.x === x && t.y === y);

const tileLeft = (rx: number, ry: number) =>
    CX + (rx - ry) * (TILE_W / 2) - TILE_W / 2;

const tileTop = (rx: number, ry: number) =>
    CY + (rx + ry) * (TILE_H / 2) - TILE_H / 2;

interface GridProps {
    selectedTiles: Tile[];
    targetTile: Tile;
    invert: boolean;
    onSetTile: (x: number, y: number, selected: boolean) => void;
    onMoveTarget: (x: number, y: number) => void;
    targetPlacementMode: boolean;
}

const NeighborhoodGrid: FC<GridProps> = ({ selectedTiles, targetTile, invert, onSetTile, onMoveTarget, targetPlacementMode }) =>
{
    const [ dragMode, setDragMode ] = useState<'add' | 'remove' | 'target' | null>(null);
    const tiles: JSX.Element[] = [];

    useEffect(() =>
    {
        const stopDragging = () => setDragMode(null);

        window.addEventListener('mouseup', stopDragging);

        return () => window.removeEventListener('mouseup', stopDragging);
    }, []);

    const beginTileDrag = (event: ReactMouseEvent<HTMLDivElement>, rx: number, ry: number, isTarget: boolean, isSelected: boolean) =>
    {
        event.preventDefault();

        if(targetPlacementMode)
        {
            setDragMode('target');
            onMoveTarget(rx, ry);
            return;
        }

        const nextMode = isSelected ? 'remove' : 'add';

        setDragMode(nextMode);
        onSetTile(rx, ry, nextMode === 'add');
    };

    const continueTileDrag = (event: ReactMouseEvent<HTMLDivElement>, rx: number, ry: number, isTarget: boolean) =>
    {
        if(!(event.buttons & 1) || !dragMode) return;

        if(dragMode === 'target')
        {
            onMoveTarget(rx, ry);
            return;
        }

        onSetTile(rx, ry, dragMode === 'add');
    };

    for (let ry = -GRID_RANGE; ry <= GRID_RANGE; ry++)
    {
        for (let rx = -GRID_RANGE; rx <= GRID_RANGE; rx++)
        {
            const isTarget   = rx === targetTile.x && ry === targetTile.y;
            const isSelected = tileIncluded(selectedTiles, rx, ry);
            const isActive   = invert ? !isSelected : isSelected;
            const left       = tileLeft(rx, ry);
            const top_       = tileTop(rx, ry);
            const zIdx       = rx + ry + GRID_RANGE * 2 + 10;

            const bgColor = isActive
                ? '#3399ff'
                : '#2a3042';

            const borderColor = isTarget
                ? '#ffffff'
                : isActive
                    ? '#1166cc'
                    : '#1a2032';

            const diamond: CSSProperties = {
                position:        'absolute',
                width:           TILE_W,
                height:          TILE_H,
                left,
                top:             top_,
                clipPath:        'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                backgroundColor: bgColor,
                cursor:          'pointer',
                zIndex:          zIdx,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                color:           isTarget ? '#ffffff' : 'transparent',
                fontSize:        10
            };

            const border: CSSProperties = {
                position:        'absolute',
                width:           TILE_W + (isTarget ? 6 : 2),
                height:          TILE_H + (isTarget ? 6 : 2),
                left:            left - (isTarget ? 3 : 1),
                top:             top_ - (isTarget ? 3 : 1),
                clipPath:        'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                backgroundColor: borderColor,
                zIndex:          zIdx - 1,
                pointerEvents:   'none',
            };

            const targetOutline: CSSProperties = {
                position:      'absolute',
                width:         TILE_W + 4,
                height:        TILE_H + 4,
                left:          left - 2,
                top:           top_ - 2,
                zIndex:        zIdx + 1,
                pointerEvents: 'none',
                overflow:      'visible'
            };

            tiles.push(
                <div key={ `b-${ rx }-${ ry }` } style={ border } />,
                isTarget && (
                    <svg key={ `o-${ rx }-${ ry }` } style={ targetOutline } viewBox={ `0 0 ${ TILE_W + 4 } ${ TILE_H + 4 }` }>
                        <polygon
                            points={ `${ (TILE_W + 4) / 2 },2 ${ TILE_W + 2 },${ (TILE_H + 4) / 2 } ${ (TILE_W + 4) / 2 },${ TILE_H + 2 } 2,${ (TILE_H + 4) / 2 }` }
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1" />
                    </svg>
                ),
                <div
                    key={ `t-${ rx }-${ ry }` }
                    style={ diamond }
                    title={ `(${ rx }, ${ ry })` }
                    onMouseDown={ event => beginTileDrag(event, rx, ry, isTarget, isSelected) }
                    onMouseEnter={ event => continueTileDrag(event, rx, ry, isTarget) } />,
            );
        }
    }

    return (
        <div style={ { position: 'relative', width: GRID_PX_W, height: GRID_PX_H, flexShrink: 0 } } onContextMenu={ event => event.preventDefault() }>
            { tiles }
        </div>
    );
};

export const WiredSelectorUsersNeighborhoodView: FC<{}> = () =>
{
    const [ selectedTiles, setSelectedTiles ] = useState<Tile[]>([]);
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const [ sourceType, setSourceType ] = useState(SOURCE_USER_TRIGGER);
    const [ targetTile, setTargetTile ] = useState<Tile>({ x: 0, y: 0 });
    const [ targetPlacementMode, setTargetPlacementMode ] = useState(false);
    const [ curX, setCurX ] = useState(0);
    const [ curY, setCurY ] = useState(0);

    const { trigger = null, furniIds = [], setIntParams } = useWired();

    useEffect(() =>
    {
        GetRoomEngine().areaSelectionManager.clearHighlight();
        GetRoomEngine().areaSelectionManager.deactivate();
    }, []);

    useEffect(() =>
    {
        if(!trigger) return;

        const p = trigger.intData;
        if(p.length >= 1) setSourceType(p[0]);
        if(p.length >= 2) setFilterExisting(p[1] === 1);
        if(p.length >= 3) setInvert(p[2] === 1);
        if(p.length >= 5) setTargetTile({ x: p[3], y: p[4] });
        else setTargetTile({ x: 0, y: 0 });

        if(p.length >= 6)
        {
            const n     = p[5];
            const tiles: Tile[] = [];

            for(let i = 0; i < n; i++)
            {
                const xi = 6 + i * 2;
                if(xi + 1 < p.length) tiles.push({ x: p[xi], y: p[xi + 1] });
            }

            setSelectedTiles(tiles);
        }
        else
        {
            setSelectedTiles([]);
        }
    }, [ trigger ]);

    const save = useCallback(() =>
    {
        const params: number[] = [
            sourceType,
            filterExisting ? 1 : 0,
            invert ? 1 : 0,
            targetTile.x,
            targetTile.y,
            selectedTiles.length,
            ...selectedTiles.flatMap(t => [ t.x, t.y ]),
        ];

        setIntParams(params);
    }, [ sourceType, filterExisting, invert, selectedTiles, targetTile.x, targetTile.y, setIntParams ]);

    const setTileSelection = useCallback((x: number, y: number, selected: boolean) =>
    {
        setSelectedTiles(prev =>
        {
            const alreadySelected = tileIncluded(prev, x, y);

            if(selected)
            {
                if(alreadySelected) return prev;

                return [ ...prev, { x, y } ];
            }

            if(!alreadySelected) return prev;

            return prev.filter(t => !(t.x === x && t.y === y));
        });
    }, []);

    const moveTargetTile = useCallback((x: number, y: number) =>
    {
        setTargetTile({ x, y });
    }, []);

    const addTile = useCallback(() =>
    {
        if(!tileIncluded(selectedTiles, curX, curY))
            setSelectedTiles(prev => [ ...prev, { x: curX, y: curY } ]);
    }, [ curX, curY, selectedTiles ]);

    const removeTile = useCallback(() =>
    {
        setSelectedTiles(prev => prev.filter(t => !(t.x === curX && t.y === curY)));
    }, [ curX, curY ]);

    const clearTiles = useCallback(() => setSelectedTiles([]), []);

    const loadDefaultPattern = useCallback(() =>
    {
        const tiles: Tile[] = [];

        for(let y = -2; y <= 2; y++)
        {
            for(let x = -2; x <= 2; x++)
            {
                if(x === 0 && y === 0) continue;
                tiles.push({ x, y });
            }
        }

        setSelectedTiles(tiles);
    }, []);

    const isUserGroup = sourceType <= SOURCE_USER_CLICKED;
    const activeSources = isUserGroup ? USER_SOURCES : FURNI_SOURCES;
    const groupOffset = isUserGroup ? 0 : SOURCE_FURNI_TRIGGER;
    const groupIndex = sourceType - groupOffset;

    const prevSource = () =>
        setSourceType(groupOffset + ((groupIndex - 1 + activeSources.length) % activeSources.length));

    const nextSource = () =>
        setSourceType(groupOffset + ((groupIndex + 1) % activeSources.length));

    const switchGroup = (toUser: boolean) =>
    {
        if(toUser === isUserGroup) return;

        const newOffset = toUser ? 0 : SOURCE_FURNI_TRIGGER;
        setSourceType(newOffset + groupIndex);
    };

    const requiresFurni = sourceType === SOURCE_FURNI_PICKED
        ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID
        : WiredFurniType.STUFF_SELECTION_OPTION_NONE;

    const pickedCount = furniIds.length;
    const pickedLimit = trigger?.maximumItemSelectionCount ?? 20;

    return (
        <WiredSelectorBaseView hasSpecialInput={ true } requiresFurni={ requiresFurni } save={ save } hideDelay={ true } cardStyle={ { width: '400px' } }>
            <div className="flex flex-col gap-2">

                <Text bold>{ LocalizeText('wiredfurni.params.neighborhood_selection') }</Text>

                <div className="flex items-center gap-1">
                    <Button
                        variant={ targetPlacementMode ? 'success' : 'secondary' }
                        className="px-2 py-1"
                        onClick={ () => setTargetPlacementMode(value => !value) }
                        title="Sposta target">
                        <span aria-hidden className="relative inline-block h-[14px] w-[14px]">
                            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                            <span className="absolute left-1/2 top-1/2 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-current" />
                        </span>
                    </Button>
                    <Button variant="success" className="px-2 py-1" onClick={ addTile } title={ LocalizeText('wiredfurni.tooltip.select.tile') }>
                        <FaPlus />
                    </Button>
                    <Button variant="danger" className="px-2 py-1" onClick={ removeTile } title={ LocalizeText('wiredfurni.tooltip.remove.tile') }>
                        <FaMinus />
                    </Button>
                    <Button variant="primary" className="px-2 py-1" onClick={ loadDefaultPattern } title={ LocalizeText('wiredfurni.tooltip.remove.5x5_tile') }>
                        <MdGridOn />
                    </Button>
                    <Button variant="secondary" className="px-2 py-1" onClick={ clearTiles } title={ LocalizeText('wiredfurni.tooltip.remove.clear_tile') }>
                        <FaTimes />
                    </Button>
                </div>

                <div className="flex justify-center">
                    <NeighborhoodGrid
                        selectedTiles={ selectedTiles }
                        targetTile={ targetTile }
                        invert={ invert }
                        onSetTile={ setTileSelection }
                        onMoveTarget={ moveTargetTile }
                        targetPlacementMode={ targetPlacementMode } />
                </div>

                <div className="flex items-center gap-2">
                    <Text small>X:</Text>
                    <input
                        type="number"
                        className="form-control form-control-sm"
                        style={ { width: 56 } }
                        value={ curX }
                        min={ -GRID_RANGE }
                        max={ GRID_RANGE }
                        onChange={ e => setCurX(parseInt(e.target.value) || 0) } />
                    <Text small>Y:</Text>
                    <input
                        type="number"
                        className="form-control form-control-sm"
                        style={ { width: 56 } }
                        value={ curY }
                        min={ -GRID_RANGE }
                        max={ GRID_RANGE }
                        onChange={ e => setCurY(parseInt(e.target.value) || 0) } />
                </div>

                <hr className="m-0 bg-dark" />

                <Text bold>{ LocalizeText('wiredfurni.params.selector_options_selector') }</Text>

                <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={ filterExisting }
                        onChange={ e => setFilterExisting(e.target.checked) } />
                    <Text small>{ LocalizeText('wiredfurni.params.selector_option.0') }</Text>
                </label>

                <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={ invert }
                        onChange={ e => setInvert(e.target.checked) } />
                    <Text small>{ LocalizeText('wiredfurni.params.selector_option.1') }</Text>
                </label>

                <hr className="m-0 bg-dark" />

                <Text bold>{ LocalizeText('wiredfurni.params.sources.merged.title.neighborhood') }</Text>

                <div className="flex gap-1">
                    <Button
                        fullWidth
                        variant={ isUserGroup ? 'primary' : 'secondary' }
                        onClick={ () => switchGroup(true) }>
                        { LocalizeText('wiredfurni.params.furni_neighborhood.group.user') }
                    </Button>
                    <Button
                        fullWidth
                        variant={ !isUserGroup ? 'primary' : 'secondary' }
                        onClick={ () => switchGroup(false) }>
                        { LocalizeText('wiredfurni.params.furni_neighborhood.group.furni') }
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="primary" className="px-2 py-1" onClick={ prevSource }>&#8249;</Button>
                    <div className="flex flex-1 items-center justify-center">
                        <Text small>{ LocalizeText(activeSources[groupIndex].label) }</Text>
                    </div>
                    <Button variant="primary" className="px-2 py-1" onClick={ nextSource }>&#8250;</Button>
                </div>

                { sourceType === SOURCE_FURNI_PICKED &&
                    <Text small className="text-center">
                        { LocalizeText('wiredfurni.pickfurnis.caption', [ 'count', 'limit' ], [ pickedCount.toString(), pickedLimit.toString() ]) }
                    </Text> }

            </div>
        </WiredSelectorBaseView>
    );
};
