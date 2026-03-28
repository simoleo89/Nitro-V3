import { RgbaColorPicker, RgbaColor } from 'react-colorful';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaUndo, FaTrash, FaDownload, FaUpload, FaGlasses } from 'react-icons/fa';
import { LocalizeText, PRESET_COLORS, THEME_PRESETS, useUiSettings } from '../../api';
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
            setColor(hexToRgba('#' + clean, color.a));
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

    const onPresetClick = useCallback((presetHex: string) =>
    {
        setColor(hexToRgba(presetHex, color.a));
    }, [ color.a ]);

    const onThemeClick = useCallback((preset: typeof THEME_PRESETS[0]) =>
    {
        const c = preset.colors;
        if(c.headerColor) setColor(hexToRgba(c.headerColor, (c.headerAlpha ?? settings.headerAlpha) / 100));
        updateSettings({
            colorMode: 'color',
            ...c,
            headerAlpha: c.headerAlpha ?? settings.headerAlpha
        });
    }, [ updateSettings, settings.headerAlpha ]);

    const onReset = useCallback(() =>
    {
        resetSettings();
        setColor(hexToRgba('#1E7295', 1));
    }, [ resetSettings ]);

    const onDelete = useCallback(() =>
    {
        updateSettings({ colorMode: 'default' });
        setColor(hexToRgba('#1E7295', 1));
    }, [ updateSettings ]);

    const toggleGlass = useCallback(() =>
    {
        updateSettings({ glassMode: !settings.glassMode });
    }, [ updateSettings, settings.glassMode ]);

    const onExport = useCallback(() =>
    {
        const data = btoa(JSON.stringify(settings));
        navigator.clipboard.writeText(data);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    }, [ settings ]);

    const onImport = useCallback(() =>
    {
        try
        {
            const decoded = JSON.parse(atob(importValue.trim()));
            if(decoded.headerColor)
            {
                setColor(hexToRgba(decoded.headerColor, (decoded.headerAlpha ?? 100) / 100));
                updateSettings({ ...decoded });
            }
            setImportValue('');
            setShowImport(false);
        }
        catch(e)
        {
            // Try raw JSON fallback
            try
            {
                const decoded = JSON.parse(importValue.trim());
                if(decoded.headerColor)
                {
                    setColor(hexToRgba(decoded.headerColor, (decoded.headerAlpha ?? 100) / 100));
                    updateSettings({ ...decoded });
                }
                setImportValue('');
                setShowImport(false);
            }
            catch(e2) { /* invalid input */ }
        }
    }, [ importValue, updateSettings ]);

    return (
        <Flex column gap={ 2 } className="items-center p-2 overflow-auto">
            {/* Color picker */}
            <div className="w-[280px]">
                <RgbaColorPicker color={ color } onChange={ setColor } style={ { width: '100%', height: '180px' } } />
            </div>

            {/* Color preview swatch */}
            <div
                className="w-[280px] h-[32px] rounded border border-black/20 transition-colors duration-150"
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
                { (['r', 'g', 'b'] as const).map(ch => (
                    <Flex column className="items-center" key={ ch }>
                        <input
                            type="number"
                            className="form-control form-control-sm text-center w-[45px]"
                            value={ color[ch] }
                            onChange={ e => onRgbInput(ch, parseInt(e.target.value)) }
                            min={ 0 } max={ 255 }
                        />
                        <Text small className="text-black">{ ch.toUpperCase() }</Text>
                    </Flex>
                )) }
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

            {/* Preset colors */}
            <div className="grid grid-cols-10 gap-0.5 mt-1">
                { PRESET_COLORS.map((presetHex, i) => (
                    <div
                        key={ i }
                        className={ `w-[24px] h-[24px] rounded cursor-pointer border transition-transform hover:scale-110 ${ hexColor.toUpperCase() === presetHex.toUpperCase() ? 'border-white border-2 scale-110' : 'border-black/20' }` }
                        style={ { backgroundColor: presetHex } }
                        onClick={ () => onPresetClick(presetHex) }
                    />
                )) }
            </div>

            {/* Theme presets */}
            <Text small bold className="text-black mt-2">{ LocalizeText('interface.settings.color.themes') }</Text>
            <div className="grid grid-cols-6 gap-1 w-full">
                { THEME_PRESETS.map((theme) => (
                    <div
                        key={ theme.name }
                        className={ `flex flex-col items-center gap-0.5 p-1 rounded cursor-pointer hover:bg-black/5 transition-colors ${ settings.headerColor.toUpperCase() === (theme.colors.headerColor ?? '').toUpperCase() && settings.toolbarColor === (theme.colors.toolbarColor ?? '') ? 'ring-2 ring-white' : '' }` }
                        onClick={ () => onThemeClick(theme) }
                    >
                        <div
                            className="w-[32px] h-[32px] rounded-full border border-black/20 relative overflow-hidden"
                            style={ { backgroundColor: theme.colors.headerColor } }
                        >
                            { theme.colors.glassMode && (
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
                            ) }
                        </div>
                        <Text small className="text-black text-[10px]">{ LocalizeText(`interface.settings.theme.${ theme.name }`) }</Text>
                    </div>
                )) }
            </div>

            {/* Action buttons */}
            <Flex gap={ 1 } className="w-full mt-2 flex-wrap">
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs min-w-[70px] bg-teal-600 hover:bg-teal-700 transition-colors"
                    onClick={ onReset }
                    title={ LocalizeText('interface.settings.color.reset') }
                >
                    <FaUndo size={ 12 } />
                    { LocalizeText('interface.settings.color.reset') }
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs min-w-[70px] bg-red-600 hover:bg-red-700 transition-colors"
                    onClick={ onDelete }
                    title={ LocalizeText('interface.settings.color.remove') }
                >
                    <FaTrash size={ 12 } />
                    { LocalizeText('interface.settings.color.remove') }
                </button>
                <button
                    className={ `flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs min-w-[70px] transition-colors ${ settings.glassMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-500 hover:bg-gray-600' }` }
                    onClick={ toggleGlass }
                    title="Glassmorphism"
                >
                    <FaGlasses size={ 12 } />
                    Glass
                </button>
            </Flex>
            <Flex gap={ 1 } className="w-full">
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={ onExport }
                    title={ LocalizeText('interface.settings.color.export') }
                >
                    <FaDownload size={ 12 } />
                    { copyFeedback ? LocalizeText('interface.settings.color.copied') : LocalizeText('interface.settings.color.export') }
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white text-xs bg-green-600 hover:bg-green-700 transition-colors"
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
                        className="px-3 py-1 rounded cursor-pointer text-white text-xs bg-green-600 hover:bg-green-700 transition-colors"
                        onClick={ onImport }
                    >
                        OK
                    </button>
                </Flex>
            ) }
        </Flex>
    );
};
