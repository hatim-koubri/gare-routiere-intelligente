import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    disableHover?: boolean;
    dark?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', disableHover = false, dark = false, children, ...props }, ref) => {
        let baseClass = `relative overflow-hidden rounded-[4px] p-8 border `;
        
        if (dark) {
            baseClass += `bg-[var(--slate)] border-[var(--gold)]/20 `;
        } else {
            baseClass += `bg-[var(--cream)] border-[var(--card-border)] shadow-[0_1px_3px_rgba(13,17,23,0.06),0_4px_16px_rgba(13,17,23,0.04)] `;
        }

        let hoverClass = disableHover ? '' : 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(193,68,14,0.12)] group ';

        return (
            <div ref={ref} className={baseClass + hoverClass + className} {...props}>
                {/* Zellige Watermark Top Right */}
                <div className="absolute top-0 right-0 w-[80px] h-[80px] zellige-pattern opacity-6 pointer-events-none" />
                
                {/* Content */}
                <div className="relative z-10 w-full h-full">
                    {children}
                </div>

                {/* Hover line bottom */}
                {!disableHover && (
                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--terracotta)] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 z-20 pointer-events-none" />
                )}
            </div>
        );
    }
);

Card.displayName = 'Card';
