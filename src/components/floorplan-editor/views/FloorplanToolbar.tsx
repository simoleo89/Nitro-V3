import { Dispatch, FC } from 'react';
import { FaHandPaper, FaRedo, FaUndo } from 'react-icons/fa';
import { LocalizeText } from '../../../api';
import { Base, Flex, Text } from '../../../common';
import { FloorplanAction, FloorActionMode, FloorplanState } from '../state/types';

type Props = {
    state: FloorplanState;
    dispatch: Dispatch<FloorplanAction>;
    canUndo?: boolean;
    canRedo?: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
    panMode?: boolean;
    onTogglePanMode?: () => void;
};

const BRUSH_BUTTONS: { id: string; mode: FloorActionMode; iconClass: string }[] = [
    { id: 'tool-set',   mode: 'SET',   iconClass: 'icon-set-tile' },
    { id: 'tool-unset', mode: 'UNSET', iconClass: 'icon-unset-tile' },
    { id: 'tool-up',    mode: 'UP',    iconClass: 'icon-increase-height' },
    { id: 'tool-down',  mode: 'DOWN',  iconClass: 'icon-decrease-height' },
    { id: 'tool-door',  mode: 'DOOR',  iconClass: 'icon-set-door' }
];

export const FloorplanToolbar: FC<Props> = ({ state, dispatch, canUndo, canRedo, onUndo, onRedo, panMode, onTogglePanMode }) =>
{
    return (
        <Flex gap={ 1 } alignItems="center">
            <Text bold small>{ LocalizeText('floor.plan.editor.draw.mode') }</Text>
            { BRUSH_BUTTONS.map(b => (
                <Base
                    key={ b.id }
                    pointer
                    data-testid={ b.id }
                    data-active={ state.brush.action === b.mode ? 'true' : 'false' }
                    className={ `nitro-icon ${ b.iconClass } ${ state.brush.action === b.mode ? 'border border-primary' : '' }` }
                    onClick={ () => dispatch({ type: 'BRUSH_SET', action: b.mode }) }
                />
            )) }
            <Base
                pointer
                data-testid="tool-select-all"
                className={ `nitro-icon ${ state.selection.size > 0 ? 'icon-set-deselect' : 'icon-set-select' }` }
                onClick={ () => dispatch({ type: 'SELECT_ALL' }) }
            />
            <Base
                pointer
                data-testid="tool-square-select"
                className={ `nitro-icon icon-set-squaresselect ${ state.squareSelect ? 'border border-primary' : '' }` }
                onClick={ () => dispatch({ type: 'SQUARE_SELECT_TOGGLE' }) }
            />
            { onTogglePanMode && (
                <Base
                    pointer
                    data-testid="tool-pan"
                    data-active={ panMode ? 'true' : 'false' }
                    title={ panMode ? 'Modalità mano attiva — trascina per spostare la vista (Spazio per uscire)' : 'Modalità mano — trascina per spostare la vista' }
                    className={ `ml-1 w-7 h-7 flex items-center justify-center rounded border ${ panMode ? 'bg-emerald-500 border-emerald-700 text-white shadow-inner' : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700' }` }
                    onClick={ onTogglePanMode }
                >
                    <FaHandPaper size={ 12 } />
                </Base>
            ) }
            { (onUndo || onRedo) && (
                <Flex gap={ 1 } alignItems="center" className="ml-2 pl-2 border-l border-zinc-300">
                    <Base
                        pointer={ Boolean(canUndo) }
                        data-testid="tool-undo"
                        title="Annulla (Ctrl+Z)"
                        className={ `w-7 h-7 flex items-center justify-center rounded border ${ canUndo ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700' : 'border-zinc-200 bg-zinc-100 text-zinc-300 cursor-not-allowed' }` }
                        onClick={ canUndo && onUndo ? onUndo : undefined }
                    >
                        <FaUndo size={ 12 } />
                    </Base>
                    <Base
                        pointer={ Boolean(canRedo) }
                        data-testid="tool-redo"
                        title="Ripeti (Ctrl+Shift+Z)"
                        className={ `w-7 h-7 flex items-center justify-center rounded border ${ canRedo ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700' : 'border-zinc-200 bg-zinc-100 text-zinc-300 cursor-not-allowed' }` }
                        onClick={ canRedo && onRedo ? onRedo : undefined }
                    >
                        <FaRedo size={ 12 } />
                    </Base>
                </Flex>
            ) }
        </Flex>
    );
};
