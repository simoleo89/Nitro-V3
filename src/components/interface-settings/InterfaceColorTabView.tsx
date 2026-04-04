import { RgbaColorPicker, RgbaColor } from 'react-colorful';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaUndo, FaTrash, FaDownload, FaUpload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { LocalizeText, AVAILABLE_FONTS, FONT_SIZE_MIN, FONT_SIZE_MAX, useUiSettings } from '../../api';
import { Flex, Text } from '../../common';

const hexToRgba = (hex: string, a = 1): RgbaColor =>
{
    const num = parseInt(hex.replace('#', ''), 16);
    return { r: (num >> 16) & 0xFF, g: (num >> 8) & 0xFF, b: num & 0xFF, a };
};

const rgbaToHex = (rgba: RgbaColor): string =>
{
    return '#' + ((1 << 24) + (rgba.r << 16) + (rgba.g << 8) + rgba.b).toString(16).slice(1);
};

export const InterfaceColorTabView: FC<{}> = () =>
{
    const { settings, updateSettings, resetSettings } = useUiSettings();
    const [ color, setColor ] = useState<RgbaColor>(() => hexToRgba(settings.headerColor, settings.headerAlpha / 100));
    const [ importValue, setImportValue ] = useState('');
    const [ showImport, setShowImport ] = useState(false);
    const [ showAdvanced, setShowAdvanced ] = useState(false);
    const [ copyFeedback, setCopyFeedback ] = useState(false);
    const previewTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const hexColor = useMemo(() => rgbaToHex(color), [ color ]);
    const alphaPercent = useMemo(() => Math.round((color.a ?? 1) * 100), [ color ]);

    // Live preview with debounce
    useEffect(() =>
    {
        if(previewTimerRef.current) clearTimeout(previewTimerRef.current);

        previewTimerRef.current = setTimeout(() =>
        {
            updateSettings({
                colorMode: 'color',
                headerColor: hexColor,
                headerAlpha: alphaPercent
            });
        }, 50);

        return () =>
        {
            if(previewTimerRef.current) clearTimeout(previewTimerRef.current);
        };
    }, [ hexColor, alphaPercent ]);

    const onHexInput = useCallback((value: string) =>
    {
        const clean = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
        if(clean.length === 6)
        {
            const rgba = hexToRgba('#' + clean, color.a);
            setColor(rgba);
        }
    }, [ color.a ]);

    const onRgbInput = useCallback((channel: 'r' | 'g' | 'b', value: number) =>
    {
        const clamped = Math.max(0, Math.min(255, value || 0));
        setColor(prev => ({ ...prev, [channel]: clamped }));
    }, []);

    const onAlphaInput = useCallback((value: number) =>
    {
        const clamped = Math.max(0, Math.min(100, value || 0));
        setColor(prev => ({ ...prev, a: clamped / 100 }));
    }, []);

    const onSecondaryHexInput = useCallback((value: string) =>
    {
        const clean = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
        if(clean.length === 6)
        {
            updateSettings({ secondaryColor: '#' + clean });
        }
    }, [ updateSettings ]);

    const onClearSecondary = useCallback(() =>
    {
        updateSettings({ secondaryColor: undefined });
    }, [ updateSettings ]);

    const onFontChange = useCallback((fontName: string) =>
    {
        updateSettings({ fontFamily: fontName });
    }, [ updateSettings ]);

    const onFontSizeChange = useCallback((size: number) =>
    {
        updateSettings({ fontSize: Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, size)) });
    }, [ updateSettings ]);

    const onReset = useCallback(() =>
    {
        resetSettings();
        setColor(hexToRgba('#1E7295', 1));
    }, [ resetSettings ]);

    const onDelete = useCallback(() =>
    {
        updateSettings({ colorMode: 'default', secondaryColor: undefined, accentColor: undefined, fontFamily: 'Ubuntu', fontSize: 14 });
        setColor(hexToRgba('#1E7295', 1));
    }, [ updateSettings ]);

    const onExport = useCallback(() =>
    {
        const data = JSON.stringify({
            color: hexColor,
            alpha: alphaPercent,
            mode: settings.colorMode,
            image: settings.headerImageUrl,
            secondary: settings.secondaryColor,
            font: settings.fontFamily,
            fontSize: settings.fontSize
        });

        navigator.clipboard.writeText(data);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    }, [ hexColor, alphaPercent, settings ]);

    const onImport = useCallback(() =>
    {
        try
        {
            const data = JSON.parse(importValue);

            if(data.color)
            {
                const alpha = data.alpha ?? 100;
                setColor(hexToRgba(data.color, alpha / 100));
                updateSettings({
                    colorMode: data.mode || 'color',
                    headerColor: data.color,
                    headerAlpha: alpha,
                    headerImageUrl: data.image || '',
                    secondaryColor: data.secondary || undefined,
                    fontFamily: data.font || 'Ubuntu',
                    fontSize: data.fontSize || 14
                });
            }

            setImportValue('');
            setShowImport(false);
        }
        catch(e) {}
    }, [ importValue, updateSettings ]);

    return (
        <Flex column gap={ 2 } className="items-center p-2">
            {/* Color picker */}
            <div className="w-[280px]">
                <RgbaColorPicker color={ color } onChange={ setColor } style={ { width: '100%', height: '180px' } } />
            </div>

            {/* Color preview swatch */}
            <div
                className="w-[280px] h-[32px] rounded border border-black/20"
                style={ { backgroundColor: `rgba(${ color.r }, ${ color.g }, ${ color.b }, ${ color.a })` } }
            />

            {/* Hex/RGB/A inputs */}
            <Flex gap={ 1 } className="items-center mt-1">
                <Flex column className="items-center">
                    <input
                        className="form-control form-control-sm text-center w-[70px]"
                        value={ hexColor.replace('#', '').toUpperCase() }
                        onChange={ e => onHexInput(e.target.value) }
                        maxLength={ 6 }
                    />
                    <Text small className="text-black">Hex</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ color.r }
                        onChange={ e => onRgbInput('r', parseInt(e.target.value)) }
                        min={ 0 } max={ 255 }
                    />
                    <Text small className="text-black">R</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ color.g }
                        onChange={ e => onRgbInput('g', parseInt(e.target.value)) }
                        min={ 0 } max={ 255 }
                    />
                    <Text small className="text-black">G</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ color.b }
                        onChange={ e => onRgbInput('b', parseInt(e.target.value)) }
                        min={ 0 } max={ 255 }
                    />
                    <Text small className="text-black">B</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ alphaPercent }
                        onChange={ e => onAlphaInput(parseInt(e.target.value)) }
                        min={ 0 } max={ 100 }
                    />
                    <Text small className="text-black">A</Text>
                </Flex>
            </Flex>

            {/* Font selector */}
            <Text small bold className="text-black mt-2">{ LocalizeText('interface.settings.font') }</Text>
            <div className="flex gap-1 w-full flex-wrap">
                { AVAILABLE_FONTS.map((font) => (
                    <button
                        key={ font.name }
                        className={ `flex-1 min-w-[70px] py-1.5 rounded cursor-pointer text-sm border-2 transition-colors ${ (settings.fontFamily || 'Ubuntu') === font.name ? 'border-white bg-black/20 text-white font-bold' : 'border-transparent bg-black/5 text-black hover:bg-black/10' }` }
                        style={ { fontFamily: `'${ font.name }', sans-serif` } }
                        onClick={ () => onFontChange(font.name) }
                    >
                        { font.label }
                    </button>
                )) }
            </div>

            {/* Font size */}
            <Text small bold className="text-black mt-2">{ LocalizeText('interface.settings.font.size') }</Text>
            <Flex gap={ 2 } className="items-center w-full">
                <Text small className="text-black w-[20px] text-center">{ settings.fontSize || 14 }</Text>
                <input
                    type="range"
                    className="custom-range flex-1"
                    min={ FONT_SIZE_MIN }
                    max={ FONT_SIZE_MAX }
                    step={ 1 }
                    value={ settings.fontSize || 14 }
                    onChange={ e => onFontSizeChange(parseInt(e.target.value)) }
                />
                <Text small className="text-black text-[10px]">{ FONT_SIZE_MIN }px - { FONT_SIZE_MAX }px</Text>
            </Flex>

            {/* Advanced toggle */}
            <button
                className="flex items-center gap-1 text-xs text-black/60 cursor-pointer hover:text-black transition-colors mt-1"
                onClick={ () => setShowAdvanced(!showAdvanced) }
            >
                { showAdvanced ? <FaChevronUp size={ 10 } /> : <FaChevronDown size={ 10 } /> }
                { LocalizeText('interface.settings.color.advanced') }
            </button>

            {/* Advanced section */}
            { showAdvanced && (
                <div className="w-full flex flex-col gap-2 p-2 rounded bg-black/5">
                    {/* Secondary color */}
                    <Flex gap={ 1 } className="items-center">
                        <Text small className="text-black w-[80px]">{ LocalizeText('interface.settings.color.secondary') }</Text>
                        <input
                            className="form-control form-control-sm text-center w-[70px]"
                            value={ (settings.secondaryColor || '').replace('#', '').toUpperCase() }
                            onChange={ e => onSecondaryHexInput(e.target.value) }
                            placeholder="Auto"
                            maxLength={ 6 }
                        />
                        { settings.secondaryColor && (
                            <>
                                <div
                                    className="w-[24px] h-[24px] rounded border border-black/20"
                                    style={ { backgroundColor: settings.secondaryColor } }
                                />
                                <button
                                    className="text-xs text-red-600 cursor-pointer hover:underline"
                                    onClick={ onClearSecondary }
                                >
                                    Auto
                                </button>
                            </>
                        ) }
                    </Flex>
                </div>
            ) }

            {/* Action buttons */}
            <Flex gap={ 1 } className="w-full mt-2">
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs"
                    style={ { backgroundColor: '#5f9ea0' } }
                    onClick={ onReset }
                    title={ LocalizeText('interface.settings.color.reset') }
                >
                    <FaUndo size={ 12 } />
                    { LocalizeText('interface.settings.color.reset') }
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs"
                    style={ { backgroundColor: '#c0392b' } }
                    onClick={ onDelete }
                    title={ LocalizeText('interface.settings.color.remove') }
                >
                    <FaTrash size={ 12 } />
                    { LocalizeText('interface.settings.color.remove') }
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs"
                    style={ { backgroundColor: '#2980b9' } }
                    onClick={ onExport }
                    title={ LocalizeText('interface.settings.color.export') }
                >
                    <FaDownload size={ 12 } />
                    { copyFeedback ? LocalizeText('interface.settings.color.copied') : LocalizeText('interface.settings.color.export') }
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs"
                    style={ { backgroundColor: '#27ae60' } }
                    onClick={ () => setShowImport(!showImport) }
                    title={ LocalizeText('interface.settings.color.import') }
                >
                    <FaUpload size={ 12 } />
                    { LocalizeText('interface.settings.color.import') }
                </button>
            </Flex>

            {/* Import panel */}
            { showImport && (
                <Flex gap={ 1 } className="w-full">
                    <input
                        className="form-control form-control-sm flex-1"
                        placeholder={ LocalizeText('interface.settings.color.import.placeholder') }
                        value={ importValue }
                        onChange={ e => setImportValue(e.target.value) }
                    />
                    <button
                        className="px-3 py-1 rounded cursor-pointer text-white text-xs"
                        style={ { backgroundColor: '#27ae60' } }
                        onClick={ onImport }
                    >
                        OK
                    </button>
                </Flex>
            ) }
        </Flex>
    );
};
