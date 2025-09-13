// Data constants for landing page components
import type { HeroTitle, Feature, FAQItem, FooterSection } from './types';

export const heroTitles: HeroTitle[] = [
  {
    id: 'expert',
    text: 'What do you want to be expert on?',
    weight: 1
  },
  {
    id: 'know',
    text: 'What do you want to know?',
    weight: 1
  },
  {
    id: 'master',
    text: 'What would you like to master?',
    weight: 1
  },
  {
    id: 'curiosity',
    text: 'What sparks your curiosity?',
    weight: 1
  },
  {
    id: 'adventure',
    text: "What's your next learning adventure?",
    weight: 1
  }
];

export const features: Feature[] = [
  {
    id: 'ai-research',
    icon: 'Search',
    title: 'AI Research',
    description: 'Automated information gathering and synthesis from multiple sources',
    category: 'core'
  },
  {
    id: 'structured-learning',
    icon: 'BookOpen',
    title: 'Structured Learning',
    description: 'Organized content with clear progression and learning paths',
    category: 'core'
  },
  {
    id: 'progress-tracking',
    icon: 'TrendingUp',
    title: 'Progress Tracking',
    description: 'Visual indicators of learning advancement and milestones',
    category: 'core'
  },
  {
    id: 'interactive-content',
    icon: 'MessageCircle',
    title: 'Interactive Content',
    description: 'Quizzes, exercises, and engagement tools for active learning',
    category: 'advanced'
  },
  {
    id: 'personalization',
    icon: 'User',
    title: 'Personalization',
    description: 'Adaptive content based on your preferences and learning style',
    category: 'advanced'
  },
  {
    id: 'export-options',
    icon: 'Download',
    title: 'Export Options',
    description: 'Save and share your learning materials in various formats',
    category: 'integration'
  }
];

export const faqItems: FAQItem[] = [
  {
    id: 'getting-started',
    question: 'How do I get started with the platform?',
    answer: 'Simply enter any topic you want to learn about in the input field above. Our AI will research and create a structured learning path for you.',
    category: 'general'
  },
  {
    id: 'ai-research',
    question: 'How does the AI research work?',
    answer: 'Our AI agents search multiple sources, synthesize information, and organize it into digestible learning modules tailored to your topic.',
    category: 'features'
  },
  {
    id: 'learning-paths',
    question: 'What makes the learning paths structured?',
    answer: 'Each topic is broken down into logical subtopics with clear progression, interactive quizzes, and milestone tracking to ensure comprehensive understanding.',
    category: 'features'
  },
  {
    id: 'progress-tracking',
    question: 'How can I track my learning progress?',
    answer: 'The platform provides visual progress indicators, completion percentages, and milestone achievements to help you stay motivated and on track.',
    category: 'features'
  },
  {
    id: 'pricing',
    question: 'Is there a free tier available?',
    answer: 'Yes, we offer a free tier with limited topics per month. Premium plans provide unlimited access and advanced features.',
    category: 'pricing'
  },
  {
    id: 'subscription-benefits',
    question: 'What are the benefits of a premium subscription?',
    answer: 'Premium subscribers get unlimited topic generation, advanced personalization, priority support, and access to exclusive features like detailed analytics.',
    category: 'pricing'
  },
  {
    id: 'offline-access',
    question: 'Can I access my learning materials offline?',
    answer: 'Yes, you can download your learning materials for offline access through our export feature.',
    category: 'technical'
  },
  {
    id: 'data-privacy',
    question: 'How is my data protected?',
    answer: 'We use industry-standard encryption and never share your personal learning data with third parties.',
    category: 'technical'
  },
  {
    id: 'mobile-support',
    question: 'Does the platform work on mobile devices?',
    answer: 'Absolutely! Our platform is fully responsive and optimized for mobile devices, tablets, and desktops for learning on the go.',
    category: 'technical'
  },
  {
    id: 'topic-complexity',
    question: 'Can I learn complex technical topics?',
    answer: 'Yes, our AI can handle topics of any complexity level, from basic concepts to advanced technical subjects, adapting the content to your expertise level.',
    category: 'general'
  }
];

export const footerSections: FooterSection[] = [
  {
    id: 'product',
    title: 'Product',
    links: [
      { id: 'features', label: 'Features', href: '#features' },
      { id: 'pricing', label: 'Pricing', href: '/pricing' },
      { id: 'demo', label: 'Demo', href: '/demo-app' }
    ]
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { id: 'about', label: 'About', href: '#' },
      { id: 'blog', label: 'Blog', href: '#' },
      { id: 'careers', label: 'Careers', href: '#' },
      { id: 'contact', label: 'Contact', href: 'mailto:hello@learningplatform.com' }
    ]
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      { id: 'help', label: 'Help Center', href: '#' },
      { id: 'docs', label: 'Documentation', href: '#' },
      { id: 'api', label: 'API', href: '#' }
    ]
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { id: 'privacy', label: 'Privacy Policy', href: '#' },
      { id: 'terms', label: 'Terms of Service', href: '#' },
      { id: 'cookies', label: 'Cookie Policy', href: '#' }
    ]
  }
];

// Utility functions for data manipulation
export const getRandomHeroTitle = (): HeroTitle => {
  const totalWeight = heroTitles.reduce((sum, title) => sum + (title.weight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const title of heroTitles) {
    random -= title.weight || 1;
    if (random <= 0) {
      return title;
    }
  }
  
  return heroTitles[0]; // Fallback
};

export const getFeaturesByCategory = (category: Feature['category']): Feature[] => {
  return features.filter(feature => feature.category === category);
};

export const getFAQsByCategory = (category: FAQItem['category']): FAQItem[] => {
  return faqItems.filter(faq => faq.category === category);
};