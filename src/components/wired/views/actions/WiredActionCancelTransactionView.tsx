import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionCancelTransactionView: FC<{}> = () => {
    const { setIntParams = null } = useWired();
    const save = () => setIntParams([]);

    return (
        <WiredActionBaseView hasSpecialInput={false} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save}>
            <Text small>Fires the "Transaction Failed" triggers (failure / rollback branch). No settings.</Text>
        </WiredActionBaseView>
    );
};
