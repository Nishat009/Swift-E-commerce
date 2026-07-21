'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Ticket, Award, RefreshCw, ChevronLeft, Calendar, FileText, X, Printer, Filter, Trophy, Clock, Hash, CreditCard, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';

interface Campaign {
  id: string;
  title: string;
  prizeName: string;
  prizeImage?: string;
  productTitle?: string;
  productPrice?: number;
  drawDate?: string;
  status: 'draft' | 'active' | 'paused' | 'sold-out' | 'completed' | 'archived';
  winnerUser?: { id: string; name: string };
}

interface TicketRecord {
  id: string;
  ticketNumber: string;
  campaign: Campaign;
  status: 'active' | 'won' | 'lost';
  purchaseAmount: number;
  paymentMethod: string;
  createdAt: string;
}

type TicketFilter = 'all' | 'active' | 'won' | 'lost';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketInvoice, setSelectedTicketInvoice] = useState<TicketRecord | null>(null);
  const [activeFilter, setActiveFilter] = useState<TicketFilter>('all');

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/campaigns/my-tickets');
      if (res.data?.success) {
        setTickets(res.data.data);
      } else {
        setError('Failed to fetch ticket entries.');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Connection to backend failed or user unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'all') return tickets;
    return tickets.filter(t => t.status === activeFilter);
  }, [tickets, activeFilter]);

  const filterTabs: { key: TicketFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tickets.length },
    { key: 'active', label: 'Active', count: tickets.filter(t => t.status === 'active').length },
    { key: 'won', label: 'Won', count: tickets.filter(t => t.status === 'won').length },
    { key: 'lost', label: 'Unsuccessful', count: tickets.filter(t => t.status === 'lost').length },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <RefreshCw className="w-10 h-10 animate-spin text-[#8b6f47]" />
        <span className="text-sm font-semibold tracking-wider font-serif">Loading Ticket Registers...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns" className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-[#f5f1eb]">My Draw Tickets</h1>
          <p className="text-xs text-gray-500 mt-1">Review all your lucky draw entries and track results.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Ticket, value: tickets.length, label: 'Total Tickets', color: 'text-[#8b6f47]', bg: 'bg-[#8b6f47]/10' },
          { icon: Clock, value: tickets.filter(t => t.status === 'active').length, label: 'Active Entries', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { icon: Trophy, value: tickets.filter(t => t.status === 'won').length, label: 'Won', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
          { icon: CreditCard, value: `$${tickets.reduce((a, t) => a + (t.purchaseAmount || 0), 0).toFixed(0)}`, label: 'Total Spent', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#181715] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <span className="block text-lg font-black text-gray-900 dark:text-white">{stat.value}</span>
              <span className="block text-[8px] text-gray-400 uppercase font-bold tracking-wider">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-200 dark:border-red-800/30">
          <Gift className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              activeFilter === tab.key
                ? 'bg-[#8b6f47] text-white border-[#8b6f47] shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-[#8b6f47]/30'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
              activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Ticket Cards */}
      {filteredTickets.length === 0 ? (
        <div className="p-16 text-center border border-dashed rounded-[32px] text-gray-500 bg-white dark:bg-[#181715]">
          <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">No Tickets Found</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {activeFilter === 'all'
              ? "You haven't participated in any draw campaigns yet."
              : `No tickets with status "${activeFilter}" found.`}
          </p>
          <Link href="/campaigns" className="block mt-6">
            <Button className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 py-2 border-0">
              Browse Active Drawings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((t, idx) => {
              const isWinner = t.status === 'won';
              const isLost = t.status === 'lost';

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className={`relative bg-white dark:bg-[#181715] rounded-[24px] border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                    isWinner ? 'border-yellow-300/50 dark:border-yellow-700/30' : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  {/* Winner Glow */}
                  {isWinner && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-yellow-500/5 pointer-events-none" />
                  )}

                  <div className="p-5 relative">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isWinner ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600' :
                          isLost ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' :
                          'bg-blue-50 dark:bg-blue-950/20 text-blue-600'
                        }`}>
                          {isWinner ? <Trophy className="w-4 h-4" /> : isLost ? <X className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isWinner ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300/30' :
                          isLost ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700' :
                          'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/30'
                        }`}>
                          {isWinner ? '🏆 Winner' : isLost ? 'Unsuccessful' : '⏳ Active'}
                        </span>
                      </div>
                    </div>

                    {/* Ticket Number */}
                    <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 mb-3 border border-gray-100 dark:border-gray-800">
                      <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider block mb-0.5">Ticket Serial</span>
                      <span className="font-mono font-bold text-sm text-[#8b6f47] dark:text-[#c9a96b] tracking-wider">{t.ticketNumber}</span>
                    </div>

                    {/* Campaign Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider block">Campaign Prize</span>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block">{t.campaign?.prizeName || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-400 truncate block">{t.campaign?.title}</span>
                        </div>
                        <span className="text-sm font-serif font-black text-[#8b6f47] dark:text-[#c9a96b] flex-shrink-0 ml-2">
                          ${(t.purchaseAmount || t.campaign?.productPrice || 15).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {t.paymentMethod || 'Wallet'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                      <button
                        onClick={() => setSelectedTicketInvoice(t)}
                        className="flex-1 text-[10px] font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:bg-[#8b6f47]/5 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3" /> Invoice
                      </button>
                      <Link href={`/campaigns/${t.campaign?.id}`} className="flex-1">
                        <button className="w-full text-[10px] font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors">
                          <Gift className="w-3 h-3" /> Campaign
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Digital Invoice Modal */}
      <AnimatePresence>
        {selectedTicketInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <button onClick={() => setSelectedTicketInvoice(null)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 text-gray-400 hover:text-gray-700 rounded-full">
                <X className="w-4 h-4" />
              </button>

              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-[#8b6f47]/10 to-[#c9a96b]/10 p-6 text-center border-b border-gray-100 dark:border-gray-800">
                <div className="w-12 h-12 rounded-2xl bg-[#8b6f47]/10 flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6 text-[#8b6f47]" />
                </div>
                <span className="text-xs font-serif font-black text-[#8b6f47] dark:text-[#c9a96b] tracking-widest uppercase block">
                  SwiftCart Digital Invoice
                </span>
                <span className="text-[9px] text-gray-400 font-mono block mt-1">
                  Receipt ID: INV-{selectedTicketInvoice.ticketNumber.substring(10)}
                </span>
              </div>

              {/* Invoice Body */}
              <div className="p-6 space-y-4">
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Campaign Prize', value: selectedTicketInvoice.campaign?.prizeName },
                    { label: 'Purchased Item', value: selectedTicketInvoice.campaign?.productTitle },
                    { label: 'Ticket Serial', value: selectedTicketInvoice.ticketNumber, highlight: true },
                    { label: 'Purchase Date', value: new Date(selectedTicketInvoice.createdAt).toLocaleString() },
                    { label: 'Payment Method', value: (selectedTicketInvoice.paymentMethod || 'simulated_wallet').toUpperCase() },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-gray-400">{row.label}:</span>
                      <span className={`font-bold ${row.highlight ? 'font-mono text-[#8b6f47] dark:text-[#c9a96b]' : 'text-gray-800 dark:text-gray-200'}`}>{row.value}</span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Payment Status:</span>
                    <span className="font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-200/20 uppercase tracking-widest text-[9px] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </span>
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-800" />

                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-800 dark:text-white">Amount Charged:</span>
                  <span className="font-serif font-black text-lg text-[#8b6f47] dark:text-[#c9a96b]">
                    ${(selectedTicketInvoice.purchaseAmount || selectedTicketInvoice.campaign?.productPrice || 15).toFixed(2)}
                  </span>
                </div>

                {/* Ticket Status */}
                <div className={`p-3 rounded-xl text-center border ${
                  selectedTicketInvoice.status === 'won'
                    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200/30'
                    : selectedTicketInvoice.status === 'lost'
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200/30'
                }`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    selectedTicketInvoice.status === 'won' ? 'text-yellow-700 dark:text-yellow-400' :
                    selectedTicketInvoice.status === 'lost' ? 'text-gray-500' : 'text-blue-700 dark:text-blue-400'
                  }`}>
                    {selectedTicketInvoice.status === 'won' ? '🏆 WINNING TICKET' : selectedTicketInvoice.status === 'lost' ? 'Draw Completed — Not Selected' : '⏳ Awaiting Draw Result'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <Button
                  onClick={() => window.print()}
                  className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </Button>
                <button
                  onClick={() => setSelectedTicketInvoice(null)}
                  className="flex-1 text-xs font-bold py-2.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
