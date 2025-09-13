import React from 'react';
interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    placeholder?: string;
    onLoad?: () => void;
    onError?: () => void;
}
export declare const OptimizedImage: React.FC<OptimizedImageProps>;
export {};
//# sourceMappingURL=OptimizedImage.d.ts.map