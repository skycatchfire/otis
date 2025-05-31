import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { IssueRow } from './IssueCreator';
import IssueForm from './IssueForm';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { GitHubProjectField } from '../types';

interface IssueTableProps {
  issues: IssueRow[];
  onUpdate: (id: string, updates: Partial<IssueRow>) => void;
  onDelete: (id: string) => void;
  fields?: GitHubProjectField[];
}

const RENDERED_FIELD_TYPES = ['SINGLE_SELECT', 'NUMBER', 'TEXT'];

const IssueTable: React.FC<IssueTableProps> = ({ issues, onUpdate, onDelete, fields = [] }) => {
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  // Only show fields that are rendered in the form
  const renderedFields = fields.filter((f) => RENDERED_FIELD_TYPES.includes(f.type));

  const getEditingIssue = () => {
    if (!editingIssueId) return null;
    return issues.find((issue) => issue.id === editingIssueId) || null;
  };

  const handleUpdate = (updatedIssue: IssueRow) => {
    onUpdate(updatedIssue.id, updatedIssue);
    setEditingIssueId(null);
  };

  return (
    <>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              {/* Dynamic project fields */}
              {renderedFields.map((field) => (
                <TableHead key={field.id}>{field.name}</TableHead>
              ))}
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id} className='hover:bg-accent'>
                <TableCell className='font-medium'>
                  <div className='flex items-start'>
                    <span className='truncate max-w-xs'>{issue.title}</span>
                  </div>
                </TableCell>
                {/* Dynamic project field values */}
                {renderedFields.map((field) => {
                  let value = issue.fields?.[field.id];
                  if (field.type === 'SINGLE_SELECT' && value && field.options) {
                    const opt = field.options.find((o) => o.id === value);
                    value = opt ? opt.name : value;
                  }
                  let displayValue: string = '-';
                  if (value !== undefined && value !== '') {
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else {
                      displayValue = String(value);
                    }
                  }
                  return (
                    <TableCell key={field.id} className='text-muted-foreground'>
                      {displayValue}
                    </TableCell>
                  );
                })}
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button onClick={() => setEditingIssueId(issue.id)} variant='ghost' size='icon' aria-label='Edit'>
                      <Edit2 className='w-4 h-4' />
                    </Button>
                    <Button onClick={() => onDelete(issue.id)} variant='destructive' size='icon' aria-label='Delete'>
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingIssueId && <IssueForm initialData={getEditingIssue() || undefined} onSubmit={handleUpdate} onCancel={() => setEditingIssueId(null)} />}
    </>
  );
};

export default IssueTable;
