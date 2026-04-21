import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'danger' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className = '', children, ...props }) => {
    let variantClass = '';

    switch (variant) {
        case 'success':
            variantClass = 'bg-[#7EB8A4]/15 text-[#3D8C72] border-[#7EB8A4]';
            break;
        case 'warning':
            variantClass = 'bg-[#BFA05A]/15 text-[#8A6A20] border-[#BFA05A]';
            break;
        case 'danger':
            variantClass = 'bg-[#C1440E]/10 text-[#C1440E] border-[#C1440E]';
            break;
        case 'neutral':
        default:
            variantClass = 'bg-[var(--ink)]/5 text-[var(--muted)] border-[var(--ink)]/10';
            break;
    }

    return (
        <span 
            className={`inline-block border px-[10px] py-[4px] rounded-[2px] font-mono text-[12px] uppercase tracking-[0.08em] font-medium leading-none ${variantClass} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};
