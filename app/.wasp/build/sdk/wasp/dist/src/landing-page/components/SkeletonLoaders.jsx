import React from 'react';
export const IntroductionSkeleton = () => (<section className="py-16 sm:py-20 lg:py-24 bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Text Content Skeleton */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="h-8 sm:h-10 md:h-12 bg-muted/30 rounded-lg animate-pulse mb-4 sm:mb-6 w-3/4"/>
              <div className="space-y-3">
                <div className="h-6 bg-muted/20 rounded animate-pulse"/>
                <div className="h-6 bg-muted/20 rounded animate-pulse w-5/6"/>
                <div className="h-6 bg-muted/20 rounded animate-pulse w-4/5"/>
              </div>
            </div>

            {/* Benefits Skeleton */}
            <div className="space-y-4 sm:space-y-6">
              {[1, 2, 3].map((i) => (<div key={i} className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-muted/30 rounded-lg animate-pulse"/>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-5 bg-muted/20 rounded animate-pulse w-1/3"/>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted/15 rounded animate-pulse"/>
                      <div className="h-4 bg-muted/15 rounded animate-pulse w-4/5"/>
                    </div>
                  </div>
                </div>))}
            </div>
          </div>

          {/* Visual Element Skeleton */}
          <div className="relative mt-8 lg:mt-0">
            <div className="bg-muted/20 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-border/50 animate-pulse">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-muted/30 rounded-full"/>
                  <div className="h-4 bg-muted/30 rounded w-1/3"/>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="h-3 sm:h-4 bg-muted/30 rounded"/>
                  <div className="h-3 sm:h-4 bg-muted/30 rounded w-3/4"/>
                  <div className="h-3 sm:h-4 bg-muted/30 rounded w-1/2"/>
                </div>
                
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/10 rounded-lg">
                  <div className="h-3 bg-muted/20 rounded w-1/4 mb-2"/>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[1, 2, 3].map((i) => (<div key={i} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-muted/30 rounded-full"/>
                        <div className="h-3 bg-muted/20 rounded w-1/3"/>
                      </div>))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>);
export const FeaturesSkeleton = () => (<section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header Skeleton */}
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <div className="h-8 sm:h-10 md:h-12 bg-muted/30 rounded-lg animate-pulse mb-4 sm:mb-6 w-2/3 mx-auto"/>
          <div className="space-y-2 max-w-3xl mx-auto">
            <div className="h-6 bg-muted/20 rounded animate-pulse"/>
            <div className="h-6 bg-muted/20 rounded animate-pulse w-4/5 mx-auto"/>
          </div>
        </div>

        {/* Features Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (<div key={i} className="bg-card rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border border-border animate-pulse">
              {/* Icon Skeleton */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted/30 rounded-lg mb-4 sm:mb-6"/>

              {/* Content Skeleton */}
              <div className="space-y-3">
                <div className="h-6 bg-muted/20 rounded w-3/4"/>
                <div className="space-y-2">
                  <div className="h-4 bg-muted/15 rounded"/>
                  <div className="h-4 bg-muted/15 rounded w-5/6"/>
                  <div className="h-4 bg-muted/15 rounded w-4/5"/>
                </div>
              </div>

              {/* Badge Skeleton */}
              <div className="mt-4 sm:mt-6">
                <div className="h-6 bg-muted/20 rounded-full w-16"/>
              </div>
            </div>))}
        </div>

        {/* CTA Skeleton */}
        <div className="text-center mt-12 sm:mt-14 lg:mt-16">
          <div className="h-6 bg-muted/20 rounded animate-pulse mb-4 sm:mb-6 w-1/3 mx-auto"/>
          <div className="h-12 bg-muted/30 rounded-lg animate-pulse w-40 mx-auto"/>
        </div>
      </div>
    </div>
  </section>);
export const FAQSkeleton = () => (<section className="py-16 sm:py-20 lg:py-24 bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Header Skeleton */}
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <div className="h-8 sm:h-10 md:h-12 bg-muted/30 rounded-lg animate-pulse mb-4 sm:mb-6 w-1/2 mx-auto"/>
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="h-6 bg-muted/20 rounded animate-pulse"/>
            <div className="h-6 bg-muted/20 rounded animate-pulse w-3/4 mx-auto"/>
          </div>
        </div>

        {/* FAQ Items Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (<div key={i} className="bg-card rounded-lg border border-border p-4 sm:p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-muted/20 rounded w-3/4"/>
                <div className="w-6 h-6 bg-muted/30 rounded"/>
              </div>
            </div>))}
        </div>
      </div>
    </div>
  </section>);
export const FooterSkeleton = () => (<footer className="bg-muted/50 border-t border-border">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="space-y-3">
              <div className="h-5 bg-muted/30 rounded w-1/2 animate-pulse"/>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (<div key={j} className="h-4 bg-muted/20 rounded w-3/4 animate-pulse"/>))}
              </div>
            </div>))}
        </div>
        
        <div className="border-t border-border pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="h-4 bg-muted/20 rounded w-48 animate-pulse"/>
            <div className="flex space-x-4">
              {[1, 2, 3].map((i) => (<div key={i} className="w-8 h-8 bg-muted/30 rounded animate-pulse"/>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>);
//# sourceMappingURL=SkeletonLoaders.jsx.map