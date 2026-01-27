import { Company, Project } from '@/types';
import { Building2, MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CompaniesViewProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (company: Company) => void;
}

export function CompaniesView({ companies, onSelectCompany, onAddCompany, onEditCompany, onDeleteCompany }: CompaniesViewProps) {
  const { role } = useAuth();
  
  // Only admins and managers can add/edit/delete companies
  const canManageCompanies = role === 'admin' || role === 'manager';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">Manage your client organizations</p>
        </div>
        {canManageCompanies && (
          <Button className="gap-2" onClick={onAddCompany}>
            <Plus className="w-4 h-4" />
            Add Company
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Company</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Projects</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Total Tasks</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Completed</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Progress</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {companies.map(company => {
              const totalTasks = company.projects.reduce((acc, p) => acc + p.tasks.length, 0);
              const completedTasks = company.projects.reduce(
                (acc, p) => acc + p.tasks.filter(t => t.status === 'live').length, 0
              );
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              
              return (
                <tr 
                  key={company.id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectCompany(company)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-medium text-card-foreground">{company.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{company.projects.length}</td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{totalTasks}</td>
                  <td className="px-6 py-4 text-sm text-success">{completedTasks}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {canManageCompanies && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditCompany(company); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); onDeleteCompany(company); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {companies.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No companies yet. Click "Add Company" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
