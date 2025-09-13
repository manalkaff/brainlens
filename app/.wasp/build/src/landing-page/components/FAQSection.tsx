import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FAQSectionProps } from './types';
import { faqItems } from './data';

export const FAQSection: React.FC<FAQSectionProps> = ({
  className = ''
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isExpanded = (itemId: string) => expandedItems.has(itemId);

  return (
    <section 
      id="faq" 
      className={`py-16 sm:py-20 lg:py-24 bg-background ${className}`}
      aria-labelledby="faq-title"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-14 lg:mb-16">
            <h2 
              id="faq-title"
              className="text-title-md sm:text-title-lg md:text-title-xl lg:text-title-xxl font-bold text-foreground mb-4 sm:mb-6 leading-tight tracking-tight"
            >
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground px-4 sm:px-0">
              Everything you need to know about our AI-powered learning platform.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-3 sm:space-y-4" role="list" aria-label="Frequently asked questions">
            {faqItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 focus-within:shadow-lg focus-within:border-primary/30"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
                role="listitem"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset min-h-[44px] touch-manipulation transition-colors duration-200 hover:bg-muted/30 focus:bg-muted/30"
                  aria-expanded={isExpanded(item.id)}
                  aria-controls={`faq-answer-${item.id}`}
                  type="button"
                >
                  <span 
                    id={`faq-question-${item.id}`}
                    className="text-base sm:text-lg font-semibold text-foreground pr-3 sm:pr-4 leading-tight"
                  >
                    {item.question}
                  </span>
                  <div className="flex-shrink-0 text-muted-foreground p-2 -m-2 transition-transform duration-300">
                    {isExpanded(item.id) ? (
                      <ChevronUp 
                        className="w-5 h-5 sm:w-6 sm:h-6 transform rotate-0 transition-transform duration-300" 
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown 
                        className="w-5 h-5 sm:w-6 sm:h-6 transform rotate-0 transition-transform duration-300" 
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>

                {/* Answer */}
                <div
                  id={`faq-answer-${item.id}`}
                  className={`
                    overflow-hidden transition-all duration-500 ease-out
                    ${isExpanded(item.id) 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                    }
                  `}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                >
                  <div className="px-4 sm:px-6 pb-4 sm:pb-5">
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                      
                      {/* Category Badge */}
                      <div className="mt-3 sm:mt-4">
                        <span 
                          className={`
                            inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-all duration-200
                            ${item.category === 'general' 
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : item.category === 'features'
                              ? 'bg-success/10 text-success border border-success/20'
                              : item.category === 'pricing'
                              ? 'bg-accent/50 text-accent-foreground border border-accent'
                              : 'bg-warning/10 text-warning border border-warning/20'
                            }
                          `}
                          aria-label={`Question category: ${item.category}`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-8 sm:mt-12 p-6 sm:p-8 bg-primary/5 border border-primary/10 rounded-xl transition-all duration-300 hover:bg-primary/10">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
              Still have questions?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
              We're here to help! Reach out to our support team for personalized assistance.
            </p>
            <button 
              className="inline-flex items-center px-6 py-3 sm:py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:bg-primary/90 focus:scale-105"
              type="button"
              aria-label="Contact our support team for help with your questions"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};