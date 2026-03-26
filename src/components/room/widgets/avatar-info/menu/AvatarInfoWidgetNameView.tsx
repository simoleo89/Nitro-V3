import { GetSessionDataManager } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { AvatarInfoName, parsePrefixColors, getPrefixEffectStyle, getPrefixLetterStyle, isPerLetterEffect, ensurePrefixKeyframes, getGradientStyle } from '../../../../../api';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

interface AvatarInfoWidgetNameViewProps
{
    nameInfo: AvatarInfoName;
    onClose: () => void;
}

export const AvatarInfoWidgetNameView: FC<AvatarInfoWidgetNameViewProps> = props =>
{
    const { nameInfo = null, onClose = null } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'name-only' ];

        if(nameInfo.isFriend) newClassNames.push('is-friend');

        return newClassNames;
    }, [ nameInfo ]);

    const hasPrefix = !!nameInfo.prefixText;

    if(hasPrefix) ensurePrefixKeyframes();

    const prefixElement = useMemo(() =>
    {
        if(!hasPrefix) return null;

        const colors = parsePrefixColors(nameInfo.prefixText, nameInfo.prefixColor);
        const hasMultiColor = colors.length > 1 && new Set(colors).size > 1;
        const fxStyle = getPrefixEffectStyle(nameInfo.prefixEffect, colors[0] || '#FFFFFF');
        const useGradient = nameInfo.prefixEffect === 'gradient' && hasMultiColor;
        const gradientStyle = useGradient ? getGradientStyle(colors) : {};
        const perLetter = isPerLetterEffect(nameInfo.prefixEffect);

        return (
            <span className="font-bold mr-1 text-[11px]" style={ { ...fxStyle, ...gradientStyle } }>
                { nameInfo.prefixIcon && <span className="mr-0.5">{ nameInfo.prefixIcon }</span> }
                <span style={ !useGradient && !hasMultiColor && !perLetter ? { ...fxStyle, color: colors[0] || '#FFFFFF' } : fxStyle }>
                    {'{'}
                    { perLetter
                        ? [ ...nameInfo.prefixText ].map((char, i) => (
                            <span key={ i } style={ { color: colors[i] || colors[colors.length - 1] || '#FFFFFF', ...getPrefixLetterStyle(nameInfo.prefixEffect, i, colors[i]) } }>{ char }</span>
                        ))
                        : hasMultiColor && !useGradient
                            ? [ ...nameInfo.prefixText ].map((char, i) => (
                                <span key={ i } style={ { color: colors[i] || colors[colors.length - 1], ...getPrefixEffectStyle(nameInfo.prefixEffect, colors[i]) } }>{ char }</span>
                            ))
                            : nameInfo.prefixText
                    }
                    {'}'}
                </span>
            </span>
        );
    }, [ hasPrefix, nameInfo.prefixText, nameInfo.prefixColor, nameInfo.prefixIcon, nameInfo.prefixEffect ]);

    return (
        <ContextMenuView category={ nameInfo.category } classNames={ getClassNames } fades={ (nameInfo.id !== GetSessionDataManager().userId) } objectId={ nameInfo.roomIndex } userType={ nameInfo.userType } onClose={ onClose }>
            <div className="text-shadow flex items-center justify-center">
                { prefixElement }
                <span dangerouslySetInnerHTML={ { __html: nameInfo.name } } />
            </div>
        </ContextMenuView>
    );
};
