import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Edit2, Maximize2Icon, Trash2 } from 'lucide-react';
import React, { forwardRef } from 'react';
import { GitHubProjectField, ParsedTemplate } from '../types';
import { IssueRow } from './IssueCreator';

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
  onExpandClick?: (issue: IssueRow) => void;
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
  expandable,
  className = '',
  onExpandClick,
  issue,
}: {
  field: GitHubProjectField | { id: string; name: string; type: string; options?: { id: string; name: string }[] };
  value: string;
  options?: { id: string; name: string }[];
  onChange?: (val: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  placeholder?: string;
  expandable?: boolean;
  className?: string;
  onExpandClick?: (issue: IssueRow) => void;
  issue?: IssueRow;
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
      <span className='flex flex-grow h-[calc(100%-2px)] items-center'>
        <Input
          className={`h-full rounded-none border-none hover:bg-accent focus:bg-accent text-foreground truncate ${className}`}
          autoFocus={autoFocus}
          type={field.type === 'NUMBER' ? 'number' : 'text'}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || field.name}
        />

        {expandable && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label='Expand'
            className='shrink-0'
            onClick={() => onExpandClick && issue && onExpandClick(issue)}
          >
            <Maximize2Icon size={16} className='text-muted-foreground' />
          </Button>
        )}
      </span>
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
    onExpandClick,
    templates,
  } = props;

  // Unified Row
  const isAdd = isAddRow && addRow;
  const rowData = isAdd ? addRow : issue;
  if (!rowData) return null;

  // Handlers
  const handleChange = (field: string, value: string) => {
    if (isAdd) {
      onAddRowChange?.(field, value);
    } else if (issue && onInlineEditChange) {
      onInlineEditChange(issue.id, field, value);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (isAdd) {
      onAddRowKeyDown?.(e, field);
    } else if (e.key === 'Enter' && onInlineEditBlur) {
      onInlineEditBlur();
    }
  };
  const handleBlur = isAdd ? undefined : onInlineEditBlur;
  const handleCellClick = (field: string) => {
    if (!isAdd && issue && onCellClick) {
      onCellClick(issue.id, field);
    }
  };

  return (
    <TableRow ref={isAdd ? ref : undefined}>
      <TableCell className='p-0 h-[3.375rem] border-r border-border' tabIndex={-1}>
        <Select value={rowData.template || ''} onValueChange={(val) => handleChange('template', val)}>
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
        className={`font-medium p-0 h-[3.375rem] border-r border-border${isAdd ? '' : ''}`}
        onFocus={isAdd ? undefined : () => handleCellClick('title')}
        onClick={isAdd ? undefined : () => handleCellClick('title')}
        tabIndex={isAdd ? -1 : inlineEdit && issue && inlineEdit.id === issue.id && inlineEdit.field === 'title' ? -1 : 0}
      >
        {renderCell({
          field: { id: 'title', name: 'Title', type: 'text' },
          value: rowData.title || '',
          onChange: (val) => handleChange('title', val),
          onBlur: handleBlur,
          onKeyDown: (e) => handleKeyDown(e, 'title'),
          autoFocus: !isAdd && !!(inlineEdit && issue && inlineEdit.id === issue.id && inlineEdit.field === 'title'),
          placeholder: 'Title',
          className: 'border-none outline-none shadow-none',
          onExpandClick: onExpandClick,
          issue: issue,
        })}
      </TableCell>
      <TableCell
        className='p-0 min-h-[3.375rem] border-r border-border'
        onFocus={isAdd ? undefined : () => handleCellClick('description')}
        onClick={isAdd ? undefined : () => handleCellClick('description')}
        tabIndex={isAdd ? -1 : inlineEdit && issue && inlineEdit.id === issue.id && inlineEdit.field === 'description' ? -1 : 0}
      >
        {renderCell({
          field: { id: 'description', name: 'Description', type: 'text' },
          value: rowData.description || '',
          onChange: (val) => handleChange('description', val),
          onBlur: handleBlur,
          onKeyDown: (e) => handleKeyDown(e, 'description'),
          autoFocus: !isAdd && !!(inlineEdit && issue && inlineEdit.id === issue.id && inlineEdit.field === 'description'),
          placeholder: 'Description',
          expandable: true,
          className: 'border-none outline-none shadow-none',
          onExpandClick: onExpandClick,
          issue: isAdd ? addRow : issue,
        })}
      </TableCell>
      {renderedFields.map((field) => {
        let value = '';
        if (rowData.fields && field.id in rowData.fields) {
          const v = rowData.fields[field.id];
          value = typeof v === 'string' || typeof v === 'number' ? String(v) : '';
        }
        return (
          <TableCell
            key={field.id}
            className='h-[3.375rem] p-0 text-muted-foreground border-r border-border'
            onClick={isAdd ? undefined : () => handleCellClick(field.id)}
            onFocus={isAdd ? undefined : () => handleCellClick(field.id)}
            tabIndex={isAdd ? -1 : inlineEdit && issue && inlineEdit.id === issue.id && inlineEdit.field === field.id ? -1 : 0}
          >
            {renderCell({
              field,
              value,
              options: field.options,
              onChange: (val) => handleChange(field.id, val),
              onBlur: handleBlur,
              onKeyDown: (e) => handleKeyDown(e, field.id),
              autoFocus: !isAdd && !!(inlineEdit && issue && inlineEdit.id === issue.id && inlineEdit.field === field.id),
              placeholder: field.name,
              onExpandClick: onExpandClick,
              issue: issue,
            })}
          </TableCell>
        );
      })}
      <TableCell className='text-right p-0 h-[3.375rem]'>
        <div className='flex justify-end px-3 py-1'>
          {isAdd ? (
            <Button onClick={onAddRowSubmit} variant='default' size='sm' disabled={!rowData.title}>
              Add
            </Button>
          ) : (
            <>
              <Button onClick={onEditClick} variant='ghost' size='icon' aria-label='Edit'>
                <Edit2 className='w-4 h-4' />
              </Button>
              <Button onClick={onDelete} variant='ghost' size='icon' aria-label='Delete'>
                <Trash2 className='w-4 h-4' />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

export default InlineIssueRow;
