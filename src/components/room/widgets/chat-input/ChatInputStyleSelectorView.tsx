import * as Popover from '@radix-ui/react-popover';
import { FC, useState } from 'react';
import { Flex, Grid, NitroCardContentView } from '../../../../common';

interface ChatInputStyleSelectorViewProps {
    chatStyleId: number;
    chatStyleIds: number[];
    selectChatStyleId: (styleId: number) => void;
}

export const ChatInputStyleSelectorView: FC<ChatInputStyleSelectorViewProps> = (props) => {
    const { chatStyleIds = null, selectChatStyleId = null } = props;
    const [selectorVisible, setSelectorVisible] = useState(false);

    const selectStyle = (styleId: number) => {
        selectChatStyleId(styleId);
        setSelectorVisible(false);
    };

    return (
        <Popover.Root open={selectorVisible} onOpenChange={setSelectorVisible}>
            <Popover.Trigger asChild>
                <div className="nitro-chat-style-trigger" aria-label="Stili chat">
                    <svg className="nitro-chat-style-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="nitro-icon chatstyles-icon" />
                </div>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="top"
                    sideOffset={12}
                    className="nitro-chat-style-popover"
                >
                    <NitroCardContentView className="nitro-chat-style-popover-content" overflow="hidden">
                        <Grid columnCount={3} overflow="auto">
                            {chatStyleIds &&
                                chatStyleIds.length > 0 &&
                                chatStyleIds.map((styleId) => (
                                    <Flex key={styleId} center pointer className="nitro-chat-style-option" onClick={() => selectStyle(styleId)}>
                                        <div className="bubble-container nitro-chat-style-preview">
                                            <div className={`nitro-chat-style-bubble chat-bubble bubble-${styleId}`} />
                                        </div>
                                    </Flex>
                                ))}
                        </Grid>
                    </NitroCardContentView>
                    <Popover.Arrow className="fill-black" width={14} height={7} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};
