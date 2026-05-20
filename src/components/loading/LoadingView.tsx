import { FC } from 'react';
import loadingGif from '@/assets/images/loading/loading.gif';
import { Base, Column, Text } from '../../common';

interface LoadingViewProps {
    isError?: boolean;
    message?: string;
    homeUrl?: string;
}

export const LoadingView: FC<LoadingViewProps> = props =>
{
    const { isError = false, message = '', homeUrl = '' } = props;

    return (
        <Column fullHeight position="fixed" className="fixed inset-0 z-[2147483000] bg-[radial-gradient(#1d1a24,#003a6b)]">
            <Base fullHeight className="container h-100">
                <Column fullHeight alignItems="center" justifyContent="center">
                    <Base className="absolute top-[20px] left-[20px] z-[2] w-[150px] h-[100px] bg-[url('@/assets/images/notifications/nitro_v3.png')] bg-no-repeat bg-left-top" />
                    { isError && (message && message.length) ?
                        <Column alignItems="center" className="absolute bottom-[20px] left-1/2 z-[3] -translate-x-1/2 max-w-[80%]" gap={ 2 }>
                            <Text fontSizeCustom={ 20 } variant="white" className="text-center [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]">
                                { message }
                            </Text>
                            { homeUrl &&
                                <a
                                    href={ homeUrl }
                                    className="mt-3 px-6 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-base font-semibold no-underline cursor-pointer transition-colors duration-200 [text-shadow:none]"
                                >
                                    Back to Hotel
                                </a>
                            }
                        </Column>
                        :
                        <Column alignItems="center" justifyContent="center" gap={ 3 } className="z-[3]">
                            <img src={ loadingGif } alt="" draggable={ false } className="block w-auto h-auto select-none pointer-events-none" />
                            { message && message.length ?
                                <Text fontSizeCustom={ 20 } variant="white" className="text-center [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]">
                                    { message }
                                </Text>
                                : null
                            }
                        </Column>
                    }
                </Column>
            </Base>
        </Column>
    );
};
