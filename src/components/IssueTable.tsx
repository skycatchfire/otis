import React, { useState } from 'react';
import { Edit2, Trash2, AlertOctagon } from 'lucide-react';
import { IssueRow } from './IssueCreator';
import IssueForm from './IssueForm';
import { Button } from '@/components/ui/button';

interface IssueTableProps {
  issues: IssueRow[];
  onUpdate: (id: string, updates: Partial<IssueRow>) => void;
  onDelete: (id: string) => void;
}

const IssueTable: React.FC<IssueTableProps> = ({ issues, onUpdate, onDelete }) => {
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  const getEditingIssue = () => {
    if (!editingIssueId) return null;
    return issues.find((issue) => issue.id === editingIssueId) || null;
  };

  const handleUpdate = (updatedIssue: IssueRow) => {
    onUpdate(updatedIssue.id, updatedIssue);
    setEditingIssueId(null);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'bug':
        return <AlertOctagon className='w-4 h-4 text-red-500' />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-border'>
          <thead className='bg-background'>
            <tr>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Title
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Type
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Status
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Assignee
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Est.
              </th>
              <th scope='col' className='px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-background divide-y divide-border'>
            {issues.map((issue) => (
              <tr key={issue.id} className='hover:bg-accent'>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  <div className='flex items-start'>
                    <span className='truncate max-w-xs'>{issue.title}</span>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    {getTypeIcon(issue.type)}
                    <span>{issue.type}</span>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm'>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                    {issue.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-muted-foreground'>{issue.assignee || '-'}</td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-muted-foreground'>{issue.estimate || '-'}</td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex justify-end gap-2'>
                    <Button onClick={() => setEditingIssueId(issue.id)} variant='ghost' size='icon' aria-label='Edit'>
                      <Edit2 className='w-4 h-4' />
                    </Button>
                    <Button onClick={() => onDelete(issue.id)} variant='destructive' size='icon' aria-label='Delete'>
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingIssueId && <IssueForm initialData={getEditingIssue() || undefined} onSubmit={handleUpdate} onCancel={() => setEditingIssueId(null)} />}
    </>
  );
};

export default IssueTable;
