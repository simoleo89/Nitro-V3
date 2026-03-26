// ── Effects ──────────────────────────────────────────────────────────
export const PRESET_PREFIX_EFFECTS: { id: string; label: string; icon: string }[] = [
    { id: '', label: 'None', icon: '—' },
    { id: 'italic', label: 'Italic', icon: '𝑰' },
    { id: 'shadow', label: 'Shadow', icon: '🌑' },
    { id: 'outline', label: 'Outline', icon: '🔲' },
    { id: 'glow', label: 'Glow', icon: '✨' },
    { id: 'pulse', label: 'Pulse', icon: '💫' },
    { id: 'bold-glow', label: 'Neon', icon: '💡' },
    { id: 'gradient', label: 'Gradient', icon: '🌈' },
    { id: 'rainbow', label: 'Rainbow', icon: '🏳️‍🌈' },
    { id: 'shine', label: 'Shine', icon: '💎' },
    { id: 'wave', label: 'Wave', icon: '🌊' },
    { id: 'fire', label: 'Fire', icon: '🔥' },
    { id: 'glitch', label: 'Glitch', icon: '⚡' },
    { id: 'typing', label: 'Typing', icon: '⌨️' },
];

// ── Color parsing ────────────────────────────────────────────────────
export const parsePrefixColors = (text: string, colorStr: string): string[] =>
{
    if(!colorStr || !text) return [];

    const colors = colorStr.split(',');
    return [ ...text ].map((_, i) => colors[Math.min(i, colors.length - 1)]);
};

// ── Effect styles ────────────────────────────────────────────────────
// Returns inline styles for a given effect.
// For per-letter effects (wave, typing), use getPrefixLetterStyle() instead.
export const getPrefixEffectStyle = (effect: string, color?: string): Record<string, string | number> =>
{
    const baseColor = color || '#FFFFFF';

    switch(effect)
    {
        case 'glow':
            return { textShadow: `0 0 6px ${ baseColor }, 0 0 12px ${ baseColor }80` };
        case 'shadow':
            return { textShadow: '2px 2px 4px rgba(0,0,0,0.7), 1px 1px 2px rgba(0,0,0,0.5)' };
        case 'italic':
            return { fontStyle: 'italic' };
        case 'outline':
            return {
                WebkitTextStroke: '0.5px rgba(0,0,0,0.6)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.3), -1px -1px 0 rgba(0,0,0,0.3), 1px -1px 0 rgba(0,0,0,0.3), -1px 1px 0 rgba(0,0,0,0.3)'
            };
        case 'pulse':
            return { animation: 'prefix-pulse 1.5s ease-in-out infinite' };
        case 'bold-glow':
            return {
                textShadow: `0 0 4px ${ baseColor }, 0 0 8px ${ baseColor }, 0 0 16px ${ baseColor }60`,
                fontWeight: 900
            };
        case 'gradient':
            return {
                background: `linear-gradient(90deg, ${ baseColor }, ${ baseColor }80)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            };
        case 'rainbow':
            return {
                background: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'prefix-rainbow 3s linear infinite',
            };
        case 'shine':
            return {
                background: `linear-gradient(90deg, ${ baseColor } 0%, #ffffff 50%, ${ baseColor } 100%)`,
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'prefix-shine 2s linear infinite',
            };
        case 'fire':
            return {
                textShadow: `0 0 4px #ff4500, 0 0 8px #ff6600, 0 -2px 12px #ff880060`,
                animation: 'prefix-fire 0.8s ease-in-out infinite alternate',
            };
        case 'glitch':
            return {
                textShadow: `2px 0 #ff0040, -2px 0 #00ffff`,
                animation: 'prefix-glitch 0.5s steps(2) infinite',
            };
        case 'typing':
            return {
                display: 'inline-block',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                borderRight: '2px solid currentColor',
                animation: 'prefix-typing 2s steps(20) forwards, prefix-blink 0.7s step-end 3',
            };
        case 'wave':
            // Wave is per-letter — base container just needs display
            return { display: 'inline-flex' };
        default:
            return {};
    }
};

// Per-letter style for wave effect (each letter gets a different delay)
export const getPrefixLetterStyle = (effect: string, letterIndex: number, color?: string): Record<string, string | number> =>
{
    const baseColor = color || '#FFFFFF';

    switch(effect)
    {
        case 'wave':
            return {
                display: 'inline-block',
                color: baseColor,
                animation: 'prefix-wave 1.2s ease-in-out infinite',
                animationDelay: `${ letterIndex * 0.08 }s`,
            };
        default:
            return {};
    }
};

// Check if an effect requires per-letter rendering
export const isPerLetterEffect = (effect: string): boolean =>
{
    return effect === 'wave';
};

// ── Gradient multi-color style ───────────────────────────────────────
// When the "gradient" effect is used with multiple colors, build a CSS gradient from them
export const getGradientStyle = (colors: string[]): Record<string, string | number> =>
{
    if(colors.length < 2) return {};

    const uniqueColors = [ ...new Set(colors) ];
    if(uniqueColors.length < 2) return {};

    return {
        background: `linear-gradient(90deg, ${ uniqueColors.join(', ') })`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    };
};

// ── Keyframes injection (call once) ──────────────────────────────────
let keyframesInjected = false;

export const ensurePrefixKeyframes = (): void =>
{
    if(keyframesInjected) return;
    keyframesInjected = true;

    const style = document.createElement('style');
    style.id = 'prefix-effect-keyframes';
    style.textContent = PREFIX_ALL_KEYFRAMES;
    document.head.appendChild(style);
};

// Backwards compat — still exported but prefer ensurePrefixKeyframes()
export const PREFIX_EFFECT_KEYFRAMES = '';

const PREFIX_ALL_KEYFRAMES = `
@keyframes prefix-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes prefix-rainbow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
}

@keyframes prefix-shine {
    0% { background-position: 200% 50%; }
    100% { background-position: -200% 50%; }
}

@keyframes prefix-wave {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
}

@keyframes prefix-fire {
    0% { text-shadow: 0 0 4px #ff4500, 0 0 8px #ff6600, 0 -2px 12px #ff880060; }
    100% { text-shadow: 0 0 6px #ff6600, 0 0 12px #ff4500, 0 -4px 16px #ff440040; }
}

@keyframes prefix-glitch {
    0% { text-shadow: 2px 0 #ff0040, -2px 0 #00ffff; }
    25% { text-shadow: -2px 0 #ff0040, 2px 0 #00ffff; }
    50% { text-shadow: 1px 1px #ff0040, -1px -1px #00ffff; }
    75% { text-shadow: -1px 1px #ff0040, 1px -1px #00ffff; }
    100% { text-shadow: 2px 0 #ff0040, -2px 0 #00ffff; }
}

@keyframes prefix-typing {
    from { width: 0; }
    to { width: 100%; }
}

@keyframes prefix-blink {
    50% { border-color: transparent; }
}

`;
