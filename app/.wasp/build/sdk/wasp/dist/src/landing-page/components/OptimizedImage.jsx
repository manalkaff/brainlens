import React, { useState, useRef, useEffect } from 'react';
export const OptimizedImage = ({ src, alt, className = '', width, height, priority = false, placeholder, onLoad, onError }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const containerRef = useRef(null);
    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, {
            rootMargin: '50px'
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, [priority]);
    // Generate WebP and fallback sources
    const getOptimizedSrc = (originalSrc, format = 'original') => {
        if (format === 'webp' && originalSrc.match(/\.(jpg|jpeg|png)$/i)) {
            return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        }
        return originalSrc;
    };
    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };
    const handleError = () => {
        setHasError(true);
        onError?.();
    };
    const imageStyle = {
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
    };
    return (<div ref={containerRef} className={`relative overflow-hidden ${className}`} style={imageStyle}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (<div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center" style={imageStyle}>
          {placeholder && (<span className="text-muted-foreground text-sm">{placeholder}</span>)}
        </div>)}

      {/* Optimized Image */}
      {isInView && !hasError && (<picture>
          {/* WebP source for modern browsers */}
          <source srcSet={getOptimizedSrc(src, 'webp')} type="image/webp"/>
          
          {/* Fallback for older browsers */}
          <img ref={imgRef} src={src} alt={alt} className={`
              transition-opacity duration-300 ease-in-out
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${className}
            `} style={imageStyle} onLoad={handleLoad} onError={handleError} loading={priority ? 'eager' : 'lazy'} decoding="async" {...(width && { width })} {...(height && { height })}/>
        </picture>)}

      {/* Error fallback */}
      {hasError && (<div className="absolute inset-0 bg-muted/10 flex items-center justify-center border border-border/20 rounded" style={imageStyle}>
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>)}
    </div>);
};
//# sourceMappingURL=OptimizedImage.jsx.map