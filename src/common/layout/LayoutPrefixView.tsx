import { FC } from 'react';
import { parsePrefixColors, getPrefixEffectStyle, PREFIX_EFFECT_KEYFRAMES } from '../../api';

interface LayoutPrefixViewProps
{
    text: string;
    color: string;
    icon?: string;
    effect?: string;
    className?: string;
    textSize?: string;
}

export const LayoutPrefixView: FC<LayoutPrefixViewProps> = ({ text, color, icon = '', effect = '', className = '', textSize = 'text-sm' }) =>
{
    if(!text) return null;

    const colors = parsePrefixColors(text, color);
    const hasMultiColor = colors.length > 1 && new Set(colors).size > 1;
    const fxStyle = getPrefixEffectStyle(effect, colors[0] || '#FFFFFF');

    return (
        <span className={ `font-bold ${ textSize } ${ className }` } style={ fxStyle }>
            { effect && <style>{ PREFIX_EFFECT_KEYFRAMES }</style> }
            { icon && <span className="mr-0.5">{ icon }</span> }
            <span style={ hasMultiColor ? fxStyle : { ...fxStyle, color: colors[0] || '#FFFFFF' } }>
                {'{'}
                { hasMultiColor
                    ? [ ...text ].map((char, i) => (
                        <span key={ i } style={ { color: colors[i] || colors[colors.length - 1], ...getPrefixEffectStyle(effect, colors[i]) } }>{ char }</span>
                    ))
                    : text
                }
                {'}'}
            </span>
        </span>
    );
};
