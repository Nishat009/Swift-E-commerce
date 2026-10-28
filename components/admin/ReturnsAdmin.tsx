'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Order } from '@/types';
import Input from '@/components/ui/Input';
import { Search, XCircle, RotateCcw, Banknote, CheckCircle2 } from 'lucide-react';
import OrderDetailModal from './OrderDetailModal';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { useAuditTrail } from './AuditTrailModal';

type View = 'cancelled' | 'returns' | 'refunds';

// Return requests waiting on staff (an offer the customer has not answered yet waits on them)
const RETURN_OPEN = ['Requested', 'Proposed', 'Accepted', 'Declined'];
const RETURN_LABELS: Record<string, string> = {
  Requested: 'Return requested',
  Proposed: 'Refund offered',
  Accepted: 'Offer accepted: pay refund',
  Declined: 'Offer declined',
  Approved: 'Refunded',
  Rejected: 'Rejected',
};

// Sub-filters for each view: [id, label, test]
const FILTERS: Record<View, [string, string, (o: Order) => boolean][]> = {
  cancelled: [
    ['all', 'All', () => true],
    ['refund', 'Refund needed', (o) => o.paymentStatus === 'Refund Needed'],
    ['refunded', 'Refunded', (o) => o.paymentStatus === 'Refunded'],
    ['unpaid', 'Nothing to refund', (o) => !['Refund Needed', 'Refunded'].includes(o.paymentStatus || '')],
  ],
  returns: [
    ['all', 'All', () => true],
    ['open', 'Open', (o) => RETURN_OPEN.includes(o.returnRequest?.status || '')],
    ['approved', 'Approved', (o) => o.returnRequest?.status === 'Approved' || o.orderStatus === 'Returned'],
    ['rejected', 'Rejected', (o) => o.returnRequest?.status === 'Rejected'],
  ],
  refunds: [
    ['all', 'All', () => true],
    ['pending', 'Waiting for refund', (o) => o.paymentStatus === 'Refund Needed' || o.returnRequest?.status === 'Accepted'],
    ['done', 'Refunded', (o) => o.paymentStatus === 'Refunded'],
  ],
};

const IN_VIEW: Record<View, (o: Order) => boolean> = {
  cancelled: (o) => o.orderStatus === 'Cancelled',
  returns: (o) => Boolean(o.returnRequest?.status) || o.orderStatus === 'Returned',
  refunds: (o) => ['Refund Needed', 'Refunded'].includes(o.paymentStatus || '') || o.returnRequest?.status === 'Accepted' || Boolean(o.refund?.amount),
};

const money = (n?: number) => `$${(Number(n) || 0).toFixed(2)}`;
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '-');

