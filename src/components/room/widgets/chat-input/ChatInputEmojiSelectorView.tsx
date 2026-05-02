import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import * as Popover from '@radix-ui/react-popover';
import { FC, useState } from 'react';

interface ChatInputEmojiSelectorViewProps
{
    addChatEmoji: (emoji: string) => void;
}

export const ChatInputEmojiSelectorView: FC<ChatInputEmojiSelectorViewProps> = props =>
{
    const { addChatEmoji = null } = props;
    const [ selectorVisible, setSelectorVisible ] = useState(false);

    const handleEmojiSelect = (emoji: any) =>
    {
        addChatEmoji(emoji.native);
        setSelectorVisible(false);
    };

    return (
        <div>
            <Popover.Root open={ selectorVisible } onOpenChange={ setSelectorVisible }>
                <Popover.Trigger asChild>
                    <div className="cursor-pointer text-lg select-none px-1">🙂</div>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content className="z-[1070]" side="top" sideOffset={ 6 }>
                        <Picker data={ data } onEmojiSelect={ handleEmojiSelect } />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
};
