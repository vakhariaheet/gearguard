# GearGuard Landing Page Components

This directory contains all the components for the GearGuard landing page module (F02).

## Components

### Core Sections

- **HeroSection**: Main hero banner with CTA buttons and floating stats
- **FeaturesSection**: Feature showcase with cards and benefits
- **StatsSection**: Animated statistics with count-up effects
- **FAQSection**: Collapsible FAQ with common questions
- **ContactForm**: Contact and demo request form

### Reusable Components

- **FeatureCard**: Individual feature highlight card
- **TestimonialCard**: Customer testimonial display
- **PricingCard**: Pricing tier card with features

## Usage

```tsx
import { HeroSection, FeaturesSection, StatsSection } from '@/components/landing';

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
    </div>
  );
}
```

## Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Animated Statistics**: Count-up animations for impressive numbers
- **Professional UI**: Built with shadcn/ui components
- **Type Safety**: Full TypeScript support
- **Accessibility**: ARIA-compliant components

## Static Content

All content is currently hardcoded for the foundation phase. This allows for:

- Fast development and deployment
- No backend dependencies
- Easy content updates
- Future enhancement with dynamic content from APIs

## Enhancement Ready

The components are designed to easily integrate with:

- Real-time equipment statistics (Module M06)
- Dynamic testimonials from database
- Contact form backend integration
- A/B testing for conversion optimization
