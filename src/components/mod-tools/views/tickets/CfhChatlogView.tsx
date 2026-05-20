import { CfhChatlogData, CfhChatlogEvent, GetCfhChatlogMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { useNitroQuery } from '../../../../api/nitro-query';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { ChatlogView } from '../chatlog/ChatlogView';

interface CfhChatlogViewProps
{
    issueId: number;
    onCloseClick(): void;
}

export const CfhChatlogView: FC<CfhChatlogViewProps> = props =>
{
    const { onCloseClick = null, issueId = null } = props;

    const { data: chatlogData } = useNitroQuery<CfhChatlogEvent, CfhChatlogData>({
        key: [ 'nitro', 'mod-tools', 'cfh-chatlog', issueId ],
        request: () => new GetCfhChatlogMessageComposer(issueId),
        parser: CfhChatlogEvent,
        accept: e => e.getParser()?.data.issueId === issueId,
        select: e => e.getParser().data,
        enabled: issueId !== null
    });

    return (
        <NitroCardView className="nitro-mod-tools-chatlog" theme="primary-slim">
            <NitroCardHeaderView headerText={ 'Issue Chatlog' } onCloseClick={ onCloseClick } />
            <NitroCardContentView className="text-black">
                { chatlogData && <ChatlogView records={ [ chatlogData.chatRecord ] } /> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
