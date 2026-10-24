'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { selectClass } from '@/components/ui/Select';
import { Plus, Search, ShieldAlert, Edit2, X, Gift, Trophy } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { useAuditTrail } from './AuditTrailModal';

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Prize Campaign Manager</h2>
          <Button onClick={handleOpenCreateCampaign} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] hover:bg-[#725a38] text-white flex items-center gap-1.5 border-0">
            <Plus className="w-4 h-4" /> Create Campaign
          </Button>
        </div>

        {/* Campaign Analytics Cards */}
        {campaignAnalytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-[#8b6f47]/5 to-[#8b6f47]/10 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <span className="block text-[9px] text-gray-400 uppercase font-black">Campaign Revenue</span>
              <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">${campaignAnalytics.overview.totalRevenue.toFixed(0)}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-50/30 to-blue-50/60 dark:from-blue-950/15 dark:to-blue-900/25 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <span className="block text-[9px] text-gray-400 uppercase font-black">Tickets Issued</span>
              <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">{campaignAnalytics.overview.totalTickets}</span>
            </div>
            <div className="bg-gradient-to-br from-purple-50/30 to-purple-50/60 dark:from-purple-950/15 dark:to-purple-900/25 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <span className="block text-[9px] text-gray-400 uppercase font-black">Unique Participants</span>
              <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">{campaignAnalytics.overview.uniqueParticipants}</span>
            </div>
            <div className="bg-gradient-to-br from-green-50/30 to-green-50/60 dark:from-emerald-950/15 dark:to-emerald-900/25 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <span className="block text-[9px] text-gray-400 uppercase font-black">Active Campaigns</span>
              <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">{campaignAnalytics.overview.activeCampaigns}</span>
            </div>
          </div>
        )}

        {/* Revenue Chart (CSS Bar Chart) */}
        {campaignAnalytics?.revenueByCampaign?.length > 0 && (
          <div className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Revenue by Campaign</h4>
            <div className="space-y-2">
              {campaignAnalytics.revenueByCampaign.slice(0, 5).map((item: any, idx: number) => {
                const maxRev = campaignAnalytics.revenueByCampaign[0]?.revenue || 1;
                const pct = Math.round((item.revenue / maxRev) * 100);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-500 w-24 truncate">{item.campaignTitle}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-gray-600 dark:text-gray-300 w-12 text-right">${item.revenue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search campaigns by title or prize name..."
            value={campaignSearch}
            onChange={(e) => setCampaignSearch(e.target.value)}
            className="w-full text-sm pl-8"
          />
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Campaigns Table */}
        <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="p-3">Campaign Prize</th>
                <th className="p-3">Product Cost</th>
                <th className="p-3">Sold / Limit</th>
                <th className="p-3">Draw Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allCampaigns
                .filter((c) =>
                  c.title.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                  c.prizeName.toLowerCase().includes(campaignSearch.toLowerCase())
                )
                .map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-900/40">
                    <td className="p-3">
                      <span className="block font-bold text-gray-800 dark:text-gray-200">{c.prizeName}</span>
                      <span className="block text-[10px] text-gray-400">{c.title}</span>
                    </td>
                    <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">${c.productPrice.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="font-mono">{c.ticketsSold}/{c.ticketLimit}</span>
                      <div className="w-16 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full" style={{ width: `${Math.min(100, (c.ticketsSold / c.ticketLimit) * 100)}%` }} />
                      </div>
                    </td>
                    <td className="p-3 text-[10px] text-gray-500">
                      {c.drawDate ? new Date(c.drawDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleUpdateCampaignStatus(c.id, e.target.value)}
                        className={`text-[9px] font-bold border rounded-lg px-1.5 py-0.5 bg-white dark:bg-gray-900 ${
                          c.status === 'completed' ? 'text-yellow-700 border-yellow-300' :
                          c.status === 'sold-out' ? 'text-red-700 border-red-300' :
                          c.status === 'active' ? 'text-blue-700 border-blue-300' :
                          c.status === 'paused' ? 'text-orange-700 border-orange-300' :
                          c.status === 'archived' ? 'text-gray-500 border-gray-300' :
                          'text-gray-500 border-gray-300'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="sold-out">Sold Out</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                                                          <button onClick={() => fetchAuditTrail('Campaign', c.id)} className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg" title="Audit Trail">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleOpenEditCampaign(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg" title="Edit Campaign">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {c.status !== 'completed' && (
                          <Button
                            onClick={() => handleConductDraw(c)}
                            size="sm"
                            className="text-[8px] py-1 px-2 font-bold rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black border-0 shadow-sm"
                          >
                            Draw 🎲
                          </Button>
                        )}
                                                          {c.status === 'completed' && (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[9px] text-yellow-600 font-bold px-1">
                              🏆 {c.winnerUser?.name || 'Winner'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl p-6 relative">

            <button onClick={() => setIsCampaignModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#8b6f47]" /> {editingCampaign ? 'Edit Campaign' : 'Create Lucky Draw Campaign'}
            </h3>

            <form onSubmit={handleCampaignFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Campaign Title</label>
                <Input type="text" placeholder="e.g., iPhone 16 Pro Campaign" value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} required className="w-full text-sm" />
              </div>

              {/* Campaign Config */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Draw Date</label>
                  <input type="date" value={campaignForm.drawDate} onChange={(e) => setCampaignForm({ ...campaignForm, drawDate: e.target.value })} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Max/User</label>
                  <Input type="number" value={campaignForm.maxTicketsPerUser} onChange={(e) => setCampaignForm({ ...campaignForm, maxTicketsPerUser: Number(e.target.value) })} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Visibility</label>
                  <select value={campaignForm.visibility} onChange={(e) => setCampaignForm({ ...campaignForm, visibility: e.target.value })} className={`${selectClass} w-full`}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" placeholder="Campaign description..." />
              </div>

              {/* Product Section */}
              <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50/30 dark:bg-gray-900/30 space-y-3">
                <span className="block text-[9px] font-black uppercase text-gray-400 tracking-wider">Target Product</span>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Product Title</label>
                  <Input type="text" placeholder="e.g. Swift Brass Gold Pen" value={campaignForm.productTitle} onChange={(e) => setCampaignForm({ ...campaignForm, productTitle: e.target.value })} required className="w-full text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Price ($)</label>
                    <Input type="number" value={campaignForm.productPrice} onChange={(e) => setCampaignForm({ ...campaignForm, productPrice: Number(e.target.value) })} required className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Ticket Limit</label>
                    <Input type="number" value={campaignForm.ticketLimit} onChange={(e) => setCampaignForm({ ...campaignForm, ticketLimit: Number(e.target.value) })} required className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Per Purchase</label>
                    <Input type="number" value={campaignForm.ticketsPerPurchase} onChange={(e) => setCampaignForm({ ...campaignForm, ticketsPerPurchase: Number(e.target.value) })} className="w-full text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Product Image URL</label>
                  <Input type="text" value={campaignForm.productImage} onChange={(e) => setCampaignForm({ ...campaignForm, productImage: e.target.value })} required className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Product Description</label>
                  <textarea value={campaignForm.productDescription} onChange={(e) => setCampaignForm({ ...campaignForm, productDescription: e.target.value })} required rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" />
                </div>
              </div>

              {/* Prize Section */}
              <div className="border border-yellow-200/30 dark:border-yellow-800/20 p-4 rounded-2xl bg-yellow-50/10 dark:bg-yellow-950/5 space-y-3">
                <span className="block text-[9px] font-black uppercase text-yellow-600 tracking-wider">Grand Reward</span>
                <div>
                  <label className="block text-[9px] font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Prize Name</label>
                  <Input type="text" placeholder="e.g. Suzuki GSX sports bike" value={campaignForm.prizeName} onChange={(e) => setCampaignForm({ ...campaignForm, prizeName: e.target.value })} required className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Prize Image URL</label>
                  <Input type="text" value={campaignForm.prizeImage} onChange={(e) => setCampaignForm({ ...campaignForm, prizeImage: e.target.value })} required className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Prize Description</label>
                  <textarea value={campaignForm.prizeDescription} onChange={(e) => setCampaignForm({ ...campaignForm, prizeDescription: e.target.value })} required rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" />
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Campaign Rules & Terms (optional)</label>
                <textarea value={campaignForm.terms} onChange={(e) => setCampaignForm({ ...campaignForm, terms: e.target.value })} rows={3} placeholder="Enter campaign rules, eligibility criteria, and terms of participation..." className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" />
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 shadow-sm">
                {editingCampaign ? 'Update Campaign' : 'Publish Lucky Draw Campaign'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {drawingCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-8 text-center space-y-6 relative">

            {isDrawing && (
              <div className="space-y-6 py-8">
                {/* Spinner */}
                <div className="relative w-24 h-24 mx-auto rounded-full border-4 border-dashed border-yellow-500 animate-spin flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-yellow-550 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-extrabold text-gray-900 dark:text-white">Lottery In Progress...</h3>
                  <p className="text-sm text-gray-450">Selecting random ticket from campaign database entries.</p>
                </div>

                {/* Spinning Ticket Code Indicator */}
                <div className="bg-gray-105 dark:bg-gray-950 p-3 rounded-2xl border font-mono font-bold text-sm tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                  SWIFT-TKT-{Math.floor(100000 + Math.random() * 900000)}
                </div>
              </div>
            )}

            {drawnWinner && (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-950/40 rounded-full flex items-center justify-center mx-auto text-yellow-600">
                  <Trophy className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-yellow-600 font-black uppercase tracking-widest block">Winner Chosen!</span>
                  <h3 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-white">{drawnWinner.name}</h3>
                  <p className="text-sm text-gray-450">Customer account: {drawnWinner.email}</p>
                </div>

                <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-300/30 text-center">
                  <span className="block text-[8px] text-gray-450 uppercase font-black tracking-wider mb-1">Winning Ticket Code</span>
                  <span className="font-mono text-lg font-bold text-[#8b6f47] dark:text-[#c9a96b] tracking-wider">
                    {drawnWinner.ticketNumber}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    setDrawingCampaign(null);
                    setDrawnWinner(null);
                    setIsDrawing(false);
                  }}
                  className="w-full text-sm font-bold py-2.5 rounded-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 shadow-sm"
                >
                  Close & Refresh Dashboard
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

      {auditTrailModal}
    </>
  );
}
