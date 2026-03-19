import { CloseIssuesMessageComposer, ReleaseIssuesMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { GetIssueCategoryName, LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, Column, Grid, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import { useModTools } from '../../../../hooks';
import { CfhChatlogView } from './CfhChatlogView';

interface IssueInfoViewProps
{
    issueId: number;
    onIssueInfoClosed(issueId: number): void;
}

export const ModToolsIssueInfoView: FC<IssueInfoViewProps> = props =>
{
    const { issueId = null, onIssueInfoClosed = null } = props;
    const [ cfhChatlogOpen, setcfhChatlogOpen ] = useState(false);
    const { tickets = [], openUserInfo = null } = useModTools();
    const ticket = tickets.find(issue => (issue.issueId === issueId));

    const releaseIssue = (issueId: number) =>
    {
        SendMessageComposer(new ReleaseIssuesMessageComposer([ issueId ]));

        onIssueInfoClosed(issueId);
    };

    const closeIssue = (resolutionType: number) =>
    {
        SendMessageComposer(new CloseIssuesMessageComposer([ issueId ], resolutionType));

        onIssueInfoClosed(issueId);
    };

    return (
        <>
            <NitroCardView className="nitro-mod-tools-handle-issue" theme="primary-slim">
                <NitroCardHeaderView headerText={ LocalizeText('moderation.issue.resolving', [ 'id' ], [ String(issueId) ]) } onCloseClick={ () => onIssueInfoClosed(issueId) } />
                <NitroCardContentView className="text-black">
                    <Text fontSize={ 4 }>{ LocalizeText('moderation.issue.info') }</Text>
                    <Grid overflow="auto">
                        <Column size={ 8 }>
                            <table className="table table-striped table-sm table-text-small text-black m-0">
                                <tbody>
                                    <tr>
                                        <th>{ LocalizeText('moderation.issue.source') }</th>
                                        <td>{ GetIssueCategoryName(ticket.categoryId) }</td>
                                    </tr>
                                    <tr>
                                        <th>{ LocalizeText('moderation.issue.category') }</th>
                                        <td className="text-break">{ LocalizeText('help.cfh.topic.' + ticket.reportedCategoryId) }</td>
                                    </tr>
                                    <tr>
                                        <th>{ LocalizeText('moderation.issue.description') }</th>
                                        <td className="text-break">{ ticket.message }</td>
                                    </tr>
                                    <tr>
                                        <th>{ LocalizeText('moderation.issue.caller') }</th>
                                        <td>
                                            <Text bold pointer underline onClick={ event => openUserInfo(ticket.reporterUserId) }>{ ticket.reporterUserName }</Text>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>{ LocalizeText('moderation.issue.reported') }</th>
                                        <td>
                                            <Text bold pointer underline onClick={ event => openUserInfo(ticket.reportedUserId) }>{ ticket.reportedUserName }</Text>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Column>
                        <Column gap={ 1 } size={ 4 }>
                            <Button variant="secondary" onClick={ () => setcfhChatlogOpen(!cfhChatlogOpen) }>{ LocalizeText('moderation.issue.chatlog') }</Button>
                            <Button onClick={ event => closeIssue(CloseIssuesMessageComposer.RESOLUTION_USELESS) }>{ LocalizeText('moderation.issue.close.useless') }</Button>
                            <Button variant="danger" onClick={ event => closeIssue(CloseIssuesMessageComposer.RESOLUTION_ABUSIVE) }>{ LocalizeText('moderation.issue.close.abusive') }</Button>
                            <Button variant="success" onClick={ event => closeIssue(CloseIssuesMessageComposer.RESOLUTION_RESOLVED) }>{ LocalizeText('moderation.issue.close.resolved') }</Button>
                            <Button variant="secondary" onClick={ event => releaseIssue(issueId) } >{ LocalizeText('moderation.issue.release') }</Button>
                        </Column>
                    </Grid>
                </NitroCardContentView>
            </NitroCardView>
            { cfhChatlogOpen &&
                <CfhChatlogView issueId={ issueId } onCloseClick={ () => setcfhChatlogOpen(false) }/> }
        </>
    );
};
