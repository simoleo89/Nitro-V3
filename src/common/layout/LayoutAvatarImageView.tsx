import { AvatarScaleType, AvatarSetType, GetAvatarRenderManager, NitroEventType } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react';
import { Base, BaseProps } from '../Base';
import { useNitroEvent } from '../../hooks/events';

const AVATAR_IMAGE_CACHE: Map<string, string> = new Map();

export interface LayoutAvatarImageViewProps extends BaseProps<HTMLDivElement>
{
    figure: string;
    gender?: string;
    headOnly?: boolean;
    direction?: number;
    scale?: number;
}

export const LayoutAvatarImageView: FC<LayoutAvatarImageViewProps> = props =>
{
    const { figure = '', gender = '', headOnly = false, direction = 0, scale = 1, classNames = [], style = {}, ...rest } = props;
    const [ avatarUrl, setAvatarUrl ] = useState<string>(null);
    const [ isReady, setIsReady ] = useState<boolean>(false);
    const [ updateId, setUpdateId ] = useState<number>(0);
    const isDisposed = useRef(false);
    const figureKeyRef = useRef<string>(null);

    useNitroEvent(NitroEventType.AVATAR_ASSET_LOADED, () =>
    {
        if(figureKeyRef.current)
        {
            AVATAR_IMAGE_CACHE.delete(figureKeyRef.current);
            setUpdateId(prev => prev + 1);
        }
    });

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'avatar-image relative w-[90px] h-[130px] bg-no-repeat left-[-2px] pointer-events-none' ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(avatarUrl && avatarUrl.length) newStyle.backgroundImage = `url('${ avatarUrl }')`;

        if(scale !== 1)
        {
            newStyle.transform = `scale(${ scale })`;

            if(!(scale % 1)) newStyle.imageRendering = 'pixelated';
        }

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ avatarUrl, scale, style ]);

    useEffect(() =>
    {
        if(!isReady) return;

        const figureKey = [ figure, gender, direction, headOnly ].join('-');

        figureKeyRef.current = figureKey;

        if(AVATAR_IMAGE_CACHE.has(figureKey))
        {
            setAvatarUrl(AVATAR_IMAGE_CACHE.get(figureKey));
        }
        else
        {
            const avatarImage = GetAvatarRenderManager().createAvatarImage(figure, AvatarScaleType.LARGE, gender, {
                resetFigure: (figure: string) =>
                {
                    if(isDisposed.current) return;

                    AVATAR_IMAGE_CACHE.delete(figureKey);
                    setUpdateId(prev => prev + 1);
                },
                dispose: null,
                disposed: false
            });

            let setType = AvatarSetType.FULL;

            if(headOnly) setType = AvatarSetType.HEAD;

            avatarImage.setDirection(setType, direction);

            const imageUrl = avatarImage.processAsImageUrl(setType);

            if(imageUrl && !isDisposed.current)
            {
                if(!avatarImage.isPlaceholder()) AVATAR_IMAGE_CACHE.set(figureKey, imageUrl);

                setAvatarUrl(imageUrl);
            }

            avatarImage.dispose();
        }
    }, [ figure, gender, direction, headOnly, isReady, updateId ]);

    useEffect(() =>
    {
        isDisposed.current = false;

        setIsReady(true);

        return () =>
        {
            isDisposed.current = true;
        };
    }, []);

    return <Base classNames={ getClassNames } style={ getStyle } { ...rest } />;
};
