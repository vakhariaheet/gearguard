import { ContactForm } from '@/components/landing/ContactForm';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Ready to transform your maintenance operations? We'd love to hear from you. Schedule a
            demo, ask questions, or just say hello.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">hello@gearguard.com</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Phone</div>
                        <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Address</div>
                        <div className="text-sm text-muted-foreground">
                          123 Innovation Drive
                          <br />
                          San Francisco, CA 94105
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Business Hours</div>
                        <div className="text-sm text-muted-foreground">
                          Mon-Fri: 9:00 AM - 6:00 PM PST
                          <br />
                          24/7 Support Available
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Quick Links</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <a href="mailto:sales@gearguard.com" className="text-primary hover:underline">
                      Sales Inquiries
                    </a>
                  </div>
                  <div>
                    <a href="mailto:support@gearguard.com" className="text-primary hover:underline">
                      Technical Support
                    </a>
                  </div>
                  <div>
                    <a
                      href="mailto:partnerships@gearguard.com"
                      className="text-primary hover:underline"
                    >
                      Partnership Opportunities
                    </a>
                  </div>
                  <div>
                    <a href="mailto:careers@gearguard.com" className="text-primary hover:underline">
                      Career Opportunities
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Quick answers to common questions</p>
          </div>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How quickly can we get started?</h3>
                <p className="text-sm text-muted-foreground">
                  Most customers are up and running within 24 hours. Our onboarding team will guide
                  you through the setup process.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Do you offer training?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! We provide comprehensive training sessions, documentation, and ongoing
                  support to ensure your team's success.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can you integrate with our existing systems?</h3>
                <p className="text-sm text-muted-foreground">
                  Absolutely. We offer API integrations and can work with your team to connect
                  GearGuard to your existing workflow.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What kind of support do you provide?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer 24/7 support via chat, email, and phone. Enterprise customers get
                  dedicated account managers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Visit Our Office</h2>
            <p className="text-lg text-muted-foreground">
              Located in the heart of San Francisco's tech district
            </p>
          </div>
          <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Interactive Map Placeholder</p>
          </div>
        </div>
      </section>
    </div>
  );
}
