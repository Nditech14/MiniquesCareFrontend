'use client';

import { useEffect, useState } from 'react';
import { discountsApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Discount, ApiResponse } from '@/types';
import {
  AdminHeader, AdminTable, Modal, Field,
  Input, Select, DeleteConfirm,
} from '@/components/admin';

const emptyForm = {
  name: '',
  type: 'Percentage' as 'FlatRate' | 'Percentage',
  value: '',
  minimumOrderAmount: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

function toDateTimeLocal(iso: string) {
  // "2026-07-22T23:59:59Z" -> "2026-07-22T23:59" for <input type="datetime-local">
  return iso ? iso.slice(0, 16) : '';
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);

  const token = () => getToken() ?? '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = (await discountsApi.getAll()) as ApiResponse<Discount[]>;
      if (res.success) setDiscounts(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (i: number) => {
    const d = discounts[i];
    setEditId(d.id);
    setForm({
      name: d.name,
      type: d.type,
      value: String(d.value),
      minimumOrderAmount: d.minimumOrderAmount != null ? String(d.minimumOrderAmount) : '',
      startDate: toDateTimeLocal(d.startDate),
      endDate: toDateTimeLocal(d.endDate),
      isActive: d.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        value: Number(form.value),
        minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : null,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
      };

      if (editId) {
        await discountsApi.update(editId, payload, token());
      } else {
        await discountsApi.create(payload, token());
      }
      setModalOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (d: Discount) => {
    setSaving(true);
    try {
      await discountsApi.toggle(d.id, !d.isActive, token());
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await discountsApi.delete(deleteTarget.id, token());
      setDeleteTarget(null);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const isExpired = (d: Discount) => new Date(d.endDate) < new Date();

  return (
    <div>
      <AdminHeader
        title="Discounts"
        subtitle="Automatic discounts applied at checkout — no coupon codes"
        onAdd={openCreate}
        addLabel="Add Discount"
      />

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <AdminTable
          columns={['Name', 'Type', 'Value', 'Min. Order', 'Window', 'Status']}
          rows={discounts.map((d) => [
            d.name,
            d.type,
            d.type === 'Percentage' ? `${d.value}%` : `₦${d.value.toLocaleString()}`,
            d.minimumOrderAmount != null ? `₦${d.minimumOrderAmount.toLocaleString()}` : '—',
            `${new Date(d.startDate).toLocaleDateString()} – ${new Date(d.endDate).toLocaleDateString()}`,
            <button
              key="status"
              onClick={() => handleToggle(d)}
              disabled={saving}
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                d.isActive && !isExpired(d)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isExpired(d) ? 'Expired' : d.isActive ? 'Active' : 'Inactive'}
            </button>,
          ])}
          onEdit={(i) => openEdit(i)}
          onDelete={(i) => setDeleteTarget(discounts[i])}
        />
      )}

      <Modal
        open={modalOpen}
        title={editId ? 'Edit Discount' : 'Add Discount'}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        loading={saving}
      >
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Reward, Ramadan Sale"
          />
        </Field>

        <Field label="Type" required>
          <Select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'FlatRate' | 'Percentage' })}
          >
            <option value="Percentage">Percentage</option>
            <option value="FlatRate">Flat Rate</option>
          </Select>
        </Field>

        <Field label={form.type === 'Percentage' ? 'Percentage Off (%)' : 'Amount Off (₦)'} required>
          <Input
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder={form.type === 'Percentage' ? 'e.g. 10' : 'e.g. 5000'}
          />
        </Field>

        <Field label="Minimum Order Amount (₦)">
          <Input
            type="number"
            value={form.minimumOrderAmount}
            onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })}
            placeholder="Leave blank for no minimum"
          />
        </Field>

        <Field label="Start Date" required>
          <Input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </Field>

        <Field label="End Date" required>
          <Input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </Field>

        <Field label="Active">
          <Select
            value={form.isActive ? 'true' : 'false'}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
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