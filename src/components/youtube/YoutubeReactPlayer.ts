import { ComponentType, LazyExoticComponent, lazy } from 'react';
import HtmlPlayer from 'react-player/HtmlPlayer';
import { canPlay } from 'react-player/patterns';
import { PlayerEntry } from 'react-player/players';
import { createReactPlayer } from 'react-player/ReactPlayer';
import { VideoElementProps } from 'react-player/types';

const YoutubeElement = lazy(() => import('youtube-video-element/react')) as LazyExoticComponent<
    ComponentType<VideoElementProps>
>;

const YoutubeReactPlayer = createReactPlayer(
    [
        {
            key: 'youtube',
            name: 'YouTube',
            canPlay: canPlay.youtube,
            player: YoutubeElement,
        },
    ] satisfies PlayerEntry[],
    {
        key: 'html',
        name: 'html',
        canPlay: canPlay.html,
        canEnablePIP: () => true,
        player: HtmlPlayer,
    },
);

export default YoutubeReactPlayer;
