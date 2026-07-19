'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Category, ApiResponse } from '@/types';
import {
  AdminHeader, AdminTable, Modal, Field,
  Input, Textarea, Select, DeleteConfirm,
} from '@/components/admin';

const emptyForm = { name: '', description: '', type: 'Drug' as 'Drug' | 'Lab' | 'Supermarket' };

const typeColors: Record<string, string> = {
  Drug: 'bg-green-100 text-green-700',
  Lab: 'bg-blue-100 text-blue-700',
  Supermarket: 'bg-purple-100 text-purple-700',
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [typeFilter, setTypeFilter] = useState<'Drug' | 'Lab' | 'Supermarket'>('Drug');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const token = () => getToken() ?? '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = (await categoriesApi.getAll(typeFilter)) as ApiResponse<Category[]>;
      if (res.success) setCategories(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [typeFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, type: typeFilter });
    setModalOpen(true);
  };

  const openEdit = (i: number) => {
    const c = categories[i];
    setEditId(c.id);
    setForm({ name: c.name, description: c.description ?? '', type: c.type });
    setModalOpen(true);
  };

const handleSave = async () => {
  setSaving(true);
  try {
    const typeMap = { Drug: 0, Lab: 1, Supermarket: 2 } as const;

    if (editId) {
      await categoriesApi.update(
        editId,
        { name: form.name, description: form.description, type: typeMap[form.type] },
        token()
      );
    } else {
      await categoriesApi.create(
        { name: form.name, description: form.description, type: typeMap[form.type] },
        token()
      );
    }
    setModalOpen(false);
    fetchData();
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await categoriesApi.delete(deleteTarget.id, token());
      setDeleteTarget(null);
      fetchData();
    } finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader title="Categories" subtitle="Organise drugs, lab tests, and products by category" onAdd={openCreate} addLabel="Add Category" />

      {/* Type tabs */}
      <div className="flex gap-2 mb-6">
        {(['Drug', 'Lab', 'Supermarket'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === t ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            style={typeFilter === t ? { background: '#25D366' } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <AdminTable
          columns={['Name', 'Type', 'Description']}
          rows={categories.map((c) => [
            c.name,
            <span key="t" className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeColors[c.type] ?? ''}`}>{c.type}</span>,
            c.description ?? '-',
          ])}
          onEdit={(i) => openEdit(i)}
          onDelete={(i) => setDeleteTarget(categories[i])}
        />
      )}

      <Modal open={modalOpen} title={editId ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)} onSubmit={handleSave} loading={saving}>
        {!editId && (
          <Field label="Type" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'Drug' | 'Lab' | 'Supermarket' })}>
              <option value="Drug">Drug</option>
              <option value="Lab">Lab</option>
              <option value="Supermarket">Supermarket</option>
            </Select>
          </Field>
        )}
        <Field label="Category Name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Antibiotics, Blood Tests" />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} />
        </Field>
      </Modal>

      <DeleteConfirm open={!!deleteTarget} label={deleteTarget?.name ?? ''} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} loading={saving} />
    </div>
  );
}
