import { FC, useEffect, useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Button, Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { sortWiredSourceOptions, useAvailableUserSources } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const SOURCE_GROUP_USERS = 0;
const SOURCE_GROUP_FURNI = 1;
const COMPARISON_OPTIONS = [ 0, 1, 2 ];
const MIN_QUANTITY = 0;
const MAX_QUANTITY = 100;
const QUANTITY_PATTERN = /^\d*$/;

const USER_SOURCES = [
    { value: 0, label: 'wiredfurni.params.sources.users.0' },
    { value: 200, label: 'wiredfurni.params.sources.users.200' },
    { value: 201, label: 'wiredfurni.params.sources.users.201' }
];

const FURNI_SOURCES = sortWiredSourceOptions([
    { value: 0, label: 'wiredfurni.params.sources.furni.0' },
    { value: 200, label: 'wiredfurni.params.sources.furni.200' },
    { value: 201, label: 'wiredfurni.params.sources.furni.201' }
], 'furni');

const clampQuantity = (value: number) =>
{
    if(isNaN(value)) return MIN_QUANTITY;

    return Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, Math.floor(value)));
};

const normalizeSource = (value: number, allowed: number[]) =>
{
    return allowed.includes(value) ? value : 0;
};

export const WiredConditionSelectionQuantityView: FC<{}> = () =>
{
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const availableUserSources = sortWiredSourceOptions(useAvailableUserSources(trigger, USER_SOURCES), 'users');
    const [ comparison, setComparison ] = useState(1);
    const [ quantity, setQuantity ] = useState(0);
    const [ quantityInput, setQuantityInput ] = useState('0');
    const [ sourceGroup, setSourceGroup ] = useState(SOURCE_GROUP_USERS);
    const [ userSource, setUserSource ] = useState(0);
    const [ furniSource, setFurniSource ] = useState(0);

    useEffect(() =>
    {
        if(!trigger) return;

        const nextComparison = (trigger.intData.length > 0) ? trigger.intData[0] : 1;
        const nextQuantity = clampQuantity((trigger.intData.length > 1) ? trigger.intData[1] : 0);
        const nextSourceGroup = (trigger.intData.length > 2 && trigger.intData[2] === SOURCE_GROUP_FURNI) ? SOURCE_GROUP_FURNI : SOURCE_GROUP_USERS;
        const nextSourceType = (trigger.intData.length > 3) ? trigger.intData[3] : 0;

        setComparison(COMPARISON_OPTIONS.includes(nextComparison) ? nextComparison : 1);
        setQuantity(nextQuantity);
        setQuantityInput(nextQuantity.toString());
        setSourceGroup(nextSourceGroup);
        setUserSource(nextSourceGroup === SOURCE_GROUP_USERS ? normalizeSource(nextSourceType, availableUserSources.map(source => source.value)) : 0);
        setFurniSource(nextSourceGroup === SOURCE_GROUP_FURNI ? normalizeSource(nextSourceType, FURNI_SOURCES.map(source => source.value)) : 0);
    }, [ availableUserSources, trigger ]);

    const activeSources = useMemo(() => (sourceGroup === SOURCE_GROUP_FURNI) ? FURNI_SOURCES : availableUserSources, [ availableUserSources, sourceGroup ]);
    const activeSource = (sourceGroup === SOURCE_GROUP_FURNI) ? furniSource : userSource;
    const activeSourceIndex = Math.max(0, activeSources.findIndex(source => source.value === activeSource));

    const updateQuantity = (value: number) =>
    {
        const nextValue = clampQuantity(value);

        setQuantity(nextValue);
        setQuantityInput(nextValue.toString());
    };

    const updateQuantityInput = (value: string) =>
    {
        if(!QUANTITY_PATTERN.test(value)) return;

        setQuantityInput(value);

        if(!value.length)
        {
            setQuantity(0);
            return;
        }

        updateQuantity(parseInt(value));
    };

    const cycleSource = (direction: -1 | 1) =>
    {
        const nextIndex = (activeSourceIndex + direction + activeSources.length) % activeSources.length;
        const nextValue = activeSources[nextIndex].value;

        if(sourceGroup === SOURCE_GROUP_FURNI) setFurniSource(nextValue);
        else setUserSource(nextValue);
    };

    const save = () =>
    {
        setIntParams([
            comparison,
            clampQuantity(quantity),
            sourceGroup,
            (sourceGroup === SOURCE_GROUP_FURNI) ? furniSource : userSource
        ]);
        setStringParam('');
    };

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.comparison_selection') }</Text>
                { COMPARISON_OPTIONS.map(value =>
                {
                    return (
                        <label key={ value } className="flex items-center gap-1">
                            <input checked={ (comparison === value) } className="form-check-input" name="selectionQuantityComparison" type="radio" onChange={ () => setComparison(value) } />
                            <Text>{ LocalizeText(`wiredfurni.params.comparison.${ value }`) }</Text>
                        </label>
                    );
                }) }
            </div>
            <div className="flex flex-col gap-2">
                <input
                    className="form-control form-control-sm"
                    inputMode="numeric"
                    max={ MAX_QUANTITY }
                    min={ MIN_QUANTITY }
                    type="text"
                    value={ quantityInput }
                    onBlur={ () => setQuantityInput(clampQuantity(quantity).toString()) }
                    onChange={ event => updateQuantityInput(event.target.value) } />
                <Slider
                    max={ MAX_QUANTITY }
                    min={ MIN_QUANTITY }
                    step={ 1 }
                    value={ quantity }
                    onChange={ event => updateQuantity(event as number) } />
                <Text small>{ quantity }</Text>
            </div>
            <div className="flex flex-col gap-2">
                <Text bold>{ LocalizeText('wiredfurni.params.sources.merged.title') }</Text>
                <div className="flex gap-1">
                    <Button
                        fullWidth
                        variant={ (sourceGroup === SOURCE_GROUP_USERS) ? 'primary' : 'secondary' }
                        onClick={ () => setSourceGroup(SOURCE_GROUP_USERS) }>
                        { LocalizeText('wiredfurni.params.sources.users.title') }
                    </Button>
                    <Button
                        fullWidth
                        variant={ (sourceGroup === SOURCE_GROUP_FURNI) ? 'primary' : 'secondary' }
                        onClick={ () => setSourceGroup(SOURCE_GROUP_FURNI) }>
                        { LocalizeText('wiredfurni.params.sources.furni.title') }
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="primary" className="px-2 py-1" onClick={ () => cycleSource(-1) }>
                        <FaChevronLeft />
                    </Button>
                    <div className="flex flex-1 items-center justify-center">
                        <Text small>{ LocalizeText(activeSources[activeSourceIndex].label) }</Text>
                    </div>
                    <Button variant="primary" className="px-2 py-1" onClick={ () => cycleSource(1) }>
                        <FaChevronRight />
                    </Button>
                </div>
            </div>
        </WiredConditionBaseView>
    );
};
