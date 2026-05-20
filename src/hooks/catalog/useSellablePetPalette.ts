import { GetSellablePetPalettesComposer, SellablePetPalettesMessageEvent } from '@nitrots/nitro-renderer';
import { UseQueryResult } from '@tanstack/react-query';
import { CatalogPetPalette } from '../../api';
import { useNitroQuery } from '../../api/nitro-query';

/**
 * Sellable palettes for a given pet breed, as returned by
 * GetSellablePetPalettesComposer(breed) → SellablePetPalettesMessageEvent.
 * The renderer multiplexes one event type for every breed; accept()
 * keeps each query slot listening only for the matching productCode.
 *
 * Replaces the per-breed accumulator that previously lived in
 * useCatalog (writing to catalogOptions.petPalettes). The catalog pet
 * page now reads via `useSellablePetPalette(productData.type)`.
 *
 * The breed identifier is the localization product code string
 * (e.g. 'pet_egg', 'pet_dog', ...). Disabled while breed is empty so
 * we don't spam composers at mount before the offer is known.
 */
export const useSellablePetPalette = (
    breed: string,
    options: { enabled?: boolean } = {}
): UseQueryResult<CatalogPetPalette> =>
    useNitroQuery<SellablePetPalettesMessageEvent, CatalogPetPalette>({
        key: [ 'nitro', 'catalog', 'petPalette', breed ],
        request: () => new GetSellablePetPalettesComposer(breed),
        parser: SellablePetPalettesMessageEvent,
        accept: event => (event.getParser().productCode === breed),
        select: event => new CatalogPetPalette(event.getParser().productCode, event.getParser().palettes.slice()),
        enabled: (options.enabled ?? true) && !!breed,
        staleTime: Infinity
    });
