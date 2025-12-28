import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Activity,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  X,
} from 'lucide-react';
import { useEquipmentList } from '../../hooks/useEquipment';
import { EquipmentForm } from '../../components/equipment/EquipmentForm';
import type { Equipment } from '../../types/equipment';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES, DEPARTMENTS } from '../../types/equipment';

export function EquipmentPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const {
    data: equipmentData,
    isLoading,
    refetch,
  } = useEquipmentList({
    search: searchTerm || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    department: departmentFilter || undefined,
    limit: 50,
  });

  const equipment = equipmentData?.equipment || [];

  const handleCreateEquipment = () => {
    setEditingEquipment(undefined);
    setShowForm(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEquipment(undefined);
    refetch();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEquipment(undefined);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Under Maintenance':
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'Scrapped':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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

  if (showForm) {
    return (
      <EquipmentForm
        equipment={editingEquipment}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="p-16">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your equipment inventory, health monitoring, and maintenance scheduling
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/equipment/health">
            <Button variant="outline" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health Dashboard
            </Button>
          </Link>
          <Link to="/equipment/maintenance">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Maintenance Schedule
            </Button>
          </Link>
          <Button onClick={handleCreateEquipment} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Equipment</p>
                <p className="text-2xl font-bold">{equipment.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {equipment.filter((e) => e.status === 'Active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {equipment.filter((e) => e.status === 'Under Maintenance').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scrapped</p>
                <p className="text-2xl font-bold text-red-600">
                  {equipment.filter((e) => e.status === 'Scrapped').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 ">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryFilter('')}
                  className="px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
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
            <div className="flex gap-2">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
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
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Equipment Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter || statusFilter || departmentFilter
                  ? 'No equipment matches your current filters.'
                  : 'Get started by adding your first piece of equipment.'}
              </p>
              <Button onClick={handleCreateEquipment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.equipmentName}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.serialNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {getStatusIcon(item.status)}
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Department:</span>
                        <span>{item.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="truncate ml-2">{item.location}</span>
                      </div>
                      {item.usageHours && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Usage Hours:</span>
                          <span>{item.usageHours.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEquipment(item)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Link to={`/equipment/health?equipmentId=${item.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Health
                        </Button>
                      </Link>
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
}
