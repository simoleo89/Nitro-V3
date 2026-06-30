import { FC, useEffect, useState } from 'react';
import { localizeWithFallback, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { ChestFurniIconPreview } from '../ChestFurniIconPreview';
import { WiredExtraBaseView } from './WiredExtraBaseView';

// Config-based v1: the chest stocks a single furni base-type (base item id) x quantity.
//
// The server contract (InteractionWiredChestFurni, CODE 101) reads exactly
// intData[0] = baseItemId and intData[1] = quantity, wipes the stock and adds at
// most ONE furni kind — only if baseItemId > 0, quantity > 0 AND that base item
// actually exists. So we keep the 2-int payload and requiresFurni = NONE.
//
// ChestFurniIconPreview mirrors the official ChestItemIconPreviewer: it resolves the
// furni icon + localized name so the owner sees WHAT they're stocking instead of a
// blind id — and flags an unknown id (which the server would silently drop).
export const WiredChestFurniView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [baseItemId, setBaseItemId] = useState(0);
    const [quantity, setQuantity] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        setBaseItemId(trigger.intData.length > 0 ? trigger.intData[0] : 0);
        setQuantity(trigger.intData.length > 1 ? Math.max(0, trigger.intData[1]) : 0);
    }, [trigger]);

    const save = () => {
        setIntParams([Math.max(0, baseItemId), Math.max(0, quantity)]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save}>
            <div className="flex flex-col gap-2">
                <Text bold>{localizeWithFallback('wiredfurni.chest.furni.base_item', 'Furni to store')}</Text>
                <ChestFurniIconPreview baseItemId={baseItemId} />
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={baseItemId}
                    onChange={(event) => setBaseItemId(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <Text bold>{localizeWithFallback('wiredfurni.chest.furni.quantity', 'Quantity stored')}</Text>
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <Text small className="text-black/50">
                    {localizeWithFallback('wiredfurni.chest.furni.quantity.hint', 'How many of this furni the chest holds.')}
                </Text>
            </div>
        </WiredExtraBaseView>
    );
};
