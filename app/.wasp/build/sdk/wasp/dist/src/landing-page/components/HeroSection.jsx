import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getRandomHeroTitle } from './data';
import { InputCard } from './InputCard';
import { smoothScrollToSection } from './utils';
import { prefersReducedMotion, getAnimationDuration } from '../utils/performance';
export const HeroSection = ({ onTopicSubmit, isLoading = false }) => {
    const [heroTitle, setHeroTitle] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const reducedMotion = prefersReducedMotion();
    useEffect(() => {
        // Set random title on component mount
        const randomTitle = getRandomHeroTitle();
        setHeroTitle(randomTitle.text);
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);
    const handleScrollToNext = () => {
        smoothScrollToSection('introduction');
    };
    return (<section id="hero" className="h-screen flex flex-col items-center justify-center relative bg-gradient-to-br from-background via-muted/30 to-accent/20 overflow-hidden" role="banner" aria-labelledby="hero-title" aria-describedby="hero-subtitle">
      {/* Background decoration - hidden from screen readers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/5" aria-hidden="true"/>
      {!reducedMotion && (<>
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl will-change-transform" style={{
                animation: reducedMotion ? 'none' : 'pulse 4s ease-in-out infinite',
            }} aria-hidden="true"/>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/8 rounded-full blur-3xl will-change-transform" style={{
                animation: reducedMotion ? 'none' : 'pulse 4s ease-in-out infinite 2s',
            }} aria-hidden="true"/>
        </>)}
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto">
          {/* Hero Title */}
          <h1 id="hero-title" className={`
              text-title-lg sm:text-title-xl md:text-title-xxl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 sm:mb-8 leading-tight tracking-tight px-2 sm:px-0
              transform transition-all ease-out will-change-transform
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `} style={{
            transitionDuration: `${getAnimationDuration(700)}ms`,
        }}>
            {heroTitle}
          </h1>
          
          {/* Subtitle */}
          <p id="hero-subtitle" className={`
              text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0
              transform transition-all ease-out will-change-transform
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `} style={{
            transitionDuration: `${getAnimationDuration(700)}ms`,
            transitionDelay: `${getAnimationDuration(150)}ms`,
        }}>
            Transform any topic into a structured learning journey powered by AI research
          </p>
          
          {/* Input Card */}
          <div className={`
              max-w-2xl mx-auto px-2 sm:px-0
              transform transition-all ease-out will-change-transform
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `} style={{
            transitionDuration: `${getAnimationDuration(700)}ms`,
            transitionDelay: `${getAnimationDuration(300)}ms`,
        }}>
            <InputCard onSubmit={onTopicSubmit} isLoading={isLoading}/>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="relative z-10 pb-6 sm:pb-8">
        <button onClick={handleScrollToNext} className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-foreground transition-all duration-300 ease-out group min-h-[44px] min-w-[44px] p-3 rounded-xl hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:bg-muted/50" aria-label="Scroll to introduction section to learn more about our platform" type="button">
          <span className="text-sm font-medium transition-transform duration-300 group-hover:scale-105">Learn more</span>
          <ChevronDown className={`
              w-6 h-6 transition-transform duration-300 group-hover:translate-y-1 will-change-transform
              ${!reducedMotion ? 'animate-bounce group-hover:animate-none' : ''}
            `} aria-hidden="true"/>
        </button>
      </div>
    </section>);
};
//# sourceMappingURL=HeroSection.jsx.map