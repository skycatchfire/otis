import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GitHubProjectField } from '../types';
import InlineIssueRow from './InlineIssueRow';
import { IssueRow } from './IssueCreator';
import IssueForm from './IssueForm';
import { useSettingsStore } from '../stores/settingsStore';

// Define a type for parsed templates (copied from IssueForm)
interface ParsedTemplate {
  name: string;
  path: string;
  content: string;
  parsed: {
    body?: Array<{ attributes?: { value?: string } }>;
    name?: string;
  } | null;
}

interface IssueTableProps {
  issues: IssueRow[];
  onUpdate: (id: string, updates: Partial<IssueRow>) => void;
  onDelete: (id: string) => void;
  fields?: GitHubProjectField[];
  templates?: ParsedTemplate[];
}

const RENDERED_FIELD_TYPES = ['SINGLE_SELECT', 'NUMBER', 'TEXT'];

const IssueTable: React.FC<IssueTableProps> = ({ issues, onUpdate, onDelete, fields = [], templates = [] }) => {
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: string } | null>(null);
  const { lastUsedTemplate, lastUsedFields, setLastUsedTemplate, setLastUsedFields } = useSettingsStore();
  const [addRow, setAddRow] = useState<{ id: string; template: string; title: string; description: string; fields: Record<string, string> }>(() => {
    const template = lastUsedTemplate || '';
    let description = '';
    if (template) {
      const selectedTemplate = templates.find((t) => t.name === template);
      if (selectedTemplate) {
        if (selectedTemplate.parsed && selectedTemplate.parsed.body && Array.isArray(selectedTemplate.parsed.body)) {
          const descField = selectedTemplate.parsed.body.find((b: { attributes?: { value?: string } }) => b.attributes && b.attributes.value);
          description = descField?.attributes?.value || '';
        } else if (selectedTemplate.content) {
          description = selectedTemplate.content;
        }
      }
    }
    return {
      id: uuidv4(),
      template,
      title: '',
      description,
      fields: lastUsedFields ? { ...lastUsedFields } : {},
    };
  });
  const addRowRef = React.useRef<HTMLTableRowElement>(null);

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

  const handleAddRowChange = (field: string, value: string) => {
    if (field === 'title') {
      setAddRow((prev) => ({ ...prev, title: value }));
    } else if (field === 'template') {
      // Find the selected template and auto-populate description
      const selectedTemplate = templates.find((t) => t.name === value);
      let description = '';
      if (selectedTemplate) {
        // Try to get description from parsed YAML or fallback to markdown content
        if (selectedTemplate.parsed && selectedTemplate.parsed.body && Array.isArray(selectedTemplate.parsed.body)) {
          // Try to find a field with a value
          const descField = selectedTemplate.parsed.body.find((b: { attributes?: { value?: string } }) => b.attributes && b.attributes.value);
          description = descField?.attributes?.value || '';
        } else if (selectedTemplate.content) {
          description = selectedTemplate.content;
        }
      }
      setAddRow((prev) => ({ ...prev, template: value, description }));
    } else if (field === 'description') {
      setAddRow((prev) => ({ ...prev, description: value }));
    } else {
      setAddRow((prev) => ({ ...prev, fields: { ...prev.fields, [field]: value } }));
    }
  };

  const handleAddRowSubmit = () => {
    if (!addRow.title) return;
    const newIssue: IssueRow = {
      id: addRow.id,
      title: addRow.title,
      description: addRow.description,
      fields: addRow.fields,
      template: addRow.template,
    };
    onUpdate(newIssue.id, newIssue); // Use onUpdate to add (parent should handle add if not exists)
    setLastUsedTemplate(addRow.template);
    setLastUsedFields(addRow.fields);
    setAddRow({ id: uuidv4(), template: addRow.template, title: '', description: '', fields: { ...addRow.fields } });
    // Focus first input in new add row
    setTimeout(() => {
      if (addRowRef.current) {
        const firstInput = addRowRef.current.querySelector('input,select,textarea');
        if (firstInput) (firstInput as HTMLElement).focus();
      }
    }, 0);
  };

  // Inline edit handlers
  const handleCellClick = (id: string, field: string) => {
    setInlineEdit({ id, field });
  };
  const handleInlineEditChange = (id: string, field: string, value: string) => {
    const issue = issues.find((i) => i.id === id);
    if (!issue) return;
    if (field === 'title') {
      onUpdate(id, { ...issue, title: value });
    } else if (field === 'template') {
      // Find the selected template and auto-populate description
      const selectedTemplate = templates.find((t) => t.name === value);
      let description = issue.description;
      if (selectedTemplate) {
        if (selectedTemplate.parsed && selectedTemplate.parsed.body && Array.isArray(selectedTemplate.parsed.body)) {
          const descField = selectedTemplate.parsed.body.find((b: { attributes?: { value?: string } }) => b.attributes && b.attributes.value);
          description = descField?.attributes?.value || '';
        } else if (selectedTemplate.content) {
          description = selectedTemplate.content;
        }
      }
      onUpdate(id, { ...issue, template: value, description });
    } else {
      onUpdate(id, { ...issue, fields: { ...issue.fields, [field]: value } });
    }
  };
  const handleInlineEditBlur = () => {
    setInlineEdit(null);
  };

  // Keyboard navigation for add row
  const handleAddRowKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && field === renderedFields[renderedFields.length - 1]?.id)) {
      e.preventDefault();
      handleAddRowSubmit();
    }
  };

  // Ensure description is set if template is auto-selected and templates load after mount
  useEffect(() => {
    if (addRow.template && !addRow.description && templates.length > 0) {
      const selectedTemplate = templates.find((t) => t.name === addRow.template);
      let description = '';
      if (selectedTemplate) {
        if (selectedTemplate.parsed && selectedTemplate.parsed.body && Array.isArray(selectedTemplate.parsed.body)) {
          const descField = selectedTemplate.parsed.body.find((b: { attributes?: { value?: string } }) => b.attributes && b.attributes.value);
          description = descField?.attributes?.value || '';
        } else if (selectedTemplate.content) {
          description = selectedTemplate.content;
        }
      }
      if (description) {
        setAddRow((prev) => ({ ...prev, description }));
      }
    }
  }, [addRow.template, addRow.description, templates]);

  return (
    <>
      <div className='overflow-x-auto border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='p-3 border-r'>Template</TableHead>
              <TableHead className='p-3 border-r'>Title</TableHead>
              <TableHead className='p-3 border-r'>Description</TableHead>
              {/* Dynamic project fields */}
              {renderedFields.map((field) => (
                <TableHead key={field.id} className='p-3 border-r'>
                  {field.name}
                </TableHead>
              ))}
              <TableHead className='text-right p-3'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <InlineIssueRow
                key={issue.id}
                issue={issue}
                renderedFields={renderedFields}
                inlineEdit={inlineEdit}
                onCellClick={handleCellClick}
                onInlineEditChange={handleInlineEditChange}
                onInlineEditBlur={handleInlineEditBlur}
                onEditClick={() => setEditingIssueId(issue.id)}
                onDelete={() => onDelete(issue.id)}
                templates={templates}
              />
            ))}
            {/* Always-visible add row */}
            <InlineIssueRow
              ref={addRowRef}
              isAddRow
              addRow={addRow}
              renderedFields={renderedFields}
              onAddRowChange={handleAddRowChange}
              onAddRowKeyDown={handleAddRowKeyDown}
              onAddRowSubmit={handleAddRowSubmit}
              templates={templates}
            />
          </TableBody>
        </Table>
      </div>

      {editingIssueId && <IssueForm initialData={getEditingIssue() || undefined} onSubmit={handleUpdate} onCancel={() => setEditingIssueId(null)} />}
    </>
  );
};

export default IssueTable;
