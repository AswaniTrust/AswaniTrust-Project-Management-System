import { useState } from 'react';
import { Project, User, userRoleConfig } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/ui/modal';

interface TeamAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberIds: string[]) => void;
  project: Project;
  allMembers: User[];
}

export function TeamAssignment({ isOpen, onClose, onSave, project, allMembers }: TeamAssignmentProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(project.members.map(m => m.id));

  const toggleMember = (userId: string) => {
    setSelectedIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Manage Team - ${project.name}`}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select team members to assign to this project.
        </p>
        <div className="border border-border rounded-lg max-h-80 overflow-y-auto">
          {allMembers.map(member => {
            const roleConfig = userRoleConfig[member.role];
            const isSelected = selectedIds.includes(member.id);
            
            return (
              <label
                key={member.id}
                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleMember(member.id)}
                />
                <Avatar className="w-9 h-9">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{roleConfig.label}</p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Save Team ({selectedIds.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
