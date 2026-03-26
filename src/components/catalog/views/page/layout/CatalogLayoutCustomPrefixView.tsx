import { PurchasePrefixComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText, SanitizeHtml, SendMessageComposer, PRESET_PREFIX_EFFECTS, parsePrefixColors, getPrefixEffectStyle, getPrefixLetterStyle, isPerLetterEffect, ensurePrefixKeyframes, getGradientStyle } from '../../../../../api';
import { CatalogLayoutProps } from './CatalogLayout.types';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const PRESET_COLORS: string[] = [
    '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#00CCFF',
    '#0066FF', '#9933FF', '#FF33CC', '#FFFFFF', '#CCCCCC',
    '#999999', '#333333', '#FF9999', '#99FF99', '#9999FF',
    '#FFD700', '#FF4500', '#00CED1', '#8A2BE2', '#DC143C'
];

// ── Effect chip ──────────────────────────────────────────────────────
const EffectChip: FC<{
    fx: typeof PRESET_PREFIX_EFFECTS[number];
    isSelected: boolean;
    onClick: () => void;
}> = ({ fx, isSelected, onClick }) =>
{
    return (
        <button
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
            style={ {
                background: isSelected ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)',
                border: isSelected ? '1.5px solid rgba(59,130,246,0.5)' : '1px solid rgba(0,0,0,0.1)',
                opacity: isSelected ? 1 : 0.7,
                boxShadow: isSelected ? '0 0 8px rgba(59,130,246,0.2)' : 'none',
            } }
            onClick={ onClick }>
            <span>{ fx.icon }</span>
            <span>{ fx.label }</span>
        </button>
    );
};

// ── Prefix text preview (shared) ─────────────────────────────────────
const PrefixPreviewText: FC<{
    text: string;
    colors: string[];
    effect: string;
    icon: string;
    textClass?: string;
}> = ({ text, colors, effect, icon, textClass = '' }) =>
{
    const hasMultiColor = colors.length > 1 && new Set(colors).size > 1;
    const fxStyle = getPrefixEffectStyle(effect, colors[0] || '#FFFFFF');
    const useGradient = effect === 'gradient' && hasMultiColor;
    const gradientStyle = useGradient ? getGradientStyle(colors) : {};
    const perLetter = isPerLetterEffect(effect);

    return (
        <span className={ `font-bold ${ textClass }` } style={ { ...fxStyle, ...gradientStyle } }>
            { icon && <span className="mr-0.5">{ icon }</span> }
            <span style={ !useGradient && !hasMultiColor && !perLetter ? { color: colors[0] || '#FFFFFF' } : fxStyle }>
                {'{'}
                { perLetter
                    ? [ ...(text || '...') ].map((char, i) => (
                        <span key={ i } style={ { color: colors[i] || colors[colors.length - 1] || '#FFFFFF', ...getPrefixLetterStyle(effect, i, colors[i]) } }>{ char }</span>
                    ))
                    : hasMultiColor && !useGradient
                        ? [ ...(text || '...') ].map((char, i) => (
                            <span key={ i } style={ { color: colors[i] || colors[colors.length - 1], ...getPrefixEffectStyle(effect, colors[i]) } }>{ char }</span>
                        ))
                        : (text || '...')
                }
                {'}'}
            </span>
        </span>
    );
};

