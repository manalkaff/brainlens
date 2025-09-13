import React from 'react';
import { Search, BookOpen, TrendingUp, MessageCircle, User, Download } from 'lucide-react';
import { features } from './data';
// Icon mapping
const iconMap = {
    Search,
    BookOpen,
    TrendingUp,
    MessageCircle,
    User,
    Download
};
export const FeaturesSection = ({ className = '' }) => {
    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName];
        return IconComponent ? <IconComponent className="w-6 h-6"/> : null;
    };
    return (<section id="features" className={`py-16 sm:py-20 lg:py-24 bg-muted/30 ${className}`} aria-labelledby="features-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-14 lg:mb-16">
            <h2 id="features-title" className="text-title-md sm:text-title-lg md:text-title-xl lg:text-title-xxl font-bold text-foreground mb-4 sm:mb-6 leading-tight tracking-tight">
              Powerful Features for Deep Learning
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Everything you need to transform curiosity into expertise, 
              powered by cutting-edge AI technology.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" role="list" aria-label="Platform features">
            {features.map((feature, index) => (<article key={feature.id} className="group bg-card rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border border-border transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 focus-within:shadow-2xl focus-within:border-primary/30" style={{
                animationDelay: `${index * 100}ms`,
            }} role="listitem" tabIndex={0} aria-labelledby={`feature-title-${feature.id}`} aria-describedby={`feature-desc-${feature.id}`}>
                {/* Icon */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                  <div className="text-primary transition-transform duration-300 group-hover:scale-110">
                    {getIcon(feature.icon)}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 id={`feature-title-${feature.id}`} className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p id={`feature-desc-${feature.id}`} className="text-sm sm:text-base text-muted-foreground leading-relaxed transition-colors duration-200">
                    {feature.description}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="mt-4 sm:mt-6">
                  <span className={`
                      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${feature.category === 'core'
                ? 'bg-success/10 text-success border border-success/20'
                : feature.category === 'advanced'
                    ? 'bg-accent/50 text-accent-foreground border border-accent'
                    : 'bg-warning/10 text-warning border border-warning/20'}
                    `} aria-label={`Feature category: ${feature.category}`}>
                    {feature.category}
                  </span>
                </div>
              </article>))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12 sm:mt-14 lg:mt-16">
            <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 px-4 sm:px-0">
              Ready to experience the future of learning?
            </p>
            <button onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 min-h-[44px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:bg-primary/90 focus:scale-105" type="button" aria-label="Go back to the top of the page to start creating your learning path">
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </section>);
};
//# sourceMappingURL=FeaturesSection.jsx.map