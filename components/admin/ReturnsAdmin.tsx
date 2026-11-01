'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Order } from '@/types';
import { CheckCircle2 } from 'lucide-react';
import OrderDetailModal from './OrderDetailModal';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { useAuditTrail } from './AuditTrailModal';
import { AdminButton, AdminEmpty, FilterTabs, Pill, SearchField, StatusPill, table } from './AdminUI';

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
const RETURN_TONES: Record<string, 'success' | 'neutral' | 'info' | 'warning'> = { Approved: 'success', Rejected: 'neutral', Proposed: 'info' };

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

  const tabs: { value: View; label: string; count: number }[] = [
    { value: 'cancelled', label: 'Cancelled orders', count: cancelled.length },
    { value: 'returns', label: 'Returns', count: returns.length },
    { value: 'refunds', label: 'Refunds', count: refunds.length },
  ];

  const switchView = (next: View) => {
    setView(next);
    setFilter('all');
  };

  if (loading) return <SectionLoading />;

  const moneyColumn = view !== 'returns';

  return (
    <>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Cancelled orders', value: cancelled.length },
            { label: 'Open return requests', value: openReturns },
            { label: 'Waiting for refund', value: refundsWaiting.length },
            { label: 'Total refunded', value: money(refundedTotal) },
          ].map((card) => (
            <div key={card.label} className="rounded-lg border border-line p-4">
              <span className="block text-[13px] font-medium text-stone-500 dark:text-stone-400">{card.label}</span>
              <span className="mt-2 block text-xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white">{card.value}</span>
            </div>
          ))}
        </div>

        {!canOverrideStatus && refundsWaiting.length > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            Only a super admin can pay out refunds (the shared demo admin can review but not pay).
          </p>
        )}

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs options={tabs} value={view} onChange={switchView} />
            <SearchField value={search} onChange={setSearch} placeholder="Search by order, customer or email" className="w-full lg:w-80" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter">
            {FILTERS[view].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  filter === id
                    ? 'border-[#8b6f47]/50 bg-[#8b6f47]/15 text-[#5c4729] dark:border-[#c9a96b]/50 dark:bg-[#c9a96b]/15 dark:text-[#e0c690]'
                    : 'border-line text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${table.wrap} max-h-[640px] overflow-y-auto`}>
          <table className={table.table}>
            <thead className={`${table.thead} sticky top-0 z-10`}>
              <tr>
                <th className={table.th}>Order</th>
                <th className={table.th}>Customer</th>
                <th className={`${table.th} ${moneyColumn ? 'text-right' : ''}`}>{view === 'returns' ? 'Reason' : 'Order total'}</th>
                <th className={`${table.th} ${view === 'refunds' ? 'text-right' : ''}`}>{view === 'cancelled' ? 'Cancelled' : view === 'returns' ? 'Requested' : 'Refund'}</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>Payment</th>
                <th className={table.th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <AdminEmpty icon={CheckCircle2} title="Nothing here right now" description={q || filter !== 'all' ? 'Try a different search or filter.' : undefined} />
                  </td>
                </tr>
              )}
              {rows.map((o) => {
                const rr = o.returnRequest;
                const needsAction = RETURN_OPEN.includes(rr?.status || '') || o.paymentStatus === 'Refund Needed';
                return (
                  <tr key={o.id} className={`${table.tr} align-top`}>
                    <td className={table.td}>
                      <button onClick={() => setSelectedOrder(o)} className="block whitespace-nowrap text-left font-mono text-xs font-medium text-stone-900 hover:text-[#8b6f47] hover:underline dark:text-stone-100 dark:hover:text-[#c9a96b] cursor-pointer" title="View order details">
                        {o.orderNumber || o.id}
                      </button>
                      <span className="block whitespace-nowrap text-[11px] text-stone-400">Placed {day(o.createdAt)} · {o.paymentMethod?.toUpperCase()}</span>
                    </td>
                    <td className={table.td}>
                      <span className="block font-medium text-stone-800 dark:text-stone-200">{(o.user as any)?.name || 'Deleted user'}</span>
                      <span className="block text-xs text-stone-400">{(o.user as any)?.email}</span>
                    </td>
                    <td className={`${table.td} ${moneyColumn ? 'text-right' : ''}`}>
                      {view === 'returns' ? (
                        <div className="max-w-[240px]">
                          <span className="font-medium text-stone-700 dark:text-stone-200">{rr?.reason || '-'}</span>
                          {rr?.details && <span className="block text-xs text-stone-400 line-clamp-2">{rr.details}</span>}
                        </div>
                      ) : (
                        <span className="font-medium tabular-nums text-stone-900 dark:text-white">{money(o.total)}</span>
                      )}
                    </td>
                    <td className={`${table.td} whitespace-nowrap text-stone-600 dark:text-stone-300 ${view === 'refunds' ? 'text-right' : ''}`}>
                      {view === 'cancelled' && <span className="text-xs">{day(o.updatedAt)}</span>}
                      {view === 'returns' && (
                        <>
                          <span className="text-xs">{day(rr?.requestedAt)}</span>
                          {rr?.proposal?.amount !== undefined && <span className="block text-xs tabular-nums text-stone-400">Offer {money(rr.proposal.amount)}</span>}
                        </>
                      )}
                      {view === 'refunds' && (
                        o.refund?.amount
                          ? <><span className="font-medium tabular-nums text-stone-900 dark:text-white">{money(o.refund.amount)}</span><span className="block text-xs text-stone-400">{day(o.refund.at)}{o.refund.byName ? ` by ${o.refund.byName}` : ''}</span></>
                          : <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">{rr?.proposal?.amount !== undefined ? `Due ${money(rr.proposal.amount)}` : `Due ${money(o.total)}`}</span>
                      )}
                    </td>
                    <td className={table.td}>
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill status={o.orderStatus} />
                        {rr?.status && <Pill tone={RETURN_TONES[rr.status] || 'warning'}>{RETURN_LABELS[rr.status] || rr.status}</Pill>}
                      </div>
                    </td>
                    <td className={table.td}><StatusPill kind="payment" status={o.paymentStatus} /></td>
                    <td className={`${table.td} text-right`}>
                      <AdminButton size="sm" variant={needsAction ? 'primary' : 'secondary'} onClick={() => setSelectedOrder(o)}>
                        {RETURN_OPEN.includes(rr?.status || '') ? 'Review return' : o.paymentStatus === 'Refund Needed' ? 'Record refund' : 'View'}
                      </AdminButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500">
          Showing {rows.length} {rows.length === 1 ? 'order' : 'orders'}. Open an order to send a refund offer, pay an accepted return, reject a request or record a refund.
        </p>
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
