import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { IssueRow } from './IssueCreator';
import { GitHubProjectField } from '../types';

// Types for props
interface InlineIssueRowProps {
  // Add row props
  isAddRow?: boolean;
  addRow?: { id: string; title: string; fields: Record<string, string> };
  renderedFields: GitHubProjectField[];
  onAddRowChange?: (field: string, value: string) => void;
  onAddRowKeyDown?: (e: React.KeyboardEvent, field: string) => void;
  onAddRowSubmit?: () => void;
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
  mode,
  field,
  value,
  options,
  isEditing,
  onChange,
  onBlur,
  onKeyDown,
  autoFocus,
  placeholder,
  className = '',
}: {
  mode: 'add' | 'edit';
  field: GitHubProjectField | { id: string; name: string; type: string; options?: { id: string; name: string }[] };
  value: string;
  options?: { id: string; name: string }[];
  isEditing?: boolean;
  onChange?: (val: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}) {
  if (isEditing) {
    if (field.type === 'SINGLE_SELECT') {
      return (
        <Select value={value} defaultValue={value} onValueChange={(val) => onChange && onChange(val)}>
          <SelectTrigger autoFocus={autoFocus} className={`h-full rounded-none border-none hover:bg-accent ${className}`}>
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
          className={`h-full rounded-none border-none hover:bg-accent ${className}`}
          autoFocus={autoFocus}
          type={field.type === 'NUMBER' ? 'number' : 'text'}
          value={mode === 'add' ? value : undefined}
          defaultValue={mode === 'edit' ? value : undefined}
          onBlur={onBlur}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || field.name}
        />
      );
    }
  } else {
    // Display value
    let displayValue = '-';
    if (value !== undefined && value !== '') {
      if (field.type === 'SINGLE_SELECT' && field.options) {
        const opt = field.options.find((o) => o.id === value);
        displayValue = opt ? opt.name : String(value);
      } else if (typeof value === 'object') {
        displayValue = '';
      } else {
        displayValue = String(value);
      }
    }
    return <p className={`flex items-center h-full px-3 py-1 ${className}`}>{displayValue}</p>;
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
  } = props;

  // Add Row
  if (isAddRow && addRow) {
    return (
      <TableRow ref={ref}>
        {/* Title cell */}
        <TableCell className='font-medium p-0 h-[3.375rem] border-r' tabIndex={0}>
          {renderCell({
            mode: 'add',
            field: { id: 'title', name: 'Title', type: 'text' },
            value: addRow.title,
            isEditing: true,
            onChange: (val) => onAddRowChange && onAddRowChange('title', val),
            onKeyDown: (e) => onAddRowKeyDown && onAddRowKeyDown(e, 'title'),
            autoFocus: false,
            placeholder: 'Title',
            className: 'border-none outline-none shadow-none',
          })}
        </TableCell>
        {/* Dynamic fields */}
        {renderedFields.map((field) => (
          <TableCell key={field.id} className='h-[3.375rem] p-0 text-muted-foreground border-r' tabIndex={0}>
            {renderCell({
              mode: 'add',
              field,
              value: addRow.fields[field.id] || '',
              options: field.options,
              isEditing: true,
              onChange: (val) => onAddRowChange && onAddRowChange(field.id, val),
              onKeyDown: (e) => onAddRowKeyDown && onAddRowKeyDown(e, field.id),
              autoFocus: false,
              placeholder: field.name,
            })}
          </TableCell>
        ))}
        {/* Add button cell */}
        <TableCell className='text-right p-0 h-[3.375rem]'>
          <div className='flex justify-end gapx-3 py-1'>
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
      <TableCell
        className='font-medium p-0 h-[3.375rem] border-r'
        onFocus={() => onCellClick && onCellClick(issue.id, 'title')}
        onClick={() => onCellClick && onCellClick(issue.id, 'title')}
        tabIndex={0}
      >
        {inlineEdit && inlineEdit.id === issue.id && inlineEdit.field === 'title' ? (
          renderCell({
            mode: 'edit',
            field: { id: 'title', name: 'Title', type: 'text' },
            value: issue.title,
            isEditing: true,
            onChange: (val) => onInlineEditChange && onInlineEditChange(issue.id, 'title', val),
            onBlur: onInlineEditBlur,
            onKeyDown: (e) => e.key === 'Enter' && onInlineEditBlur && onInlineEditBlur(),
            autoFocus: true,
            className: 'border-none outline-none shadow-none',
          })
        ) : (
          <div className='flex items-center h-full px-3 py-1'>
            <span className='truncate max-w-xs'>{issue.title}</span>
          </div>
        )}
      </TableCell>

      {renderedFields.map((field) => {
        const value = issue.fields?.[field.id];
        let displayValue = '-';
        if (value !== undefined && value !== '') {
          if (field.type === 'SINGLE_SELECT' && field.options) {
            const opt = field.options.find((o) => o.id === value);
            displayValue = opt ? opt.name : String(value);
          } else if (typeof value === 'object') {
            displayValue = '';
          } else {
            displayValue = String(value);
          }
        }
        return (
          <TableCell
            key={field.id}
            className='h-[3.375rem] p-0 text-muted-foreground border-r'
            onClick={() => onCellClick && onCellClick(issue.id, field.id)}
            tabIndex={0}
          >
            {inlineEdit && inlineEdit.id === issue.id && inlineEdit.field === field.id ? (
              renderCell({
                mode: 'edit',
                field,
                value: typeof issue.fields?.[field.id] === 'object' ? '' : String(issue.fields?.[field.id] ?? ''),
                options: field.options,
                isEditing: true,
                onChange: (val) => onInlineEditChange && onInlineEditChange(issue.id, field.id, val),
                onBlur: onInlineEditBlur,
                onKeyDown: (e) => e.key === 'Enter' && onInlineEditBlur && onInlineEditBlur(),
                autoFocus: true,
              })
            ) : (
              <p className='flex items-center h-full px-3 py-1'>{displayValue}</p>
            )}
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
