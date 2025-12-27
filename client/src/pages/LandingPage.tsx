import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ContactForm } from '@/components/landing/ContactForm';

export function LandingPage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <FAQSection />
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Maintenance Operations?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of companies already using GearGuard to streamline their maintenance
              workflows.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