/** Cancelled orders, return requests and refunds in one place, each opening the order to act on it. */
export default function ReturnsAdmin() {
  const { open: fetchAuditTrail, modal: auditTrailModal } = useAuditTrail();
  const [orders, setOrders] = useState<Order[]>([]);
  const [canOverrideStatus, setCanOverrideStatus] = useState(false);
  const [view, setView] = useState<View>('returns');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/orders/admin/all?limit=500');
    if (res.data?.success) {
      setOrders(res.data.data);
      setCanOverrideStatus(Boolean(res.data.canOverrideStatus));
    }
  });

  const cancelled = orders.filter(IN_VIEW.cancelled);
  const returns = orders.filter(IN_VIEW.returns);
  const refunds = orders.filter(IN_VIEW.refunds);
  const openReturns = returns.filter((o) => RETURN_OPEN.includes(o.returnRequest?.status || '')).length;
  const refundsWaiting = refunds.filter(FILTERS.refunds[1][2]);
  const refundedTotal = orders.reduce((sum, o) => sum + (o.paymentStatus === 'Refunded' ? Number(o.refund?.amount) || 0 : 0), 0);

  const q = search.trim().toLowerCase();
  const filterTest = (FILTERS[view].find(([id]) => id === filter) || FILTERS[view][0])[2];
  const rows = orders
    .filter(IN_VIEW[view])
    .filter(filterTest)
    .filter((o) =>
      !q ||
      (o.orderNumber || o.id).toLowerCase().includes(q) ||
      ((o.user as any)?.name || '').toLowerCase().includes(q) ||
      ((o.user as any)?.email || '').toLowerCase().includes(q))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  const tabs: { id: View; label: string; count: number; icon: typeof XCircle }[] = [
    { id: 'cancelled', label: 'Cancelled orders', count: cancelled.length, icon: XCircle },
    { id: 'returns', label: 'Returns', count: returns.length, icon: RotateCcw },
    { id: 'refunds', label: 'Refunds', count: refunds.length, icon: Banknote },
  ];

  const switchView = (next: View) => {
    setView(next);
    setFilter('all');
  };

  if (loading) return <SectionLoading />;

  return (
    <>
      <div className="space-y-5">
        <div className="border-b pb-3.5 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Cancellations, Returns & Refunds</h2>
          <p className="text-xs text-gray-500 mt-1">Open an order to send a refund offer, pay an accepted return, reject a request or record a refund.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Cancelled orders', value: cancelled.length, tone: 'text-red-600' },
            { label: 'Open return requests', value: openReturns, tone: 'text-amber-600' },
            { label: 'Waiting for refund', value: refundsWaiting.length, tone: 'text-orange-600' },
            { label: 'Total refunded', value: money(refundedTotal), tone: 'text-green-700' },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">{card.label}</span>
              <span className={`block mt-1 text-xl font-black ${card.tone}`}>{card.value}</span>
            </div>
          ))}
        </div>

        {!canOverrideStatus && refundsWaiting.length > 0 && (
          <p className="rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40 px-4 py-2.5 text-xs text-orange-800 dark:text-orange-300">
            Only a super admin can pay out refunds (the shared demo admin can review but not pay).
          </p>
        )}

        {/* View tabs */}
        <div className="flex flex-wrap gap-2" role="tablist">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => switchView(id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
                view === id
                  ? 'border-[#8b6f47] bg-[#8b6f47] text-white'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-[#8b6f47]/50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
              <span className={`rounded-full px-1.5 text-[10px] ${view === id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>{count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS[view].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                  filter === id ? 'border-[#8b6f47] text-[#8b6f47] bg-[#8b6f47]/10' : 'border-gray-200 dark:border-gray-800 text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative md:ml-auto md:w-72">
            <Input
              type="text"
              placeholder="Search order, customer or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto border rounded-2xl dark:border-gray-800 max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">{view === 'returns' ? 'Reason' : 'Order total'}</th>
                <th className="p-3">{view === 'cancelled' ? 'Cancelled' : view === 'returns' ? 'Requested' : 'Refund'}</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  Nothing here right now.
                </td></tr>
              )}
              {rows.map((o) => {
                const rr = o.returnRequest;
                return (
                  <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 align-top">
                    <td className="p-3">
                      <button onClick={() => setSelectedOrder(o)} className="font-mono text-[10px] font-bold text-[#8b6f47] hover:underline">
                        {o.orderNumber || o.id}
                      </button>
                      <span className="block text-[9px] text-gray-400">Placed {day(o.createdAt)} · {o.paymentMethod?.toUpperCase()}</span>
                    </td>
                    <td className="p-3">
                      <span className="block font-bold text-gray-800 dark:text-gray-200">{(o.user as any)?.name || 'Deleted user'}</span>
                      <span className="block text-[10px] text-gray-400">{(o.user as any)?.email}</span>
                    </td>
                    <td className="p-3 text-xs">
                      {view === 'returns' ? (
                        <>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">{rr?.reason || '-'}</span>
                          {rr?.details && <span className="block text-[10px] text-gray-400 line-clamp-2">{rr.details}</span>}
                        </>
                      ) : (
                        <span className="font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">{money(o.total)}</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-600 dark:text-gray-300">
                      {view === 'cancelled' && day(o.updatedAt)}
                      {view === 'returns' && (
                        <>
                          {day(rr?.requestedAt)}
                          {rr?.proposal?.amount !== undefined && <span className="block text-[10px] text-gray-400">Offer {money(rr.proposal.amount)}</span>}
                        </>
                      )}
                      {view === 'refunds' && (
                        o.refund?.amount
                          ? <><span className="font-bold">{money(o.refund.amount)}</span><span className="block text-[10px] text-gray-400">{day(o.refund.at)}{o.refund.byName ? ` by ${o.refund.byName}` : ''}</span></>
                          : <span className="text-gray-400">{rr?.proposal?.amount !== undefined ? `Due ${money(rr.proposal.amount)}` : `Due ${money(o.total)}`}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : o.orderStatus === 'Returned' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>{o.orderStatus}</span>
                      {rr?.status && (
                        <span className={`block mt-1 w-fit px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          rr.status === 'Approved' ? 'bg-green-100 text-green-700' : rr.status === 'Rejected' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'
                        }`}>{RETURN_LABELS[rr.status] || rr.status}</span>
                      )}
                      <span className={`block mt-1 w-fit px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        o.paymentStatus === 'Refund Needed' ? 'bg-orange-100 text-orange-700' : o.paymentStatus === 'Refunded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>Payment: {o.paymentStatus || 'Pending'}</span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-[10px] font-bold border border-[#8b6f47]/40 text-[#8b6f47] rounded-lg px-3 py-1.5 hover:bg-[#8b6f47]/10 whitespace-nowrap"
                      >
                        {RETURN_OPEN.includes(rr?.status || '') ? 'Review return' : o.paymentStatus === 'Refund Needed' ? 'Record refund' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          canOverrideStatus={canOverrideStatus}
          onClose={() => setSelectedOrder(null)}
          onUpdated={(updated) => {
            setSelectedOrder(updated);
            setOrders((prev) => prev.map((o) => (o.id === updated.id
              ? { ...o, orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus, refund: updated.refund, returnRequest: updated.returnRequest, deliveredAt: updated.deliveredAt, updatedAt: updated.updatedAt }
              : o)));
          }}
          onViewAudit={(id) => fetchAuditTrail('Order', id)}
        />
      )}

      {auditTrailModal}
    </>
  );
}
