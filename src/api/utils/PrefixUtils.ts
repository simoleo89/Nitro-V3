export const PRESET_PREFIX_EFFECTS: { id: string; label: string; icon: string }[] = [
    { id: '', label: 'None', icon: '—' },
    { id: 'glow', label: 'Glow', icon: '✨' },
    { id: 'shadow', label: 'Shadow', icon: '🌑' },
    { id: 'italic', label: 'Italic', icon: '𝑰' },
    { id: 'outline', label: 'Outline', icon: '🔲' },
    { id: 'pulse', label: 'Pulse', icon: '💫' },
    { id: 'bold-glow', label: 'Neon', icon: '💡' },
    { id: 'rainbow', label: 'Rainbow', icon: '🌈' },
    { id: 'shine', label: 'Shine', icon: '🌟' },
    { id: 'wave', label: 'Wave', icon: '🌊' },
    { id: 'fire', label: 'Fire', icon: '🔥' },
    { id: 'glitch', label: 'Glitch', icon: '👾' },
];

export const parsePrefixColors = (text: string, colorStr: string): string[] =>
{
    if(!colorStr || !text) return [];

    const colors = colorStr.split(',');
    return [ ...text ].map((_, i) => colors[Math.min(i, colors.length - 1)]);
};

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
        case 'rainbow':
            return { animation: 'prefix-rainbow 3s linear infinite' };
        case 'shine':
            return {
                backgroundImage: `linear-gradient(90deg, ${ baseColor } 0%, #fff 50%, ${ baseColor } 100%)`,
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'prefix-shine 2s linear infinite'
            };
        case 'wave':
            return {
                display: 'inline-flex',
                animation: 'prefix-wave 2s ease-in-out infinite'
            };
        case 'fire':
            return {
                textShadow: `0 0 4px #ff4500, 0 0 8px #ff6600, 0 0 16px #ff8c00, 0 -2px 4px #ff4500`,
                animation: 'prefix-fire 0.8s ease-in-out infinite alternate'
            };
        case 'glitch':
            return {
                animation: 'prefix-glitch 0.5s ease-in-out infinite alternate',
                textShadow: `-2px 0 #ff0000, 2px 0 #00ffff`
            };
        default:
            return {};
    }
};

export const PREFIX_EFFECT_KEYFRAMES = `
@keyframes prefix-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
@keyframes prefix-rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
}
@keyframes prefix-shine {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
@keyframes prefix-wave {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-2px); }
    75% { transform: translateY(2px); }
}
@keyframes prefix-fire {
    0% { text-shadow: 0 0 4px #ff4500, 0 0 8px #ff6600, 0 0 16px #ff8c00, 0 -2px 4px #ff4500; }
    100% { text-shadow: 0 0 6px #ff6600, 0 0 12px #ff8c00, 0 0 20px #ffaa00, 0 -4px 8px #ff4500; }
}
@keyframes prefix-glitch {
    0% { text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; transform: translate(0); }
    25% { text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; transform: translate(-1px, 1px); }
    50% { text-shadow: -1px 0 #ff0000, 1px 0 #00ffff; transform: translate(1px, -1px); }
    75% { text-shadow: 1px 0 #ff0000, -1px 0 #00ffff; transform: translate(-1px, 0); }
    100% { text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; transform: translate(0); }
}
`;
