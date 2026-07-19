'use client';

import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { ApiResponse, Order, OrderStatus, PagedResult } from '@/types';
import { AdminTable, Modal } from '@/components/admin';
import { EmptyState, Pagination, Spinner } from '@/components/ui';
import clsx from 'clsx';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Delivered',
  'Cancelled',
];

const statusColors: Record<OrderStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Processing: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const pageSize = 15;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = (await ordersApi.getAll(
        page,
        pageSize,
        statusFilter || undefined,
        typeFilter || undefined,
        token
      )) as ApiResponse<PagedResult<Order>>;
      if (res.success && res.data) {
        setOrders(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: number, status: OrderStatus) => {
    setUpdating(true);
    try {
      const token = getToken();
      if (!token) return;
      await ordersApi.updateStatus(orderId, { status }, token);
      setSelected(null);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage customer orders from pharmacy and supermarket.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">All Types</option>
          <option value="Drug">Pharmacy</option>
          <option value="Supermarket">Supermarket</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found." />
      ) : (
        <>
          <AdminTable
            columns={['Order #', 'Type', 'Customer', 'Total', 'Status', 'Date', '']}
            rows={orders.map((o) => [
              <span key="num" className="font-mono text-xs font-medium">{o.orderNumber}</span>,
              <span key="type" className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.orderType}</span>,
              <div key="cust">
                <p className="font-medium text-gray-900">{o.customerName}</p>
                <p className="text-xs text-gray-400">{o.customerPhone}</p>
              </div>,
              <span key="total" className="font-semibold">₦{o.totalAmount.toLocaleString()}</span>,
              <span key="status" className={clsx('text-xs px-2 py-1 rounded-full font-medium', statusColors[o.status])}>
                {o.status}
              </span>,
              <span key="date" className="text-xs text-gray-500">
                {new Date(o.createdAt).toLocaleDateString()}
              </span>,
              <button
                key="view"
                onClick={() => setSelected(o)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                View
              </button>,
            ])}
          />
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          )}
        </>
      )}

      <Modal
        open={!!selected}
        title={selected ? `Order ${selected.orderNumber}` : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Customer</p>
                <p className="font-medium">{selected.customerName}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="font-medium">{selected.customerPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400">Address</p>
                <p className="font-medium">{selected.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment</p>
                <p className="font-medium">{selected.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-400">Total</p>
                <p className="font-bold text-lg">₦{selected.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                {selected.items.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex justify-between text-sm">
                    <span>{item.itemName} × {item.quantity}</span>
                    <span className="font-medium">₦{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    disabled={updating || selected.status === status}
                    onClick={() => handleStatusUpdate(selected.id, status)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      selected.status === status
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
