import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Award, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">About GearGuard</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We're on a mission to revolutionize maintenance management through intelligent
            automation, intuitive design, and powerful analytics that help businesses maintain peak
            operational efficiency.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                To empower organizations worldwide with the tools they need to maintain their
                equipment efficiently, reduce downtime, and optimize operational costs through smart
                maintenance management.
              </p>
              <p className="text-lg text-muted-foreground">
                We believe that effective maintenance management shouldn't be complicated. That's
                why we've built GearGuard to be intuitive, powerful, and accessible to teams of all
                sizes.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8">
              <img
                src="https://picsum.photos/500/350?random=team"
                alt="Our Team"
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at GearGuard
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Customer First</h3>
                <p className="text-sm text-muted-foreground">
                  Every decision we make is guided by what's best for our customers and their
                  success.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  We continuously push the boundaries of what's possible in maintenance management.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  We strive for excellence in every aspect of our product and service delivery.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Global Impact</h3>
                <p className="text-sm text-muted-foreground">
                  We're building solutions that make a positive impact on businesses worldwide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">GearGuard by the Numbers</h2>
            <p className="text-lg text-muted-foreground">
              Our impact on maintenance management worldwide
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Companies Trust Us</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Equipment Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1M+</div>
              <div className="text-muted-foreground">Maintenance Tasks</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The passionate individuals behind GearGuard's success
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <img
                  src="https://picsum.photos/150/150?random=ceo"
                  alt="CEO"
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="font-semibold mb-1">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground mb-2">CEO & Co-Founder</p>
                <p className="text-sm text-muted-foreground">
                  Former operations director with 15+ years in industrial maintenance management.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <img
                  src="https://picsum.photos/150/150?random=cto"
                  alt="CTO"
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="font-semibold mb-1">Michael Chen</h3>
                <p className="text-sm text-muted-foreground mb-2">CTO & Co-Founder</p>
                <p className="text-sm text-muted-foreground">
                  Software architect with expertise in IoT, AI, and enterprise software solutions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <img
                  src="https://picsum.photos/150/150?random=vp"
                  alt="VP Product"
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="font-semibold mb-1">Emily Rodriguez</h3>
                <p className="text-sm text-muted-foreground mb-2">VP of Product</p>
                <p className="text-sm text-muted-foreground">
                  Product strategist focused on user experience and customer success in B2B
                  software.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Our Mission?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of maintenance management with GearGuard. Start your free trial
            today and see the difference for yourself.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link to="/sign-up">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
