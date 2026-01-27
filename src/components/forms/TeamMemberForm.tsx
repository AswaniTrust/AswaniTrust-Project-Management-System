import { useState, useEffect } from 'react';
import { User, UserRole, userRoleConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Eye, EyeOff } from 'lucide-react';

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Partial<User> & { password?: string }) => void;
  member?: User;
  isLoading?: boolean;
}

export function TeamMemberForm({ isOpen, onClose, onSave, member, isLoading }: TeamMemberFormProps) {
  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(member?.role || 'frontend_developer');
  const [designation, setDesignation] = useState(member?.designation || '');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setRole(member.role);
      setDesignation(member.designation || '');
      setPassword(''); // Don't show existing password
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('frontend_developer');
      setDesignation('');
    }
    setShowPassword(false);
  }, [member, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const memberData: Partial<User> & { password?: string } = { 
      id: member?.id, 
      name, 
      email, 
      role, 
      designation 
    };
    
    // Only include password for new members or if explicitly set
    if (!member && password) {
      memberData.password = password;
    }
    
    onSave(memberData);
  };

  const isNewMember = !member;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={member ? 'Edit Team Member' : 'Add Team Member'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            required
            disabled={isLoading || !!member} // Can't change email for existing members
          />
        </div>
        {isNewMember && (
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
                minLength={6}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share these credentials with the team member so they can log in.
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(userRoleConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g., PHP Developer, React Developer, iOS Developer"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Saving...' : (member ? 'Save Changes' : 'Add Member')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
