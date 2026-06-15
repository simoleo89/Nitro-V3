import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText } from '../../api';
import imgAchievements from '../../assets/images/vault/achievements.png';
import imgBonusbag from '../../assets/images/vault/bonusbag.png';
import imgDailygift from '../../assets/images/vault/dailygift.png';
import imgDonations from '../../assets/images/vault/donations.png';
import imgGames from '../../assets/images/vault/games.png';
import imgGeneric from '../../assets/images/vault/generic.png';
import imgHcpayday from '../../assets/images/vault/hcpayday.png';
import imgLevel from '../../assets/images/vault/levelprogression.png';
import imgMarketplace from '../../assets/images/vault/marketplace.png';
import imgSurprise from '../../assets/images/vault/surprise.png';
import { LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return (text && text !== key) ? text : fallback;
};

interface EarningRow
{
    key: string;
    label: string;
    img: string;
    currencies: number[];
}

// Icons are the hotel's real earnings_icon_* assets. Amounts are placeholders
// (0) and claims are disabled until the emulator exposes the data + packets.
// 'clubwork' has no dedicated earnings icon — uses the generic one for now.
const EARNINGS: EarningRow[] = [
    { key: 'daily', label: 'Regalo giornaliero', img: imgDailygift, currencies: [ 5 ] },
    { key: 'games', label: 'Giochi', img: imgGames, currencies: [ 0 ] },
    { key: 'achievements', label: 'Traguardi', img: imgAchievements, currencies: [ 5, 0 ] },
    { key: 'marketplace', label: 'Mercatino', img: imgMarketplace, currencies: [ 0 ] },
    { key: 'hcpayday', label: 'Bonus giorno di paga HC', img: imgHcpayday, currencies: [ 0 ] },
    { key: 'level', label: 'Progressione Livello', img: imgLevel, currencies: [ 5, 0 ] },
    { key: 'donations', label: 'Donazioni', img: imgDonations, currencies: [ 0 ] },
    { key: 'bonusbag', label: 'Sacco Bonus', img: imgBonusbag, currencies: [ 0 ] },
    { key: 'surprise', label: 'Scatole Sorprese', img: imgSurprise, currencies: [ 5, 0 ] },
    { key: 'clubwork', label: 'Club e Lavoro', img: imgGeneric, currencies: [ 0 ] }
];

export const VaultView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 3) return;
                if(parts[2] !== 'vault') return;

                switch(parts[1])
                {
                    case 'open':
                        setIsVisible(true);
                        return;
                    case 'close':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'habboUI/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!isVisible) return null;

    return (
        <NitroCardView className="nitro-vault w-[430px]" theme="primary-slim" uniqueKey="vault">
            <NitroCardHeaderView headerText={ localizeWithFallback('earnings.title', 'Guadagni') } onCloseClick={ () => setIsVisible(false) } />
            <NitroCardContentView className="flex flex-col gap-[5px] text-black">
                { EARNINGS.map(row => (
                    <div key={ row.key } className="flex items-center gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[5px] border border-[#9aa0a8] bg-white px-1.5 py-1">
                            <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded border border-black/15 bg-white">
                                <img src={ row.img } alt="" className="max-h-[24px] max-w-[24px] object-contain [image-rendering:pixelated]" />
                            </span>
                            <Text bold className="truncate">{ localizeWithFallback('earnings.' + row.key, row.label) }</Text>
                        </div>
                        <div className="flex min-w-[78px] shrink-0 items-center justify-end gap-2">
                            { row.currencies.map((currency, index) => (
                                <span key={ index } className="flex items-center gap-1">
                                    <LayoutCurrencyIcon type={ currency } />
                                    <Text bold small>0</Text>
                                </span>
                            )) }
                        </div>
                        <button type="button" disabled className="shrink-0 cursor-default rounded-[4px] border border-[#909090] bg-[linear-gradient(180deg,#f2f2f2_0%,#cdcdcd_100%)] px-2.5 py-[3px] text-[0.72rem] font-bold text-[#7c7c7c] shadow-[inset_0_1px_0_#ffffff]">
                            { localizeWithFallback('earnings.claim', 'Riscatta') }
                        </button>
                    </div>
                )) }
                <div className="flex justify-center pt-1">
                    <button type="button" disabled className="cursor-default rounded-[4px] border border-[#909090] bg-[linear-gradient(180deg,#f2f2f2_0%,#cdcdcd_100%)] px-7 py-1 text-[0.78rem] font-bold text-[#7c7c7c] shadow-[inset_0_1px_0_#ffffff]">
                        { localizeWithFallback('earnings.claim.all', 'Richiedili Tutti') }
                    </button>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
