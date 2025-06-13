import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { IssueRow } from './IssueCreator';
import { GitHubProjectField, ParsedTemplate } from '../types';

// Types for props
interface InlineIssueRowProps {
  // Add row props
  isAddRow?: boolean;
  addRow?: { id: string; template: string; title: string; description: string; fields: Record<string, string> };
  renderedFields: GitHubProjectField[];
  onAddRowChange?: (field: string, value: string) => void;
  onAddRowKeyDown?: (e: React.KeyboardEvent, field: string) => void;
  onAddRowSubmit?: () => void;
  templates?: ParsedTemplate[];
  // Edit/view row props
  issue?: IssueRow;
  inlineEdit?: { id: string; field: string } | null;
  onCellClick?: (id: string, field: string) => void;
  onInlineEditChange?: (id: string, field: string, value: string) => void;
  onInlineEditBlur?: () => void;
  onEditClick?: () => void;
  onDelete?: () => void;
}

// Helper to render a cell for add or edit/view
function renderCell({
  field,
  value,
  options,
  onChange,
  onBlur,
  onKeyDown,
  autoFocus,
  placeholder,
  className = '',
}: {
  field: GitHubProjectField | { id: string; name: string; type: string; options?: { id: string; name: string }[] };
  value: string;
  options?: { id: string; name: string }[];
  onChange?: (val: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}) {
  if (field.type === 'SINGLE_SELECT') {
    return (
      <Select value={value} defaultValue={value} onValueChange={(val) => onChange && onChange(val)}>
        <SelectTrigger
          autoFocus={autoFocus}
          className={`h-full rounded-none border-none hover:bg-accent focus:bg-accent text-foreground ${className}`}
        >
          <SelectValue placeholder={placeholder || `Select ${field.name}`} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else {
    return (
      <Input
        className={`h-full rounded-none border-none hover:bg-accent focus:bg-accent text-foreground ${className}`}
        autoFocus={autoFocus}
        type={field.type === 'NUMBER' ? 'number' : 'text'}
        value={value}
        onBlur={onBlur}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder || field.name}
      />
    );
  }
}

const InlineIssueRow = forwardRef<HTMLTableRowElement, InlineIssueRowProps>((props, ref) => {
  const {
    isAddRow,
    addRow,
    renderedFields,
    onAddRowChange,
    onAddRowKeyDown,
    onAddRowSubmit,
    issue,
    inlineEdit,
    onCellClick,
    onInlineEditChange,
    onInlineEditBlur,
    onEditClick,
    onDelete,
    templates,
  } = props;

  // Add Row
  if (isAddRow && addRow) {
    return (
      <TableRow ref={ref}>
        <TableCell className='p-0 h-[3.375rem] border-r border-border' tabIndex={-1}>
          {/* Template select */}
          <Select value={addRow.template} onValueChange={(val) => onAddRowChange && onAddRowChange('template', val)}>
            <SelectTrigger className='h-full rounded-none hover:bg-accent focus:bg-accent text-foreground border-none outline-none shadow-none'>
              <SelectValue placeholder='Select template' />
            </SelectTrigger>
            <SelectContent>
              {(templates || []).map((template) => (
                <SelectItem key={template.name} value={template.name}>
                  <span className='flex flex-col text-left'>
                    <span>{template.parsed?.name || template.name}</span>
                    {template.parsed?.description && <span className='text-xs text-muted-foreground'>{template.parsed.description}</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className='p-0 h-[3.375rem] border-r border-border'>
          {renderCell({
            field: { id: 'title', name: 'Title', type: 'text' },
            value: addRow.title,
            onChange: (val) => onAddRowChange && onAddRowChange('title', val),
            onKeyDown: (e) => onAddRowKeyDown && onAddRowKeyDown(e, 'title'),
            autoFocus: false,
            placeholder: 'Title',
            className: 'border-none outline-none shadow-none',
          })}
        </TableCell>
        <TableCell className='p-0 h-[3.375rem] border-r border-border'>
          {renderCell({
            field: { id: 'description', name: 'Description', type: 'text' },
            value: addRow.description,
            onChange: (val) => onAddRowChange && onAddRowChange('description', val),
            onKeyDown: (e) => onAddRowKeyDown && onAddRowKeyDown(e, 'description'),
            autoFocus: false,
            placeholder: 'Description',
            className: 'border-none outline-none shadow-none',
          })}
        </TableCell>
        {/* Dynamic fields */}
        {renderedFields.map((field) => (
          <TableCell key={field.id} className='h-[3.375rem] p-0 text-muted-foreground border-r border-border' tabIndex={-1}>
            {renderCell({
              field,
              value: addRow.fields[field.id] || '',
              options: field.options,
              onChange: (val) => onAddRowChange && onAddRowChange(field.id, val),
              onKeyDown: (e) => onAddRowKeyDown && onAddRowKeyDown(e, field.id),
              autoFocus: false,
              placeholder: field.name,
            })}
          </TableCell>
        ))}
        {/* Add button cell */}
        <TableCell className='text-right p-0 h-[3.375rem]'>
          <div className='flex justify-end px-3 py-1'>
            <Button onClick={onAddRowSubmit} variant='default' size='sm' disabled={!addRow.title}>
              Add
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Edit/View Row
  if (!issue) return null;
  return (
    <TableRow>
      <TableCell className='p-0 h-[3.375rem] border-r border-border' tabIndex={-1}>
        {/* Template dropdown for edit/view row */}
        <Select value={issue.template || ''} onValueChange={(val) => onInlineEditChange && onInlineEditChange(issue.id, 'template', val)}>
          <SelectTrigger className='h-full rounded-none hover:bg-accent focus:bg-accent text-foreground border-none outline-none shadow-none'>
            <SelectValue placeholder='Select template' />
          </SelectTrigger>
          <SelectContent>
            {(templates || []).map((template) => (
              <SelectItem key={template.name} value={template.name}>
                <span className='flex flex-col text-left'>
                  <span>{template.parsed?.name || template.name}</span>
                  {template.parsed?.description && <span className='text-xs text-muted-foreground'>{template.parsed.description}</span>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell
        className='font-medium p-0 h-[3.375rem] border-r border-border'
        onFocus={() => onCellClick && onCellClick(issue.id, 'title')}
        onClick={() => onCellClick && onCellClick(issue.id, 'title')}
        tabIndex={inlineEdit && inlineEdit.id === issue.id && inlineEdit.field === 'title' ? -1 : 0}
      >
        {renderCell({
          field: { id: 'title', name: 'Title', type: 'text' },
          value: issue.title,
          onChange: (val) => onInlineEditChange && onInlineEditChange(issue.id, 'title', val),
          onBlur: onInlineEditBlur,
          onKeyDown: (e) => e.key === 'Enter' && onInlineEditBlur && onInlineEditBlur(),
          autoFocus: !!(inlineEdit && inlineEdit.id === issue.id && inlineEdit.field === 'title'),
          className: 'border-none outline-none shadow-none',
        })}
      </TableCell>

      <TableCell className='p-0 h-[3.375rem] border-r border-border'>
        {renderCell({
          field: { id: 'description', name: 'Description', type: 'text' },
          value: issue.description,
          onChange: (val) => onInlineEditChange && onInlineEditChange(issue.id, 'description', val),
          onBlur: onInlineEditBlur,
          onKeyDown: (e) => e.key === 'Enter' && onInlineEditBlur && onInlineEditBlur(),
          autoFocus: !!(inlineEdit && inlineEdit.id === issue.id && inlineEdit.field === 'description'),
          className: 'border-none outline-none shadow-none',
        })}
      </TableCell>

      {renderedFields.map((field) => {
        return (
          <TableCell
            key={field.id}
            className='h-[3.375rem] p-0 text-muted-foreground border-r border-border'
            onClick={() => onCellClick && onCellClick(issue.id, field.id)}
            onFocus={() => onCellClick && onCellClick(issue.id, field.id)}
            tabIndex={inlineEdit && inlineEdit.id === issue.id && inlineEdit.field === field.id ? -1 : 0}
          >
            {renderCell({
              field,
              value: typeof issue.fields?.[field.id] === 'object' ? '' : String(issue.fields?.[field.id] ?? ''),
              options: field.options,
              onChange: (val) => onInlineEditChange && onInlineEditChange(issue.id, field.id, val),
              onBlur: onInlineEditBlur,
              onKeyDown: (e) => e.key === 'Enter' && onInlineEditBlur && onInlineEditBlur(),
              autoFocus: !!(inlineEdit && inlineEdit.id === issue.id && inlineEdit.field === field.id),
            })}
          </TableCell>
        );
      })}

      <TableCell className='text-right p-0 h-[3.375rem]'>
        <div className='flex justify-end gapx-3 py-1'>
          <Button onClick={onEditClick} variant='ghost' size='icon' aria-label='Edit'>
            <Edit2 className='w-4 h-4' />
          </Button>
          <Button onClick={onDelete} variant='ghost' size='icon' aria-label='Delete'>
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export default InlineIssueRow;
