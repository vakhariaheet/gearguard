import { useState } from 'react';
import { EquipmentList } from '../../components/equipment/EquipmentList';
import { EquipmentForm } from '../../components/equipment/EquipmentForm';
import { EquipmentDetails } from '../../components/equipment/EquipmentDetails';
import type { Equipment } from '../../types/equipment';

type ViewMode = 'list' | 'create' | 'edit' | 'details';

export function EquipmentListPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const handleCreateClick = () => {
    setSelectedEquipment(null);
    setViewMode('create');
  };

  const handleEditClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setViewMode('edit');
  };

  const handleViewClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setViewMode('details');
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setSelectedEquipment(null);
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedEquipment(null);
  };

  const handleDetailsClose = () => {
    setViewMode('list');
    setSelectedEquipment(null);
  };

  const handleDetailsEdit = () => {
    setViewMode('edit');
  };

  return (
    <div className="container mx-auto p-6">
      {viewMode === 'list' && (
        <EquipmentList
          onCreateClick={handleCreateClick}
          onEditClick={handleEditClick}
          onViewClick={handleViewClick}
        />
      )}

      {viewMode === 'create' && (
        <EquipmentForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      )}

      {viewMode === 'edit' && selectedEquipment && (
        <EquipmentForm
          equipment={selectedEquipment}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {viewMode === 'details' && selectedEquipment && (
        <EquipmentDetails
          equipment={selectedEquipment}
          onEdit={handleDetailsEdit}
          onClose={handleDetailsClose}
        />
      )}
    </div>
  );
}
