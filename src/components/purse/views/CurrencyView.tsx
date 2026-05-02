import * as Tooltip from '@radix-ui/react-tooltip';
import { FC, useMemo } from 'react';
import { LocalizeFormattedNumber, LocalizeShortNumber } from '../../../api';
import { Flex, LayoutCurrencyIcon, Text } from '../../../common';

interface CurrencyViewProps
{
    type: number;
    amount: number;
    short: boolean;
}

export const CurrencyView: FC<CurrencyViewProps> = props =>
{
    const { type = -1, amount = -1, short = false } = props;

    const element = useMemo(() =>
    {
        return (
            <Flex justifyContent="end" pointer gap={ 1 } className={`nitro-purse-button rounded allcurrencypurse nitro-purse-button currency-${type}`}>
                <Text truncate textEnd variant="white" grow>{ short ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount) }</Text>
                <LayoutCurrencyIcon type={ type } />
            </Flex>);
    }, [ amount, short, type ]);

    if(!short) return element;

    return (
        <Tooltip.Provider delayDuration={ 200 }>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    { element }
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side="left"
                        sideOffset={ 4 }
                        className="z-50 rounded bg-black/85 px-2 py-1 text-xs text-white shadow-md">
                        { LocalizeFormattedNumber(amount) }
                        <Tooltip.Arrow className="fill-black/85" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}
