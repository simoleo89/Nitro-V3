import { FC } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

export const WiredExtraMoveNoAnimationView: FC<{}> = () =>
{
    const { setIntParams = null, setStringParam = null } = useWired();

    const save = () =>
    {
        setIntParams([]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } save={ save } cardStyle={ { width: 360 } }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.mov_no_animation.title') }</Text>
                <Text>{ LocalizeText('wiredfurni.params.mov_no_animation.description') }</Text>
            </div>
        </WiredExtraBaseView>
    );
};
