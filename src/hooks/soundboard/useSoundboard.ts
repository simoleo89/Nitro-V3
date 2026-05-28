import { ISoundboardSound, SoundboardPlayComposer, SoundboardPlayEvent, SoundboardSetEnabledComposer, SoundboardSettingsEvent } from '@nitrots/nitro-renderer';
import { useCallback, useState } from 'react';
import { useBetween } from 'use-between';
import { GetConfigurationValue, SendMessageComposer, setSoundboardRoomEnabled } from '../../api';
import { useMessageEvent } from '../events';

// Resolve a stored sound url (which may be relative, like custom badges) to an
// absolute one against the asset host.
const resolveUrl = (url: string): string =>
{
    if(!url) return '';
    if(/^https?:\/\//i.test(url) || url.startsWith('//')) return url;

    const base = (GetConfigurationValue<string>('soundboard.url.prefix') || GetConfigurationValue<string>('asset.url') || '').replace(/\/+$/, '');
    return base ? `${ base }/${ url.replace(/^\/+/, '') }` : url;
};

// Soundboard state + actions. Shared via useBetween so the event listeners
// register once regardless of how many components read it (toolbar + view).
const useSoundboardState = () =>
{
    const [ enabled, setEnabled ] = useState(false);
    const [ sounds, setSounds ] = useState<ISoundboardSound[]>([]);
    const [ lastPlayed, setLastPlayed ] = useState<{ soundId: number; username: string } | null>(null);

    useMessageEvent<SoundboardSettingsEvent>(SoundboardSettingsEvent, event =>
    {
        const parser = event.getParser();
        setEnabled(parser.enabled);
        setSounds(parser.sounds);
        setSoundboardRoomEnabled(parser.enabled);
    });

    useMessageEvent<SoundboardPlayEvent>(SoundboardPlayEvent, event =>
    {
        const parser = event.getParser();
        const url = resolveUrl(parser.url);

        if(url)
        {
            try
            {
                const audio = new Audio(url);
                audio.volume = 0.8;
                void audio.play().catch(() => {});
            }
            catch {}
        }

        setLastPlayed({ soundId: parser.soundId, username: parser.username });
    });

    const play = useCallback((soundId: number) => SendMessageComposer(new SoundboardPlayComposer(soundId)), []);
    const setRoomEnabled = useCallback((value: boolean) =>
    {
        setEnabled(value);
        setSoundboardRoomEnabled(value);
        SendMessageComposer(new SoundboardSetEnabledComposer(value));
    }, []);

    // Local-only clear (e.g. when leaving the room) — does not notify the server.
    const reset = useCallback(() =>
    {
        setEnabled(false);
        setSounds([]);
        setLastPlayed(null);
        setSoundboardRoomEnabled(false);
    }, []);

    return { enabled, sounds, lastPlayed, play, setRoomEnabled, reset };
};

export const useSoundboard = () => useBetween(useSoundboardState);