// ── Main component ───────────────────────────────────────────────────
export const CatalogLayoutCustomPrefixView: FC<CatalogLayoutProps> = props =>
{
    const { page = null, hideNavigation = null } = props;

    useEffect(() =>
    {
        hideNavigation();
        ensurePrefixKeyframes();
    }, [ page, hideNavigation ]);

    const [ prefixText, setPrefixText ] = useState('');
    const [ colorMode, setColorMode ] = useState<'single' | 'perLetter'>('single');
    const [ singleColor, setSingleColor ] = useState('#FFFFFF');
    const [ letterColors, setLetterColors ] = useState<Record<number, string>>({});
    const [ selectedLetterIndex, setSelectedLetterIndex ] = useState<number | null>(null);
    const [ customColorInput, setCustomColorInput ] = useState('#FFFFFF');
    const [ selectedIcon, setSelectedIcon ] = useState('');
    const [ showIconPicker, setShowIconPicker ] = useState(false);
    const [ selectedEffect, setSelectedEffect ] = useState('');
    const [ purchaseState, setPurchaseState ] = useState<'idle' | 'sending' | 'success'>('idle');
    const purchaseTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const colorString = useMemo(() =>
    {
        if(colorMode === 'single') return singleColor;
        if(!prefixText.length) return singleColor;
        return [ ...prefixText ].map((_, i) => letterColors[i] || singleColor).join(',');
    }, [ colorMode, singleColor, letterColors, prefixText ]);

    const previewColors = useMemo(() =>
    {
        return parsePrefixColors(prefixText || '...', colorString || '#FFFFFF');
    }, [ prefixText, colorString ]);

    const isValid = useMemo(() =>
    {
        if(!prefixText.trim().length || prefixText.trim().length > 15) return false;
        if(colorMode === 'single') return /^#[0-9A-Fa-f]{6}$/.test(singleColor);
        const colors = colorString.split(',');
        return colors.every(c => /^#[0-9A-Fa-f]{6}$/.test(c));
    }, [ prefixText, colorMode, singleColor, colorString ]);

    const handlePurchase = () =>
    {
        if(!isValid || purchaseState !== 'idle') return;

        setPurchaseState('sending');
        SendMessageComposer(new PurchasePrefixComposer(prefixText.trim(), colorString, selectedIcon, selectedEffect));

        if(purchaseTimeoutRef.current) clearTimeout(purchaseTimeoutRef.current);
        purchaseTimeoutRef.current = setTimeout(() =>
        {
            setPurchaseState('success');
            setTimeout(() => setPurchaseState('idle'), 2000);
        }, 1500);
    };

    const handleColorSelect = (color: string) =>
    {
        if(colorMode === 'single')
        {
            setSingleColor(color);
            setCustomColorInput(color);
        }
        else if(selectedLetterIndex !== null)
        {
            setLetterColors(prev => ({ ...prev, [selectedLetterIndex]: color }));
            setCustomColorInput(color);

            if(selectedLetterIndex < prefixText.length - 1)
            {
                const nextIdx = selectedLetterIndex + 1;
                setSelectedLetterIndex(nextIdx);
                setCustomColorInput(letterColors[nextIdx] || singleColor);
            }
        }
    };

    const handleCustomColorChange = (value: string) =>
    {
        setCustomColorInput(value);
        if(/^#[0-9A-Fa-f]{6}$/.test(value))
        {
            if(colorMode === 'single') setSingleColor(value);
            else if(selectedLetterIndex !== null) setLetterColors(prev => ({ ...prev, [selectedLetterIndex]: value }));
        }
    };

    const handleTextChange = (newText: string) =>
    {
        setPrefixText(newText);
        if(selectedLetterIndex !== null && selectedLetterIndex >= newText.length)
        {
            setSelectedLetterIndex(newText.length > 0 ? newText.length - 1 : null);
        }
    };

    const applyColorToAll = () =>
    {
        if(!prefixText.length) return;
        const newColors: Record<number, string> = {};
        [ ...prefixText ].forEach((_, i) => { newColors[i] = customColorInput; });
        setLetterColors(newColors);
    };

    const currentActiveColor = colorMode === 'single'
        ? singleColor
        : (selectedLetterIndex !== null ? (letterColors[selectedLetterIndex] || singleColor) : singleColor);

    return (
        <div className="flex flex-col gap-2 h-full overflow-auto p-1">
            { /* Header */ }
            { page.localization.getImage(0) &&
                <img alt="" className="w-full rounded" src={ page.localization.getImage(0) } /> }
            { page.localization.getText(0) &&
                <div className="text-sm mb-1" dangerouslySetInnerHTML={ { __html: SanitizeHtml(page.localization.getText(0)) } } /> }

            { /* Live Preview — Chat Bubble Mockup */ }
            <div className="relative rounded-lg overflow-hidden"
                style={ {
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)',
                    padding: '16px',
                } }>
                <div className="absolute inset-0 opacity-20"
                    style={ { background: 'radial-gradient(ellipse at center, rgba(100,149,237,0.3) 0%, transparent 70%)' } } />
                <div className="relative flex items-start gap-2">
                    <div className="w-[30px] h-[30px] rounded-full bg-white/10 shrink-0" />
                    <div className="relative rounded-lg px-3 py-2 min-w-[120px]"
                        style={ { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' } }>
                        <div className="flex items-baseline gap-1 text-sm">
                            <span className="text-base">
                                <PrefixPreviewText colors={ previewColors } effect={ selectedEffect } icon={ selectedIcon } text={ prefixText } />
                            </span>
                            <b className="text-white/90">Username:</b>
                            <span className="text-white/60">Hello world!</span>
                        </div>
                        <div className="absolute -bottom-[5px] left-[20px] w-0 h-0"
                            style={ { borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(255,255,255,0.08)' } } />
                    </div>
                </div>
            </div>

            { /* Text + Icon Row */ }
            <div className="flex gap-2">
                <div className="flex flex-col gap-0.5 flex-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.text') }</label>
                    <div className="relative">
                        <input
                            className="w-full px-3 py-1.5 rounded-md text-sm focus:outline-none transition-all"
                            maxLength={ 15 }
                            placeholder={ LocalizeText('catalog.prefix.text.placeholder') }
                            style={ { background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.15)', color: 'inherit' } }
                            type="text"
                            value={ prefixText }
                            onChange={ e => handleTextChange(e.target.value) } />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-30 font-mono">
                            { prefixText.length }/15
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5 relative">
                    <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.icon') }</label>
                    <div className="flex gap-1">
                        <button
                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all min-w-[70px]"
                            style={ {
                                background: selectedIcon ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.15)',
                                border: selectedIcon ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(0,0,0,0.15)'
                            } }
                            onClick={ () => setShowIconPicker(!showIconPicker) }>
                            { selectedIcon
                                ? <><span className="text-base">{ selectedIcon }</span><span className="text-[10px] opacity-40">&darr;</span></>
                                : <span className="opacity-40 text-xs">Emoji &darr;</span>
                            }
                        </button>
                        { selectedIcon &&
                            <button
                                className="flex items-center justify-center px-1.5 rounded-md text-xs transition-all"
                                style={ { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' } }
                                onClick={ () => setSelectedIcon('') }>
                                &times;
                            </button>
                        }
                    </div>
                </div>
            </div>

            { /* Emoji Picker */ }
            { showIconPicker && (
                <>
                    <div className="fixed inset-0" style={ { zIndex: 999, background: 'rgba(0,0,0,0.5)' } } onClick={ () => setShowIconPicker(false) } />
                    <div className="fixed rounded-xl overflow-hidden" style={ { zIndex: 1000, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' } }>
                        <Picker
                            data={ data }
                            dynamicWidth={ false }
                            emojiButtonSize={ 30 }
                            emojiSize={ 22 }
                            locale="it"
                            maxFrequentRows={ 2 }
                            perLine={ 8 }
                            previewPosition="none"
                            set="native"
                            skinTonePosition="search"
                            theme="dark"
                            onEmojiSelect={ (emoji: { native: string }) => { setSelectedIcon(emoji.native); setShowIconPicker(false); } }
                        />
                    </div>
                </>
            ) }

            { /* Effect Selector with Rarity */ }
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.effect') }</label>
                <div className="flex flex-wrap gap-1">
                    { PRESET_PREFIX_EFFECTS.map(fx => (
                        <EffectChip key={ fx.id } fx={ fx } isSelected={ selectedEffect === fx.id } onClick={ () => setSelectedEffect(fx.id) } />
                    )) }
                </div>
            </div>

            { /* Color Mode Toggle */ }
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.color') }</label>
                <div className="flex rounded-md overflow-hidden" style={ { border: '1px solid rgba(0,0,0,0.15)' } }>
                    <button
                        className="flex-1 px-2 py-1.5 text-xs font-bold transition-all"
                        style={ { background: colorMode === 'single' ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)', borderRight: '1px solid rgba(0,0,0,0.1)', opacity: colorMode === 'single' ? 1 : 0.6 } }
                        onClick={ () => { setColorMode('single'); setSelectedLetterIndex(null); } }>
                        { LocalizeText('catalog.prefix.color.single') }
                    </button>
                    <button
                        className="flex-1 px-2 py-1.5 text-xs font-bold transition-all"
                        style={ { background: colorMode === 'perLetter' ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)', opacity: colorMode === 'perLetter' ? 1 : 0.6 } }
                        onClick={ () => { setColorMode('perLetter'); if(prefixText.length > 0) setSelectedLetterIndex(0); } }>
                        { LocalizeText('catalog.prefix.color.per.letter') }
                    </button>
                </div>
            </div>

            { /* Per-Letter Selector */ }
            { colorMode === 'perLetter' && prefixText.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-50">{ LocalizeText('catalog.prefix.color.hint') }</span>
                        <button
                            className="text-[10px] px-1.5 py-0.5 rounded transition-all"
                            style={ { background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.1)' } }
                            onClick={ applyColorToAll }>
                            { LocalizeText('catalog.prefix.color.apply.all') }
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1 p-2 rounded-lg" style={ { background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.1)' } }>
                        { [ ...prefixText ].map((char, i) =>
                        {
                            const charColor = letterColors[i] || singleColor;
                            const isSelected = selectedLetterIndex === i;
                            return (
                                <div
                                    key={ i }
                                    className="relative flex items-center justify-center cursor-pointer transition-all"
                                    style={ {
                                        width: '28px', height: '34px', borderRadius: '6px',
                                        background: isSelected ? 'rgba(59,130,246,0.2)' : 'rgba(0,0,0,0.12)',
                                        border: isSelected ? '2px solid rgba(59,130,246,0.6)' : '1px solid rgba(0,0,0,0.08)',
                                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                        zIndex: isSelected ? 10 : 1,
                                        boxShadow: isSelected ? '0 0 8px rgba(59,130,246,0.3)' : 'none'
                                    } }
                                    onClick={ () => { setSelectedLetterIndex(i); setCustomColorInput(charColor); } }>
                                    <span className="text-sm font-black" style={ { color: charColor } }>{ char }</span>
                                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full"
                                        style={ { width: '14px', height: '3px', backgroundColor: charColor, boxShadow: `0 0 4px ${ charColor }` } } />
                                </div>
                            );
                        }) }
                    </div>
                </div>
            ) }

            { /* Color Palette */ }
            <div className="flex flex-col gap-1">
                { colorMode === 'perLetter' && selectedLetterIndex !== null &&
                    <span className="text-[10px] opacity-50 italic">
                        { LocalizeText('catalog.prefix.color.selected') } &quot;{ prefixText[selectedLetterIndex] || '' }&quot;
                    </span>
                }
                <div className="grid gap-1" style={ { gridTemplateColumns: 'repeat(auto-fill, minmax(30px, 1fr))' } }>
                    { PRESET_COLORS.map((color, idx) =>
                    {
                        const isActive = currentActiveColor === color;
                        return (
                            <div
                                key={ idx }
                                className={ `aspect-square rounded cursor-pointer transition-all duration-100 border-2 ${ isActive ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105' }` }
                                style={ {
                                    backgroundColor: color,
                                    boxShadow: isActive ? `0 0 8px ${ color }, 0 0 0 1px rgba(0,0,0,0.3)` : 'inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.15)',
                                    zIndex: isActive ? 5 : 1
                                } }
                                onClick={ () => handleColorSelect(color) } />
                        );
                    }) }
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <label className="relative cursor-pointer shrink-0"
                        style={ { width: '24px', height: '24px', borderRadius: '6px', backgroundColor: customColorInput, border: '2px solid rgba(0,0,0,0.2)', boxShadow: `0 0 6px ${ customColorInput }40, inset 0 1px 0 rgba(255,255,255,0.3)` } }>
                        <input className="absolute inset-0 opacity-0 cursor-pointer" style={ { width: '100%', height: '100%' } } type="color" value={ customColorInput } onChange={ e => handleColorSelect(e.target.value) } />
                    </label>
                    <input
                        className="flex-1 px-2 py-0.5 text-xs font-mono focus:outline-none transition-all"
                        maxLength={ 7 }
                        placeholder="#FFFFFF"
                        style={ { background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.1)', color: 'inherit', maxWidth: '80px', borderRadius: '5px' } }
                        type="text"
                        value={ customColorInput }
                        onChange={ e => handleCustomColorChange(e.target.value) } />
                </div>
            </div>

            { /* Purchase Footer */ }
            <div className="flex items-center justify-between mt-auto pt-2" style={ { borderTop: '1px solid rgba(0,0,0,0.1)' } }>
                <div className="flex items-center gap-1">
                    <span className="text-xs opacity-60">{ LocalizeText('catalog.prefix.price') }</span>
                    <span className="text-sm font-bold">{ LocalizeText('catalog.prefix.price.amount') }</span>
                </div>
                <button
                    className="px-5 py-1.5 rounded-md text-sm font-bold transition-all"
                    disabled={ !isValid || purchaseState !== 'idle' }
                    style={ {
                        background: !isValid ? 'rgba(0,0,0,0.1)' : purchaseState === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : purchaseState === 'sending' ? 'linear-gradient(135deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: !isValid ? 'rgba(0,0,0,0.3)' : '#fff',
                        cursor: !isValid || purchaseState !== 'idle' ? 'not-allowed' : 'pointer',
                        border: !isValid ? '1px solid rgba(0,0,0,0.1)' : 'none',
                        boxShadow: isValid && purchaseState === 'idle' ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                        borderRadius: '6px'
                    } }
                    onClick={ handlePurchase }>
                    { purchaseState === 'success' ? LocalizeText('catalog.prefix.purchased') : purchaseState === 'sending' ? '...' : LocalizeText('catalog.prefix.purchase') }
                </button>
            </div>
        </div>
    );
};
