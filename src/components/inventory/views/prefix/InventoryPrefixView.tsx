import { FC, useEffect, useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { IPrefixItem, LocalizeText, parsePrefixColors, getPrefixEffectStyle, getPrefixLetterStyle, isPerLetterEffect, ensurePrefixKeyframes, PRESET_PREFIX_EFFECTS, getGradientStyle } from '../../../../api';
import { useInventoryPrefixes, useNotification } from '../../../../hooks';
import { NitroButton } from '../../../../layout';

// ── Prefix preview (shared) ─────────────────────────────────────────
const PrefixPreview: FC<{ text: string; color: string; icon: string; effect?: string; className?: string; textSize?: string }> = ({ text, color, icon, effect = '', className = '', textSize = 'text-sm' }) =>
{
    const colors = parsePrefixColors(text, color);
    const hasMultiColor = colors.length > 1 && new Set(colors).size > 1;
    const fxStyle = getPrefixEffectStyle(effect, colors[0] || '#FFFFFF');
    const useGradient = effect === 'gradient' && hasMultiColor;
    const gradientStyle = useGradient ? getGradientStyle(colors) : {};
    const perLetter = isPerLetterEffect(effect);

    return (
        <span className={ `font-bold ${ textSize } ${ className }` } style={ { ...fxStyle, ...gradientStyle } }>
            { icon && <span className="mr-0.5">{ icon }</span> }
            <span style={ !useGradient && !hasMultiColor && !perLetter ? { ...fxStyle, color: colors[0] || '#FFFFFF' } : fxStyle }>
                {'{'}
                { perLetter
                    ? [ ...text ].map((char, i) => (
                        <span key={ i } style={ { color: colors[i] || colors[colors.length - 1] || '#FFFFFF', ...getPrefixLetterStyle(effect, i, colors[i]) } }>{ char }</span>
                    ))
                    : hasMultiColor && !useGradient
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

// ── Prefix card ──────────────────────────────────────────────────────
const PrefixItemView: FC<{
    prefix: IPrefixItem;
    isSelected: boolean;
    onClick: () => void;
}> = ({ prefix, isSelected, onClick }) =>
{
    return (
        <div
            className={ `flex items-center justify-center rounded-md cursor-pointer p-2 transition-all duration-150
                ${ isSelected ? 'bg-card-grid-item-active scale-105 border-2 border-card-grid-item-active' : 'bg-card-grid-item hover:bg-card-grid-item-active/50 border-2 border-card-grid-item-border' }
                ${ prefix.active ? 'ring-2 ring-green-400' : '' }` }
            onClick={ onClick }>
            <PrefixPreview className="truncate" color={ prefix.color } effect={ prefix.effect } icon={ prefix.icon } text={ prefix.text } />
        </div>
    );
};

// ── Main view ────────────────────────────────────────────────────────
export const InventoryPrefixView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { prefixes = [], activePrefix = null, selectedPrefix = null, setSelectedPrefix = null, activatePrefix = null, deactivatePrefix = null, deletePrefix = null, activate = null, deactivate = null } = useInventoryPrefixes();
    const { showConfirm = null } = useNotification();

    useEffect(() => { ensurePrefixKeyframes(); }, []);

    const attemptDeletePrefix = () =>
    {
        if(!selectedPrefix) return;

        showConfirm(
            `Are you sure you want to delete the prefix {${ selectedPrefix.text }}?`,
            () => deletePrefix(selectedPrefix.id),
            null,
            null,
            null,
            LocalizeText('inventory.delete.confirm_delete.title')
        );
    };

    useEffect(() =>
    {
        if(!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    const selectedEffectInfo = selectedPrefix ? PRESET_PREFIX_EFFECTS.find(fx => fx.id === selectedPrefix.effect) : null;

    return (
        <div className="grid h-full grid-cols-12 gap-2">
            { /* Prefix grid */ }
            <div className="flex flex-col col-span-7 gap-1 overflow-auto">
                <div className="grid grid-cols-3 gap-1">
                    { prefixes.map(prefix => (
                        <PrefixItemView
                            key={ prefix.id }
                            isSelected={ selectedPrefix?.id === prefix.id }
                            prefix={ prefix }
                            onClick={ () => setSelectedPrefix(prefix) } />
                    )) }
                </div>
                { (!prefixes || prefixes.length === 0) &&
                    <div className="flex items-center justify-center h-full text-sm opacity-50">
                        { LocalizeText('inventory.empty.title') }
                    </div> }
            </div>

            { /* Details panel */ }
            <div className="flex flex-col justify-between col-span-5 overflow-auto">
                { /* Active prefix indicator */ }
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">Active prefix</span>
                    { activePrefix
                        ? (
                            <div className="flex items-center justify-center p-3 rounded-md border-2 border-green-400 bg-card-grid-item"
                                style={ { boxShadow: '0 0 8px rgba(74,222,128,0.2)' } }>
                                <PrefixPreview color={ activePrefix.color } effect={ activePrefix.effect } icon={ activePrefix.icon } text={ activePrefix.text } textSize="text-lg" />
                            </div>
                        )
                        : (
                            <div className="flex items-center justify-center p-3 rounded-md border-2 border-dashed border-card-grid-item-border bg-card-grid-item opacity-50">
                                <span className="text-xs">No active prefix</span>
                            </div>
                        )
                    }
                </div>

                { /* Selected prefix detail */ }
                { !!selectedPrefix && (
                    <div className="flex flex-col gap-2 mt-2">
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-card-grid-item border-2 border-card-grid-item-border">
                            <PrefixPreview color={ selectedPrefix.color } effect={ selectedPrefix.effect } icon={ selectedPrefix.icon } text={ selectedPrefix.text } textSize="text-lg" />
                            { selectedEffectInfo && selectedEffectInfo.id && (
                                <span className="text-[9px] font-medium opacity-60 px-2 py-0.5">
                                    { selectedEffectInfo.icon } { selectedEffectInfo.label }
                                </span>
                            ) }
                        </div>

                        { /* Actions */ }
                        <div className="flex items-center gap-1.5">
                            <NitroButton
                                className="grow text-xs"
                                onClick={ () => selectedPrefix.active ? deactivatePrefix() : activatePrefix(selectedPrefix.id) }>
                                { selectedPrefix.active ? 'Deactivate' : 'Activate' }
                            </NitroButton>
                            { !selectedPrefix.active &&
                                <NitroButton className="bg-danger! hover:bg-danger/80! p-1" onClick={ attemptDeletePrefix }>
                                    <FaTrashAlt className="fa-icon" />
                                </NitroButton> }
                        </div>
                    </div>
                ) }
            </div>
        </div>
    );
};
