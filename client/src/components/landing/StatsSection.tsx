import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  format?: 'number' | 'percentage' | 'currency' | 'time';
}

const StatItem = ({ label, value, suffix, prefix, format }: StatItemProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'time':
        return `${val}h`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-primary mb-2">
        {prefix}
        {formatValue(displayValue)}
        {suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

export const StatsSection = () => {
  // Static impressive statistics for foundation phase
  const stats = {
    totalEquipment: 2847,
    activeRequests: 156,
    completedMaintenance: 12453,
    uptime: 98.7,
    costSavings: 284000,
    responseTime: 2.3,
  };

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Trusted by Companies Worldwide</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how GearGuard is transforming maintenance management across industries
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <Card>
            <CardContent className="p-6">
              <StatItem label="Equipment Tracked" value={stats.totalEquipment} format="number" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <StatItem label="Active Requests" value={stats.activeRequests} format="number" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <StatItem label="Completed Jobs" value={stats.completedMaintenance} format="number" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <StatItem label="System Uptime" value={stats.uptime} format="percentage" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <StatItem label="Cost Savings" value={stats.costSavings} format="currency" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <StatItem label="Avg Response" value={stats.responseTime} format="time" />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
