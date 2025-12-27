/**
 * AddTeamMemberForm Component
 * Form for adding new members to a team with email search
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { X, Plus, UserPlus, Loader2 } from 'lucide-react';
import { UserSearchInput } from './UserSearchInput';
import type { AddTeamMemberRequest, MemberRole, UserSearchResult } from '@/types/teams';

interface AddTeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddTeamMemberRequest) => void;
  isLoading?: boolean;
}

const MEMBER_ROLES: MemberRole[] = ['Lead', 'Senior', 'Junior', 'Trainee'];

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

const COMMON_CERTIFICATIONS = [
  'OSHA Safety',
  'Electrical License',
  'Welding Certification',
  'HVAC License',
  'CompTIA A+',
  'Network+',
  'Forklift Operation',
  'First Aid/CPR',
  'Confined Space',
  'Lockout/Tagout',
];

export const AddTeamMemberForm = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddTeamMemberFormProps) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddTeamMemberRequest>({
    defaultValues: {
      userId: '',
      role: 'Junior',
      skills: [],
      certifications: [],
    },
  });

  const role = watch('role');

  const handleClose = () => {
    reset();
    setSkills([]);
    setCertifications([]);
    setNewSkill('');
    setNewCertification('');
    setSelectedUser(null);
    onClose();
  };

  const handleUserSelect = (user: UserSearchResult | null) => {
    setSelectedUser(user);
    setValue('userId', user?.id || '');
  };

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

  const handleAddCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (certToRemove: string) => {
    setCertifications(certifications.filter((cert) => cert !== certToRemove));
  };

  const handleAddCommonCertification = (cert: string) => {
    if (!certifications.includes(cert)) {
      setCertifications([...certifications, cert]);
    }
  };

  const handleFormSubmit = (data: AddTeamMemberRequest) => {
    if (!selectedUser) {
      return; // Form validation should prevent this
    }

    onSubmit({
      ...data,
      skills: skills.length > 0 ? skills : undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Search User *</Label>
            <UserSearchInput
              value={selectedUser?.id}
              onUserSelect={handleUserSelect}
              placeholder="Search user by email..."
              allowClear={true}
            />
            {!selectedUser && (
              <p className="text-sm text-red-600">Please select a user from the search results</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={(value) => setValue('role', value as MemberRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select member role" />
              </SelectTrigger>
              <SelectContent>
                {MEMBER_ROLES.map((memberRole) => (
                  <SelectItem key={memberRole} value={memberRole}>
                    {memberRole}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <Label>Skills (Optional)</Label>

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
                <p className="text-sm text-muted-foreground">No skills added</p>
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
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {COMMON_SKILLS.filter((skill) => !skills.includes(skill)).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary text-xs"
                    onClick={() => handleAddCommonSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <Label>Certifications (Optional)</Label>

            {/* Current Certifications */}
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {cert}
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(cert)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {certifications.length === 0 && (
                <p className="text-sm text-muted-foreground">No certifications added</p>
              )}
            </div>

            {/* Add Custom Certification */}
            <div className="flex gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Add certification..."
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddCertification())
                }
              />
              <Button type="button" onClick={handleAddCertification} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Common Certifications */}
            <div className="space-y-2">
              <Label className="text-sm">Common Certifications (click to add):</Label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {COMMON_CERTIFICATIONS.filter((cert) => !certifications.includes(cert)).map(
                  (cert, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary text-xs"
                      onClick={() => handleAddCommonCertification(cert)}
                    >
                      {cert}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedUser}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
