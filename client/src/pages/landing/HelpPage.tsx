import { FAQSection } from '@/components/landing/FAQSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Video, MessageCircle, Phone, Search, Download, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HelpPage() {
  return (
    <div className="help-page">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Help & Support Center</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Find answers, get support, and learn how to make the most of GearGuard's maintenance
            management platform.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, tutorials, or guides..."
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Quick Help Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Can We Help You?</h2>
            <p className="text-lg text-muted-foreground">
              Choose the support option that works best for you
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive guides and API documentation
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Browse Docs
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Video Tutorials</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Step-by-step video guides and webinars
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Watch Videos
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Live Chat</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Get instant help from our support team
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Phone Support</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Speak directly with our support experts
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/contact">Call Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Help Articles</h2>
            <p className="text-lg text-muted-foreground">
              Most frequently accessed guides and tutorials
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Getting Started Guide</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete walkthrough for setting up your first maintenance workflow
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Read Article →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Team Management</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      How to set up teams, assign roles, and manage permissions
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Read Article →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Data Import/Export</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Import existing equipment data and export reports
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Read Article →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">API Documentation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete API reference for custom integrations
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Read Article →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Mobile App Setup</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download and configure the GearGuard mobile app
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Read Article →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Troubleshooting</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Common issues and their solutions
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Read Article →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Contact Support */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Our support team is here to help you succeed. Get in touch and we'll respond within 24
            hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Schedule a Call
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
