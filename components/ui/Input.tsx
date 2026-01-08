import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-sm font-medium text-foreground/80 ml-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full bg-surface/50 border border-border rounded-xl px-4 py-3 
            text-foreground placeholder:text-foreground/30
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-200' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-500 ml-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
