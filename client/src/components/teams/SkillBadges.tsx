/**
 * SkillBadges Component
 * Displays team skills as badges
 */

import { Badge } from '@/components/ui/badge';

interface SkillBadgesProps {
  skills?: string[];
  maxDisplay?: number;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

export const SkillBadges = ({
  skills = [],
  maxDisplay = 5,
  variant = 'secondary',
  size = 'default',
}: SkillBadgesProps) => {
  // Ensure skills is always an array
  const safeSkills = skills || [];
  const displaySkills = safeSkills.slice(0, maxDisplay);
  const remainingCount = safeSkills.length - maxDisplay;

  if (safeSkills.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No skills specified
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {displaySkills.map((skill, index) => (
        <Badge key={index} variant={variant} className={size === 'sm' ? 'text-xs px-2 py-0.5' : ''}>
          {skill}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className={`text-muted-foreground ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};
