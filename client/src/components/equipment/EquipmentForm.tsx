import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useCreateEquipment, useUpdateEquipment } from '../../hooks/useEquipment';
import type {
  Equipment,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  EquipmentFormData,
} from '../../types/equipment';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  DEPARTMENTS,
  MAINTENANCE_TEAMS,
} from '../../types/equipment';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EquipmentForm({ equipment, onSuccess, onCancel }: EquipmentFormProps) {
  const isEditing = !!equipment;
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();

  // Use equipment ID or timestamp to force re-render when equipment changes
  const formKey = equipment ? `edit-${equipment.id}` : 'create-new';

  const [formData, setFormData] = useState<EquipmentFormData>({
    equipmentName: '',
    serialNumber: '',
    category: '',
    department: '',
    assignedEmployee: '',
    assignedTeam: '',
    purchaseDate: '',
    warrantyExpiry: '',
    location: '',
    status: 'Active',
    specifications: '',
    usageHours: '',
    lastMaintenanceDate: '',
  });

  const [errors, setErrors] = useState<Partial<EquipmentFormData>>({});

  // Populate form when editing
  useEffect(() => {
    console.log('Equipment prop changed:', equipment); // Debug log
    if (equipment) {
      console.log('Equipment data received:', {
        category: equipment.category,
        department: equipment.department,
        assignedTeam: equipment.assignedTeam,
        status: equipment.status,
      }); // Debug log

      const newFormData = {
        equipmentName: equipment.equipmentName || '',
        serialNumber: equipment.serialNumber || '',
        category: equipment.category || '',
        department: equipment.department || '',
        assignedEmployee: equipment.assignedEmployee || '',
        assignedTeam: equipment.assignedTeam || '',
        purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.split('T')[0] : '', // Convert to date input format
        warrantyExpiry: equipment.warrantyExpiry ? equipment.warrantyExpiry.split('T')[0] : '',
        location: equipment.location || '',
        status: equipment.status || 'Active',
        specifications: equipment.specifications
          ? JSON.stringify(equipment.specifications, null, 2)
          : '',
        usageHours: equipment.usageHours?.toString() || '',
        lastMaintenanceDate: equipment.lastMaintenanceDate
          ? equipment.lastMaintenanceDate.split('T')[0]
          : '',
      };

      console.log('Setting form data to:', newFormData); // Debug log

      // Use setTimeout to ensure the form data is set after the component re-renders
      setTimeout(() => {
        setFormData(newFormData);
      }, 0);
    } else {
      // Reset form for new equipment
      setFormData({
        equipmentName: '',
        serialNumber: '',
        category: '',
        department: '',
        assignedEmployee: '',
        assignedTeam: '',
        purchaseDate: '',
        warrantyExpiry: '',
        location: '',
        status: 'Active',
        specifications: '',
        usageHours: '',
        lastMaintenanceDate: '',
      });
    }
    // Clear any existing errors
    setErrors({});
  }, [equipment]);

  const handleInputChange = (field: keyof EquipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EquipmentFormData> = {};

    if (!formData.equipmentName.trim()) {
      newErrors.equipmentName = 'Equipment name is required';
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.assignedTeam) {
      newErrors.assignedTeam = 'Assigned team is required';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.specifications) {
      try {
        JSON.parse(formData.specifications);
      } catch {
        newErrors.specifications = 'Invalid JSON format';
      }
    }

    if (formData.usageHours && isNaN(Number(formData.usageHours))) {
      newErrors.usageHours = 'Usage hours must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const requestData: CreateEquipmentRequest | UpdateEquipmentRequest = {
        equipmentName: formData.equipmentName.trim(),
        serialNumber: formData.serialNumber.trim(),
        category: formData.category as any,
        department: formData.department,
        assignedEmployee: formData.assignedEmployee.trim() || undefined,
        assignedTeam: formData.assignedTeam,
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
        warrantyExpiry: formData.warrantyExpiry
          ? new Date(formData.warrantyExpiry).toISOString()
          : undefined,
        location: formData.location.trim(),
        status: formData.status as any,
        specifications: formData.specifications ? JSON.parse(formData.specifications) : undefined,
        usageHours: formData.usageHours ? Number(formData.usageHours) : undefined,
        lastMaintenanceDate: formData.lastMaintenanceDate
          ? new Date(formData.lastMaintenanceDate).toISOString()
          : undefined,
      };

      if (isEditing) {
        await updateEquipment.mutateAsync({ id: equipment.id, data: requestData });
      } else {
        await createEquipment.mutateAsync(requestData as CreateEquipmentRequest);
      }

      onSuccess();
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isLoading = createEquipment.isPending || updateEquipment.isPending;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Equipment' : 'Add New Equipment'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentName">Equipment Name *</Label>
              <Input
                id="equipmentName"
                value={formData.equipmentName}
                onChange={(e) => handleInputChange('equipmentName', e.target.value)}
                placeholder="Enter equipment name"
              />
              {errors.equipmentName && (
                <p className="text-sm text-red-600">{errors.equipmentName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                placeholder="Enter serial number"
              />
              {errors.serialNumber && <p className="text-sm text-red-600">{errors.serialNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              {/* Debug info */}

              <Select
                key={`category-${formKey}`}
                value={formData.category || undefined}
                onValueChange={(value) => {
                  console.log('Category changed to:', value);
                  handleInputChange('category', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              {/* Debug info */}

              <Select
                key={`department-${formKey}`}
                value={formData.department || undefined}
                onValueChange={(value) => {
                  console.log('Department changed to:', value);
                  handleInputChange('department', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-sm text-red-600">{errors.department}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedEmployee">Assigned Employee</Label>
              <Input
                id="assignedEmployee"
                value={formData.assignedEmployee}
                onChange={(e) => handleInputChange('assignedEmployee', e.target.value)}
                placeholder="Enter employee ID or name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTeam">Assigned Team *</Label>
              {/* Debug info */}

              <Select
                key={`assignedTeam-${formKey}`}
                value={formData.assignedTeam || undefined}
                onValueChange={(value) => {
                  console.log('AssignedTeam changed to:', value);
                  handleInputChange('assignedTeam', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedTeam && <p className="text-sm text-red-600">{errors.assignedTeam}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              />
              {errors.purchaseDate && <p className="text-sm text-red-600">{errors.purchaseDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="warrantyExpiry"
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
              />
              {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                key={`status-${formKey}`}
                value={formData.status || undefined}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageHours">Usage Hours</Label>
              <Input
                id="usageHours"
                type="number"
                value={formData.usageHours}
                onChange={(e) => handleInputChange('usageHours', e.target.value)}
                placeholder="Enter usage hours"
              />
              {errors.usageHours && <p className="text-sm text-red-600">{errors.usageHours}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastMaintenanceDate">Last Maintenance Date</Label>
              <Input
                id="lastMaintenanceDate"
                type="date"
                value={formData.lastMaintenanceDate}
                onChange={(e) => handleInputChange('lastMaintenanceDate', e.target.value)}
              />
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-2">
            <Label htmlFor="specifications">Specifications (JSON)</Label>
            <Textarea
              id="specifications"
              value={formData.specifications}
              onChange={(e) => handleInputChange('specifications', e.target.value)}
              placeholder='{"power": "500W", "voltage": "220V", "weight": "50kg"}'
              rows={4}
            />
            {errors.specifications && (
              <p className="text-sm text-red-600">{errors.specifications}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Enter technical specifications as JSON format (optional)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Equipment' : 'Create Equipment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
