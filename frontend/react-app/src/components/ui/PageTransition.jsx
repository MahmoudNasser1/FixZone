import React from 'react';
import { cn } from '../../lib/utils';

const PageTransition = ({ children, className }) => {
    return (
        <div
            className={cn(
                "animate-in fade-in slide-in-from-bottom duration-500",
                className
            )}
        >
            {children}
        </div>
    );
};

export default PageTransition;
