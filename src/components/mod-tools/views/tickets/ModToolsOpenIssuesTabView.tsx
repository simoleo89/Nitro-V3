import { IssueMessageData, PickIssuesMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useRef } from 'react';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, Column, Grid } from '../../../../common';

interface ModToolsOpenIssuesTabViewProps
{
    openIssues: IssueMessageData[];
}

export const ModToolsOpenIssuesTabView: FC<ModToolsOpenIssuesTabViewProps> = props =>
{
    const { openIssues = null } = props;
    const pendingPicksRef = useRef<Set<number>>(new Set());

    const pickIssue = (issueId: number) =>
    {
        if(pendingPicksRef.current.has(issueId)) return;

        pendingPicksRef.current.add(issueId);
        SendMessageComposer(new PickIssuesMessageComposer([ issueId ], false, 0, 'pick issue button'));

        setTimeout(() => pendingPicksRef.current.delete(issueId), 2000);
    };

    return (
        <Column gap={ 0 } overflow="hidden">
            <Column gap={ 2 }>
                <Grid className="text-black font-bold	 border-bottom pb-1" gap={ 1 }>
                    <div className="col-span-2">{ LocalizeText('moderation.tickets.col.type') }</div>
                    <div className="col-span-3">{ LocalizeText('moderation.tickets.col.roomPlayer') }</div>
                    <div className="col-span-4">{ LocalizeText('moderation.tickets.col.opened') }</div>
                    <div className="col-span-3"></div>
                </Grid>
            </Column>
            <Column className="striped-children" gap={ 0 } overflow="auto">
                { openIssues && (openIssues.length > 0) && openIssues.map(issue =>
                {
                    return (
                        <Grid key={ issue.issueId } alignItems="center" className="text-black py-1 border-bottom" gap={ 1 }>
                            <div className="col-span-2">{ issue.categoryId }</div>
                            <div className="col-span-3">{ issue.reportedUserName }</div>
                            <div className="col-span-4">{ new Date(Date.now() - issue.issueAgeInMilliseconds).toLocaleTimeString() }</div>
                            <div className="col-span-3">
                                <Button variant="success" onClick={ () => pickIssue(issue.issueId) }>{ LocalizeText('moderation.tickets.pick') }</Button>
                            </div>
                        </Grid>
                    );
                }) }
            </Column>
        </Column>
    );
};
