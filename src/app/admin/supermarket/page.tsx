'use client';

import { useEffect, useState, useCallback } from 'react';
import { supermarketApi, categoriesApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { SupermarketProduct, Category, ApiResponse, PagedResult } from '@/types';
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
  categoryId: 0, 
  name: '', 
  brand: '', 
  description: '', 
  unit: '',
  price: 0, 
  availability: 0,
  isSpotlight: false,
};

export default function AdminSupermarketPage() {
  const [products, setProducts] = useState<SupermarketProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<SupermarketProduct | null>(null);
  const [imgProduct, setImgProduct] = useState<SupermarketProduct | null>(null);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const token = () => getToken() ?? '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await supermarketApi.getAll(page, pageSize, undefined, search)) as ApiResponse<PagedResult<SupermarketProduct>>;
      if (res.success) { 
        setProducts(res.data.items); 
        setTotalCount(res.data.total); 
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally { 
      setLoading(false); 
    }
  }, [page, search]);

  useEffect(() => {
    categoriesApi.getAll('Supermarket').then((res) => { 
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
      availability: 0
    });
    setModalOpen(true);
  };

  const openEdit = (i: number) => {
    const p = products[i];
    setEditId(p.id);
    
    // Convert availability string to number
    const availabilityNumber = p.availability === 'Available' ? 0 : 
                              p.availability === 'OutOfStock' ? 1 : 2;
    
    setForm({
      categoryId: p.categoryId, // This should be the category ID from the product
      name: p.name, 
      brand: p.brand ?? '',
      description: p.description ?? '', 
      unit: p.unit ?? '', 
      price: p.price ?? 0,
      availability: availabilityNumber,
      isSpotlight: p.isSpotlight,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    // Validate form
    if (!form.name.trim()) {
      alert('Product name is required');
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
        brand: form.brand,
        description: form.description,
        unit: form.unit,
        price: Number(form.price),
        availability: form.availability,
        isSpotlight: form.isSpotlight,
      };
      
      if (editId) {
        await supermarketApi.update(editId, payload, token());
      } else {
        await supermarketApi.create(payload, token());
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await supermarketApi.delete(deleteTarget.id, token());
      setDeleteTarget(null);
      fetchData();
    } finally { setSaving(false); }
  };

  const handleUploadImages = async () => {
    if (!imgProduct || imgFiles.length === 0) return;
    const fd = new FormData();
    imgFiles.forEach((f) => fd.append('files', f));
    await supermarketApi.uploadImages(imgProduct.id, fd, token());
    setImgProduct(null);
    setImgFiles([]);
    fetchData();
  };

  const handleDeleteImage = async (product: SupermarketProduct, publicId: string) => {
    await supermarketApi.deleteImage(product.id, publicId, token());
    fetchData();
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <AdminHeader title="Supermarket Products" subtitle={`${totalCount} products`} onAdd={openCreate} addLabel="Add Product" />
      <AdminSearch value={search} onChange={setSearch} placeholder="Search products..." />

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <AdminTable
          columns={['Name', 'Brand', 'Category', 'Price', 'Availability', 'Spotlight', 'Images']}
          rows={filtered.map((p) => [
            p.name,
            p.brand ?? '-',
            p.categoryName ?? '-',
            `₦${p.price.toLocaleString()}`,
            <StatusBadge key="s" status={p.availability} />,
            p.isSpotlight ? '⭐' : '-',
            <button key="img" onClick={() => { setImgProduct(p); setImgFiles([]); }} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
              {p.images?.length ?? 0} img
            </button>,
          ])}
          onEdit={(i) => openEdit(i)}
          onDelete={(i) => setDeleteTarget(products[i])}
        />
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}

      <Modal open={modalOpen} title={editId ? 'Edit Product' : 'Add Product'} onClose={() => setModalOpen(false)} onSubmit={handleSave} loading={saving}>
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
          {/* Show message if no categories exist */}
          {categories.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No categories available. Please add categories first.
            </p>
          )}
        </Field>
        
        <Field label="Product Name" required>
          <Input 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            placeholder="Product name" 
          />
        </Field>
        
        <Field label="Brand">
          <Input 
            value={form.brand} 
            onChange={(e) => setForm({ ...form, brand: e.target.value })} 
            placeholder="Brand name" 
          />
        </Field>
        
        <Field label="Description">
          <Textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Product description..." 
            rows={4} 
          />
        </Field>
        
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit" required>
            <Input 
              value={form.unit} 
              onChange={(e) => setForm({ ...form, unit: e.target.value })} 
              placeholder="e.g. 1kg, per piece" 
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
        </div>
        
        <Field label="Availability">
          <Select 
            value={form.availability?.toString() || '0'} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setForm({ ...form, availability: isNaN(val) ? 0 : val });
            }}
          >
            <option value="0">Available</option>
            <option value="1">Out of Stock</option>
            <option value="2">Discontinued</option>
          </Select>
        </Field>

        <Toggle 
          checked={form.isSpotlight} 
          onChange={(v) => setForm({ ...form, isSpotlight: v })} 
          label="Spotlight" 
        />
      </Modal>

      {/* Image Manager */}
      <Modal open={!!imgProduct} title={`Images — ${imgProduct?.name}`} onClose={() => setImgProduct(null)} onSubmit={handleUploadImages} submitLabel="Upload">
        {imgProduct?.images?.length ? (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {imgProduct.images.map((img, i) => (
              <div key={i} className="relative group">
                <div className="relative h-20 rounded-lg overflow-hidden">
                  <Image src={img.url} alt={`img-${i}`} fill className="object-cover" />
                </div>
                <button 
                  onClick={() => handleDeleteImage(imgProduct, img.publicId)} 
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 mb-4">No images yet.</p>}
        <ImageUploadZone onChange={setImgFiles} />
        {imgFiles.length > 0 && <p className="text-xs text-gray-500 mt-2">{imgFiles.length} file(s) selected</p>}
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