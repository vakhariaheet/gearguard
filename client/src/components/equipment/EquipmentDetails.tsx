import { Edit, Trash2, Calendar, MapPin, Users, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { HealthAssessmentButton } from './HealthAssessmentButton';
import { useDeleteEquipment } from '../../hooks/useEquipment';
import type { Equipment } from '../../types/equipment';

interface EquipmentDetailsProps {
  equipment: Equipment;
  onEdit: () => void;
  onClose: () => void;
}

export function EquipmentDetails({ equipment, onEdit, onClose }: EquipmentDetailsProps) {
  const deleteEquipment = useDeleteEquipment();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${equipment.equipmentName}"?`)) {
      try {
        await deleteEquipment.mutateAsync(equipment.id);
        onClose();
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Under Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Scrapped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isWarrantyExpired =
    equipment.warrantyExpiry && new Date(equipment.warrantyExpiry) < new Date();
  const warrantyStatus = equipment.warrantyExpiry
    ? isWarrantyExpired
      ? 'Expired'
      : 'Active'
    : 'No warranty';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{equipment.equipmentName}</h1>
          <p className="text-muted-foreground">Serial: {equipment.serialNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteEquipment.isPending}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <div className="mt-1">
                    <Badge variant="outline">{equipment.category}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(equipment.status)}>{equipment.status}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="mt-1">{equipment.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned Team</label>
                  <p className="mt-1 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {equipment.assignedTeam}
                  </p>
                </div>
                {equipment.assignedEmployee && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Assigned Employee
                    </label>
                    <p className="mt-1">{equipment.assignedEmployee}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="mt-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {equipment.location}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Dates & Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                  <p className="mt-1">{formatDate(equipment.purchaseDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Warranty Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={
                        warrantyStatus === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : warrantyStatus === 'Expired'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {warrantyStatus}
                    </Badge>
                    {equipment.warrantyExpiry && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Expires: {formatDate(equipment.warrantyExpiry)}
                      </p>
                    )}
                  </div>
                </div>
                {equipment.lastMaintenanceDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Maintenance
                    </label>
                    <p className="mt-1">{formatDate(equipment.lastMaintenanceDate)}</p>
                  </div>
                )}
                {equipment.usageHours && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Usage Hours</label>
                    <p className="mt-1">{equipment.usageHours.toLocaleString()} hours</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          {equipment.specifications && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(equipment.specifications).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="mt-1">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Health Assessment Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthAssessmentButton equipment={equipment} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Age</label>
                <p className="mt-1">
                  {Math.floor(
                    (Date.now() - new Date(equipment.purchaseDate).getTime()) /
                      ((1000 * 60 * 60 * 24) / 365.25)
                  )}{' '}
                  years
                </p>
              </div>

              {equipment.lastMaintenanceDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Days Since Maintenance
                  </label>
                  <p className="mt-1">
                    {Math.floor(
                      (Date.now() - new Date(equipment.lastMaintenanceDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="mt-1 text-sm">{formatDate(equipment.createdAt)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="mt-1 text-sm">{formatDate(equipment.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
