import { GetSessionDataManager, IssueMessageData } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../../../common';
import { useModTools } from '../../../../hooks';
import { ModToolsIssueInfoView } from './ModToolsIssueInfoView';
import { ModToolsMyIssuesTabView } from './ModToolsMyIssuesTabView';
import { ModToolsOpenIssuesTabView } from './ModToolsOpenIssuesTabView';
import { ModToolsPickedIssuesTabView } from './ModToolsPickedIssuesTabView';

interface ModToolsTicketsViewProps
{
    onCloseClick: () => void;
}

const TAB_KEYS: string[] = [
    'moderation.tickets.open',
    'moderation.tickets.my',
    'moderation.tickets.picked'
];

export const ModToolsTicketsView: FC<ModToolsTicketsViewProps> = props =>
{
    const { onCloseClick = null } = props;
    const [ currentTab, setCurrentTab ] = useState<number>(0);
    const [ issueInfoWindows, setIssueInfoWindows ] = useState<number[]>([]);
    const { tickets = [] } = useModTools();

    const openIssues = tickets.filter(issue => issue.state === IssueMessageData.STATE_OPEN);
    const myIssues = tickets.filter(issue => (issue.state === IssueMessageData.STATE_PICKED) && (issue.pickerUserId === GetSessionDataManager().userId));
    const pickedIssues = tickets.filter(issue => issue.state === IssueMessageData.STATE_PICKED);

    const closeIssue = (issueId: number) =>
    {
        setIssueInfoWindows(prevValue =>
        {
            const newValue = [ ...prevValue ];
            const existingIndex = newValue.indexOf(issueId);

            if(existingIndex >= 0) newValue.splice(existingIndex, 1);

            return newValue;
        });
    };

    const handleIssue = (issueId: number) =>
    {
        setIssueInfoWindows(prevValue =>
        {
            const newValue = [ ...prevValue ];
            const existingIndex = newValue.indexOf(issueId);

            if(existingIndex === -1) newValue.push(issueId);
            else newValue.splice(existingIndex, 1);

            return newValue;
        });
    };

    const CurrentTabComponent = () =>
    {
        switch(currentTab)
        {
            case 0: return <ModToolsOpenIssuesTabView openIssues={ openIssues }/>;
            case 1: return <ModToolsMyIssuesTabView handleIssue={ handleIssue } myIssues={ myIssues }/>;
            case 2: return <ModToolsPickedIssuesTabView pickedIssues={ pickedIssues }/>;
        }

        return null;
    };

    return (
        <>
            <NitroCardView className="nitro-mod-tools-tickets">
                <NitroCardHeaderView headerText={ LocalizeText('moderation.tickets.title') } onCloseClick={ onCloseClick } />
                <NitroCardTabsView>
                    { TAB_KEYS.map((tabKey, index) =>
                    {
                        return (<NitroCardTabsItemView key={ index } isActive={ (currentTab === index) } onClick={ event => setCurrentTab(index) }>
                            { LocalizeText(tabKey) }
                        </NitroCardTabsItemView>);
                    }) }
                </NitroCardTabsView>
                <NitroCardContentView gap={ 1 }>
                    <CurrentTabComponent />
                </NitroCardContentView>
            </NitroCardView>
            { issueInfoWindows && (issueInfoWindows.length > 0) && issueInfoWindows.map(issueId => <ModToolsIssueInfoView key={ issueId } issueId={ issueId } onIssueInfoClosed={ closeIssue } />) }
        </>
    );
};
