import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { TestimonialData } from '@/types/landing';

interface TestimonialCardProps {
  testimonial: TestimonialData;
}

export const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <blockquote className="text-muted-foreground mb-4 italic">
          "{testimonial.content}"
        </blockquote>
        <div className="flex items-center gap-3">
          {testimonial.avatar && (
            <img
              src={testimonial.avatar}
              alt={testimonial.customerName}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="font-semibold">{testimonial.customerName}</div>
            <div className="text-sm text-muted-foreground">
              {testimonial.role} at {testimonial.companyName}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
