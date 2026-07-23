'use client';

import { useEffect, useState, useCallback } from 'react';
import { shippingApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { ShippingRate } from '@/types';
import {
  AdminHeader, AdminSearch, AdminTable, Modal, Field,
  Input, Textarea, DeleteConfirm, Toggle,
} from '@/components/admin';

const emptyForm = {
  name: '',
  locations: '',
  price: 0,
  isActive: true,
};

export default function AdminShippingPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [deleteTarget, setDeleteTarget] = useState<ShippingRate | null>(null);

  const token = () => getToken() ?? '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // GET /api/ShippingRate/all — no pagination on this endpoint, returns everything
      const res = (await shippingApi.getAll()) as { success: boolean; data: ShippingRate[] };
      if (res.success) setRates(res.data);
    } catch (error) {
      console.error('Failed to fetch shipping rates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (i: number) => {
    const r = filtered[i];
    setEditId(r.id);
    setForm({
      name: r.name,
      locations: r.locations,
      price: r.price,
      isActive: r.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Rate name is required');
      return;
    }
    if (!form.locations.trim()) {
      alert('Locations are required (e.g. Lagos, Ikeja, Lekki)');
      return;
    }
    if (!form.price || form.price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        // PUT /api/ShippingRate — id goes in the body per UpdateShippingRateDto
        await shippingApi.update(
          {
            id: editId,
            name: form.name,
            locations: form.locations,
            price: Number(form.price),
            isActive: form.isActive,
          },
          token()
        );
      } else {
        await shippingApi.create(
          {
            name: form.name,
            locations: form.locations,
            price: Number(form.price),
          },
          token()
        );
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save shipping rate:', error);
      alert('Failed to save shipping rate. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await shippingApi.delete(deleteTarget.id, token());
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete shipping rate:', error);
      alert('Failed to delete shipping rate. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Quick active/inactive toggle straight from the table
  const handleQuickActiveToggle = async (rate: ShippingRate) => {
    try {
      await shippingApi.update(
        {
          id: rate.id,
          name: rate.name,
          locations: rate.locations,
          price: rate.price,
          isActive: !rate.isActive,
        },
        token()
      );
      fetchData();
    } catch (error) {
      console.error('Failed to toggle shipping rate:', error);
    }
  };

  const filtered = rates.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.locations.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AdminHeader
        title="Shipping Rates"
        subtitle={`${rates.length} rate${rates.length !== 1 ? 's' : ''}`}
        onAdd={openCreate}
        addLabel="Add Rate"
      />
      <AdminSearch value={search} onChange={setSearch} placeholder="Search by name or location..." />

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <AdminTable
          columns={['Name', 'Locations', 'Price', 'Active']}
          rows={filtered.map((r) => [
            r.name,
            <span key="loc" className="text-sm text-gray-600">{r.locations}</span>,
            `₦${r.price.toLocaleString()}`,
            <Toggle
              key="active"
              checked={r.isActive}
              onChange={() => handleQuickActiveToggle(r)}
            />,
          ])}
          onEdit={(i) => openEdit(i)}
          onDelete={(i) => setDeleteTarget(filtered[i])}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        title={editId ? 'Edit Shipping Rate' : 'Add Shipping Rate'}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        loading={saving}
      >
        <Field label="Rate Name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Lagos Mainland"
          />
        </Field>

        <Field label="Locations" required hint="Comma-separated areas this rate covers">
          <Textarea
            value={form.locations}
            onChange={(e) => setForm({ ...form, locations: e.target.value })}
            placeholder="e.g. Ikeja, Yaba, Surulere"
            rows={3}
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
            onWheel={(e) => e.currentTarget.blur()}
            min={0}
            step="0.01"
            placeholder="0.00"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </Field>

        {/* isActive only applies on edit — new rates default to active on the backend */}
        {editId && (
          <Toggle
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
            label="Active"
          />
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