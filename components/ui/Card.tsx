import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'default', children, ...props }, ref) => {

        const variants = {
            default: "bg-surface border border-border shadow-sm",
            glass: "bg-white/40 backdrop-blur-md border border-white/50 shadow-sm"
        };

        return (
            <div
                ref={ref}
                className={`rounded-2xl p-6 ${variants[variant]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
