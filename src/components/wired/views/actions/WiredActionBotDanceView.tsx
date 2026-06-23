import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { NitroInput } from '../../../../layout';
import { WiredActionBaseView } from './WiredActionBaseView';

const DANCE_TYPES = [
    { value: 0, label: 'Stop dancing' },
    { value: 1, label: 'Hap Hop' },
    { value: 2, label: 'Pogo Mogo' },
    { value: 3, label: 'Duck Funk' },
    { value: 4, label: 'The Rollie' }
];

export const WiredActionBotDanceView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState<string>('');
    const [ danceType, setDanceType ] = useState<number>(0);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    useEffect(() =>
    {
        if(!trigger) return;

        setBotName(trigger.stringData ?? '');
        setDanceType((trigger.intData?.length ?? 0) > 0 ? trigger.intData[0] : 0);
    }, [ trigger ]);

    const save = () =>
    {
        setStringParam(botName);
        setIntParams([ danceType ]);
    };

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }>
            <div className="flex flex-col gap-1">
                <Text bold>Bot name</Text>
                <NitroInput maxLength={ 32 } type="text" value={ botName } onChange={ event => setBotName(event.target.value) } />
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>Dance</Text>
                <select
                    className="form-select form-select-sm"
                    value={ danceType }
                    onChange={ event => setDanceType(parseInt(event.target.value, 10) || 0) }>
                    { DANCE_TYPES.map(option => (
                        <option key={ option.value } value={ option.value }>{ option.label }</option>
                    )) }
                </select>
            </div>
        </WiredActionBaseView>
    );
};
