'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Ticket, RefreshCw, ChevronLeft, FileText, X, Printer } from 'lucide-react';
import StatusPill, { PillTone } from '@/components/orders/StatusPill';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

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
  const toast = useToast();

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/campaigns/my-tickets');
      if (res.data?.success) {
        setTickets(Array.isArray(res.data.data) ? res.data.data : []);
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
    // Result of a ticket payment (verified server-side before tickets are issued)
    if (typeof window !== 'undefined') {
      const result = new URLSearchParams(window.location.search).get('payment');
      if (result === 'success') toast.success('Payment confirmed. Your tickets are ready!');
      else if (result === 'failed') toast.error('Payment was not completed. No tickets were issued.');
      if (result) window.history.replaceState({}, '', '/campaigns/my-tickets');
    }
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-stone-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" strokeWidth={1.5} />
        <span className="text-sm">Loading your tickets...</span>
      </div>
    );
  }

  const eyebrow = 'text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400';
  const ticketTone = (status: TicketRecord['status']): PillTone => (status === 'won' ? 'success' : status === 'lost' ? 'neutral' : 'accent');

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-8 sm:py-12 space-y-10">

      {/* Header */}
      <div>
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-ink transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> All draws
        </Link>
        <h1 className="mt-6 font-serif text-4xl sm:text-5xl font-medium tracking-tight text-ink">My Draw Tickets</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">Review all your lucky draw entries and track results.</p>
      </div>

      {/* Stats Overview */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 border-y border-line py-6">
        {[
          { value: tickets.length, label: 'Total Tickets' },
          { value: tickets.filter(t => t.status === 'active').length, label: 'Active Entries' },
          { value: tickets.filter(t => t.status === 'won').length, label: 'Won' },
          { value: `$${tickets.reduce((a, t) => a + (t.purchaseAmount || 0), 0).toFixed(0)}`, label: 'Total Spent' },
        ].map((stat, i) => (
          <div key={i} className="sm:px-6 first:pl-0 sm:border-l sm:first:border-l-0 border-line">
            <dd className="text-3xl font-serif font-medium tabular-nums text-ink">{stat.value}</dd>
            <dt className={`${eyebrow} mt-1`}>{stat.label}</dt>
          </div>
        ))}
      </dl>

      {error && (
        <div className="p-4 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-3 border border-red-200 dark:border-red-900/50">
          <Gift className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="no-scrollbar flex items-center gap-6 overflow-x-auto border-b border-line -mb-4">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`whitespace-nowrap py-3 -mb-px text-sm border-b transition-colors cursor-pointer ${
              activeFilter === tab.key
                ? 'border-ink text-ink font-medium'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-ink'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs tabular-nums text-stone-400">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Ticket Cards */}
      {filteredTickets.length === 0 ? (
        <div className="py-20 text-center">
          <Ticket className="w-8 h-8 mx-auto text-stone-400 mb-4" strokeWidth={1.25} />
          <h3 className="text-2xl font-serif font-medium tracking-tight text-ink">No tickets found</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {activeFilter === 'all'
              ? "You haven't participated in any draw campaigns yet."
              : `No tickets with status "${activeFilter}" found.`}
          </p>
          <Link href="/campaigns" className="inline-block mt-8">
            <Button>Browse Active Drawings</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((t, idx) => {
              const isWinner = t.status === 'won';
              const isLost = t.status === 'lost';

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className={`border rounded-lg p-5 transition-colors ${isWinner ? 'border-ink' : 'border-line hover:border-stone-400'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={eyebrow}>Ticket serial</span>
                    <StatusPill tone={ticketTone(t.status)}>
                      {isWinner ? 'Winner' : isLost ? 'Unsuccessful' : 'Active'}
                    </StatusPill>
                  </div>

                  <p className="font-serif text-2xl font-medium tabular-nums tracking-tight text-ink break-all">{t.ticketNumber}</p>

                  <div className="mt-5 pt-4 border-t border-line space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-stone-500 dark:text-stone-400 block">Campaign prize</span>
                        <span className="text-sm text-ink truncate block">{t.campaign?.prizeName || 'Unknown'}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 truncate block">{t.campaign?.title}</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-ink flex-shrink-0">
                        ${(t.purchaseAmount || t.campaign?.productPrice || 15).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {new Date(t.createdAt).toLocaleDateString()} &middot; {t.paymentMethod || 'Online'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedTicketInvoice(t)}>
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </Button>
                    <Link href={`/campaigns/${t.campaign?.id}`} className="flex-1">
                      <Button size="sm" variant="ghost" className="w-full">Campaign</Button>
                    </Link>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-surface border border-line rounded-lg w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <button onClick={() => setSelectedTicketInvoice(null)} aria-label="Close" className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>

              {/* Invoice Header */}
              <div className="p-6 border-b border-line">
                <span className={`${eyebrow} block`}>SwiftCart Digital Invoice</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums block mt-1">
                  Receipt ID: INV-{selectedTicketInvoice.ticketNumber.substring(10)}
                </span>
              </div>

              {/* Invoice Body */}
              <div className="p-6 space-y-5">
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Campaign Prize', value: selectedTicketInvoice.campaign?.prizeName },
                    { label: 'Purchased Item', value: selectedTicketInvoice.campaign?.productTitle },
                    { label: 'Ticket Serial', value: selectedTicketInvoice.ticketNumber, highlight: true },
                    { label: 'Purchase Date', value: new Date(selectedTicketInvoice.createdAt).toLocaleString() },
                    { label: 'Payment Method', value: (selectedTicketInvoice.paymentMethod || 'online').toUpperCase() },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-start gap-4">
                      <span className="text-stone-500 dark:text-stone-400">{row.label}</span>
                      <span className={`text-right tabular-nums ${row.highlight ? 'font-medium text-ink' : 'text-ink'}`}>{row.value}</span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400">Payment Status</span>
                    <StatusPill tone="success">Paid</StatusPill>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-line">
                  <span className="text-sm font-medium text-ink">Amount Charged</span>
                  <span className="text-xl font-medium tabular-nums text-ink">
                    ${(selectedTicketInvoice.purchaseAmount || selectedTicketInvoice.campaign?.productPrice || 0).toFixed(2)}
                  </span>
                </div>

                {/* Ticket Status */}
                <div className="p-3 rounded-lg text-center bg-surface-muted">
                  <span className={`text-sm font-medium ${
                    selectedTicketInvoice.status === 'won' ? 'text-green-700 dark:text-green-400' : 'text-stone-600 dark:text-stone-300'
                  }`}>
                    {selectedTicketInvoice.status === 'won' ? 'Winning ticket' : selectedTicketInvoice.status === 'lost' ? 'Draw completed. Not selected.' : 'Awaiting draw result'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <Button onClick={() => window.print()} className="flex-1">
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </Button>
                <Button variant="outline" onClick={() => setSelectedTicketInvoice(null)} className="flex-1">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
