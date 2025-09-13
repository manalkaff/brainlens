import React from 'react';
import { Brain, Zap, Target } from 'lucide-react';
import type { IntroductionSectionProps } from './types';

export const IntroductionSection: React.FC<IntroductionSectionProps> = ({
  className = ''
}) => {
  return (
    <section 
      id="introduction" 
      className={`py-16 sm:py-20 lg:py-24 bg-background ${className}`}
      aria-labelledby="introduction-title"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 
                  id="introduction-title"
                  className="text-title-md sm:text-title-lg md:text-title-xl lg:text-title-xxl font-bold text-foreground mb-4 sm:mb-6 leading-tight tracking-tight"
                >
                  Transform Any Topic Into Deep Learning
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Our AI-powered platform researches any topic you're curious about, 
                  then creates a structured, personalized learning experience that 
                  adapts to your pace and style.
                </p>
              </div>

              {/* Key Benefits */}
              <div className="space-y-4 sm:space-y-6" role="list" aria-label="Platform benefits">
                <div className="flex items-start space-x-3 sm:space-x-4 group" role="listitem">
                  <div 
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2 transition-colors duration-200">
                      AI-Powered Research
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed transition-colors duration-200">
                      Advanced AI agents gather information from multiple sources, 
                      synthesize complex topics, and organize them into digestible modules.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4 group" role="listitem">
                  <div 
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-success/20 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-success transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2 transition-colors duration-200">
                      Instant Learning Paths
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed transition-colors duration-200">
                      Get structured learning paths in seconds, complete with 
                      interactive content, quizzes, and progress tracking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4 group" role="listitem">
                  <div 
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-accent/50 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-accent group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2 transition-colors duration-200">
                      Personalized Experience
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed transition-colors duration-200">
                      Content adapts to your learning style, pace, and goals, 
                      ensuring maximum retention and engagement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Element */}
            <div className="relative mt-8 lg:mt-0">
              <div 
                className="bg-gradient-to-br from-muted/50 to-accent/30 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-border/50 transition-all duration-500 hover:shadow-2xl hover:border-border"
                role="img"
                aria-label="Demonstration of AI research process creating a learning path"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 bg-success rounded-full animate-pulse"
                      aria-hidden="true"
                    ></div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      AI Research in Progress
                    </span>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3" aria-hidden="true">
                    <div className="h-3 sm:h-4 bg-primary/20 rounded animate-pulse"></div>
                    <div className="h-3 sm:h-4 bg-primary/20 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 sm:h-4 bg-primary/20 rounded animate-pulse w-1/2"></div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-card rounded-lg shadow-sm border border-border/30">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Learning Path Generated
                    </div>
                    <div className="space-y-1.5 sm:space-y-2" role="list" aria-label="Sample learning path steps">
                      <div className="flex items-center space-x-2" role="listitem">
                        <div 
                          className="w-2 h-2 bg-success rounded-full"
                          aria-label="Completed step"
                        ></div>
                        <span className="text-xs sm:text-sm text-foreground">Introduction & Basics</span>
                      </div>
                      <div className="flex items-center space-x-2" role="listitem">
                        <div 
                          className="w-2 h-2 bg-warning rounded-full"
                          aria-label="In progress step"
                        ></div>
                        <span className="text-xs sm:text-sm text-foreground">Core Concepts</span>
                      </div>
                      <div className="flex items-center space-x-2" role="listitem">
                        <div 
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                          aria-label="Upcoming step"
                        ></div>
                        <span className="text-xs sm:text-sm text-foreground">Advanced Topics</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};