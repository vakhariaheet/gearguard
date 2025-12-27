import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { useLandingStats } from '@/hooks/useLandingStats';

interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  format?: 'number' | 'percentage' | 'currency' | 'time';
  isLoading?: boolean;
}

const StatItem = ({ label, value, suffix, prefix, format, isLoading }: StatItemProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isLoading) return;

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
  }, [value, isLoading]);

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

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    );
  }

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

export const DynamicStatsSection = () => {
  const { data: stats, isLoading, isRefetching } = useLandingStats();

  // Fallback stats for when API is unavailable
  const fallbackStats = {
    totalEquipment: 2847,
    activeRequests: 156,
    completedMaintenance: 12453,
    systemUptime: 99.7,
    averageResponseTime: 2.3,
    costSavings: 284000,
    userSatisfaction: 94.7,
    teamsManaged: 24,
    lastUpdated: new Date().toISOString(),
  };

  const displayStats = stats || fallbackStats;

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl font-bold">Real-Time System Performance</h2>

            {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how GearGuard is transforming maintenance management across industries with live
            system metrics
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="Equipment Tracked"
                value={displayStats.totalEquipment}
                format="number"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="Active Requests"
                value={displayStats.activeRequests}
                format="number"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="Completed Jobs"
                value={displayStats.completedMaintenance}
                format="number"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="System Uptime"
                value={displayStats.systemUptime}
                format="percentage"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="Cost Savings"
                value={displayStats.costSavings}
                format="currency"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="Avg Response"
                value={displayStats.averageResponseTime}
                format="time"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="User Satisfaction"
                value={displayStats.userSatisfaction}
                format="percentage"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <StatItem
                label="Teams Managed"
                value={displayStats.teamsManaged}
                format="number"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
