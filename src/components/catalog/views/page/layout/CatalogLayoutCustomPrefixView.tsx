import { PurchasePrefixComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, SanitizeHtml, SendMessageComposer, PRESET_PREFIX_EFFECTS, parsePrefixColors, PREFIX_EFFECT_KEYFRAMES } from '../../../../../api';
import { LayoutPrefixView } from '../../../../../layout';
import { CatalogLayoutProps } from './CatalogLayout.types';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const PRESET_COLORS: string[] = [
    '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#00CCFF',
    '#0066FF', '#9933FF', '#FF33CC', '#FFFFFF', '#CCCCCC',
    '#999999', '#333333', '#FF9999', '#99FF99', '#9999FF',
    '#FFD700', '#FF4500', '#00CED1', '#8A2BE2', '#DC143C'
];

export const CatalogLayoutCustomPrefixView: FC<CatalogLayoutProps> = props =>
{
    const { page = null, hideNavigation = null } = props;

    useEffect(() =>
    {
        hideNavigation();
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
    const [ purchased, setPurchased ] = useState(false);

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
        if(!isValid) return;
        SendMessageComposer(new PurchasePrefixComposer(prefixText.trim(), colorString, selectedIcon, selectedEffect));
        setPurchased(true);
        setTimeout(() => setPurchased(false), 2000);
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
            if(colorMode === 'single')
            {
                setSingleColor(value);
            }
            else if(selectedLetterIndex !== null)
            {
                setLetterColors(prev => ({ ...prev, [selectedLetterIndex]: value }));
            }
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
            <style>{ PREFIX_EFFECT_KEYFRAMES }</style>

            { /* Header */ }
            { page.localization.getImage(0) &&
                <img alt="" className="w-full rounded" src={ page.localization.getImage(0) } /> }
            { page.localization.getText(0) &&
                <div className="text-sm mb-1" dangerouslySetInnerHTML={ { __html: SanitizeHtml(page.localization.getText(0)) } } /> }

            { /* Live Preview */ }
            <div className="relative flex items-center justify-center p-4 rounded-lg min-h-14 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border border-white/10 shadow-inner">
                <div className="absolute inset-0 rounded-lg opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(100,149,237,0.3)_0%,transparent_70%)]" />
                <LayoutPrefixView className="relative tracking-wide" color={ colorString || '#FFFFFF' } effect={ selectedEffect } icon={ selectedIcon } text={ prefixText || '...' } textSize="text-xl" />
                <span className="relative ml-2 text-white/80 text-lg font-medium">Username</span>
            </div>

            { /* Text + Icon Row */ }
            <div className="flex gap-2">
                <div className="flex flex-col gap-0.5 flex-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.text') }</label>
                    <div className="relative">
                        <input
                            className="w-full px-3 py-1.5 rounded-md text-sm bg-black/15 border border-black/15 focus:outline-none focus:border-blue-500/40 transition-all"
                            maxLength={ 15 }
                            placeholder={ LocalizeText('catalog.prefix.text.placeholder') }
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
                            className={ `flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all min-w-[70px] border ${ selectedIcon ? 'bg-blue-500/15 border-blue-500/30' : 'bg-black/15 border-black/15' }` }
                            onClick={ () => setShowIconPicker(!showIconPicker) }>
                            { selectedIcon
                                ? <><span className="text-base">{ selectedIcon }</span><span className="text-[10px] opacity-40">&#x25BC;</span></>
                                : <span className="opacity-40 text-xs">Emoji &#x25BC;</span>
                            }
                        </button>
                        { selectedIcon &&
                            <button
                                className="flex items-center justify-center px-1.5 rounded-md text-xs bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-all"
                                title={ LocalizeText('catalog.prefix.icon.remove') }
                                onClick={ () => setSelectedIcon('') }>
                                &#x2715;
                            </button>
                        }
                    </div>
                </div>
            </div>

            { /* Emoji Picker */ }
            { showIconPicker && (
                <>
                    <div className="fixed inset-0 z-[999] bg-black/50" onClick={ () => setShowIconPicker(false) } />
                    <div className="fixed z-[1000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-2xl">
                        <Picker
                            data={ data }
                            locale="it"
                            onEmojiSelect={ (emoji: { native: string }) => { setSelectedIcon(emoji.native); setShowIconPicker(false); } }
                            theme="dark"
                            previewPosition="none"
                            skinTonePosition="search"
                            perLine={ 8 }
                            maxFrequentRows={ 2 }
                            emojiSize={ 22 }
                            emojiButtonSize={ 30 }
                            dynamicWidth={ false }
                            set="native"
                        />
                    </div>
                </>
            ) }

            { /* Effect Selector */ }
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.effect') }</label>
                <div className="flex flex-wrap gap-1">
                    { PRESET_PREFIX_EFFECTS.map(fx => (
                        <button
                            key={ fx.id }
                            className={ `px-2 py-1 rounded-md text-[11px] font-semibold transition-all border ${ selectedEffect === fx.id ? 'bg-blue-500/25 border-blue-500/40 opacity-100' : 'bg-black/10 border-black/10 opacity-70 hover:opacity-100' }` }
                            onClick={ () => setSelectedEffect(fx.id) }>
                            <span className="mr-0.5">{ fx.icon }</span> { fx.label }
                        </button>
                    )) }
                </div>
            </div>

            { /* Color Mode Toggle */ }
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.color') }</label>
                <div className="flex rounded-md overflow-hidden border border-black/15">
                    <button
                        className={ `flex-1 px-2 py-1.5 text-xs font-bold transition-all border-r border-black/10 ${ colorMode === 'single' ? 'bg-blue-500/25 opacity-100' : 'bg-black/10 opacity-60 hover:opacity-80' }` }
                        onClick={ () => { setColorMode('single'); setSelectedLetterIndex(null); } }>
                        { LocalizeText('catalog.prefix.color.single') }
                    </button>
                    <button
                        className={ `flex-1 px-2 py-1.5 text-xs font-bold transition-all ${ colorMode === 'perLetter' ? 'bg-blue-500/25 opacity-100' : 'bg-black/10 opacity-60 hover:opacity-80' }` }
                        onClick={ () => { setColorMode('perLetter'); if(prefixText.length > 0) setSelectedLetterIndex(0); } }>
                        { LocalizeText('catalog.prefix.color.per.letter') }
                    </button>
                </div>
            </div>

            { /* Per-Letter Selector */ }
            { colorMode === 'perLetter' && prefixText.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-50">
                            { LocalizeText('catalog.prefix.color.hint') }
                        </span>
                        <button
                            className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 border border-black/10 hover:bg-black/20 transition-all"
                            title={ LocalizeText('catalog.prefix.color.apply.all.title') }
                            onClick={ applyColorToAll }>
                            { LocalizeText('catalog.prefix.color.apply.all') }
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-black/10 border border-black/10">
                        { [ ...prefixText ].map((char, i) =>
                        {
                            const charColor = letterColors[i] || singleColor;
                            const isSelected = selectedLetterIndex === i;
                            return (
                                <div
                                    key={ i }
                                    className={ `relative flex items-center justify-center w-7 h-[34px] rounded-md cursor-pointer transition-all ${ isSelected ? 'bg-blue-500/20 border-2 border-blue-500/60 scale-115 z-10 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-black/10 border border-black/10 z-[1]' }` }
                                    onClick={ () => { setSelectedLetterIndex(i); setCustomColorInput(charColor); } }>
                                    <span className="text-sm font-black" style={ { color: charColor } }>
                                        { char }
                                    </span>
                                    <div
                                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-[3px] rounded-full"
                                        style={ { backgroundColor: charColor, boxShadow: `0 0 4px ${ charColor }` } } />
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
                <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1">
                    { PRESET_COLORS.map((color, idx) =>
                    {
                        const isActive = currentActiveColor === color;
                        return (
                            <div
                                key={ idx }
                                className={ `aspect-square rounded cursor-pointer transition-all duration-100 border-2 ${ isActive ? 'scale-110 border-white shadow-lg z-[5]' : 'border-transparent hover:scale-105 z-[1]' }` }
                                style={ { backgroundColor: color } }
                                onClick={ () => handleColorSelect(color) } />
                        );
                    }) }
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <label className="relative cursor-pointer w-6 h-6 rounded-md border-2 border-black/20 overflow-hidden"
                        style={ { backgroundColor: customColorInput } }>
                        <input
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            type="color"
                            value={ customColorInput }
                            onChange={ e => handleColorSelect(e.target.value) } />
                    </label>
                    <input
                        className="flex-1 max-w-20 px-2 py-0.5 text-xs font-mono bg-black/15 border border-black/10 rounded-[5px] focus:outline-none focus:border-blue-500/40 transition-all"
                        maxLength={ 7 }
                        placeholder="#FFFFFF"
                        type="text"
                        value={ customColorInput }
                        onChange={ e => handleCustomColorChange(e.target.value) } />
                </div>
            </div>

            { /* Purchase Footer */ }
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/10">
                <div className="flex items-center gap-1">
                    <span className="text-xs opacity-60">{ LocalizeText('catalog.prefix.price') }</span>
                    <span className="text-sm font-bold">{ LocalizeText('catalog.prefix.price.amount') }</span>
                </div>
                <button
                    className={ `px-5 py-1.5 rounded-md text-sm font-bold transition-all ${ !isValid ? 'bg-black/10 text-black/30 border border-black/10 cursor-not-allowed' : purchased ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:scale-105' }` }
                    disabled={ !isValid || purchased }
                    onClick={ handlePurchase }>
                    { purchased ? LocalizeText('catalog.prefix.purchased') : LocalizeText('catalog.prefix.purchase') }
                </button>
            </div>
        </div>
    );
};
