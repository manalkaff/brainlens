# Design Document

## Overview

This design document outlines the complete redesign of the landing page to create a modern, clean, and engaging user experience inspired by Claude and Grok interfaces. The design emphasizes simplicity, clear value proposition communication, and a seamless user journey from initial interest to topic creation.

The redesign transforms the current single-page learning input interface into a comprehensive landing page with multiple sections that progressively build user understanding and confidence in the platform.

## Architecture

### Component Structure

```
LandingPage
├── NavBar (preserved from existing)
├── HeroSection
│   ├── RandomizedTitle
│   └── InputCard
│       ├── LargeTextInput
│       └── IconSubmitButton
├── IntroductionSection
├── FeaturesSection
├── FAQSection
└── FooterSection
```

### Layout Flow

1. **Full-screen Hero**: Occupies 100vh with centered content
2. **Scroll-triggered sections**: Subsequent sections revealed on scroll
3. **Progressive disclosure**: Information complexity increases as user scrolls
4. **Consistent spacing**: Uniform section padding and margins throughout

## Components and Interfaces

### HeroSection Component

**Purpose**: Create an engaging first impression with randomized titles and prominent input interface

**Props Interface**:
```typescript
interface HeroSectionProps {
  onTopicSubmit: (topic: string) => Promise<void>;
  isLoading?: boolean;
}
```

**Key Features**:
- Full viewport height (100vh)
- Randomized title selection on page load
- Centered layout with maximum content width
- Smooth scroll behavior to next section

**Title Randomization**:
```typescript
const heroTitles = [
  "What do you want to be expert on?",
  "What do you want to know?", 
  "What would you like to master?",
  "What sparks your curiosity?",
  "What's your next learning adventure?"
];
```

### InputCard Component

**Purpose**: Provide an intuitive, Claude/Grok-inspired input interface

**Design Specifications**:
- **Card styling**: Elevated with subtle shadow, rounded corners (12px)
- **Input field**: Large textarea (min-height: 120px) with placeholder text
- **Submit button**: Icon-only (arrow right icon) positioned in bottom-right
- **Responsive behavior**: Adapts to mobile with appropriate touch targets
- **Focus states**: Clear visual feedback with ring and border color changes

**Visual Hierarchy**:
1. Card container with subtle background blur
2. Large, prominent input field
3. Icon button with gradient background
4. Keyboard shortcut indicators (⌘ + Enter)

### IntroductionSection Component

**Purpose**: Clearly communicate platform value proposition and capabilities

**Content Structure**:
- **Headline**: "Transform Any Topic Into Deep Learning"
- **Subheading**: Explanation of AI-powered research and structured learning
- **Visual elements**: Icons or illustrations showing the process
- **Key benefits**: Bullet points highlighting main advantages

**Layout**: Two-column on desktop, single-column on mobile with centered content

### FeaturesSection Component

**Purpose**: Showcase platform capabilities in digestible format

**Feature Categories**:
1. **AI Research**: Automated information gathering and synthesis
2. **Structured Learning**: Organized content with clear progression
3. **Progress Tracking**: Visual indicators of learning advancement
4. **Interactive Content**: Quizzes, exercises, and engagement tools
5. **Personalization**: Adaptive content based on user preferences
6. **Export Options**: Save and share learning materials

**Card Design**:
- Grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Icon + title + description format
- Hover effects with subtle elevation
- Consistent spacing and typography

### FAQSection Component

**Purpose**: Address common user concerns and questions

**Interaction Pattern**:
- Accordion-style expandable items
- Smooth expand/collapse animations
- Clear visual indicators for expanded state
- Mobile-optimized touch targets

**Content Categories**:
- Getting started questions
- Feature explanations
- Pricing and subscription info
- Technical requirements
- Data privacy and security

### FooterSection Component

**Purpose**: Provide secondary navigation and legal information

**Content Structure**:
- **Company info**: Logo, tagline, contact details
- **Navigation links**: Product, company, resources, legal
- **Social links**: Platform social media presence
- **Legal text**: Copyright, privacy policy, terms of service

## Data Models

### HeroTitle Model
```typescript
interface HeroTitle {
  id: string;
  text: string;
  weight?: number; // For weighted randomization
}
```

### Feature Model
```typescript
interface Feature {
  id: string;
  icon: string; // Icon component name or path
  title: string;
  description: string;
  category: 'core' | 'advanced' | 'integration';
}
```

### FAQ Model
```typescript
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'features' | 'pricing' | 'technical';
}
```

## Error Handling

