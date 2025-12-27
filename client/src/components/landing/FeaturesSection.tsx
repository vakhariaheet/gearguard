import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Users, Calendar, BarChart3, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Wrench,
    title: 'Equipment Tracking',
    description:
      'Comprehensive asset management with ownership, warranties, and technical specifications.',
    benefits: [
      'Serial number tracking',
      'Warranty management',
      'Location monitoring',
      'Status updates',
    ],
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Organize maintenance teams by specialization and automatically assign requests.',
    benefits: ['Specialized teams', 'Auto-assignment', 'Workload balancing', 'Skill matching'],
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description:
      'Preventive maintenance scheduling with calendar integration and automated reminders.',
    benefits: ['Calendar view', 'Automated scheduling', 'Reminder system', 'Conflict detection'],
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into maintenance performance, costs, and equipment health.',
    benefits: ['Performance metrics', 'Cost tracking', 'Trend analysis', 'Custom reports'],
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Kanban boards, auto-assignment, and smart notifications for seamless operations.',
    benefits: ['Kanban workflow', 'Auto-assignment', 'Smart notifications', 'Status tracking'],
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Role-based access control, audit trails, and enterprise-grade security.',
    benefits: ['RBAC system', 'Audit logging', 'Data encryption', 'Compliance ready'],
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need for Maintenance Excellence
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From equipment tracking to predictive analytics, GearGuard provides all the tools your
            team needs to maintain peak operational efficiency.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
