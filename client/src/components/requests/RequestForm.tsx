import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Save, X } from 'lucide-react';
import { useEquipment } from '../../hooks/useRequests';
import type {
  CreateRequestRequest,
  UpdateRequestRequest,
  MaintenanceRequest,
  Equipment,
  RequestType,
  RequestPriority,
} from '../../types/requests';

interface RequestFormProps {
  onSubmit: (requestData: CreateRequestRequest | UpdateRequestRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: MaintenanceRequest;
  mode?: 'create' | 'edit';
}

export const RequestForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  mode = 'create',
}: RequestFormProps) => {
  const { data: equipmentResponse } = useEquipment();

  const [formData, setFormData] = useState<CreateRequestRequest>({
    subject: initialData?.subject || '',
    description: initialData?.description || '',
    requestType: initialData?.requestType || 'Corrective',
    equipmentId: initialData?.equipmentId || '',
    priority: initialData?.priority || 'Medium',
    scheduledDate: initialData?.scheduledDate || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const equipmentOptions = equipmentResponse?.data?.equipment || [];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Equipment selection is required';
    }

    if (formData.requestType === 'Preventive' && formData.scheduledDate) {
      const scheduledDate = new Date(formData.scheduledDate);
      if (scheduledDate <= new Date()) {
        newErrors.scheduledDate = 'Scheduled date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (mode === 'edit') {
      // For edit mode, only send changed fields
      const updateData: UpdateRequestRequest = {};

      if (formData.subject !== initialData?.subject) {
        updateData.subject = formData.subject;
      }
      if (formData.description !== initialData?.description) {
        updateData.description = formData.description;
      }
      if (formData.priority !== initialData?.priority) {
        updateData.priority = formData.priority;
      }
      if (formData.scheduledDate !== initialData?.scheduledDate) {
        updateData.scheduledDate = formData.scheduledDate;
      }

      onSubmit(updateData);
    } else {
      onSubmit(formData);
    }
  };

  const handleFieldChange = (field: keyof CreateRequestRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const isFormValid = formData.subject.trim() && formData.equipmentId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create Maintenance Request' : 'Edit Maintenance Request'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestType">Request Type</Label>
              <Select
                value={formData.requestType}
                onValueChange={(value: RequestType) => handleFieldChange('requestType', value)}
                disabled={mode === 'edit'} // Can't change type after creation
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
              <Select
                value={formData.equipmentId}
                onValueChange={(value) => handleFieldChange('equipmentId', value)}
                disabled={mode === 'edit'} // Can't change equipment after creation
              >
                <SelectTrigger className={errors.equipmentId ? 'border-destructive' : ''}>
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
              {errors.equipmentId && (
                <p className="text-sm text-destructive">{errors.equipmentId}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              placeholder="What is wrong?"
              className={errors.subject ? 'border-destructive' : ''}
              required
            />
            {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Detailed description of the issue..."
              rows={4}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: RequestPriority) => handleFieldChange('priority', value)}
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
                  onChange={(e) => handleFieldChange('scheduledDate', e.target.value)}
                  className={errors.scheduledDate ? 'border-destructive' : ''}
                />
                {errors.scheduledDate && (
                  <p className="text-sm text-destructive">{errors.scheduledDate}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!isFormValid || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create Request' : 'Update Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
