import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const DEFAULT_CONNECTOR_PLACEHOLDER = '0=text 1\n1=text 2\n2 = text 3';

export const WiredExtraVariableTextConnectorView: FC<{}> = () =>
{
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [ mappingsText, setMappingsText ] = useState('');

    useEffect(() =>
    {
        if(!trigger) return;

        setMappingsText(trigger.stringData || '');
    }, [ trigger ]);

    const save = () =>
    {
        setIntParams([]);
        setStringParam(mappingsText ?? '');
    };

    const placeholderText = (() =>
    {
        const localizedText = LocalizeText('wiredfurni.params.variables.connect_text.caption');

        if(!localizedText || (localizedText === 'wiredfurni.params.variables.connect_text.caption')) return DEFAULT_CONNECTOR_PLACEHOLDER;
        if(localizedText.includes('0,text0') || localizedText.includes('1,text1')) return DEFAULT_CONNECTOR_PLACEHOLDER;

        return localizedText;
    })();

    return (
        <WiredExtraBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } save={ save } cardStyle={ { width: 400 } }>
            <div className="flex flex-col gap-2">
                <Text bold>{ LocalizeText('wiredfurni.params.variables.connect_text.title') }</Text>
                <textarea
                    className="form-control form-control-sm nitro-wired__resizable-textarea"
                    placeholder={ placeholderText }
                    value={ mappingsText }
                    onChange={ event => setMappingsText(event.target.value) } />
            </div>
        </WiredExtraBaseView>
    );
};
