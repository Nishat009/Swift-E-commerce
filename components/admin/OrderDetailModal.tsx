'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { X, ShieldAlert } from 'lucide-react';
import { errMsg } from './adminUtils';

export const ORDER_STATUSES = ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed'];

interface Props {
  order: any;
  onClose: () => void;
  onUpdated: (order: any) => void;
  onViewAudit?: (orderId: string) => void;
}

export default function OrderDetailModal({ order, onClose, onUpdated, onViewAudit }: Props) {
  const toast = useToast();
  const [status, setStatus] = useState<string>(order.orderStatus || 'Pending');
  const [payment, setPayment] = useState<string>(order.paymentStatus || 'Pending');
  const [saving, setSaving] = useState(false);

  const dirty = status !== order.orderStatus || payment !== order.paymentStatus;
  const addr = order.shippingAddress || order.address;

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/orders/${order.id}/status`, { status, paymentStatus: payment });
      const updated = res.data?.data || { ...order, orderStatus: status, paymentStatus: payment };
      // the status endpoint returns the order without populated user/products, so keep those
      onUpdated({ ...order, orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus });
      toast.success('Order updated.');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to update order.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl overflow-y-auto max-h-[90vh] shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Order {order.orderNumber || order.id}</h3>
        <p className="text-xs text-gray-400 mb-4 border-b pb-3">Placed {new Date(order.createdAt).toLocaleString()}</p>

        <div className="grid sm:grid-cols-2 gap-4 text-xs mb-5">
          <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Customer</span>
            <span className="block font-bold text-gray-800 dark:text-gray-200">{order.user?.name || 'Deleted user'}</span>
            <span className="block text-gray-500">{order.user?.email}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ship to</span>
            {addr ? (
              <span className="block text-gray-700 dark:text-gray-300">
                {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
              </span>
            ) : (
              <span className="text-gray-400">No address on record</span>
            )}
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden mb-5">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-2.5">Item</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Price</th>
                <th className="p-2.5 text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(order.products || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      {item.product?.thumbnail && <img src={item.product.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" />}
                      <div>
                        <span className="block font-bold text-gray-800 dark:text-gray-200">{item.product?.title || 'Removed product'}</span>
                        {item.variant?.name && <span className="block text-[10px] text-gray-400">{item.variant.name}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5 text-right">{item.quantity}</td>
                  <td className="p-2.5 text-right">${Number(item.price).toFixed(2)}</td>
                  <td className="p-2.5 text-right font-bold">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 bg-gray-50 dark:bg-gray-950 text-xs space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.subtotal || 0).toFixed(2)}</span></div>
            {order.coupon && <div className="flex justify-between"><span>Coupon</span><span className="font-mono">{order.coupon}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>${Number(order.shipping || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${Number(order.tax || 0).toFixed(2)}</span></div>
            <div className="flex justify-between font-extrabold text-sm text-[#8b6f47] pt-1 border-t"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Payment method</span><span className="uppercase">{order.paymentMethod}</span></div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Order status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5">
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment status</label>
            <select value={payment} onChange={(e) => setPayment(e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5">
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mb-4">
          Cancelling or returning an order puts its items back in stock automatically.
        </p>

        <div className="flex items-center justify-between gap-3">
          {onViewAudit ? (
            <button onClick={() => onViewAudit(order.id)} className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Change history
            </button>
          ) : <span />}
          <Button onClick={save} loading={saving} disabled={!dirty} className="text-sm py-2 px-5 font-bold rounded-xl bg-[#8b6f47] text-white">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
