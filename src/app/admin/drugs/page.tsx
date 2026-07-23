'use client';

import { useEffect, useState, useCallback } from 'react';
import { drugsApi, categoriesApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Drug, Category, ApiResponse, PagedResult } from '@/types';
import {
  AdminHeader, AdminSearch, AdminTable, Modal, Field,
  Input, Textarea, Select, StatusBadge, DeleteConfirm, Toggle, ImageUploadZone,
} from '@/components/admin';
import Image from 'next/image';

// Map availability strings to numbers (as backend expects)
const availabilityMap = {
  'Available': 0,
  'OutOfStock': 1,
  'Discontinued': 2
};

const reverseAvailabilityMap = {
  0: 'Available',
  1: 'OutOfStock',
  2: 'Discontinued'
};

const emptyForm = {
  name: '', 
  categoryId: 0, 
  description: '', 
  unit: '', 
  price: 0,
  requiresPrescription: false, 
  availability: 'Available',
  isSpotlight: false,
};

export default function AdminDrugsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<Drug | null>(null);
  const [imgDrug, setImgDrug] = useState<Drug | null>(null);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const token = () => getToken() ?? '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await drugsApi.getAll(page, pageSize, undefined, search)) as ApiResponse<PagedResult<Drug>>;
      if (res.success) { 
        setDrugs(res.data.items); 
        setTotalCount(res.data.total); 
      }
    } catch (error) {
      console.error('Failed to fetch drugs:', error);
    } finally { 
      setLoading(false); 
    }
  }, [page, search]);

  useEffect(() => {
    categoriesApi.getAll('Drug').then((res) => { 
      const r = res as ApiResponse<Category[]>;
      if (r.success) setCategories(r.data);
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
      availability: 'Available'
    });
    setModalOpen(true);
  };

  const openEdit = (i: number) => {
    const d = drugs[i];
    setEditId(d.id);
    setForm({
      name: d.name, 
      categoryId: d.categoryId, 
      description: d.description ?? '',
      unit: d.unit, 
      price: d.price, 
      requiresPrescription: d.requiresPrescription,
      availability: d.availability, // Already a string from API
      isSpotlight: d.isSpotlight,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    // Validate form
    if (!form.name.trim()) {
      alert('Drug name is required');
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
    if (!form.unit.trim()) {
      alert('Unit is required');
      return;
    }

    setSaving(true);
    try {
      // Convert availability to number for backend
      const availabilityNumber = availabilityMap[form.availability as keyof typeof availabilityMap] ?? 0;
      
      const payload = { 
        name: form.name,
        categoryId: Number(form.categoryId), 
        description: form.description,
        unit: form.unit,
        price: Number(form.price),
        requiresPrescription: form.requiresPrescription,
        availability: availabilityNumber, // Send as number
        isSpotlight: form.isSpotlight,
      };
      
      if (editId) {
        await drugsApi.update(editId, payload, token());
      } else {
        await drugsApi.create(payload, token());
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save drug:', error);
      alert('Failed to save drug. Please try again.');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await drugsApi.delete(deleteTarget.id, token());
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete drug:', error);
      alert('Failed to delete drug. Please try again.');
    } finally { 
      setSaving(false); 
    }
  };

  const handleUploadImages = async () => {
    if (!imgDrug || imgFiles.length === 0) return;
    const fd = new FormData();
    imgFiles.forEach((f) => fd.append('files', f));
    await drugsApi.uploadImages(imgDrug.id, fd, token());
    setImgDrug(null);
    setImgFiles([]);
    fetchData();
  };

  const handleDeleteImage = async (drug: Drug, publicId: string) => {
    await drugsApi.deleteImage(drug.id, publicId, token());
    fetchData();
  };

  const filtered = drugs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <AdminHeader title="Drugs" subtitle={`${totalCount} drugs in pharmacy stock`} onAdd={openCreate} addLabel="Add Drug" />
      <AdminSearch value={search} onChange={setSearch} placeholder="Search drugs..." />

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <AdminTable
          columns={['Name', 'Category', 'Price', 'Unit', 'Availability', 'Rx', 'Spotlight', 'Images']}
          rows={filtered.map((d) => [
            d.name,
            d.categoryName ?? '-',
            `₦${d.price.toLocaleString()}`,
            d.unit,
            <StatusBadge key="s" status={d.availability} />,
            d.requiresPrescription ? '✓' : '-',
            d.isSpotlight ? '⭐' : '-',
            <button
              key="img"
              onClick={() => { setImgDrug(d); setImgFiles([]); }}
              className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
            >
              {d.images?.length ?? 0} img
            </button>,
          ])}
          onEdit={(i) => openEdit(i)}
          onDelete={(i) => setDeleteTarget(drugs[i])}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} title={editId ? 'Edit Drug' : 'Add Drug'} onClose={() => setModalOpen(false)} onSubmit={handleSave} loading={saving}>
        <Field label="Name" required>
          <Input 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            placeholder="Drug name" 
          />
        </Field>
        
            <Field label="Category" required>
        <Select 
          value={form.categoryId?.toString() || ''} 
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setForm({ ...form, categoryId: isNaN(val) ? 0 : val });
          }}
        >
          {/* REMOVED the "Select category..." option */}
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
        
        <Field label="Description">
          <Textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Optional description" 
            rows={3}
          />
        </Field>
        
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit" required>
            <Input 
              value={form.unit} 
              onChange={(e) => setForm({ ...form, unit: e.target.value })} 
              placeholder="e.g. 30 tablets" 
            />
          </Field>
          <Field label="Price (₦)" required>
            <Input 
              type="number" 
              value={form.price === 0 ? '' : form.price} 
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setForm({ ...form, price: isNaN(val) ? 0 : val });
              }} 
              onWheel={(e) => {
                e.currentTarget.blur();
              }}
              min={0} 
              step="0.01"
              placeholder="0.00"
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </Field>
        </div>
        
        <Field label="Availability">
          <Select 
            value={form.availability} 
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
          >
            <option value="Available">Available</option>
            <option value="OutOfStock">Out of Stock</option>
            <option value="Discontinued">Discontinued</option>
          </Select>
        </Field>
        
        <Toggle 
          checked={form.requiresPrescription} 
          onChange={(v) => setForm({ ...form, requiresPrescription: v })} 
          label="Requires prescription" 
        />

        <Toggle 
          checked={form.isSpotlight} 
          onChange={(v) => setForm({ ...form, isSpotlight: v })} 
          label="Spotlight" 
        />
      </Modal>

      {/* Image Manager Modal */}
      <Modal open={!!imgDrug} title={`Images — ${imgDrug?.name}`} onClose={() => setImgDrug(null)} onSubmit={handleUploadImages} submitLabel="Upload">
        {imgDrug?.images?.length ? (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {imgDrug.images.map((img, i) => (
              <div key={i} className="relative group">
                <div className="relative h-20 rounded-lg overflow-hidden">
                  <Image src={img.url} alt={`img-${i}`} fill className="object-cover" />
                </div>
                <button
                  onClick={() => handleDeleteImage(imgDrug, img.publicId)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 mb-4">No images yet.</p>}
        <ImageUploadZone onChange={setImgFiles} />
        {imgFiles.length > 0 && (
          <p className="text-xs text-green-600 mt-2">{imgFiles.length} file(s) selected, ready to upload</p>
        )}
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