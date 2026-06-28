import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionInitTransactionView: FC<{}> = () => {
    const { setIntParams = null } = useWired();
    const save = () => setIntParams([]);

    return (
        <WiredActionBaseView hasSpecialInput={false} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save}>
            <Text small>Fires the "Transaction Completed" triggers (success branch). No settings.</Text>
        </WiredActionBaseView>
    );
};
