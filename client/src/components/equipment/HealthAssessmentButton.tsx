import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Spinner } from '../ui/spinner';
import { useAssessEquipmentHealth } from '../../hooks/useEquipment';
import type { Equipment, HealthAssessmentResponse } from '../../types/equipment';

interface HealthAssessmentButtonProps {
  equipment: Equipment;
  onAssessmentComplete?: (assessment: HealthAssessmentResponse) => void;
}

export function HealthAssessmentButton({
  equipment,
  onAssessmentComplete,
}: HealthAssessmentButtonProps) {
  const [assessment, setAssessment] = useState<HealthAssessmentResponse | null>(null);
  const assessHealth = useAssessEquipmentHealth();

  const handleAssessment = async () => {
    try {
      const result = await assessHealth.mutateAsync({
        id: equipment.id,
        data: {
          equipmentId: equipment.id,
          usageHours: equipment.usageHours,
          performanceMetrics: {
            efficiency: 85, // Could be from sensors or user input
            errorRate: 2,
            downtime: 5,
          },
        },
      });

      setAssessment(result);
      onAssessmentComplete?.(result);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-500 text-white';
      case 'Medium':
        return 'bg-yellow-500 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Critical':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="health-assessment-section">
      <Button
        onClick={handleAssessment}
        disabled={assessHealth.isPending}
        variant="outline"
        size="sm"
        className="mb-4"
      >
        {assessHealth.isPending ? (
          <>
            <Spinner className="w-3 h-3 mr-1" />
            Assessing...
          </>
        ) : (
          'Assess Health'
        )}
      </Button>

      {assessment && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Equipment Health Assessment
              <Badge className={getRiskColor(assessment.riskLevel)}>
                {assessment.riskLevel} Risk
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Health Score */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Health Score</span>
                  <span
                    className={`text-sm font-bold ${getHealthScoreColor(assessment.healthScore)}`}
                  >
                    {assessment.healthScore}/100
                  </span>
                </div>
                <Progress value={assessment.healthScore} className="h-2" />
              </div>

              {/* Factor Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Age Factor</span>
                  <Progress value={100 - assessment.factors.age} className="h-1 mt-1" />
                  <span className="text-xs text-muted-foreground">
                    {assessment.factors.age}% impact
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Usage Factor</span>
                  <Progress value={100 - assessment.factors.usage} className="h-1 mt-1" />
                  <span className="text-xs text-muted-foreground">
                    {assessment.factors.usage}% impact
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Maintenance Factor</span>
                  <Progress value={100 - assessment.factors.maintenance} className="h-1 mt-1" />
                  <span className="text-xs text-muted-foreground">
                    {assessment.factors.maintenance}% impact
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Performance Factor</span>
                  <Progress value={100 - assessment.factors.performance} className="h-1 mt-1" />
                  <span className="text-xs text-muted-foreground">
                    {assessment.factors.performance}% impact
                  </span>
                </div>
              </div>

              {/* Predicted Maintenance Date */}
              {assessment.predictedMaintenanceDate && (
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">Predicted Next Maintenance:</span>
                  <span className="text-sm ml-2">
                    {new Date(assessment.predictedMaintenanceDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <span className="text-sm font-medium mb-2 block">AI Recommendations:</span>
                <ul className="text-sm space-y-1">
                  {assessment.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-current rounded-full mt-2 mr-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                <div className="flex justify-between">
                  <span>Confidence: {Math.round(assessment.confidence * 100)}%</span>
                  <span>Generated: {new Date(assessment.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
