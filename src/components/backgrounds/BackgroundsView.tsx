import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Base, Grid, Flex, NitroCardView, NitroCardHeaderView, NitroCardTabsView, NitroCardTabsItemView, NitroCardContentView, Text } from '../../common';
import { useRoom } from '../../hooks';
import { GetOptionalConfigurationValue } from '../../api';
import { configFileUrl } from '../../secure-assets';

interface ItemData {
    id: number;
}

interface BackgroundsViewProps {
    setIsVisible: Dispatch<SetStateAction<boolean>>;
    selectedBackground: number;
    setSelectedBackground: Dispatch<SetStateAction<number>>;
    selectedStand: number;
    setSelectedStand: Dispatch<SetStateAction<number>>;
    selectedOverlay: number;
    setSelectedOverlay: Dispatch<SetStateAction<number>>;
    selectedCardBackground: number;
    setSelectedCardBackground: Dispatch<SetStateAction<number>>;
    selectedBorder: number;
    setSelectedBorder: Dispatch<SetStateAction<number>>;
}

const TABS = ['backgrounds', 'stands', 'overlays', 'cards', 'borders'] as const;
type TabType = typeof TABS[number];

type RemoteData = Partial<Record<'backgrounds.data' | 'stands.data' | 'overlays.data' | 'cards.data' | 'borders.data', any[]>>;

export const BackgroundsView: FC<BackgroundsViewProps> = ({
    setIsVisible,
    selectedBackground,
    setSelectedBackground,
    selectedStand,
    setSelectedStand,
    selectedOverlay,
    setSelectedOverlay,
    selectedCardBackground,
    setSelectedCardBackground,
    selectedBorder,
    setSelectedBorder
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('backgrounds');
    const [remoteData, setRemoteData] = useState<RemoteData | null>(null);
    const { roomSession } = useRoom();

    useEffect(() => {
        let cancelled = false;
        fetch(configFileUrl('infostand_backgrounds.json'), { credentials: 'omit' })
            .then(r => r.ok ? r.json() : null)
            .then(json => { if(!cancelled && json && typeof json === 'object') setRemoteData(json as RemoteData); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const processData = useCallback((configData: any[], idField: string): ItemData[] => {
        if (!configData?.length) return [];

        return configData.map(item => ({ id: typeof item === 'number' ? item : item[idField] }));
    }, []);

    const readData = useCallback((key: 'backgrounds.data' | 'stands.data' | 'overlays.data' | 'cards.data' | 'borders.data'): any[] => {
        const fromRemote = remoteData?.[key];
        if(Array.isArray(fromRemote)) return fromRemote;
        return GetOptionalConfigurationValue<any[]>(key, []) || [];
    }, [remoteData]);

    const allData = useMemo(() => ({
        backgrounds: processData(readData('backgrounds.data'), 'backgroundId'),
        stands: processData(readData('stands.data'), 'standId'),
        overlays: processData(readData('overlays.data'), 'overlayId'),
        cards: processData(readData('cards.data').length ? readData('cards.data') : readData('backgrounds.data'), 'backgroundId'),
        borders: processData(readData('borders.data'), 'borderId')
    }), [processData, readData]);

    const handleSelection = useCallback((id: number) => {
        if (!roomSession) return;

        const setters = { backgrounds: setSelectedBackground, stands: setSelectedStand, overlays: setSelectedOverlay, cards: setSelectedCardBackground, borders: setSelectedBorder };

        const currentValues = { backgrounds: selectedBackground, stands: selectedStand, overlays: selectedOverlay, cards: selectedCardBackground, borders: selectedBorder };

        setters[activeTab](id);
        const newValues = { ...currentValues, [activeTab]: id };
        roomSession.sendBackgroundMessage( newValues.backgrounds, newValues.stands, newValues.overlays, newValues.cards, newValues.borders );
    }, [activeTab, roomSession, selectedBackground, selectedStand, selectedOverlay, selectedCardBackground, selectedBorder, setSelectedBackground, setSelectedStand, setSelectedOverlay, setSelectedCardBackground, setSelectedBorder]);

    const itemTypeFor = (tab: TabType): string => {
        if(tab === 'cards') return 'card-background';
        if(tab === 'borders') return 'border';
        return tab.slice(0, -1);
    };

    const renderItem = useCallback((item: ItemData, type: string) => (
        <Flex
            pointer
            position="relative"
            key={item.id}
            onClick={() => handleSelection(item.id)}
        >
            <Base
                className={`profile-${type} ${type}-${item.id}`}
                style={
                    type === 'card-background' ? { width: 60, height: 80, borderRadius: 4 }
                    : type === 'border' ? { width: 60, height: 76, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
                    : undefined
                }
            />
        </Flex>
    ), [handleSelection]);

    return (
        <NitroCardView uniqueKey="backgrounds" className="absolute min-w-[535px] max-w-[535px] min-h-[389px] max-h-[389px]">
            <NitroCardHeaderView headerText="Profile Background" onCloseClick={() => setIsVisible(false)} />
            <NitroCardTabsView>
                {TABS.map(tab => (
                    <NitroCardTabsItemView
                        key={tab}
                        isActive={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </NitroCardTabsItemView>
                ))}
            </NitroCardTabsView>
            <NitroCardContentView gap={1}>
                <Text bold center>Select an Option</Text>
                <Grid gap={1} columnCount={7} overflow="auto">
                    {allData[activeTab].map(item => renderItem(item, itemTypeFor(activeTab)))}
                </Grid>
            </NitroCardContentView>
        </NitroCardView>
    );
};