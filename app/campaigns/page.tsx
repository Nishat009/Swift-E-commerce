'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Ticket, Trophy, Tv, AlertCircle, RefreshCw, ChevronRight, Clock, Filter, Sparkles, Star, Users, TrendingUp } from 'lucide-react';
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
    if (!drawDate) {
      setTimeLeft({ days: 2, hours: 14, minutes: 35, seconds: 50 });
      return;
    }

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

  if (isExpired) {
    return (
      <span className="text-[9px] font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-200/30 uppercase tracking-wider animate-pulse">
        Draw Imminent
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {[
        { val: timeLeft.days, label: 'd' },
        { val: timeLeft.hours, label: 'h' },
        { val: timeLeft.minutes, label: 'm' },
        { val: timeLeft.seconds, label: 's' },
      ].map((unit, i) => (
        <React.Fragment key={unit.label}>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg px-1.5 py-0.5 text-center min-w-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <span className="block text-[11px] font-mono font-black text-gray-800 dark:text-gray-200 leading-tight">{String(unit.val).padStart(2, '0')}</span>
            <span className="block text-[6px] text-gray-400 uppercase font-bold tracking-wider">{unit.label}</span>
          </div>
          {i < 3 && <span className="text-gray-300 text-[10px] font-bold">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function ProgressRing({ percent, size = 48 }: { percent: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-gray-800" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#campaignGradient)" strokeWidth="3"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="campaignGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b6f47" />
          <stop offset="100%" stopColor="#c9a96b" />
        </linearGradient>
      </defs>
    </svg>
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <RefreshCw className="w-10 h-10 animate-spin text-[#8b6f47]" />
        <span className="text-sm font-semibold tracking-wider font-serif">Loading Campaigns...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[32px] border border-gray-150/40 dark:border-gray-800 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8b6f47]/10 via-[#c9a96b]/15 to-[#d4a574]/10 dark:from-[#8b6f47]/5 dark:via-[#c9a96b]/8 dark:to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#c9a96b]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#8b6f47]/8 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-1.5 bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 text-[#8b6f47] dark:text-[#c9a96b] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-5 border border-[#8b6f47]/20">
                <Sparkles className="w-3 h-3" /> Prize Campaign Center
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-[#f5f1eb] leading-[1.1]"
            >
              Buy Products,{' '}
              <span className="bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] bg-clip-text text-transparent">
                Win Luxury Prizes!
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-5 leading-relaxed max-w-lg"
            >
              Every purchase in a campaign earns you a free draw entry. When all items sell out, a transparent random draw awards the grand prize.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 mt-8"
            >
              <Link href="/campaigns/my-tickets">
                <Button size="lg" className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 border-0 shadow-md flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> View My Tickets
                </Button>
              </Link>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-6 mt-10 pt-6 border-t border-gray-200/50 dark:border-gray-800/50"
            >
              {[
                { icon: Gift, value: activeCampaigns.length, label: 'Active Draws' },
                { icon: Ticket, value: totalTicketsSold, label: 'Tickets Issued' },
                { icon: Trophy, value: completedCampaigns.length, label: 'Winners Declared' },
                { icon: Users, value: campaigns.length, label: 'Total Campaigns' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b]" />
                  </div>
                  <div>
                    <span className="block text-base font-black text-gray-900 dark:text-white">{stat.value}</span>
                    <span className="block text-[9px] text-gray-400 uppercase font-bold tracking-wider">{stat.label}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              activeFilter === tab.key
                ? 'bg-[#8b6f47] text-white border-[#8b6f47] shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-[#8b6f47]/30 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
              activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Campaign Cards Grid */}
      <section className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {filteredCampaigns.length === 0 ? (
          <div className="p-16 text-center border border-dashed rounded-[32px] text-gray-500 bg-white dark:bg-gray-900">
            <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-sm font-semibold">No campaigns match this filter.</p>
            <p className="text-xs text-gray-400 mt-1">Check other tabs or come back later for new draws!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredCampaigns.map((c, idx) => {
                const percentSold = Math.min(100, Math.round((c.ticketsSold / c.ticketLimit) * 100));
                const isCompleted = c.status === 'completed';
                const isSoldOut = c.status === 'sold-out';

                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group bg-white dark:bg-[#181715] rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Prize Image */}
                    <div className="relative h-56 w-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
                      <Image src={c.prizeImage} alt={c.prizeName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${
                          isCompleted ? 'bg-yellow-500 text-black' :
                          isSoldOut ? 'bg-red-500 text-white' :
                          c.status === 'paused' ? 'bg-orange-500 text-white' :
                          'bg-[#8b6f47]/90 text-white'
                        }`}>
                          {isCompleted ? '🏆 Drawn' : isSoldOut ? 'Sold Out' : c.status === 'paused' ? 'Paused' : 'Grand Prize'}
                        </span>
                      </div>

                      {/* Countdown */}
                      {!isCompleted && (
                        <div className="absolute bottom-4 right-4">
                          <CountdownTimer drawDate={c.drawDate} />
                        </div>
                      )}

                      {/* Bottom overlay info */}
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white text-lg font-serif font-extrabold drop-shadow-md leading-tight">{c.prizeName}</h3>
                        <p className="text-white/70 text-[10px] font-bold mt-0.5">{c.title}</p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{c.prizeDescription}</p>

                        <hr className="my-4 border-gray-100 dark:border-gray-800" />

                        {/* Product Row */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 flex-shrink-0">
                            <Image src={c.productImage} alt={c.productTitle} fill className="object-cover" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <span className="block text-[8px] text-gray-400 uppercase font-black tracking-wider">Buy This Product:</span>
                            <span className="block text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{c.productTitle}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-serif font-black text-[#8b6f47] dark:text-[#c9a96b]">${c.productPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="mt-4 flex items-center gap-3">
                          <div className="relative flex items-center justify-center flex-shrink-0">
                            <ProgressRing percent={percentSold} size={44} />
                            <span className="absolute text-[8px] font-black text-gray-600 dark:text-gray-300">{percentSold}%</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-1">
                              <span>{c.ticketsSold} sold</span>
                              <span>{c.ticketLimit - c.ticketsSold} left</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentSold}%` }}
                                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-5 pt-3">
                        <Link href={`/campaigns/${c.id}`} className="block">
                          <Button className={`w-full border-0 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                            isCompleted
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-150'
                              : 'bg-[#8b6f47] hover:bg-[#725a38] text-white'
                          }`}>
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
        <section className="space-y-6 pt-8 border-t dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" /> Winners Gallery
              </h2>
              <p className="text-xs text-gray-500 mt-1">Previous draws, winners, and prize claim moments.</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400 font-bold bg-yellow-500/5 px-3 py-1.5 rounded-full border border-yellow-200/30">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {completedCampaigns.length} completed draw{completedCampaigns.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {completedCampaigns.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-[#181715] rounded-[24px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-40 w-full bg-gray-50 dark:bg-gray-950">
                  <Image src={c.prizeImage} alt={c.prizeName} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="bg-yellow-500 text-black text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md inline-flex items-center gap-1">
                      🏆 Draw Completed
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{c.title}</h4>
                    <h3 className="text-sm font-serif font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5">{c.prizeName}</h3>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-yellow-50/50 to-yellow-50/20 dark:from-yellow-950/10 dark:to-transparent rounded-xl flex items-center gap-2.5 border border-yellow-200/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      W
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <span className="block text-[7px] text-gray-400 uppercase font-black tracking-widest">Draw Winner:</span>
                      <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">{c.winnerUser?.name || 'Guest Winner'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] px-1">
                    <span className="text-gray-400">Winning Ticket:</span>
                    <span className="font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b] bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded-lg border dark:border-gray-800">{c.winnerTicket}</span>
                  </div>

                  {c.winnerVideoUrl && (
                    <div className="pt-2 border-t dark:border-gray-800 flex justify-center">
                      <button
                        onClick={() => toast.info('Playing mock winner review video!')}
                        className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline flex items-center gap-1.5"
                      >
                        <Tv className="w-3.5 h-3.5" /> Watch Winner Review
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
