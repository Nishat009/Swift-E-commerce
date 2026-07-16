'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Gift, Ticket, Trophy, Tv, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';

interface Campaign {
  id: string;
  title: string;
  productTitle: string;
  productPrice: number;
  productDescription: string;
  productImage: string;
  prizeName: string;
  prizeDescription: string;
  prizeImage: string;
  ticketLimit: number;
  ticketsSold: number;
  status: 'active' | 'sold-out' | 'completed';
  winnerUser?: {
    id: string;
    name: string;
    email: string;
  };
  winnerTicket?: string;
  winnerVideoUrl?: string;
}

export default function CampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'sold-out');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

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
      
      {/* Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#8b6f47]/5 via-[#c9a96b]/10 to-transparent p-8 sm:p-12 rounded-[32px] border border-gray-150/40 dark:border-gray-900 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1 bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 text-[#8b6f47] dark:text-[#c9a96b] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-[#8b6f47]/20">
            <Gift className="w-3.5 h-3.5" /> E-commerce Lucky Draw
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-[#f5f1eb] leading-tight">
            Buy Standard Products, <br />
            <span className="text-[#8b6f47] dark:text-[#c9a96b]">Win Luxury Prizes!</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
            Every product you purchase in a lucky draw campaign grants you a free draw entry. Once all products in a campaign are sold out, a live lottery draw is conducted to award the grand prize.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link href="/campaigns/my-tickets">
              <Button size="lg" className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 border-0 shadow-md flex items-center gap-2">
                <Ticket className="w-4 h-4" /> View My Tickets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Campaigns */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-900">
          <div>
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Ongoing Lucky Draws</h2>
            <p className="text-xs text-gray-500 mt-1">Purchase items before they sell out to enter the lottery.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {activeCampaigns.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-3xl text-gray-500">
            <Gift className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold">No active lucky draws at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeCampaigns.map((c) => {
              const percentSold = Math.min(100, Math.round((c.ticketsSold / c.ticketLimit) * 100));
              return (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-gray-850 rounded-[32px] border border-gray-150/40 dark:border-gray-900 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Prize Highlight Header */}
                  <div className="relative h-64 w-full bg-gray-50 dark:bg-gray-950">
                    <Image
                      src={c.prizeImage}
                      alt={c.prizeName}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-[#8b6f47]/90 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Grand Prize
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-[#8b6f47] dark:text-[#c9a96b] uppercase tracking-widest font-black">
                        Campaign: {c.title}
                      </span>
                      <h3 className="text-xl font-serif font-extrabold text-gray-900 dark:text-white mt-1">
                        {c.prizeName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                        {c.prizeDescription}
                      </p>

                      <hr className="my-4 border-gray-150/40 dark:border-gray-900" />

                      {/* Buy Product Detail */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          <Image
                            src={c.productImage}
                            alt={c.productTitle}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <span className="block text-[9px] text-gray-400 uppercase font-black">Buy This Product:</span>
                          <span className="block text-xs font-serif font-bold text-gray-850 dark:text-gray-200 truncate">{c.productTitle}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block line-through">$25.00</span>
                          <span className="text-sm font-serif font-black text-[#8b6f47] dark:text-[#c9a96b]">${c.productPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-5 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                          <span>Progress: {percentSold}% Sold</span>
                          <span>{c.ticketsSold} / {c.ticketLimit} Items</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-900 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full transition-all duration-500"
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-2">
                      <Link href={`/campaigns/${c.id}`} className="block">
                        <Button className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
                          Enter Draw & Purchase <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Winners Gallery */}
      <section className="space-y-6 pt-4 border-t dark:border-gray-900">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Draw Winners Gallery
          </h2>
          <p className="text-xs text-gray-500 mt-1">See list of previous draws, winners, and user testimonial reels.</p>
        </div>

        {completedCampaigns.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-3xl text-gray-500">
            <p className="text-sm">Winners list is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {completedCampaigns.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-150/40 dark:border-gray-900 p-5 shadow-sm space-y-4"
              >
                <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-gray-50">
                  <Image
                    src={c.prizeImage}
                    alt={c.prizeName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      🏆 Drawn Completed
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-400 capitalize">{c.title}</h4>
                  <h3 className="text-sm font-serif font-bold text-gray-850 dark:text-gray-100 truncate">{c.prizeName}</h3>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 font-bold text-xs">
                    W
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <span className="block text-[8px] text-gray-400 uppercase font-black">Draw Winner:</span>
                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">{c.winnerUser?.name || 'Guest Winner'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400">Winning Ticket:</span>
                  <span className="font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b] bg-gray-105 dark:bg-gray-900 px-2 py-0.5 rounded-lg border dark:border-gray-800">{c.winnerTicket}</span>
                </div>

                {c.winnerVideoUrl && (
                  <div className="pt-2 border-t dark:border-gray-900 flex justify-center">
                    <button
                      onClick={() => {
                        alert('Playing mock user review/video testimonial clip!');
                      }}
                      className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline flex items-center gap-1.5"
                    >
                      <Tv className="w-3.5 h-3.5" /> Watch Winner Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
