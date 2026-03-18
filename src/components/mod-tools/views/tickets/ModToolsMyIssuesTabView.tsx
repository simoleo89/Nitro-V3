import { IssueMessageData, ReleaseIssuesMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useRef } from 'react';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, Column, Grid } from '../../../../common';

interface ModToolsMyIssuesTabViewProps
{
    myIssues: IssueMessageData[];
    handleIssue: (issueId: number) => void;
}

export const ModToolsMyIssuesTabView: FC<ModToolsMyIssuesTabViewProps> = props =>
{
    const { myIssues = null, handleIssue = null } = props;
    const pendingReleasesRef = useRef<Set<number>>(new Set());

    const releaseIssue = (issueId: number) =>
    {
        if(pendingReleasesRef.current.has(issueId)) return;

        pendingReleasesRef.current.add(issueId);
        SendMessageComposer(new ReleaseIssuesMessageComposer([ issueId ]));

        setTimeout(() => pendingReleasesRef.current.delete(issueId), 2000);
    };

    return (
        <Column gap={ 0 } overflow="hidden">
            <Column gap={ 2 }>
                <Grid className="text-black font-bold	 border-bottom pb-1" gap={ 1 }>
                    <div className="col-span-2">{ LocalizeText('moderation.tickets.col.type') }</div>
                    <div className="col-span-3">{ LocalizeText('moderation.tickets.col.roomPlayer') }</div>
                    <div className="col-span-3">{ LocalizeText('moderation.tickets.col.opened') }</div>
                    <div className="col-span-2"></div>
                    <div className="col-span-2"></div>
                </Grid>
            </Column>
            <Column className="striped-children" gap={ 0 } overflow="auto">
                { myIssues && (myIssues.length > 0) && myIssues.map(issue =>
                {
                    return (
                        <Grid key={ issue.issueId } alignItems="center" className="text-black py-1 border-bottom" gap={ 1 }>
                            <div className="col-span-2">{ issue.categoryId }</div>
                            <div className="col-span-3">{ issue.reportedUserName }</div>
                            <div className="col-span-3">{ new Date(Date.now() - issue.issueAgeInMilliseconds).toLocaleTimeString() }</div>
                            <div className="col-span-2">
                                <Button variant="primary" onClick={ event => handleIssue(issue.issueId) }>{ LocalizeText('moderation.tickets.handle') }</Button>
                            </div>
                            <div className="col-span-2">
                                <Button variant="danger" onClick={ () => releaseIssue(issue.issueId) }>{ LocalizeText('moderation.tickets.release') }</Button>
                            </div>
                        </Grid>
                    );
                }) }
            </Column>
        </Column>
    );
};
