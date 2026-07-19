'use client';

import { useEffect, useState, useCallback } from 'react';
import { labApi, categoriesApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { LabTest, Category, ApiResponse, PagedResult } from '@/types';
import {
  AdminHeader, AdminSearch, AdminTable, Modal, Field,
  Input, Textarea, Select, DeleteConfirm,
} from '@/components/admin';

const sampleTypes = {'Blood':0, 'Urine':1, 'Stool':2, 'Swab':3, 'Sputum':4, 'Other':5};

const emptyForm = {
  categoryId: 0, 
  name: '', 
  description: '', 
  preparation: '',
  sampleType: 0, 
  turnaroundTime: '', 
  price: 0,
};

export default function AdminLaboratoryPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<LabTest | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const token = () => getToken() ?? '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await labApi.getAll(page, pageSize, undefined, undefined, search)) as ApiResponse<PagedResult<LabTest>>;
      if (res.success) { 
        setTests(res.data.items); 
        setTotalCount(res.data.totalCount); 
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally { 
      setLoading(false); 
    }
  }, [page, search]);

  useEffect(() => {
    categoriesApi.getAll('Lab').then((res) => { 
      const r = res as ApiResponse<Category[]>;
      if (r.success) {
        setCategories(r.data);
      }
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm({ 
      ...emptyForm, 
      categoryId: categories[0]?.id ?? 0,
      sampleType: 0
    });
    setModalOpen(true);
  };

  const openEdit = (i: number) => {
    const t = tests[i];
    setEditId(t.id);
    
    // Convert sampleType to number if it's a string
    const sampleTypeNumber = typeof t.sampleType === 'string' 
      ? sampleTypes[t.sampleType as keyof typeof sampleTypes] ?? 0
      : t.sampleType ?? 0;
    
    setForm({
      categoryId: t.categoryId, 
      name: t.name, 
      description: t.description ?? '',
      preparation: t.preparation ?? '', 
      sampleType: sampleTypeNumber,
      turnaroundTime: t.turnaroundTime ?? '',
      price: t.price ?? 0,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    // Validate form
    if (!form.name.trim()) {
      alert('Test name is required');
      return;
    }
    if (!form.categoryId || form.categoryId === 0) {
      alert('Please select a category');
      return;
    }
    if (!form.price || form.price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setSaving(true);
    try {
      const payload = { 
        name: form.name,
        categoryId: Number(form.categoryId), 
        description: form.description,
        preparation: form.preparation,
        sampleType: Number(form.sampleType),
        turnaroundTime: form.turnaroundTime,
        price: Number(form.price),
      };
      
      if (editId) {
        await labApi.update(editId, payload, token());
      } else {
        await labApi.create(payload, token());
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save test:', error);
      alert('Failed to save test. Please try again.');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await labApi.delete(deleteTarget.id, token());
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete test:', error);
      alert('Failed to delete test. Please try again.');
    } finally { 
      setSaving(false); 
    }
  };

  const filtered = tests.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <AdminHeader title="Lab Tests" subtitle={`${totalCount} diagnostic tests`} onAdd={openCreate} addLabel="Add Lab Test" />
      <AdminSearch value={search} onChange={setSearch} placeholder="Search lab tests..." />

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <AdminTable
          columns={['Name', 'Category', 'Sample Type', 'Turnaround', 'Price']}
          rows={filtered.map((t) => [
            t.name,
            t.categoryName ?? '-',
            t.sampleType,
            t.turnaroundTime,
            `₦${t.price.toLocaleString()}`,
          ])}
          onEdit={(i) => openEdit(i)}
          onDelete={(i) => setDeleteTarget(tests[i])}
        />
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}

      <Modal open={modalOpen} title={editId ? 'Edit Lab Test' : 'Add Lab Test'} onClose={() => setModalOpen(false)} onSubmit={handleSave} loading={saving}>
        <Field label="Category" required>
          <Select 
            value={form.categoryId?.toString() || ''} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setForm({ ...form, categoryId: isNaN(val) ? 0 : val });
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          {categories.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No categories available. Please add categories first.
            </p>
          )}
        </Field>
        
        <Field label="Test Name" required>
          <Input 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            placeholder="e.g. Full Blood Count" 
          />
        </Field>
        
        <Field label="Description">
          <Textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Test description..."
            rows={4}
          />
        </Field>
        
        <Field label="Patient Preparation Instructions">
          <Textarea 
            value={form.preparation} 
            onChange={(e) => setForm({ ...form, preparation: e.target.value })} 
            placeholder="e.g. Fast for 8 hours before test"
            rows={3}
          />
        </Field>
        
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sample Type" required>
            <Select 
              value={form.sampleType?.toString() || '0'} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setForm({ ...form, sampleType: isNaN(val) ? 0 : val });
              }}
            >
              {Object.entries(sampleTypes).map(([label, value]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          
          <Field label="Turnaround Time" required>
            <Input 
              value={form.turnaroundTime} 
              onChange={(e) => setForm({ ...form, turnaroundTime: e.target.value })} 
              placeholder="e.g. 24 hours" 
            />
          </Field>
        </div>
        
              <Field label="Price (₦)" required>
          <Input 
            type="number" 
            value={form.price === 0 ? '' : form.price} 
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
              setForm({ ...form, price: isNaN(val) ? 0 : val });
            }} 
            onWheel={(e) => {
              // Prevent scroll from changing the number value
              e.currentTarget.blur();
              // Or use this to completely prevent the scroll event:
              // e.preventDefault();
            }}
            min={0} 
            step="0.01"
            placeholder="0.00"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
       </Field>
      </Modal>

      <DeleteConfirm
        open={!!deleteTarget}
        label={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}