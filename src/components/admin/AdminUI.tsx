'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Upload, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

/* ─── Admin Page Header ──────────────────────────────────────────────────── */
export function AdminHeader({
  title,
  subtitle,
  onAdd,
  addLabel = 'Add New',
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-0.5 text-sm">{subtitle}</p>}
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#25D366' }}
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

/* ─── Admin Search ───────────────────────────────────────────────────────── */
export function AdminSearch({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative mb-5">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-sm pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
        style={{ '--tw-ring-color': '#25D366' } as React.CSSProperties}
      />
    </div>
  );
}

/* ─── Admin Table ────────────────────────────────────────────────────────── */
export function AdminTable({
  columns,
  rows,
  onEdit,
  onDelete,
  extraActions,
}: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
  onEdit?: (i: number) => void;
  onDelete?: (i: number) => void;
  extraActions?: (i: number) => React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {col}
                </th>
              ))}
              {(onEdit || onDelete || extraActions) && (
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-5 py-3.5 text-sm text-gray-700">
                    {cell}
                  </td>
                ))}
                {(onEdit || onDelete || extraActions) && (
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {extraActions?.(i)}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(i)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(i)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-gray-400">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({
  open,
  title,
  onClose,
  children,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {onSubmit && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
              style={{ background: '#25D366' }}
            >
              {loading ? 'Saving…' : submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Form Field ─────────────────────────────────────────────────────────── */
export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2',
        props.className
      )}
      style={{ '--tw-ring-color': '#25D366', ...props.style } as React.CSSProperties}
    />
  );
}

/* ─── Textarea ───────────────────────────────────────────────────────────── */
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 3}
      className={clsx(
        'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 resize-y',
        props.className
      )}
      style={{ '--tw-ring-color': '#25D366', ...props.style } as React.CSSProperties}
    />
  );
}

/* ─── Select ─────────────────────────────────────────────────────────────── */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white',
        props.className
      )}
      style={{ '--tw-ring-color': '#25D366', ...props.style } as React.CSSProperties}
    />
  );
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Available: 'bg-green-100 text-green-700',
    Published: 'bg-green-100 text-green-700',
    Draft: 'bg-gray-100 text-gray-600',
    Archived: 'bg-yellow-100 text-yellow-700',
    OutOfStock: 'bg-red-100 text-red-700',
    Discontinued: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded text-xs font-medium', colors[status] ?? 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
}

/* ─── Delete Confirm ─────────────────────────────────────────────────────── */
export function DeleteConfirm({
  open,
  label,
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  label: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Modal open={open} title="Confirm Delete" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to delete <strong>{label}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60"
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-10 h-5 rounded-full transition-colors',
          checked ? '' : 'bg-gray-200'
        )}
        style={checked ? { background: '#25D366' } : undefined}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

/* ─── Image Upload Preview ───────────────────────────────────────────────── */
export function ImageUploadZone({
  onChange,
  multiple = true,
}: {
  onChange: (files: File[]) => void;
  multiple?: boolean;
}) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    onChange(Array.from(fileList));
  };

  return (
    <label
      className={clsx(
        'block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        dragging ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">Drag & drop images or <span className="font-medium" style={{ color: '#25D366' }}>browse</span></p>
      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB each</p>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  );
}