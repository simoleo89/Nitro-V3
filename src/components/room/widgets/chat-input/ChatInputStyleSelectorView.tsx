import { FC, useState } from 'react';
import { ArrowContainer, Popover } from 'react-tiny-popover';
import { Flex, Grid, NitroCardContentView } from '../../../../common';

interface ChatInputStyleSelectorViewProps
{
  chatStyleId: number;
  chatStyleIds: number[];
  selectChatStyleId: (styleId: number) => void;
}

export const ChatInputStyleSelectorView: FC<ChatInputStyleSelectorViewProps> = props =>
{
  const { chatStyleIds = null, selectChatStyleId = null } = props;
  const [ selectorVisible, setSelectorVisible ] = useState(false);

  const selectStyle = (styleId: number) =>
  {
    selectChatStyleId(styleId);
    setSelectorVisible(false);
  };

  return (
    <Popover
      padding={12}
      isOpen={selectorVisible}
      positions={['top']}
      reposition={false}
      containerClassName="max-w-[276px] not-italic font-normal leading-normal text-left no-underline text-shadow-none normal-case tracking-[normal] [word-break:normal] [word-spacing:normal] whitespace-normal text-[.7875rem] [word-wrap:break-word] bg-card-content-area bg-clip-padding border border-[solid] border-card-border rounded-[.25rem] [box-shadow:0_2px_#00000073] z-1070"
      content={({ position, childRect, popoverRect }) => (
        <ArrowContainer
          arrowColor={'black'}
          arrowSize={7}
          arrowStyle={{ bottom: 'calc(-.5rem - 1px)' }}
          childRect={childRect}
          popoverRect={popoverRect}
          position={position}
        >
          <NitroCardContentView className="bg-transparent max-h-[210px]!" overflow="hidden">
            <Grid columnCount={3} overflow="auto">
              {chatStyleIds && chatStyleIds.length > 0 && chatStyleIds.map(styleId => (
                <Flex key={styleId} center pointer className="h-[35px] w-[65px]" onClick={() => selectStyle(styleId)}>
                  <div className="bubble-container relative w-[50px]">
                    <div className={`relative max-w-[65px] min-h-[26px] text-[14px] chat-bubble bubble-${styleId}`} />
                  </div>
                </Flex>
              ))}
            </Grid>
          </NitroCardContentView>
        </ArrowContainer>
      )}
    >
      <div
        className="chatstyles-anchor"
        onClick={() => setSelectorVisible(v => !v)}
      >
        <div className="nitro-icon chatstyles-icon" />
      </div>
    </Popover>
  );
};