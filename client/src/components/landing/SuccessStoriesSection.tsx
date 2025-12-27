import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useTestimonials } from '@/hooks/useLandingStats';

export const SuccessStoriesSection = () => {
  const { data: testimonials, isLoading, error } = useTestimonials();

  // Fallback testimonials for when API is unavailable
  const fallbackTestimonials = [
    {
      id: 'testimonial-1',
      customerName: 'Sarah Johnson',
      companyName: 'TechCorp Industries',
      role: 'Operations Manager',
      content:
        "GearGuard has transformed our maintenance operations. We've reduced downtime by 40% and saved over $200K in the first year.",
      rating: 5,
      industry: 'Manufacturing',
      equipmentCount: 150,
      costSavings: 200000,
      uptimeImprovement: 40,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'testimonial-2',
      customerName: 'Mike Chen',
      companyName: 'Global Logistics',
      role: 'Maintenance Director',
      content:
        'The predictive maintenance features have been a game-changer. We can now prevent issues before they become costly problems.',
      rating: 5,
      industry: 'Logistics',
      equipmentCount: 300,
      costSavings: 150000,
      uptimeImprovement: 35,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'testimonial-3',
      customerName: 'Emily Rodriguez',
      companyName: 'Healthcare Systems Inc',
      role: 'Facilities Manager',
      content:
        'Critical equipment uptime is essential in healthcare. GearGuard helps us maintain 99.9% availability of our medical equipment.',
      rating: 5,
      industry: 'Healthcare',
      equipmentCount: 85,
      costSavings: 75000,
      uptimeImprovement: 25,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const displayTestimonials = testimonials || fallbackTestimonials;
  const isLiveData = !!testimonials;

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Customer Success Stories</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl font-bold">Customer Success Stories</h2>
            {isLiveData && <Badge variant="secondary">Live Testimonials</Badge>}
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how companies across industries are achieving remarkable results with GearGuard
          </p>
          {error && (
            <p className="text-sm text-orange-600 mt-2">
              Showing sample testimonials - Live data temporarily unavailable
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayTestimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">{testimonial.rating}/5</span>
                </div>

                {/* Content */}
                <blockquote className="text-sm text-muted-foreground mb-4 italic">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="mb-4">
                  <div className="font-semibold">{testimonial.customerName}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-sm font-medium text-primary">{testimonial.companyName}</div>
                </div>

                {/* Industry & Stats */}
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {testimonial.industry}
                  </Badge>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{testimonial.equipmentCount} Equipment</span>
                    </div>
                    {testimonial.costSavings && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-500" />
                        <span>${(testimonial.costSavings / 1000).toFixed(0)}K Saved</span>
                      </div>
                    )}
                    {testimonial.uptimeImprovement && (
                      <div className="flex items-center gap-1 col-span-2">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span>{testimonial.uptimeImprovement}% Uptime Improvement</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {displayTestimonials.reduce((sum, t) => sum + (t.costSavings || 0), 0) / 1000}K+
                </div>
                <div className="text-sm text-muted-foreground">Total Cost Savings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {displayTestimonials.reduce((sum, t) => sum + t.equipmentCount, 0)}+
                </div>
                <div className="text-sm text-muted-foreground">Equipment Managed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    displayTestimonials.reduce((sum, t) => sum + (t.uptimeImprovement || 0), 0) /
                      displayTestimonials.length
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Avg Uptime Improvement</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {displayTestimonials.length}+
                </div>
                <div className="text-sm text-muted-foreground">Industries Served</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
