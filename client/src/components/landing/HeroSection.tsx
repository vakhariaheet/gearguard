import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Wrench, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                The Ultimate
                <span className="text-primary block">Maintenance Tracker</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Streamline your equipment management, automate maintenance workflows, and keep your
                operations running smoothly with GearGuard's intelligent maintenance tracking
                system.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link to="/contact">Schedule Demo</Link>
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">Real-time Analytics</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8">
              <img
                src="https://picsum.photos/600/400?random=maintenance"
                alt="GearGuard Dashboard Preview"
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
            {/* Floating stats cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 border">
              <div className="text-2xl font-bold text-green-500">98.7%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 border">
              <div className="text-2xl font-bold text-blue-500">2.3h</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
