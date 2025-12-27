import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Filter, Clock, Zap, ArrowLeft, X } from 'lucide-react';
import { useEquipmentList } from '@/hooks/useEquipment';
import { SmartScheduler } from '@/components/equipment/SmartScheduler';
import type { Equipment } from '@/types/equipment';

export const MaintenanceSchedulePage = () => {
  const navigate = useNavigate();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: equipmentData, isLoading } = useEquipmentList({
    search: searchTerm,
    department: departmentFilter || undefined,
    status: statusFilter || undefined,
    limit: 50,
  });

  const equipment = equipmentData?.equipment || [];

  const handleScheduleCreated = () => {
    // Optionally navigate to requests or show success message
    setSelectedEquipment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Under Maintenance':
        return 'bg-yellow-500';
      case 'Scrapped':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    // Simple category icons - in real implementation, could use more specific icons
    switch (category) {
      case 'Machine':
        return '⚙️';
      case 'Vehicle':
        return '🚗';
      case 'Computer':
        return '💻';
      case 'Tool':
        return '🔧';
      default:
        return '📦';
    }
  };

  if (selectedEquipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedEquipment(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Equipment List
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Smart Maintenance Scheduler</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {selectedEquipment.equipmentName} • {selectedEquipment.category}
                </span>
                <Badge className={getStatusColor(selectedEquipment.status)}>
                  {selectedEquipment.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Serial Number:</span>
                <div className="font-medium">{selectedEquipment.serialNumber}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <div className="font-medium">{selectedEquipment.department}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <div className="font-medium">{selectedEquipment.location}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Assigned Team:</span>
                <div className="font-medium">{selectedEquipment.assignedTeam}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Scheduler */}
        <SmartScheduler
          equipmentId={selectedEquipment.id}
          onScheduleCreated={handleScheduleCreated}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Scheduling</h1>
          <p className="text-muted-foreground">
            AI-powered smart scheduling for optimal maintenance planning
          </p>
        </div>
        <Button onClick={() => navigate('/equipment')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Equipment
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Equipment Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Equipment</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <div className="flex gap-2">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                  </SelectContent>
                </Select>
                {departmentFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDepartmentFilter('')}
                    className="px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="Scrapped">Scrapped</SelectItem>
                  </SelectContent>
                </Select>
                {statusFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusFilter('')}
                    className="px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Equipment for Scheduling
            </div>
            <Badge variant="secondary">{equipment.length} equipment found</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-sm text-muted-foreground">Loading equipment...</div>
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No Equipment Found</div>
              <div className="text-sm text-muted-foreground">
                Try adjusting your search filters or add new equipment.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedEquipment(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="font-medium">{item.equipmentName}</div>
                          <div className="text-xs text-muted-foreground">{item.serialNumber}</div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Department:</span>
                        <span>{item.department}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Team:</span>
                        <span>{item.assignedTeam}</span>
                      </div>
                      {item.lastMaintenanceDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last Maintenance:</span>
                          <span>{new Date(item.lastMaintenanceDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Age:{' '}
                          {Math.floor(
                            (Date.now() - new Date(item.purchaseDate).getTime()) /
                              (1000 * 60 * 60 * 24 * 365)
                          )}{' '}
                          years
                        </span>
                      </div>
                      <Button size="sm" className="h-7">
                        <Zap className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
