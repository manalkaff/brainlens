import React from 'react';
import { Heart } from 'lucide-react';
import type { FooterSectionProps } from './types';
import { footerSections } from './data';

export const FooterSection: React.FC<FooterSectionProps> = ({
  className = ''
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      id="footer" 
      className={`bg-card border-t border-border text-card-foreground ${className}`}
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-foreground">
                  Learning Platform
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-md text-sm sm:text-base">
                  Transform any topic into deep learning with our AI-powered platform. 
                  Discover, learn, and master new subjects at your own pace.
                </p>
              </div>
              
              {/* Social Links */}
              <div className="flex space-x-3 sm:space-x-4">
                <a 
                  href="https://twitter.com/learningplatform" 
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-muted hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group"
                  aria-label="Follow us on Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-sm font-bold text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300">𝕏</span>
                </a>
                <a 
                  href="https://linkedin.com/company/learningplatform" 
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-muted hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group"
                  aria-label="Connect with us on LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-sm font-bold text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300">in</span>
                </a>
                <a 
                  href="https://github.com/learningplatform" 
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-muted hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group"
                  aria-label="View our code on GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-sm font-bold text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300">gh</span>
                </a>
              </div>
            </div>

            {/* Footer Links */}
            <nav className="contents" aria-label="Footer navigation">
              {footerSections.map((section) => (
                <div key={section.id} className="min-w-0">
                  <h4 
                    className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-foreground"
                    id={`footer-section-${section.id}`}
                  >
                    {section.title}
                  </h4>
                  <ul 
                    className="space-y-1.5 sm:space-y-2 lg:space-y-3" 
                    role="list"
                    aria-labelledby={`footer-section-${section.id}`}
                  >
                    {section.links.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 text-xs sm:text-sm lg:text-base block py-1 px-2 -mx-2 rounded min-h-[44px] flex items-center hover:bg-muted/50 focus:bg-muted/50"
                          {...(link.external && { 
                            target: '_blank', 
                            rel: 'noopener noreferrer',
                            'aria-label': `${link.label} (opens in new tab)`
                          })}
                          {...(link.href.startsWith('mailto:') && {
                            'aria-label': `Send email to ${link.href.replace('mailto:', '')}`
                          })}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row lg:flex-row items-center justify-between space-y-3 sm:space-y-4 lg:space-y-0 gap-4">
            {/* Copyright */}
            <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left order-1 sm:order-1">
              © {currentYear} Learning Platform. All rights reserved.
            </div>

            {/* Made with Love */}
            <div className="flex items-center space-x-2 text-muted-foreground text-xs sm:text-sm order-3 sm:order-2 lg:order-2">
              <span>Made with</span>
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-destructive animate-pulse" fill="currentColor" />
              <span>for learners everywhere</span>
            </div>

            {/* Additional Links */}
            <nav 
              className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm order-2 sm:order-3"
              aria-label="Legal and policy links"
            >
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-all duration-300 py-2 px-2 min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded hover:bg-muted/50 focus:bg-muted/50"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-all duration-300 py-2 px-2 min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded hover:bg-muted/50 focus:bg-muted/50"
              >
                Terms of Service
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-all duration-300 py-2 px-2 min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded hover:bg-muted/50 focus:bg-muted/50"
              >
                Cookie Policy
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};