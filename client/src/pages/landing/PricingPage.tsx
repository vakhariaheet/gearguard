import { PricingCard } from '@/components/landing/PricingCard';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PricingTier } from '@/types/landing';

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    maxEquipment: 50,
    maxUsers: 5,
    features: [
      'Up to 50 equipment items',
      'Basic maintenance tracking',
      'Mobile app access',
      'Email notifications',
      'Standard support',
      'Basic reporting',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    period: 'month',
    maxEquipment: 200,
    maxUsers: 15,
    recommended: true,
    features: [
      'Up to 200 equipment items',
      'Advanced workflow automation',
      'Team management',
      'Calendar integration',
      'Custom fields & forms',
      'Advanced analytics',
      'Priority support',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    features: [
      'Unlimited equipment items',
      'Unlimited users',
      'Advanced RBAC',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom training',
      'White-label options',
      'Advanced security features',
    ],
  },
];

export function PricingPage() {
  return (
    <div className="pricing-page">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your maintenance management needs. All plans include a
            30-day free trial and can be upgraded anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <PricingCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compare All Features</h2>
            <p className="text-lg text-muted-foreground">See what's included in each plan</p>
          </div>

          <div className="max-w-4xl mx-auto bg-background rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-6 border-b bg-muted/50">
              <div className="font-semibold">Features</div>
              <div className="text-center font-semibold">Starter</div>
              <div className="text-center font-semibold">Professional</div>
              <div className="text-center font-semibold">Enterprise</div>
            </div>

            {[
              ['Equipment Tracking', true, true, true],
              ['Mobile App', true, true, true],
              ['Basic Reporting', true, true, true],
              ['Team Management', false, true, true],
              ['Advanced Analytics', false, true, true],
              ['API Access', false, true, true],
              ['Custom Integrations', false, false, true],
              ['Dedicated Support', false, false, true],
              ['White-label Options', false, false, true],
            ].map(([feature, starter, professional, enterprise], index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0">
                <div className="font-medium">{feature as string}</div>
                <div className="text-center">
                  {starter ? (
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="text-center">
                  {professional ? (
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="text-center">
                  {enterprise ? (
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pricing FAQ</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately, and we'll prorate any billing differences.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                All plans come with a 30-day free trial. No credit card required to start. You can
                explore all features during your trial period.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise
                customers. All payments are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of companies already using GearGuard to streamline their maintenance
            operations.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
            <Link to="/sign-up">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
