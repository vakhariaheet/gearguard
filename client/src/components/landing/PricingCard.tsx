import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PricingTier } from '@/types/landing';

interface PricingCardProps {
  tier: PricingTier;
}

export const PricingCard = ({ tier }: PricingCardProps) => {
  return (
    <Card className={`relative h-full ${tier.recommended ? 'border-primary shadow-lg' : ''}`}>
      {tier.recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">${tier.price}</span>
          <span className="text-muted-foreground">/{tier.period}</span>
        </div>
        {tier.maxEquipment && (
          <p className="text-sm text-muted-foreground">Up to {tier.maxEquipment} equipment items</p>
        )}
        {tier.maxUsers && (
          <p className="text-sm text-muted-foreground">Up to {tier.maxUsers} users</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full mt-6" variant={tier.recommended ? 'default' : 'outline'} asChild>
          <Link to="/sign-up">Get Started</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
