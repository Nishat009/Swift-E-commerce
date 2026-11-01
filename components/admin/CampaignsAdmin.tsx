'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Plus, ShieldAlert, Edit2, X, Gift, Trophy, ChevronDown, Dices } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { useAuditTrail } from './AuditTrailModal';
import { AdminButton, AdminEmpty, Pill, SearchField, StatCard, table } from './AdminUI';

const labelCls = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const fieldCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100 dark:[color-scheme:dark]';
const textareaCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const iconBtn =
  'inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-stone-100 cursor-pointer';

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-stone-400',
  active: 'bg-emerald-500',
  paused: 'bg-amber-500',
  'sold-out': 'bg-red-500',
  completed: 'bg-sky-500',
  archived: 'bg-stone-300 dark:bg-stone-600',
};

const money = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/** Horizontal bars, one hue: revenue for the top campaigns. */
function CampaignRevenueBars({ rows }: { rows: { campaignTitle: string; revenue: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxRev = rows[0]?.revenue || 1;
  return (
    <div>
      <ul className="space-y-2.5">
        {rows.map((item, idx) => {
          const pct = Math.round((item.revenue / maxRev) * 100);
          return (
            <li
              key={idx}
              tabIndex={0}
              aria-label={`${item.campaignTitle}: ${money(item.revenue)}`}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(idx)}
              onBlur={() => setHover(null)}
              className="relative flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f47]/30"
            >
              <span className="w-32 shrink-0 truncate text-xs text-stone-600 dark:text-stone-300 sm:w-44">{item.campaignTitle}</span>
              <div className="relative h-3 flex-1">
                <div className="absolute inset-y-0 left-0 right-0 border-l border-stone-300 dark:border-white/15" />
                <div
                  className="absolute inset-y-0 left-0 rounded-r-[4px] bg-[#a0702a] transition-opacity dark:bg-[#b8862f]"
                  style={{ width: `${Math.max(pct, item.revenue > 0 ? 1 : 0)}%`, opacity: hover === null || hover === idx ? 1 : 0.55 }}
                />
                {hover === idx && (
                  <div
                    className="pointer-events-none absolute bottom-full z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 shadow-lg"
                    style={{ left: `${Math.min(Math.max(pct, 12), 88)}%` }}
                  >
                    <p className="text-sm font-semibold tabular-nums text-stone-900 dark:text-white">{money(item.revenue)}</p>
                    <p className="max-w-56 truncate text-[11px] text-stone-500">{item.campaignTitle}</p>
                  </div>
                )}
              </div>
              <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-stone-700 dark:text-stone-300">{money(item.revenue)}</span>
            </li>
          );
        })}
      </ul>
      <table className="sr-only">
        <caption>Revenue by campaign</caption>
        <thead><tr><th>Campaign</th><th>Revenue</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}><td>{r.campaignTitle}</td><td>{money(r.revenue)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

/** Lucky-draw campaigns: analytics, create/edit, status and the prize draw. */
export default function CampaignsAdmin() {
  const toast = useToast();
  const { open: fetchAuditTrail, modal: auditTrailModal } = useAuditTrail();
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<any>(null);
  const [campaignSearch, setCampaignSearch] = useState('');

  // Lucky Draw Modals states
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    terms: '',
    bannerImage: '',
    productTitle: '',
    productPrice: 15,
    productDescription: '',
    productImage: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
    prizeName: '',
    prizeDescription: '',
    prizeImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80',
    ticketLimit: 50,
    maxTicketsPerUser: 10,
    ticketsPerPurchase: 1,
    drawDate: '',
    visibility: 'public',
    status: 'active'
  });

  // Lottery Draw states
  const [drawingCampaign, setDrawingCampaign] = useState<any | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnWinner, setDrawnWinner] = useState<any | null>(null);

  const loading = useSectionLoad(async () => {
    const [campRes, analyticsRes] = await Promise.all([
      apiClient.get('/campaigns', { params: { limit: 100 } }),
      apiClient.get('/campaigns/admin/analytics').catch(() => ({ data: { success: false } }))
    ]);
    if (campRes.data?.success) setAllCampaigns(campRes.data.data || []);
    if (analyticsRes.data?.success) setCampaignAnalytics((analyticsRes.data as any).data);
  });

  const handleOpenEditCampaign = (camp: any) => {
    setEditingCampaign(camp);
    setCampaignForm({
      title: camp.title || '',
      description: camp.description || '',
      terms: camp.terms || '',
      bannerImage: camp.bannerImage || '',
      productTitle: camp.productTitle || '',
      productPrice: camp.productPrice || 15,
      productDescription: camp.productDescription || '',
      productImage: camp.productImage || '',
      prizeName: camp.prizeName || '',
      prizeDescription: camp.prizeDescription || '',
      prizeImage: camp.prizeImage || '',
      ticketLimit: camp.ticketLimit || 50,
      maxTicketsPerUser: camp.maxTicketsPerUser || 10,
      ticketsPerPurchase: camp.ticketsPerPurchase || 1,
      drawDate: camp.drawDate ? new Date(camp.drawDate).toISOString().split('T')[0] : '',
      visibility: camp.visibility || 'public',
      status: camp.status || 'active'
    });
    setIsCampaignModalOpen(true);
  };

  const handleOpenCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      title: '', description: '', terms: '', bannerImage: '',
      productTitle: '', productPrice: 15, productDescription: '',
      productImage: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
      prizeName: '', prizeDescription: '',
      prizeImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80',
      ticketLimit: 50, maxTicketsPerUser: 10, ticketsPerPurchase: 1,
      drawDate: '', visibility: 'public', status: 'active'
    });
    setIsCampaignModalOpen(true);
  };

  const handleCampaignFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...campaignForm, drawDate: campaignForm.drawDate || null };
      if (editingCampaign) {
        const res = await apiClient.put(`/campaigns/admin/${editingCampaign.id}`, payload);
        if (res.data?.success) {
          setAllCampaigns(allCampaigns.map(c => c.id === editingCampaign.id ? res.data.data : c));
          toast.success('Campaign updated successfully!');
          setIsCampaignModalOpen(false);
        }
      } else {
        const res = await apiClient.post('/campaigns/admin/create', payload);
        if (res.data?.success) {
          setAllCampaigns([res.data.data, ...allCampaigns]);
          toast.success('Lucky Draw campaign published successfully!');
          setIsCampaignModalOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save campaign.');
    }
  };

  const handleUpdateCampaignStatus = async (campId: string, status: string) => {
    try {
      const res = await apiClient.put(`/campaigns/admin/${campId}/status`, { status });
      if (res.data?.success) {
        setAllCampaigns(allCampaigns.map(c => c.id === campId ? { ...c, status } : c));
        toast.success(`Campaign status updated to "${status}".`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update campaign status.');
    }
  };

  const handleConductDraw = async (camp: any) => {
    setDrawingCampaign(camp);
    setIsDrawing(true);
    setDrawnWinner(null);

    try {
      // Simulate frontend wheel spin animation for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const res = await apiClient.post(`/campaigns/admin/${camp.id}/draw`);
      if (res.data?.success) {
        const winner = res.data.data.campaign.winnerUser;
        const ticketNum = res.data.data.winningTicket.ticketNumber;
        setDrawnWinner({ name: winner.name, email: winner.email, ticketNumber: ticketNum });

        // Refresh campaigns
        setAllCampaigns(
          allCampaigns.map((c) => (c.id === camp.id ? res.data.data.campaign : c))
        );
      } else {
        toast.error(res.data?.message || 'Lottery draw failed.');
        setIsDrawing(false);
        setDrawingCampaign(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to conduct lottery draw.');
      setIsDrawing(false);
      setDrawingCampaign(null);
    }
  };

  if (loading) return <SectionLoading />;

  const visibleCampaigns = allCampaigns.filter((c) =>
    c.title.toLowerCase().includes(campaignSearch.toLowerCase()) ||
    c.prizeName.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        {/* Campaign analytics */}
        {campaignAnalytics && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard className="shadow-none" label="Campaign revenue" value={<span className="tabular-nums">${campaignAnalytics.overview.totalRevenue.toFixed(0)}</span>} />
            <StatCard className="shadow-none" label="Tickets issued" value={<span className="tabular-nums">{campaignAnalytics.overview.totalTickets}</span>} />
            <StatCard className="shadow-none" label="Unique participants" value={<span className="tabular-nums">{campaignAnalytics.overview.uniqueParticipants}</span>} />
            <StatCard className="shadow-none" label="Active campaigns" value={<span className="tabular-nums">{campaignAnalytics.overview.activeCampaigns}</span>} />
          </div>
        )}

        {campaignAnalytics?.revenueByCampaign?.length > 0 && (
          <div className="rounded-lg border border-line p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Revenue by campaign</h3>
            <p className="mb-4 mt-0.5 text-xs text-stone-500 dark:text-stone-400">Top five campaigns by ticket revenue</p>
            <CampaignRevenueBars rows={campaignAnalytics.revenueByCampaign.slice(0, 5)} />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField value={campaignSearch} onChange={setCampaignSearch} placeholder="Search by title or prize" className="w-full sm:w-80" />
            <AdminButton variant="primary" onClick={handleOpenCreateCampaign}>
              <Plus className="size-4" /> Create campaign
            </AdminButton>
          </div>

          <div className={`${table.wrap} max-h-[560px] overflow-y-auto`}>
            <table className={table.table}>
              <thead className={`${table.thead} sticky top-0 z-10`}>
                <tr>
                  <th className={table.th}>Prize</th>
                  <th className={`${table.th} text-right`}>Product price</th>
                  <th className={table.th}>Tickets sold</th>
                  <th className={table.th}>Draw date</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className={table.tbody}>
                {visibleCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <AdminEmpty icon={Gift} title="No campaigns found" description={campaignSearch ? 'Try a different search.' : 'Create a lucky-draw campaign to get started.'} />
                    </td>
                  </tr>
                )}
                {visibleCampaigns.map((c) => (
                  <tr key={c.id} className={table.tr}>
                    <td className={table.td}>
                      <span className="block font-medium text-stone-900 dark:text-stone-100">{c.prizeName}</span>
                      <span className="block text-xs text-stone-500 dark:text-stone-400">{c.title}</span>
                    </td>
                    <td className={`${table.td} text-right font-medium tabular-nums text-stone-900 dark:text-white`}>${c.productPrice.toFixed(2)}</td>
                    <td className={table.td}>
                      <span className="text-xs tabular-nums text-stone-700 dark:text-stone-300">{c.ticketsSold} / {c.ticketLimit}</span>
                      <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.06]">
                        <div className="h-full rounded-full bg-[#a0702a] dark:bg-[#b8862f]" style={{ width: `${Math.min(100, (c.ticketsSold / c.ticketLimit) * 100)}%` }} />
                      </div>
                    </td>
                    <td className={`${table.td} whitespace-nowrap text-xs text-stone-500 dark:text-stone-400`}>
                      {c.drawDate ? new Date(c.drawDate).toLocaleDateString() : '—'}
                    </td>
                    <td className={table.td}>
                      <div className="relative w-32">
                        <span className={`pointer-events-none absolute left-2.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full ${STATUS_DOT[c.status] || 'bg-stone-400'}`} aria-hidden />
                        <select
                          value={c.status}
                          onChange={(e) => handleUpdateCampaignStatus(c.id, e.target.value)}
                          aria-label={`Status of ${c.title}`}
                          className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-6 pr-7 text-xs font-medium text-stone-700 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-200 dark:[color-scheme:dark]"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="sold-out">Sold out</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
                      </div>
                    </td>
                    <td className={`${table.td} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => fetchAuditTrail('Campaign', c.id)} className={iconBtn} title="Audit trail" aria-label={`Audit trail for ${c.title}`}>
                          <ShieldAlert className="size-4" />
                        </button>
                        <button onClick={() => handleOpenEditCampaign(c)} className={iconBtn} title="Edit campaign" aria-label={`Edit ${c.title}`}>
                          <Edit2 className="size-4" />
                        </button>
                        {c.status !== 'completed' && (
                          <AdminButton size="sm" onClick={() => handleConductDraw(c)} className="ml-1">
                            <Dices className="size-3.5" /> Draw
                          </AdminButton>
                        )}
                        {c.status === 'completed' && (
                          <Pill tone="accent" className="ml-1">
                            <Trophy className="size-3" /> {c.winnerUser?.name || 'Winner'}
                          </Pill>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-[2px]">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-line bg-surface shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-100">
                <Gift className="size-4 text-[#8b6f47] dark:text-[#c9a96b]" /> {editingCampaign ? 'Edit campaign' : 'Create lucky-draw campaign'}
              </h3>
              <button type="button" onClick={() => setIsCampaignModalOpen(false)} className={iconBtn} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCampaignFormSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-4 overflow-y-auto p-6">
                <div>
                  <label className={labelCls}>Campaign title</label>
                  <input type="text" placeholder="e.g., iPhone 16 Pro Campaign" value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} required className={fieldCls} />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Draw date</label>
                    <input type="date" value={campaignForm.drawDate} onChange={(e) => setCampaignForm({ ...campaignForm, drawDate: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Max tickets per user</label>
                    <input type="number" value={campaignForm.maxTicketsPerUser} onChange={(e) => setCampaignForm({ ...campaignForm, maxTicketsPerUser: Number(e.target.value) })} className={`${fieldCls} tabular-nums`} />
                  </div>
                  <div>
                    <label className={labelCls}>Visibility</label>
                    <div className="relative">
                      <select value={campaignForm.visibility} onChange={(e) => setCampaignForm({ ...campaignForm, visibility: e.target.value })} className={`${fieldCls} cursor-pointer appearance-none pr-8`}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={2} className={textareaCls} placeholder="Campaign description..." />
                </div>

                <fieldset className="space-y-3 rounded-lg border border-line p-4">
                  <legend className="px-1 text-sm font-medium text-stone-900 dark:text-stone-100">Product</legend>
                  <div>
                    <label className={labelCls}>Product title</label>
                    <input type="text" placeholder="e.g. Swift Brass Gold Pen" value={campaignForm.productTitle} onChange={(e) => setCampaignForm({ ...campaignForm, productTitle: e.target.value })} required className={fieldCls} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelCls}>Price ($)</label>
                      <input type="number" value={campaignForm.productPrice} onChange={(e) => setCampaignForm({ ...campaignForm, productPrice: Number(e.target.value) })} required className={`${fieldCls} tabular-nums`} />
                    </div>
                    <div>
                      <label className={labelCls}>Ticket limit</label>
                      <input type="number" value={campaignForm.ticketLimit} onChange={(e) => setCampaignForm({ ...campaignForm, ticketLimit: Number(e.target.value) })} required className={`${fieldCls} tabular-nums`} />
                    </div>
                    <div>
                      <label className={labelCls}>Tickets per purchase</label>
                      <input type="number" value={campaignForm.ticketsPerPurchase} onChange={(e) => setCampaignForm({ ...campaignForm, ticketsPerPurchase: Number(e.target.value) })} className={`${fieldCls} tabular-nums`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Product image URL</label>
                    <input type="text" value={campaignForm.productImage} onChange={(e) => setCampaignForm({ ...campaignForm, productImage: e.target.value })} required className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Product description</label>
                    <textarea value={campaignForm.productDescription} onChange={(e) => setCampaignForm({ ...campaignForm, productDescription: e.target.value })} required rows={2} className={textareaCls} />
                  </div>
                </fieldset>

                <fieldset className="space-y-3 rounded-lg border border-line p-4">
                  <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-stone-900 dark:text-stone-100">
                    <Trophy className="size-3.5 text-[#8b6f47] dark:text-[#c9a96b]" /> Prize
                  </legend>
                  <div>
                    <label className={labelCls}>Prize name</label>
                    <input type="text" placeholder="e.g. Suzuki GSX sports bike" value={campaignForm.prizeName} onChange={(e) => setCampaignForm({ ...campaignForm, prizeName: e.target.value })} required className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Prize image URL</label>
                    <input type="text" value={campaignForm.prizeImage} onChange={(e) => setCampaignForm({ ...campaignForm, prizeImage: e.target.value })} required className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Prize description</label>
                    <textarea value={campaignForm.prizeDescription} onChange={(e) => setCampaignForm({ ...campaignForm, prizeDescription: e.target.value })} required rows={2} className={textareaCls} />
                  </div>
                </fieldset>

                <div>
                  <label className={labelCls}>Rules and terms (optional)</label>
                  <textarea value={campaignForm.terms} onChange={(e) => setCampaignForm({ ...campaignForm, terms: e.target.value })} rows={3} placeholder="Enter campaign rules, eligibility criteria, and terms of participation..." className={textareaCls} />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
                <AdminButton onClick={() => setIsCampaignModalOpen(false)}>Cancel</AdminButton>
                <AdminButton type="submit" variant="primary">
                  {editingCampaign ? 'Save changes' : 'Publish campaign'}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {drawingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-sm space-y-6 rounded-xl border border-line bg-surface p-6 text-center shadow-lg">

            {isDrawing && (
              <div className="space-y-5 py-4" role="status">
                <div className="relative mx-auto flex size-16 items-center justify-center">
                  <span className="absolute inset-0 animate-spin rounded-full border-2 border-stone-200 border-t-[#8b6f47] dark:border-white/10 dark:border-t-[#c9a96b]" aria-hidden />
                  <Trophy className="size-6 text-stone-500 dark:text-stone-400" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-stone-900 dark:text-white">Drawing a winner…</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Picking a random ticket from this campaign&apos;s entries.</p>
                </div>

                <div className="rounded-lg border border-line bg-stone-50 px-3 py-2 font-mono text-sm tabular-nums tracking-wider text-stone-600 dark:bg-white/[0.03] dark:text-stone-300">
                  SWIFT-TKT-{Math.floor(100000 + Math.random() * 900000)}
                </div>
              </div>
            )}

            {drawnWinner && (
              <div className="space-y-5">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#8b6f47]/10 text-[#8b6f47] dark:bg-[#c9a96b]/10 dark:text-[#c9a96b]">
                  <Trophy className="size-6" />
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-medium text-stone-500 dark:text-stone-400">Winner chosen</span>
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white">{drawnWinner.name}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Customer account: {drawnWinner.email}</p>
                </div>

                <div className="rounded-lg border border-line bg-stone-50 p-3 dark:bg-white/[0.03]">
                  <span className="mb-1 block text-xs text-stone-500 dark:text-stone-400">Winning ticket</span>
                  <span className="font-mono text-base font-semibold tracking-wider text-stone-900 dark:text-stone-100">
                    {drawnWinner.ticketNumber}
                  </span>
                </div>

                <AdminButton
                  variant="primary"
                  onClick={() => {
                    setDrawingCampaign(null);
                    setDrawnWinner(null);
                    setIsDrawing(false);
                  }}
                  className="w-full"
                >
                  Done
                </AdminButton>
              </div>
            )}

          </div>
        </div>
      )}

      {auditTrailModal}
    </>
  );
}
