import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Save, X, Check, ChevronDown } from 'lucide-react';
import { useEquipment } from '../../hooks/useRequests';
import type {
  CreateRequestRequest,
  UpdateRequestRequest,
  MaintenanceRequest,
  RequestType,
  RequestPriority,
} from '../../types/requests';
import type { Equipment } from '../../types/equipment';

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
  const [equipmentSearchOpen, setEquipmentSearchOpen] = useState(false);
  const [equipmentSearchValue, setEquipmentSearchValue] = useState('');
  const equipmentDropdownRef = useRef<HTMLDivElement>(null);

  const equipmentOptions = equipmentResponse?.data?.equipment || [];

  // Initialize search value when equipment options are loaded and there's an initial equipmentId
  useEffect(() => {
    if (initialData?.equipmentId && equipmentOptions.length > 0 && !equipmentSearchValue) {
      const equipment = equipmentOptions.find((eq: Equipment) => eq.id === initialData.equipmentId);
      if (equipment) {
        setEquipmentSearchValue(equipment.equipmentName);
      }
    }
  }, [equipmentOptions, initialData?.equipmentId, equipmentSearchValue]);

  // Filter equipment based on search value
  const filteredEquipment = useMemo(() => {
    if (!equipmentSearchValue) return equipmentOptions;
    return equipmentOptions.filter(
      (equipment: Equipment) =>
        equipment.equipmentName.toLowerCase().includes(equipmentSearchValue.toLowerCase()) ||
        equipment.category.toLowerCase().includes(equipmentSearchValue.toLowerCase()) ||
        equipment.department.toLowerCase().includes(equipmentSearchValue.toLowerCase())
    );
  }, [equipmentOptions, equipmentSearchValue]);

  // Get selected equipment for display
  const selectedEquipment = equipmentOptions.find(
    (eq: Equipment) => eq.id === formData.equipmentId
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        equipmentDropdownRef.current &&
        !equipmentDropdownRef.current.contains(event.target as Node)
      ) {
        setEquipmentSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleEquipmentSelect = (equipment: Equipment) => {
    handleFieldChange('equipmentId', equipment.id);
    setEquipmentSearchOpen(false);
    setEquipmentSearchValue(equipment.equipmentName);
  };

  const handleEquipmentInputChange = (value: string) => {
    setEquipmentSearchValue(value);
    setEquipmentSearchOpen(true);

    // If the input is cleared, clear the selection
    if (!value) {
      handleFieldChange('equipmentId', '');
    }
  };

  const handleEquipmentInputFocus = () => {
    setEquipmentSearchOpen(true);
    if (!equipmentSearchValue && selectedEquipment) {
      setEquipmentSearchValue(selectedEquipment.equipmentName);
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
              <div className="relative" ref={equipmentDropdownRef}>
                <div className="relative">
                  <Input
                    id="equipment"
                    value={
                      equipmentSearchValue ||
                      (selectedEquipment ? selectedEquipment.equipmentName : '')
                    }
                    onChange={(e) => handleEquipmentInputChange(e.target.value)}
                    onFocus={handleEquipmentInputFocus}
                    placeholder="Search equipment by name..."
                    className={errors.equipmentId ? 'border-destructive pr-8' : 'pr-8'}
                    disabled={mode === 'edit'} // Can't change equipment after creation
                  />
                  <ChevronDown
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                    onClick={() => setEquipmentSearchOpen(!equipmentSearchOpen)}
                  />
                </div>

                {equipmentSearchOpen && filteredEquipment.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredEquipment.map((equipment: Equipment) => (
                      <div
                        key={equipment.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          formData.equipmentId === equipment.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleEquipmentSelect(equipment)}
                      >
                        <div className="flex items-center">
                          {formData.equipmentId === equipment.id && (
                            <Check className="mr-2 h-4 w-4 text-blue-600" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900">
                              {equipment.equipmentName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {equipment.category} • {equipment.department} • {equipment.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {equipmentSearchOpen && filteredEquipment.length === 0 && equipmentSearchValue && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No equipment found matching "{equipmentSearchValue}"
                    </div>
                  </div>
                )}
              </div>
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
