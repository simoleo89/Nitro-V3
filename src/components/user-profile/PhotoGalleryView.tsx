import { FC, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { IProfilePhoto } from '../../api/user/ProfilePortfolioData';
import { RemovePhotoComposer } from '../../api/user/portfolio';
import { Flex, Text } from '../../common';

interface PhotoGalleryViewProps
{
    userId: number;
    photos: IProfilePhoto[];
    isOwnProfile: boolean;
}

export const PhotoGalleryView: FC<PhotoGalleryViewProps> = props =>
{
    const { userId, photos, isOwnProfile } = props;
    const [ selectedIndex, setSelectedIndex ] = useState<number | null>(null);

    const onRemovePhoto = (index: number) =>
    {
        SendMessageComposer(new RemovePhotoComposer(index));
        setSelectedIndex(null);
    };

    if(!photos || photos.length === 0)
    {
        return (
            <Flex center fullWidth className="h-full">
                <Text small variant="muted">Nessuna foto nella galleria</Text>
            </Flex>
        );
    }

    return (
        <div className="flex flex-col gap-2 h-full">
            { selectedIndex !== null && photos[selectedIndex] && (
                <div className="flex flex-col gap-2">
                    <div className="relative w-full h-[200px] rounded overflow-hidden bg-black/10">
                        <img
                            alt={ photos[selectedIndex].caption || 'Foto' }
                            className="w-full h-full object-contain"
                            src={ photos[selectedIndex].url }
                        />
                    </div>
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            { photos[selectedIndex].caption && (
                                <Text small bold>{ photos[selectedIndex].caption }</Text>
                            ) }
                            <Text small variant="muted">
                                { new Date(photos[selectedIndex].timestamp).toLocaleDateString() }
                            </Text>
                        </div>
                        <div className="flex gap-2">
                            { isOwnProfile && (
                                <button
                                    className="text-xs text-red-500 hover:underline cursor-pointer"
                                    onClick={ () => onRemovePhoto(selectedIndex) }>
                                    Rimuovi
                                </button>
                            ) }
                            <button
                                className="text-xs text-blue-500 hover:underline cursor-pointer"
                                onClick={ () => setSelectedIndex(null) }>
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            ) }
            { selectedIndex === null && (
                <div className="grid grid-cols-4 gap-2 overflow-auto p-1">
                    { photos.map((photo, index) => (
                        <div
                            key={ index }
                            className="aspect-square rounded overflow-hidden bg-white/50 border-2 border-muted cursor-pointer hover:border-white transition-colors"
                            onClick={ () => setSelectedIndex(index) }>
                            <img
                                alt={ photo.caption || 'Foto' }
                                className="w-full h-full object-cover"
                                src={ photo.url }
                            />
                        </div>
                    )) }
                </div>
            ) }
        </div>
    );
};
