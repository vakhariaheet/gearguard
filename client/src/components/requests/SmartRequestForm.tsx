import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Lightbulb, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useAutoFillSuggestions, useEquipment } from '../../hooks/useRequests';
import type {
  CreateRequestRequest,
  RequestAutoFillResponse,
  Equipment,
  RequestType,
  RequestPriority,
} from '../../types/requests';

interface SmartRequestFormProps {
  onSubmit: (requestData: CreateRequestRequest) => void;
  isLoading?: boolean;
  initialData?: Partial<CreateRequestRequest>;
}

export const SmartRequestForm = ({
  onSubmit,
  isLoading = false,
  initialData,
}: SmartRequestFormProps) => {
  const { toast } = useToast();
  const { data: equipmentResponse } = useEquipment();
  const autoFillMutation = useAutoFillSuggestions();

  const [formData, setFormData] = useState<CreateRequestRequest>({
    subject: initialData?.subject || '',
    description: initialData?.description || '',
    requestType: initialData?.requestType || 'Corrective',
    equipmentId: initialData?.equipmentId || '',
    priority: initialData?.priority || 'Medium',
    scheduledDate: initialData?.scheduledDate || '',
  });

  const [autoFillSuggestion, setAutoFillSuggestion] = useState<RequestAutoFillResponse | null>(
    null
  );

  const equipmentOptions = equipmentResponse?.data?.equipment || [];

  const handleEquipmentChange = async (equipmentId: string) => {
    setFormData((prev) => ({ ...prev, equipmentId }));

    if (!equipmentId) {
      setAutoFillSuggestion(null);
      return;
    }

    try {
      const response = await autoFillMutation.mutateAsync({
        equipmentId,
        requestType: formData.requestType,
        userDescription: formData.description,
      });

      setAutoFillSuggestion(response.data);
    } catch (error) {
      console.error('Auto-fill failed:', error);
      toast({
        title: 'Auto-fill failed',
        description: 'Could not generate suggestions. Please continue manually.',
        variant: 'destructive',
      });
    }
  };

  const applySuggestion = (field: keyof CreateRequestRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    toast({
      title: 'Suggestion applied',
      description: `Applied suggestion for ${field}`,
    });
  };

  const applyAllSuggestions = () => {
    if (!autoFillSuggestion) return;

    setFormData((prev) => ({
      ...prev,
      subject: autoFillSuggestion.suggestedSubject,
      description: autoFillSuggestion.suggestedDescription,
      priority: autoFillSuggestion.suggestedPriority,
      scheduledDate: autoFillSuggestion.suggestedScheduleDate || prev.scheduledDate,
    }));

    toast({
      title: 'All suggestions applied',
      description: 'Applied all AI-generated suggestions to the form',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.subject.trim() && formData.equipmentId;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Maintenance Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestType">Request Type</Label>
                <Select
                  value={formData.requestType}
                  onValueChange={(value: RequestType) =>
                    setFormData((prev) => ({ ...prev, requestType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrective">Corrective (Breakdown)</SelectItem>
                    <SelectItem value="Preventive">Preventive (Scheduled)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment *</Label>
                <Select value={formData.equipmentId} onValueChange={handleEquipmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentOptions.map((equipment: Equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name} ({equipment.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject">Subject *</Label>
                {autoFillSuggestion && formData.subject !== autoFillSuggestion.suggestedSubject && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applySuggestion('subject', autoFillSuggestion.suggestedSubject)}
                    className="text-xs"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Use Suggestion
                  </Button>
                )}
              </div>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="What is wrong?"
                required
              />
              {autoFillSuggestion && (
                <div className="text-xs text-muted-foreground">
                  Suggested: "{autoFillSuggestion.suggestedSubject}"
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                {autoFillSuggestion &&
                  formData.description !== autoFillSuggestion.suggestedDescription && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        applySuggestion('description', autoFillSuggestion.suggestedDescription)
                      }
                      className="text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Use Suggestion
                    </Button>
                  )}
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the issue..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority">Priority</Label>
                  {autoFillSuggestion &&
                    formData.priority !== autoFillSuggestion.suggestedPriority && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          applySuggestion('priority', autoFillSuggestion.suggestedPriority)
                        }
                        className="text-xs"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Use Suggested
                      </Button>
                    )}
                </div>
                <Select
                  value={formData.priority}
                  onValueChange={(value: RequestPriority) =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.requestType === 'Preventive' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!isFormValid || isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Request
              </Button>
              {autoFillSuggestion && (
                <Button type="button" variant="outline" onClick={applyAllSuggestions}>
                  Apply All Suggestions
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Smart Suggestions Panel */}
      {autoFillSuggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Smart Suggestions
              <Badge variant="secondary">
                {Math.round(autoFillSuggestion.confidence * 100)}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {autoFillSuggestion.commonIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Common Issues for this Equipment:</h4>
                <div className="flex flex-wrap gap-1">
                  {autoFillSuggestion.commonIssues.map((issue, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => applySuggestion('subject', issue)}
                    >
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Maintenance History
                </h4>
                <div className="text-sm space-y-1">
                  <div>
                    Last Maintenance:{' '}
                    {autoFillSuggestion.maintenanceHistory.lastMaintenance
                      ? new Date(
                          autoFillSuggestion.maintenanceHistory.lastMaintenance
                        ).toLocaleDateString()
                      : 'Never'}
                  </div>
                  <div>
                    Average Repair Time: {autoFillSuggestion.maintenanceHistory.averageRepairTime}h
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                <ul className="text-sm space-y-1">
                  {autoFillSuggestion.maintenanceHistory.recommendedActions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-current rounded-full mt-2 mr-2 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {autoFillMutation.isPending && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2">
              <Loader2 className="h-8 w-8" />
            </div>
            <div className="text-sm text-muted-foreground">
              Analyzing equipment and generating suggestions...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
