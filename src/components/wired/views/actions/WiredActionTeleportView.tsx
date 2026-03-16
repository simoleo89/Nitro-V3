import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredActionTeleportView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();

    const [ furniSource, setFurniSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length >= 1) return trigger.intData[0];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length >= 2) return trigger.intData[1];
        return 0;
    });

    useEffect(() =>
    {
        if(!trigger) return;

        if(trigger.intData.length >= 1) setFurniSource(trigger.intData[0]);
        else setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);

        if(trigger.intData.length >= 2) setUserSource(trigger.intData[1]);
        else setUserSource(0);
    }, [ trigger ]);

    const onChangeFurniSource = (next: number) => setFurniSource(next);

    const save = () => setIntParams([ furniSource, userSource ]);

    const requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT;

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ requiresFurni }
            save={ save }
            footer={
                <WiredSourcesSelector
                    showFurni={ true }
                    showUsers={ true }
                    furniSource={ furniSource }
                    userSource={ userSource }
                    onChangeFurni={ onChangeFurniSource }
                    onChangeUsers={ setUserSource } />
            } />
    );
};
