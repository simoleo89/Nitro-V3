import { FC } from 'react';
import { SendMessageComposer } from '../../api';
import { IProfileTabConfig, ProfileTabKey } from '../../api/user/ProfilePortfolioData';
import { SaveTabConfigComposer } from '../../api/user/portfolio';
import { Text } from '../../common';

interface ProfileTabSettingsViewProps
{
    userId: number;
    tabConfig: IProfileTabConfig;
    onConfigChange: (config: IProfileTabConfig) => void;
}

const TAB_LABELS: Record<ProfileTabKey, string> = {
    badge: 'Badge',
    amici: 'Amici',
    stanze: 'Stanze',
    gruppi: 'Gruppi',
    foto: 'Galleria Foto',
    bacheca: 'Bacheca',
    showcase: 'Vetrina Rari'
};

export const ProfileTabSettingsView: FC<ProfileTabSettingsViewProps> = props =>
{
    const { userId, tabConfig, onConfigChange } = props;

    const onToggle = (key: ProfileTabKey) =>
    {
        const enabledCount = Object.values(tabConfig).filter(Boolean).length;

        if(tabConfig[key] && enabledCount <= 1) return;

        const updated = { ...tabConfig, [key]: !tabConfig[key] };
        onConfigChange(updated);
        SendMessageComposer(new SaveTabConfigComposer(JSON.stringify(updated)));
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            <Text small bold>Scegli quali tab mostrare nel tuo profilo:</Text>
            <div className="flex flex-col gap-1">
                { (Object.keys(TAB_LABELS) as ProfileTabKey[]).map(key => (
                    <label
                        key={ key }
                        className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/50 cursor-pointer hover:bg-white/80 transition-colors">
                        <input
                            checked={ tabConfig[key] }
                            className="accent-[#1E7295]"
                            type="checkbox"
                            onChange={ () => onToggle(key) }
                        />
                        <Text small>{ TAB_LABELS[key] }</Text>
                    </label>
                )) }
            </div>
            <Text small variant="muted" className="text-center mt-auto">
                Almeno una tab deve restare attiva
            </Text>
        </div>
    );
};