### Input Validation
- **Empty input**: Disable submit button, show subtle visual cue
- **Minimum length**: Require at least 3 characters for topic submission
- **Maximum length**: Limit input to reasonable character count (500 chars)
- **Special characters**: Allow but sanitize for security

### Network Errors
- **Connection issues**: Show retry button with clear error message
- **Server errors**: Display user-friendly error with support contact
- **Timeout handling**: Implement reasonable timeout with fallback options

### Loading States
- **Button loading**: Replace icon with spinner during submission
- **Progressive loading**: Show status messages during topic creation
- **Skeleton screens**: Use for content that loads after initial page render

## Testing Strategy

### Unit Testing
- **Component rendering**: Verify all sections render correctly
- **Title randomization**: Test random selection logic
- **Input validation**: Validate form submission logic
- **Responsive behavior**: Test breakpoint adaptations

### Integration Testing
- **Navigation flow**: Test scroll behavior and section transitions
- **Form submission**: End-to-end topic creation process
- **Error scenarios**: Network failures and recovery
- **Cross-browser compatibility**: Major browser testing

### Accessibility Testing
- **Keyboard navigation**: Full keyboard accessibility
- **Screen reader compatibility**: Proper ARIA labels and structure
- **Color contrast**: WCAG AA compliance
- **Focus management**: Clear focus indicators and logical tab order

### Performance Testing
- **Page load speed**: Optimize for fast initial render
- **Image optimization**: Proper sizing and lazy loading
- **Animation performance**: Smooth 60fps animations
- **Bundle size**: Minimize JavaScript and CSS payload

## Visual Design System

### Typography Scale
```css
/* Headings */
h1: 3.5rem (56px) - Hero title
h2: 2.5rem (40px) - Section headings  
h3: 1.875rem (30px) - Subsection headings
h4: 1.25rem (20px) - Card titles

/* Body text */
body-lg: 1.125rem (18px) - Hero subtitle
body: 1rem (16px) - Default body text
body-sm: 0.875rem (14px) - Secondary text
```

### Color Palette
```css
/* Primary colors */
--primary: hsl(221, 83%, 53%) /* Blue */
--primary-foreground: hsl(0, 0%, 98%)

/* Neutral colors */
--background: hsl(0, 0%, 100%)
--foreground: hsl(222, 84%, 5%)
--muted: hsl(210, 40%, 98%)
--muted-foreground: hsl(215, 16%, 47%)

/* Accent colors */
--accent: hsl(210, 40%, 98%)
--accent-foreground: hsl(222, 84%, 5%)

/* Border and input */
--border: hsl(214, 32%, 91%)
--input: hsl(214, 32%, 91%)
--ring: hsl(221, 83%, 53%)
```

### Spacing System
```css
/* Consistent spacing scale */
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
--space-24: 6rem (96px)
```

### Animation Guidelines
- **Duration**: 200-300ms for micro-interactions, 500ms for section transitions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- **Reduced motion**: Respect user preferences for reduced motion
- **Performance**: Use transform and opacity for smooth animations

## Responsive Breakpoints

### Mobile First Approach
```css
/* Mobile: 320px - 767px */
.container { max-width: 100%; padding: 1rem; }
.hero-title { font-size: 2.5rem; }
.input-card { margin: 1rem; }

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
  .container { max-width: 768px; padding: 2rem; }
  .hero-title { font-size: 3rem; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container { max-width: 1200px; padding: 3rem; }
  .hero-title { font-size: 3.5rem; }
  .features-grid { grid-template-columns: repeat(3, 1fr); }
}
```

### Touch Target Optimization
- **Minimum size**: 44px × 44px for all interactive elements
- **Spacing**: Adequate spacing between touch targets
- **Feedback**: Clear visual feedback for touch interactions

## Implementation Notes

### Existing Component Reuse
- **NavBar**: Preserve existing NavBar component without modifications
- **UI Components**: Leverage existing Card, Button, and Input components
- **Styling**: Extend current Tailwind CSS configuration
- **Routing**: Maintain existing Wasp routing structure

### New Component Creation
- Create new components in `app/src/landing-page/components/`
- Follow existing naming conventions and file structure
- Use TypeScript for all new components
- Implement proper prop interfaces and documentation

### Performance Considerations
- **Code splitting**: Lazy load non-critical sections
- **Image optimization**: Use WebP format with fallbacks
- **CSS optimization**: Minimize unused styles
- **JavaScript optimization**: Tree shake unused code

### SEO Optimization
- **Meta tags**: Proper title, description, and Open Graph tags
- **Structured data**: JSON-LD markup for better search visibility
- **Semantic HTML**: Use proper heading hierarchy and landmarks
- **Loading performance**: Optimize Core Web Vitals metrics