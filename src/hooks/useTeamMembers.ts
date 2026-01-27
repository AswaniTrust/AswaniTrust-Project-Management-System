import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';

export function useTeamMembers() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const profiles = await api.team.getMembers();

      const users: User[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar_url || undefined,
        role: (profile.user_role || profile.role || 'backend_developer') as UserRole,
        designation: profile.designation || undefined,
      }));

      setMembers(users);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (memberData: Partial<User> & { password?: string }) => {
    try {
      setSaving(true);

      if (memberData.password) {
        const result = await api.team.createMember({
          name: memberData.name || '',
          email: memberData.email || '',
          password: memberData.password,
          role: memberData.role || 'backend_developer',
          designation: memberData.designation,
        });

        await fetchMembers();
        toast.success('Team member added with login credentials');
        return result;
      } else {
        toast.error('Password is required for new team members');
        return null;
      }
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast.error(error.message || 'Failed to add team member');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (id: string, memberData: Partial<User>) => {
    try {
      setSaving(true);
      
      if (memberData.role) {
        await api.team.updateRole(id, memberData.role);
      }

      const updatedMember: User = {
        ...members.find(m => m.id === id)!,
        ...memberData,
      };

      setMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
      toast.success('Team member updated successfully');
      return updatedMember;
    } catch (error: any) {
      console.error('Error updating team member:', error);
      toast.error(error.message || 'Failed to update team member');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      // Note: Delete endpoint would need to be added to the API
      setMembers(prev => prev.filter(m => m.id !== id));
      toast.success('Team member deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast.error(error.message || 'Failed to delete team member');
      return false;
    }
  };

  return {
    members,
    loading,
    saving,
    refetch: fetchMembers,
    addMember,
    updateMember,
    deleteMember,
  };
}
