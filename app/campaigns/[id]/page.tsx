'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RefreshCw, Shield, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface Campaign {
  id: string;
  title: string;
  description: string;
  terms: string;
  bannerImage: string;
  productTitle: string;
  productPrice: number;
  productDescription: string;
  productImage: string;
  prizeName: string;
  prizeDescription: string;
  prizeImage: string;
  ticketLimit: number;
  ticketsSold: number;
  drawDate: string | null;
  maxTicketsPerUser: number;
  // Tickets the signed-in user already holds (only sent when logged in)
  userTicketCount?: number;
  ticketsPerPurchase: number;
  status: 'draft' | 'active' | 'paused' | 'sold-out' | 'completed' | 'archived';
  linkedProducts?: any[];
}

type PaymentMethod = 'bkash' | 'card';

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center min-w-[52px]">
      <span className="block text-3xl font-serif font-medium tabular-nums text-ink leading-tight">{String(value).padStart(2, '0')}</span>
      <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{label}</span>
    </div>
  );
}

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const toast = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Purchase state
  const [quantity, setQuantity] = useState(1);
  const [showTerms, setShowTerms] = useState(false);

  // Countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!campaign?.drawDate) return;
    const targetDate = new Date(campaign.drawDate).getTime();

    const timer = setInterval(() => {
      const diff = targetDate - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [campaign?.drawDate]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isPaying, setIsPaying] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<{ bkash: boolean; card: boolean }>({ bkash: false, card: false });

  useEffect(() => {
    apiClient
      .get('/payments/methods')
      .then((res) => {
        const m = res.data?.data?.methods;
        if (m) {
          const next = { bkash: Boolean(m.bkash), card: Boolean(m.card) };
          setEnabledMethods(next);
          setPaymentMethod(next.card ? 'card' : 'bkash');
        }
      })
      .catch(() => {});
  }, []);

  const fetchCampaign = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/campaigns/${campaignId}`);
      if (res.data?.success) {
        const data: Campaign = res.data.data;
        setCampaign(data);
        const allowance = Math.min(
          data.ticketLimit - data.ticketsSold,
          data.maxTicketsPerUser - (data.userTicketCount || 0)
        );
        setQuantity((q) => Math.max(1, Math.min(q, allowance)));
      } else {
        setError('Failed to load campaign.');
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setError('Could not retrieve campaign details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) fetchCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-stone-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" strokeWidth={1.5} />
        <span className="text-sm">Loading campaign details...</span>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-md mx-auto my-20 px-4 text-center">
        <h2 className="text-3xl font-serif font-medium tracking-tight text-ink">Error loading campaign</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">{error || 'Campaign not found'}</p>
        <Link href="/campaigns" className="inline-block mt-8">
          <Button>Back to Draws</Button>
        </Link>
      </div>
    );
  }

  const anyMethodEnabled = enabledMethods.bkash || enabledMethods.card;

  // A purchase can't exceed the tickets left in the pool or the user's remaining per-user allowance
  const ticketsRemaining = Math.max(0, campaign.ticketLimit - campaign.ticketsSold);
  const ticketsHeld = campaign.userTicketCount || 0;
  const maxQuantity = Math.min(ticketsRemaining, Math.max(0, campaign.maxTicketsPerUser - ticketsHeld));

  const handleCheckoutClick = () => {
    setIsPaymentModalOpen(true);
  };

  // Reserves the tickets server-side and redirects to the gateway. Tickets are issued only
  // after the server verifies the payment, so there is nothing to confirm in the browser.
  const handlePay = async () => {
    setIsPaying(true);
    try {
      const res = await apiClient.post(`/campaigns/${campaignId}/buy`, { quantity, paymentMethod });
      const url = res.data?.data?.redirectUrl;
      if (res.data?.success && url) {
        window.location.href = url;
        return;
      }
      toast.error(res.data?.message || 'Could not start the payment.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start the payment. Please log in and try again.');
    }
    setIsPaying(false);
  };

  const percentSold = Math.min(100, Math.round((campaign.ticketsSold / campaign.ticketLimit) * 100));
  const eyebrow = 'text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400';

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-8 sm:py-12">

      {/* Back link + title */}
      <div className="mb-10">
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-ink transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> All draws
        </Link>
        <p className={`${eyebrow} mt-6 mb-3`}>Lucky Draw</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-ink">{campaign.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-12">
        {/* Left: Prize Details */}
        <div className="lg:col-span-7 space-y-12">
          {/* Prize */}
          <div>
            <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full bg-surface-muted rounded-sm overflow-hidden">
              <Image src={campaign.prizeImage} alt={campaign.prizeName} fill className="object-cover" />
              <span className="absolute top-4 left-4 bg-paper text-ink text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                Grand prize
              </span>
            </div>

            <div className="pt-6 space-y-4 max-w-2xl">
              <h2 className="font-serif text-3xl font-medium tracking-tight text-ink">{campaign.prizeName}</h2>
              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">{campaign.prizeDescription}</p>

              {campaign.description && (
                <div className="pt-4 border-t border-line">
                  <span className={`${eyebrow} block mb-2`}>Campaign description</span>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{campaign.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress & Countdown Section */}
          <div className="border-y border-line py-8 space-y-8">
            <div>
              <div className="flex justify-between items-baseline text-sm tabular-nums mb-3">
                <span className="text-ink font-medium">{percentSold}% sold</span>
                <span className="text-stone-500 dark:text-stone-400">{campaign.ticketsSold} of {campaign.ticketLimit} tickets issued</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-800 h-px relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentSold}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute left-0 -top-px h-0.5 bg-ink"
                />
              </div>
            </div>

            <dl className="grid grid-cols-3 divide-x divide-line">
              {[
                { label: 'Available', value: campaign.ticketLimit - campaign.ticketsSold },
                { label: 'Max per user', value: campaign.maxTicketsPerUser },
                { label: 'Per purchase', value: campaign.ticketsPerPurchase },
              ].map((s, i) => (
                <div key={i} className="px-4 first:pl-0">
                  <dd className="text-3xl font-serif font-medium tabular-nums text-ink">{s.value}</dd>
                  <dt className={`${eyebrow} mt-1`}>{s.label}</dt>
                </div>
              ))}
            </dl>

            {/* Countdown (only when the admin scheduled a draw date) */}
            {campaign.drawDate && campaign.status !== 'completed' && (
              <div>
                <span className={`${eyebrow} block mb-3`}>Draw countdown</span>
                <div className="flex items-start gap-3 sm:gap-5">
                  <CountdownUnit value={timeLeft.days} label="Days" />
                  <CountdownUnit value={timeLeft.hours} label="Hours" />
                  <CountdownUnit value={timeLeft.minutes} label="Minutes" />
                  <CountdownUnit value={timeLeft.seconds} label="Seconds" />
                </div>
              </div>
            )}
          </div>

          {/* Terms & Rules */}
          {campaign.terms && (
            <div className="border-b border-line -mt-6">
              <button onClick={() => setShowTerms(!showTerms)} className="w-full py-4 flex items-center justify-between text-left cursor-pointer" aria-expanded={showTerms}>
                <span className="text-[13px] font-medium tracking-wide text-ink">Campaign Rules &amp; Terms</span>
                {showTerms ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </button>
              <AnimatePresence>
                {showTerms && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="pb-5">
                      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap">{campaign.terms}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Purchase Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border border-line rounded-lg p-6 space-y-5 lg:sticky lg:top-28">
            <span className={eyebrow}>Product to buy</span>

            <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-surface-muted">
              <Image src={campaign.productImage} alt={campaign.productTitle} fill className="object-cover" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-start gap-3">
                <h3 className="text-2xl font-serif font-medium tracking-tight text-ink leading-tight">{campaign.productTitle}</h3>
                <span className="text-lg font-medium tabular-nums text-ink flex-shrink-0">${campaign.productPrice.toFixed(2)}</span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{campaign.productDescription}</p>
            </div>

            {campaign.status === 'active' && maxQuantity < 1 ? (
              <div className="p-4 bg-surface-muted text-center rounded-lg space-y-1">
                <span className="block text-sm text-stone-600 dark:text-stone-300">
                  {ticketsRemaining < 1
                    ? 'All tickets have been sold.'
                    : `You already hold the maximum of ${campaign.maxTicketsPerUser} tickets for this draw.`}
                </span>
                {ticketsRemaining > 0 && (
                  <Link href="/campaigns/my-tickets" className="text-sm text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink">View my tickets</Link>
                )}
              </div>
            ) : campaign.status === 'active' ? (
              <div className="space-y-5 pt-5 border-t border-line">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Quantity</span>
                  <div className="flex items-center border border-line rounded-full h-10 px-2 gap-1">
                    <button
                      type="button"
                      aria-label="Decrease ticket quantity"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-base text-stone-500 hover:text-ink w-7 h-7 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >-</button>
                    <span className="text-sm font-medium w-6 text-center tabular-nums text-ink" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase ticket quantity"
                      disabled={quantity >= maxQuantity}
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      className="text-base text-stone-500 hover:text-ink w-7 h-7 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >+</button>
                  </div>
                </div>

                <div className="space-y-2 text-sm tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Unit price</span>
                    <span className="text-ink">${campaign.productPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Tickets earned</span>
                    <span className="text-ink">{quantity} ticket(s)</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-line font-medium text-ink">
                    <span>Total</span>
                    <span>${(campaign.productPrice * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <Button onClick={handleCheckoutClick} size="lg" className="w-full">
                  Purchase &amp; Get Entry Tickets <ArrowRight className="w-4 h-4" />
                </Button>

                <p className="text-xs text-stone-500 dark:text-stone-400 text-center leading-relaxed">
                  Max {campaign.maxTicketsPerUser} tickets per user
                  {ticketsHeld > 0 && ` (you hold ${ticketsHeld})`} &middot; {ticketsRemaining} tickets remaining
                </p>
              </div>
            ) : (
              <div className="p-4 bg-surface-muted text-center rounded-lg">
                <span className="text-sm text-stone-600 dark:text-stone-300">
                  {campaign.status === 'sold-out' ? 'Sold out. Awaiting draw.' : campaign.status === 'completed' ? 'Completed. Draw finished.' : `Status: ${campaign.status}`}
                </span>
              </div>
            )}
          </div>

          {/* How the draw works */}
          <div className="flex gap-3 px-1">
            <Shield className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h4 className="text-sm font-medium text-ink">How the draw works</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                All draw processes are server-generated using cryptographic randomness. Every participant has equal odds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-surface border border-line rounded-lg w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <button onClick={() => setIsPaymentModalOpen(false)} aria-label="Close" className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-ink z-10 cursor-pointer">✕</button>

              <div className="p-6 border-b border-line space-y-1.5">
                <h3 className="font-serif text-2xl font-medium tracking-tight text-ink">Secure Checkout</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">Pay ${(campaign.productPrice * quantity).toFixed(2)} for {quantity} ticket(s). Tickets are issued once your payment is confirmed.</p>
              </div>

              <div className="p-6 space-y-5">
                {anyMethodEnabled ? (
                  <>
                    <div className={`grid gap-2 ${enabledMethods.bkash && enabledMethods.card ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {([['card', 'Card'], ['bkash', 'bKash']] as const)
                        .filter(([method]) => enabledMethods[method])
                        .map(([method, label]) => (
                          <button key={method} type="button" onClick={() => setPaymentMethod(method)}
                            className={`text-sm h-11 rounded-md border transition-colors cursor-pointer ${paymentMethod === method ? 'border-ink text-ink font-medium' : 'border-line text-stone-500 dark:text-stone-400 hover:border-stone-400'}`}
                          >{label}</button>
                        ))}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      You will be redirected to {paymentMethod === 'bkash' ? 'bKash' : 'a secure card payment page'} to complete the payment. Tickets are held for 30 minutes.
                    </p>
                    <Button onClick={handlePay} disabled={isPaying} className="w-full">
                      {isPaying ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Redirecting...</>) : 'Pay & Get Entry Tickets'}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-center text-stone-500 dark:text-stone-400">
                    Online payments are not available right now, so tickets cannot be purchased. Please check back soon.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
