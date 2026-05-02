import { AnimatePresence, motion } from 'motion/react';
import { FC, ReactNode } from 'react';
import { getTransitionAnimationStyle } from './TransitionAnimationStyles';

interface TransitionAnimationProps
{
    type: string;
    inProp: boolean;
    timeout?: number;
    className?: string;
    children?: ReactNode;
}

export const TransitionAnimation: FC<TransitionAnimationProps> = props =>
{
    const { type = null, inProp = false, timeout = 300, className = null, children = null } = props;

    return (
        <AnimatePresence>
            { inProp && (
                <motion.div
                    animate={ { opacity: 1 } }
                    className={ (className ?? '') + ' animate__animated' }
                    exit={ { opacity: 0 } }
                    initial={ { opacity: 0 } }
                    style={ { ...getTransitionAnimationStyle(type, 'entering', timeout) } }
                    transition={ { duration: timeout / 1000 } }>
                    { children }
                </motion.div>
            ) }
        </AnimatePresence>
    );
};
