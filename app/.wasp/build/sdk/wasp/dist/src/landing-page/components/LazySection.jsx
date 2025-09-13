import React, { useState, useEffect, useRef } from 'react';
export const LazySection = ({ children, fallback = <div className="h-96 animate-pulse bg-muted/20 rounded-lg"/>, rootMargin = '100px', threshold = 0.1, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !hasLoaded) {
                setIsVisible(true);
                setHasLoaded(true);
                // Disconnect observer after first load
                observer.disconnect();
            }
        }, {
            rootMargin,
            threshold
        });
        if (ref.current) {
            observer.observe(ref.current);
        }
        return () => {
            observer.disconnect();
        };
    }, [rootMargin, threshold, hasLoaded]);
    return (<div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>);
};
//# sourceMappingURL=LazySection.jsx.map