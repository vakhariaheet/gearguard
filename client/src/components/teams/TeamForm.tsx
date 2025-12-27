/**
 * TeamForm Component
 * Form for creating and editing teams
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Loader2, Users } from 'lucide-react';
import { UserSearchInput } from './UserSearchInput';
import type {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamSpecialization,
  UserSearchResult,
} from '@/types/teams';

interface TeamFormProps {
  team?: Team; // If provided, form is in edit mode
  onSubmit: (data: CreateTeamRequest | UpdateTeamRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SPECIALIZATIONS: TeamSpecialization[] = [
  'Mechanics',
  'Electricians',
  'IT Support',
  'HVAC',
  'General',
  'Facilities',
];

const COMMON_SKILLS = [
  'Mechanical Repair',
  'Electrical Wiring',
  'Hydraulics',
  'Pneumatics',
  'Welding',
  'Troubleshooting',
  'Preventive Maintenance',
  'Safety Protocols',
  'Equipment Diagnostics',
  'Computer Hardware',
  'Network Configuration',
  'Software Installation',
  'Climate Control',
  'Refrigeration',
  'Plumbing',
  'Carpentry',
  'Painting',
  'Facility Management',
];

export const TeamForm = ({ team, onSubmit, onCancel, isLoading = false }: TeamFormProps) => {
  const isEditMode = !!team;
  const [skills, setSkills] = useState<string[]>(team?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [selectedLeadTechnician, setSelectedLeadTechnician] = useState<UserSearchResult | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTeamRequest | UpdateTeamRequest>({
    defaultValues: {
      teamName: team?.teamName || '',
      specialization: team?.specialization || undefined,
      description: team?.description || '',
      maxCapacity: team?.maxCapacity || 10,
      leadTechnician: team?.leadTechnician || '',
      ...(isEditMode && { isActive: team?.isActive ?? true }),
    },
  });

  const specialization = watch('specialization');

  // Update skills when specialization changes
  useEffect(() => {
    if (specialization && !isEditMode) {
      const specializationSkills: Record<TeamSpecialization, string[]> = {
        Mechanics: ['Mechanical Repair', 'Hydraulics', 'Pneumatics', 'Welding', 'Troubleshooting'],
        Electricians: [
          'Electrical Wiring',
          'Circuit Analysis',
          'Safety Protocols',
          'Equipment Diagnostics',
        ],
        'IT Support': [
          'Computer Hardware',
          'Network Configuration',
          'Software Installation',
          'Troubleshooting',
        ],
        HVAC: ['Climate Control', 'Refrigeration', 'Ductwork', 'Preventive Maintenance'],
        General: ['Preventive Maintenance', 'Safety Protocols', 'Troubleshooting'],
        Facilities: [
          'Facility Management',
          'Plumbing',
          'Carpentry',
          'Painting',
          'Preventive Maintenance',
        ],
      };

      setSkills(specializationSkills[specialization] || []);
    }
  }, [specialization, isEditMode]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleAddCommonSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleFormSubmit = (data: CreateTeamRequest | UpdateTeamRequest) => {
    onSubmit({
      ...data,
      skills,
      leadTechnician: selectedLeadTechnician?.id || data.leadTechnician || undefined,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {isEditMode ? 'Edit Team' : 'Create New Team'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name *</Label>
            <Input
              id="teamName"
              {...register('teamName', { required: 'Team name is required' })}
              placeholder="e.g., Mechanical Team Alpha"
            />
            {errors.teamName && <p className="text-sm text-red-600">{errors.teamName.message}</p>}
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization *</Label>
            <Select
              value={specialization}
              onValueChange={(value) => setValue('specialization', value as TeamSpecialization)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team specialization" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialization && (
              <p className="text-sm text-red-600">{errors.specialization.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the team's responsibilities..."
              rows={3}
            />
          </div>

          {/* Max Capacity */}
          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Maximum Capacity</Label>
            <Input
              id="maxCapacity"
              type="number"
              min="1"
              max="50"
              {...register('maxCapacity', {
                valueAsNumber: true,
                min: { value: 1, message: 'Capacity must be at least 1' },
                max: { value: 50, message: 'Capacity cannot exceed 50' },
              })}
              placeholder="10"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of concurrent maintenance requests
            </p>
            {errors.maxCapacity && (
              <p className="text-sm text-red-600">{errors.maxCapacity.message}</p>
            )}
          </div>

          {/* Lead Technician */}
          <div className="space-y-2">
            <Label htmlFor="leadTechnician">Lead Technician</Label>
            <UserSearchInput
              value={selectedLeadTechnician?.id || team?.leadTechnician}
              onUserSelect={(user) => {
                setSelectedLeadTechnician(user);
                setValue('leadTechnician', user?.id || '');
              }}
              placeholder="Search for team lead by email..."
              allowClear={true}
            />
            <p className="text-sm text-muted-foreground">
              Search and select the team leader from registered users
            </p>
          </div>

          {/* Active Status (Edit mode only) */}
          {isEditMode && (
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Team is active</Label>
            </div>
          )}

          {/* Skills */}
          <div className="space-y-4">
            <Label>Team Skills</Label>

            {/* Current Skills */}
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
            </div>

            {/* Add Custom Skill */}
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add custom skill..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" onClick={handleAddSkill} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Common Skills */}
            <div className="space-y-2">
              <Label className="text-sm">Common Skills (click to add):</Label>
              <div className="flex flex-wrap gap-1">
                {COMMON_SKILLS.filter((skill) => !skills.includes(skill)).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => handleAddCommonSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? 'Update Team' : 'Create Team'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
