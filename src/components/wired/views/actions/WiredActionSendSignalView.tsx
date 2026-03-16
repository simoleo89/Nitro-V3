import { FC, useCallback, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Button, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const ANTENNA_INTERACTION_TYPES = [ 'antenna' ];

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;

const FORWARD_ITEM_DELIMITER = ';';

type SelectionMode = 'antenna' | 'furni';

const parseForwardIds = (data: string): number[] =>
{
    if(!data || !data.length) return [];

    const ids = new Set<number>();

    for(const part of data.split(/[;,\t]/))
    {
        const trimmed = part.trim();
        if(!trimmed.length) continue;

        const value = parseInt(trimmed, 10);
        if(!isNaN(value) && value > 0) ids.add(value);
    }

    return Array.from(ids);
};

const serializeForwardIds = (ids: number[]): string =>
{
    if(!ids || !ids.length) return '';

    return ids.filter(id => (id > 0)).join(FORWARD_ITEM_DELIMITER);
};

export const WiredActionSendSignalView: FC<{}> = () =>
{
    const [ furniSource, setFurniSource ]       = useState<number>(SOURCE_TRIGGER);
    const [ userSource, setUserSource ]         = useState<number>(SOURCE_TRIGGER);
    const [ signalPerFurni, setSignalPerFurni ] = useState(false);
    const [ signalPerUser, setSignalPerUser ]   = useState(false);
    const [ antennaIds, setAntennaIds ]         = useState<number[]>([]);
    const [ forwardFurniIds, setForwardFurniIds ] = useState<number[]>([]);
    const [ selectionMode, setSelectionMode ]   = useState<SelectionMode>('antenna');

    const { trigger = null, furniIds = [], setFurniIds = null, setIntParams = null, setStringParam = null, setAllowedInteractionTypes = null } = useWired();

    useEffect(() =>
    {
        if(!trigger) return;

        const p = trigger.intData;
        if(p.length > 1) setFurniSource(p[1]);
        else setFurniSource(SOURCE_TRIGGER);

        if(p.length > 2) setUserSource(p[2]);
        else setUserSource(SOURCE_TRIGGER);

        setSignalPerFurni(p.length > 3 && p[3] === 1);
        setSignalPerUser(p.length > 4 && p[4] === 1);

        setAntennaIds(trigger.selectedItems ?? []);
        setForwardFurniIds(parseForwardIds(trigger.stringData));
        setSelectionMode('antenna');
    }, [ trigger ]);

    useEffect(() =>
    {
        if(selectionMode === 'antenna') setAllowedInteractionTypes(ANTENNA_INTERACTION_TYPES);
        else setAllowedInteractionTypes(null);

        return () => setAllowedInteractionTypes(null);
    }, [ selectionMode, setAllowedInteractionTypes ]);

    useEffect(() =>
    {
        if(selectionMode === 'antenna') setAntennaIds(furniIds);
        else setForwardFurniIds(furniIds);
    }, [ furniIds, selectionMode ]);

    const applySelection = useCallback((nextIds: number[]) =>
    {
        if(!setFurniIds) return;

        setFurniIds(prev =>
        {
            if(prev && prev.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(prev);
            if(nextIds && nextIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(nextIds);

            return [ ...nextIds ];
        });
    }, [ setFurniIds ]);

    const switchSelection = useCallback((mode: SelectionMode) =>
    {
        if(mode === selectionMode) return;
        if(mode === 'furni' && furniSource !== SOURCE_SELECTED) return;

        const nextIds = (mode === 'antenna') ? antennaIds : forwardFurniIds;
        applySelection(nextIds);
        setSelectionMode(mode);
    }, [ selectionMode, furniSource, antennaIds, forwardFurniIds, applySelection ]);

    const onChangeFurniSource = (next: number) =>
    {
        if(forwardFurniIds.length) setForwardFurniIds([]);

        if(selectionMode === 'furni')
        {
            applySelection(antennaIds);
            setSelectionMode('antenna');
        }

        setFurniSource(next);
    };

    const save = useCallback(() =>
    {
        if(selectionMode === 'furni')
        {
            setSelectionMode('antenna');
            applySelection(antennaIds);
        }

        const antennaSource = (antennaIds && antennaIds.length) ? antennaIds[0] : 0;

        setIntParams([
            antennaSource,
            furniSource,
            userSource,
            signalPerFurni ? 1 : 0,
            signalPerUser ? 1 : 0,
            0,
        ]);

        setStringParam(serializeForwardIds(forwardFurniIds));
    }, [ selectionMode, antennaIds, furniSource, userSource, signalPerFurni, signalPerUser, forwardFurniIds, setIntParams, setStringParam, applySelection, setSelectionMode ]);

    const selectionLimit = trigger?.maximumItemSelectionCount ?? 0;
    const forwardSelectionEnabled = (furniSource === SOURCE_SELECTED);

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID }
            cardStyle={ { width: '400px' } }
            save={ save }
            footer={ (
                <WiredSourcesSelector
                    showFurni={ true }
                    showUsers={ true }
                    furniSource={ furniSource }
                    userSource={ userSource }
                    onChangeFurni={ onChangeFurniSource }
                    onChangeUsers={ setUserSource } />
            ) }>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <Text bold>Antenne selezionate</Text>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={ (selectionMode === 'antenna') ? 'primary' : 'secondary' }
                            onClick={ () => switchSelection('antenna') }>
                            Antenne
                        </Button>
                        <Text small>{ selectionLimit ? `${ antennaIds.length }/${ selectionLimit }` : antennaIds.length }</Text>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <Text bold>Furni selezionati</Text>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={ (selectionMode === 'furni') ? 'primary' : 'secondary' }
                            disabled={ !forwardSelectionEnabled }
                            onClick={ () => switchSelection('furni') }>
                            Furni
                        </Button>
                        <Text small>{ selectionLimit ? `${ forwardFurniIds.length }/${ selectionLimit }` : forwardFurniIds.length }</Text>
                    </div>
                </div>

                <Text bold>{ LocalizeText('wiredfurni.params.signal.options') }</Text>
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="signal-per-furni"
                        checked={ signalPerFurni }
                        onChange={ e => setSignalPerFurni(e.target.checked) } />
                    <label className="form-check-label" htmlFor="signal-per-furni">
                        <Text small>{ LocalizeText('wiredfurni.params.signal.split_furni') }</Text>
                    </label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="signal-per-user"
                        checked={ signalPerUser }
                        onChange={ e => setSignalPerUser(e.target.checked) } />
                    <label className="form-check-label" htmlFor="signal-per-user">
                        <Text small>{ LocalizeText('wiredfurni.params.signal.split_users') }</Text>
                    </label>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
