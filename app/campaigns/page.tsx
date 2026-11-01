'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Ticket, Tv, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface Campaign {
  id: string;
  title: string;
  description: string;
  productTitle: string;
  productPrice: number;
  productDescription: string;
  productImage: string;
  prizeName: string;
  prizeDescription: string;
  prizeImage: string;
  bannerImage: string;
  ticketLimit: number;
  ticketsSold: number;
  drawDate: string | null;
  maxTicketsPerUser: number;
  status: 'draft' | 'active' | 'paused' | 'sold-out' | 'completed' | 'archived';
  winnerUser?: {
    id: string;
    name: string;
    email: string;
  };
  winnerTicket?: string;
  winnerVideoUrl?: string;
  createdAt: string;
}

function CountdownTimer({ drawDate }: { drawDate: string | null }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!drawDate) return;

    const targetDate = new Date(drawDate).getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setIsExpired(true);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [drawDate]);

  if (!drawDate) {
    return <span className="text-xs text-stone-500 dark:text-stone-400">Draw date to be announced</span>;
  }

  if (isExpired) {
    return <span className="text-xs text-stone-500 dark:text-stone-400">Draw imminent</span>;
  }

  return (
    <div className="flex items-baseline gap-1 text-xs tabular-nums text-stone-600 dark:text-stone-300">
      {[
        { val: timeLeft.days, label: 'd' },
        { val: timeLeft.hours, label: 'h' },
        { val: timeLeft.minutes, label: 'm' },
        { val: timeLeft.seconds, label: 's' },
      ].map((unit) => (
        <span key={unit.label}>
          <span className="font-medium text-ink">{String(unit.val).padStart(2, '0')}</span>
          <span className="text-stone-400 ml-px mr-1">{unit.label}</span>
        </span>
      ))}
    </div>
  );
}

type FilterTab = 'all' | 'active' | 'sold-out' | 'completed';

