import * as RadixSlider from '@radix-ui/react-slider';
import { FC } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { Button } from './Button';
import { Flex } from './Flex';

export interface SliderProps
{
    min?: number;
    max?: number;
    step?: number;
    value?: number | number[];
    onChange?: (value: number, index: number) => void;
    disabled?: boolean;
    disabledButton?: boolean;
    className?: string;
}

export const Slider: FC<SliderProps> = props =>
{
    const { disabledButton, max, min, step, value, onChange, disabled, className } = props;
    const currentValue = Array.isArray(value) ? value[0] : ((typeof value === 'number') ? value : 0);
    const minimum = (typeof min === 'number') ? min : 0;
    const maximum = (typeof max === 'number') ? max : 0;
    const buttonStep = ((typeof step === 'number') && (step > 0)) ? step : 1;

    const roundToStep = (nextValue: number) =>
    {
        if(typeof buttonStep !== 'number') return nextValue;

        const decimalStep = buttonStep.toString();
        const precision = decimalStep.includes('.') ? (decimalStep.length - decimalStep.indexOf('.') - 1) : 0;

        return parseFloat(nextValue.toFixed(precision));
    };

    const sliderValues = Array.isArray(value) ? value : (typeof value === 'number' ? [ value ] : [ 0 ]);

    return <Flex fullWidth gap={ 1 } classNames={ [ 'nitro-slider-wrapper' ] }>
        { !disabledButton && <Button classNames={ [ 'nitro-slider-button', 'nitro-slider-button-left' ] } disabled={ minimum >= currentValue } onClick={ () => onChange(roundToStep(minimum < currentValue ? currentValue - buttonStep : minimum), 0) }><FaAngleLeft /></Button> }
        <RadixSlider.Root
            className={ `nitro-slider relative flex items-center select-none touch-none w-full h-5 ${className ?? ''}` }
            disabled={ disabled }
            max={ max }
            min={ min }
            step={ step }
            value={ sliderValues }
            onValueChange={ vals => vals.forEach((v, i) => onChange?.(v, i)) }>
            <RadixSlider.Track className="bg-neutral-300 relative grow rounded-full h-1">
                <RadixSlider.Range className="absolute bg-amber-600 rounded-full h-full" />
            </RadixSlider.Track>
            { sliderValues.map((_, i) => (
                <RadixSlider.Thumb key={ i } className="block w-4 h-4 bg-white border border-neutral-400 shadow rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500" />
            )) }
        </RadixSlider.Root>
        { !disabledButton && <Button classNames={ [ 'nitro-slider-button', 'nitro-slider-button-right' ] } disabled={ maximum <= currentValue } onClick={ () => onChange(roundToStep(maximum > currentValue ? currentValue + buttonStep : maximum), 0) }><FaAngleRight /></Button> }
    </Flex>;
}
