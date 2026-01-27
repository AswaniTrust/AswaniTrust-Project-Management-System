import { useState, useEffect } from 'react';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => void;
  company?: Company;
}

export function CompanyForm({ isOpen, onClose, onSave, company }: CompanyFormProps) {
  const [name, setName] = useState(company?.name || '');
  const [logo, setLogo] = useState(company?.logo || '');

  useEffect(() => {
    if (company) {
      setName(company.name);
      setLogo(company.logo || '');
    } else {
      setName('');
      setLogo('');
    }
  }, [company, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: company?.id, name, logo });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={company ? 'Edit Company' : 'Create Company'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter company name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo">Logo URL</Label>
          <Input
            id="logo"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {company ? 'Save Changes' : 'Create Company'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