export default function CampaignsDashboard() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const fetchAllCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/campaigns');
      if (res.data?.success) {
        setCampaigns(res.data.data);
      } else {
        setError('Failed to retrieve campaigns.');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Connection to backend API failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    if (activeFilter === 'all') return campaigns.filter(c => c.status !== 'draft' && c.status !== 'archived');
    if (activeFilter === 'active') return campaigns.filter(c => c.status === 'active' || c.status === 'paused');
    return campaigns.filter(c => c.status === activeFilter);
  }, [campaigns, activeFilter]);

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'sold-out' || c.status === 'paused');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');
  const totalTicketsSold = campaigns.reduce((a, c) => a + c.ticketsSold, 0);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Draws', count: campaigns.filter(c => c.status !== 'draft' && c.status !== 'archived').length },
    { key: 'active', label: 'Active', count: activeCampaigns.length },
    { key: 'sold-out', label: 'Sold Out', count: campaigns.filter(c => c.status === 'sold-out').length },
    { key: 'completed', label: 'Completed', count: completedCampaigns.length },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-stone-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" strokeWidth={1.5} />
        <span className="text-sm">Loading campaigns...</span>
      </div>
    );
  }

  const eyebrow = 'text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400';

  return (
    <div className="bg-paper">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-10 sm:py-16 space-y-14">

      {/* Header */}
      <section>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl">
          <p className={`${eyebrow} mb-4`}>Lucky Draws</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-ink leading-[1.1]">
            Buy a product, win a prize
          </h1>
          <p className="text-base text-stone-600 dark:text-stone-400 mt-5 leading-relaxed max-w-xl">
            Every purchase in a campaign earns you a free draw entry. When all items sell out, a transparent random draw awards the grand prize.
          </p>
          <div className="mt-8">
            <Link href="/campaigns/my-tickets">
              <Button size="lg">
                <Ticket className="w-4 h-4" /> View My Tickets
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 mt-12 border-y border-line py-6">
          {[
            { value: activeCampaigns.length, label: 'Active Draws' },
            { value: totalTicketsSold, label: 'Tickets Issued' },
            { value: completedCampaigns.length, label: 'Winners Declared' },
            { value: campaigns.length, label: 'Total Campaigns' },
          ].map((stat, i) => (
            <div key={i} className="sm:px-6 first:pl-0 sm:border-l sm:first:border-l-0 border-line">
              <dd className="text-3xl font-serif font-medium tabular-nums text-ink">{stat.value}</dd>
              <dt className={`${eyebrow} mt-1`}>{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Filter Tabs */}
      <div className="no-scrollbar flex items-center gap-6 overflow-x-auto border-b border-line -mb-6">
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

      {/* Campaign Cards Grid */}
      <section className="space-y-6">
        {error && (
          <div className="p-4 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-3 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {filteredCampaigns.length === 0 ? (
          <div className="py-20 text-center">
            <Gift className="w-8 h-8 mx-auto text-stone-400 mb-4" strokeWidth={1.25} />
            <p className="text-2xl font-serif font-medium tracking-tight text-ink">No campaigns match this filter</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Check other tabs or come back later for new draws.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            <AnimatePresence mode="popLayout">
              {filteredCampaigns.map((c, idx) => {
                const percentSold = Math.min(100, Math.round((c.ticketsSold / c.ticketLimit) * 100));
                const isCompleted = c.status === 'completed';
                const isSoldOut = c.status === 'sold-out';

                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    className="group flex flex-col"
                  >
                    {/* Prize Image */}
                    <Link href={`/campaigns/${c.id}`} className="relative block aspect-[4/5] w-full bg-surface-muted overflow-hidden rounded-sm">
                      <Image src={c.prizeImage} alt={c.prizeName} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                      <span className="absolute top-3 left-3 bg-paper text-ink text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                        {isCompleted ? 'Drawn' : isSoldOut ? 'Sold out' : c.status === 'paused' ? 'Paused' : 'Grand prize'}
                      </span>
                    </Link>

                    {/* Body */}
                    <div className="pt-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className={eyebrow}>{c.title}</p>
                        <h3 className="mt-1.5 text-2xl font-serif font-medium tracking-tight text-ink leading-tight">{c.prizeName}</h3>
                        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">{c.prizeDescription}</p>

                        {/* Product Row */}
                        <div className="mt-5 pt-4 border-t border-line flex items-center gap-3">
                          <div className="relative w-11 aspect-[3/4] bg-surface-muted rounded-sm overflow-hidden flex-shrink-0">
                            <Image src={c.productImage} alt={c.productTitle} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs text-stone-500 dark:text-stone-400">Buy this product</span>
                            <span className="block text-sm text-ink truncate">{c.productTitle}</span>
                          </div>
                          <span className="text-sm font-medium tabular-nums text-ink flex-shrink-0">${c.productPrice.toFixed(2)}</span>
                        </div>

                        {/* Progress */}
                        <div className="mt-5">
                          <div className="flex justify-between text-xs tabular-nums text-stone-500 dark:text-stone-400 mb-2">
                            <span>{c.ticketsSold} sold &middot; {percentSold}%</span>
                            <span>{c.ticketLimit - c.ticketsSold} left</span>
                          </div>
                          <div className="w-full bg-stone-200 dark:bg-stone-800 h-px relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentSold}%` }}
                              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                              className="absolute left-0 -top-px h-0.5 bg-ink"
                            />
                          </div>
                          {!isCompleted && (
                            <div className="mt-3">
                              <CountdownTimer drawDate={c.drawDate} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-6">
                        <Link href={`/campaigns/${c.id}`} className="block">
                          <Button variant={isCompleted || isSoldOut ? 'outline' : 'primary'} className="w-full">
                            {isCompleted ? 'View Results' : isSoldOut ? 'View Campaign' : 'Enter Draw & Purchase'}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Winners Gallery */}
      {completedCampaigns.length > 0 && (
        <section className="space-y-8 pt-12 border-t border-line">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                Winners Gallery
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">Previous draws, winners, and prize claim moments.</p>
            </div>
            <span className="hidden sm:block text-xs tabular-nums text-stone-500 dark:text-stone-400">
              {completedCampaigns.length} completed draw{completedCampaigns.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {completedCampaigns.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative aspect-[4/3] w-full bg-surface-muted rounded-sm overflow-hidden">
                  <Image src={c.prizeImage} alt={c.prizeName} fill className="object-cover" />
                  <span className="absolute top-3 left-3 bg-paper text-ink text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                    Draw completed
                  </span>
                </div>

                <div className="pt-4 space-y-3">
                  <div>
                    <p className={eyebrow}>{c.title}</p>
                    <h3 className="text-xl font-serif font-medium tracking-tight text-ink truncate mt-1">{c.prizeName}</h3>
                  </div>

                  <dl className="text-sm divide-y divide-line border-y border-line">
                    <div className="flex justify-between gap-4 py-2.5">
                      <dt className="text-stone-500 dark:text-stone-400">Winner</dt>
                      <dd className="text-ink truncate">{c.winnerUser?.name || 'Guest Winner'}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-2.5">
                      <dt className="text-stone-500 dark:text-stone-400">Winning ticket</dt>
                      <dd className="font-medium tabular-nums text-ink">{c.winnerTicket}</dd>
                    </div>
                  </dl>

                  {c.winnerVideoUrl && (
                    <a
                      href={c.winnerVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink"
                    >
                      <Tv className="w-3.5 h-3.5" /> Watch Winner Review
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
    </div>
  );
}
