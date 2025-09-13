import React, { ReactNode } from 'react';
interface LazySectionProps {
    children: ReactNode;
    fallback?: ReactNode;
    rootMargin?: string;
    threshold?: number;
    className?: string;
}
export declare const LazySection: React.FC<LazySectionProps>;
export {};
//# sourceMappingURL=LazySection.d.ts.map