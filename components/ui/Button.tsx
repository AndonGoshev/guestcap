import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-accent-gradient text-foreground shadow-sm hover:opacity-90 active:scale-95",
            secondary: "bg-surface text-foreground border border-border/50 hover:bg-surface-end active:scale-95", // updated to surface
            ghost: "bg-transparent hover:bg-black/5 text-foreground/80 hover:text-foreground",
            outline: "bg-transparent border border-foreground/20 text-foreground hover:bg-foreground/5"
        };

        const sizes = {
            sm: "text-sm px-4 py-1.5",
            md: "text-base px-6 py-3",
            lg: "text-lg px-8 py-4",
            icon: "p-2 w-10 h-10"
        };

        const widthClass = fullWidth ? "w-full" : "";

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
