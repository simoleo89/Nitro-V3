import { FC, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { IShowcaseItem } from '../../api/user/ProfilePortfolioData';
import { SaveShowcaseComposer } from '../../api/user/portfolio';
import { Flex, Text } from '../../common';

const MAX_SHOWCASE_SLOTS = 8;

interface RareShowcaseViewProps
{
    userId: number;
    items: IShowcaseItem[];
    isOwnProfile: boolean;
}

export const RareShowcaseView: FC<RareShowcaseViewProps> = props =>
{
    const { userId, items, isOwnProfile } = props;
    const [ confirmRemoveIndex, setConfirmRemoveIndex ] = useState<number | null>(null);

    const slots = Array.from({ length: MAX_SHOWCASE_SLOTS }, (_, i) => items[i] ?? null);

    const onRemoveItem = (index: number) =>
    {
        const updated = [ ...items ];
        updated.splice(index, 1);
        SendMessageComposer(new SaveShowcaseComposer(JSON.stringify(updated)));
        setConfirmRemoveIndex(null);
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="grid grid-cols-4 gap-2 p-1">
                { slots.map((item, index) => (
                    <div
                        key={ index }
                        className={ `flex flex-col items-center justify-center aspect-square rounded border-2 transition-colors ${
                            item
                                ? 'bg-white/50 border-muted hover:border-white'
                                : 'border-dashed border-muted/50 bg-muted/20'
                        } ${ isOwnProfile && item ? 'cursor-pointer' : '' }` }
                        onClick={ () =>
                        {
                            if(isOwnProfile && item)
                            {
                                setConfirmRemoveIndex(confirmRemoveIndex === index ? null : index);
                            }
                        } }>
                        { item ? (
                            <div className="flex flex-col items-center gap-1 p-1 w-full">
                                { item.imageUrl ? (
                                    <img
                                        alt={ item.name }
                                        className="w-[40px] h-[40px] object-contain"
                                        src={ item.imageUrl }
                                    />
                                ) : (
                                    <div className="w-[40px] h-[40px] bg-muted/30 rounded" />
                                ) }
                                <Text small truncate className="w-full text-center text-[10px]">{ item.name }</Text>
                                { item.isRare && (
                                    <span className="text-[9px] px-1 rounded bg-yellow-400/80 text-yellow-900 font-bold">RARO</span>
                                ) }
                                { confirmRemoveIndex === index && isOwnProfile && (
                                    <button
                                        className="text-[10px] text-red-500 hover:underline cursor-pointer mt-0.5"
                                        onClick={ (e) =>
                                        {
                                            e.stopPropagation();
                                            onRemoveItem(index);
                                        } }>
                                        Rimuovi
                                    </button>
                                ) }
                            </div>
                        ) : (
                            <Flex center className="w-full h-full">
                                <Text small variant="muted" className="text-[10px]">
                                    { isOwnProfile ? 'Vuoto' : '' }
                                </Text>
                            </Flex>
                        ) }
                    </div>
                )) }
            </div>
            { isOwnProfile && (
                <Text small variant="muted" className="text-center">
                    Clicca su un oggetto per rimuoverlo dalla vetrina
                </Text>
            ) }
        </div>
    );
};
