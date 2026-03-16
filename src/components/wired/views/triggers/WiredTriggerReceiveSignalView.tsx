import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const ANTENNA_INTERACTION_TYPES = [ 'antenna' ];

export const WiredTriggerReceiveSignalView: FC<{}> = () =>
{
    const [ senderCount, setSenderCount ] = useState(0);
    const [ maxSenders, setMaxSenders ] = useState(5);

    const { trigger = null, setAllowedInteractionTypes } = useWired();

    useEffect(() =>
    {
        if(!trigger) return;

        const p = trigger.intData;
        if(p.length >= 2) setSenderCount(p[1]);
        if(p.length >= 3) setMaxSenders(p[2]);
    }, [ trigger ]);

    useEffect(() =>
    {
        setAllowedInteractionTypes(ANTENNA_INTERACTION_TYPES);

        return () => setAllowedInteractionTypes(null);
    }, [ setAllowedInteractionTypes ]);

    return (
        <WiredTriggerBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } save={ null }>
            <div className="flex items-center justify-between">
                <Text small>{ LocalizeText('wiredfurni.params.signal.senders_connected') }</Text>
                <Text bold small>{ senderCount }/{ maxSenders }</Text>
            </div>
        </WiredTriggerBaseView>
    );
};
