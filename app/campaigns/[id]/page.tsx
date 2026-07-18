'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Ticket, ChevronLeft, CreditCard, RefreshCw, CheckCircle, Smartphone, Shield, ArrowRight, Clock, FileText, ChevronDown, ChevronUp, Users, Zap } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
  ticketsPerPurchase: number;
  status: 'draft' | 'active' | 'paused' | 'sold-out' | 'completed' | 'archived';
  linkedProducts?: any[];
}

type PaymentMethod = 'bkash' | 'nagad' | 'card';

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl px-3 py-2 text-center min-w-[52px] border border-gray-100 dark:border-gray-800 shadow-sm">
      <span className="block text-xl font-mono font-black text-gray-800 dark:text-gray-100 leading-tight">{String(value).padStart(2, '0')}</span>
      <span className="block text-[7px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">{label}</span>
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
    const targetDate = campaign?.drawDate ? new Date(campaign.drawDate).getTime() : Date.now() + 2 * 86400000 + 14 * 3600000;

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [isPaying, setIsPaying] = useState(false);
  const [payStep, setPayStep] = useState<'details' | 'otp' | 'success'>('details');

  // Input states
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [createdTickets, setCreatedTickets] = useState<any[]>([]);

  const fetchCampaign = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/campaigns/${campaignId}`);
      if (res.data?.success) {
        setCampaign(res.data.data);
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <RefreshCw className="w-10 h-10 animate-spin text-[#8b6f47]" />
        <span className="text-sm font-semibold tracking-wider font-serif">Loading Campaign Details...</span>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-3xl shadow-lg">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto text-red-500">✕</div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-3">Error Loading Campaign</h2>
        <p className="text-xs text-gray-400 mt-1">{error || 'Campaign not found'}</p>
        <Link href="/campaigns" className="block mt-6">
          <Button className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full border-0">Back to Draws</Button>
        </Link>
      </div>
    );
  }

  const handleCheckoutClick = () => {
    setFormErrors({});
    setPayStep('details');
    setIsPaymentModalOpen(true);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
      if (!mobileNumber.trim()) {
        errors.mobileNumber = 'Mobile number is required';
      } else if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(mobileNumber.trim())) {
        errors.mobileNumber = 'Provide a valid mobile wallet number';
      }
    } else {
      if (!cardName.trim()) errors.cardName = 'Name on card is required';
      if (!cardNumber.trim()) errors.cardNumber = 'Card number is required';
      if (!cardExpiry.trim()) errors.cardExpiry = 'Expiry date (MM/YY) is required';
      if (!cardCvv.trim()) errors.cardCvv = 'CVV is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setPayStep('otp');
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setFormErrors({ otpCode: 'OTP Code is required' });
      return;
    }

    setIsPaying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await apiClient.post(`/campaigns/${campaignId}/buy`, { quantity, paymentMethod });
      if (res.data?.success) {
        setCreatedTickets(res.data.data.tickets || []);
        setCampaign(res.data.data.campaign);
        setPayStep('success');
        toast.success('Successfully entered draw and purchased product!');
      } else {
        toast.error(res.data?.message || 'Payment simulation failed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unauthorized: Please log in to join lucky draws!');
      setIsPaymentModalOpen(false);
    } finally {
      setIsPaying(false);
    }
  };

  const percentSold = Math.min(100, Math.round((campaign.ticketsSold / campaign.ticketLimit) * 100));
  const circumference = 2 * Math.PI * 54;
  const progressOffset = circumference - (percentSold / 100) * circumference;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/campaigns" className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prize Campaign Center</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#f5f1eb]">{campaign.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Prize Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prize Card */}
          <div className="bg-white dark:bg-[#181715] rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-md overflow-hidden">
            <div className="relative h-80 sm:h-96 w-full bg-gray-50 dark:bg-gray-950">
              <Image src={campaign.prizeImage} alt={campaign.prizeName} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="bg-yellow-500/90 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
                  🏆 Grand Prize
                </span>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="font-serif text-3xl font-extrabold text-white drop-shadow-lg">{campaign.prizeName}</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{campaign.prizeDescription}</p>

              {campaign.description && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Campaign Description</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{campaign.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress & Countdown Section */}
          <div className="bg-white dark:bg-[#181715] rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-md p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circular Progress */}
              <div className="relative flex items-center justify-center flex-shrink-0">
                <svg width="120" height="120" className="transform -rotate-90">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-100 dark:text-gray-800" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke="url(#detailGrad)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={progressOffset}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="detailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b6f47" />
                      <stop offset="100%" stopColor="#c9a96b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <span className="block text-xl font-black text-gray-800 dark:text-white">{percentSold}%</span>
                  <span className="block text-[7px] text-gray-400 uppercase font-bold tracking-wider">Sold</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Tickets Issued: {campaign.ticketsSold}</span>
                  <span>Limit: {campaign.ticketLimit}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentSold}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Available', value: campaign.ticketLimit - campaign.ticketsSold },
                    { label: 'Max/User', value: campaign.maxTicketsPerUser },
                    { label: 'Per Purchase', value: campaign.ticketsPerPurchase },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="block text-sm font-black text-gray-800 dark:text-white">{s.value}</span>
                      <span className="block text-[7px] text-gray-400 uppercase font-bold tracking-wider">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="mt-6 p-4 bg-gradient-to-r from-[#8b6f47]/5 to-[#c9a96b]/5 rounded-2xl border border-[#8b6f47]/10">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b] animate-pulse" />
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Draw Countdown</span>
                <span className="ml-auto text-[8px] text-yellow-600 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-200/20 uppercase tracking-wider">Live</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <CountdownUnit value={timeLeft.days} label="Days" />
                <span className="text-gray-300 text-lg font-bold">:</span>
                <CountdownUnit value={timeLeft.hours} label="Hours" />
                <span className="text-gray-300 text-lg font-bold">:</span>
                <CountdownUnit value={timeLeft.minutes} label="Minutes" />
                <span className="text-gray-300 text-lg font-bold">:</span>
                <CountdownUnit value={timeLeft.seconds} label="Seconds" />
              </div>
            </div>
          </div>

          {/* Terms & Rules */}
          {campaign.terms && (
            <div className="bg-white dark:bg-[#181715] rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-md overflow-hidden">
              <button onClick={() => setShowTerms(!showTerms)} className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b]" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Campaign Rules & Terms</span>
                </div>
                {showTerms ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              <AnimatePresence>
                {showTerms && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{campaign.terms}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Purchase Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#181715] rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-md p-6 space-y-5 lg:sticky lg:top-24">
            <span className="bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-[#8b6f47]/20 inline-block">
              📦 Product to Buy
            </span>

            <div className="relative h-52 w-full rounded-[20px] overflow-hidden bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
              <Image src={campaign.productImage} alt={campaign.productTitle} fill className="object-cover" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-start gap-3">
                <h3 className="text-lg font-serif font-extrabold text-gray-900 dark:text-white leading-tight">{campaign.productTitle}</h3>
                <span className="text-xl font-serif font-black text-[#8b6f47] dark:text-[#c9a96b] flex-shrink-0">${campaign.productPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{campaign.productDescription}</p>
            </div>

            {campaign.status === 'active' ? (
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Quantity:</span>
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full py-1 px-3 gap-3 bg-white dark:bg-gray-900">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-sm font-bold text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 w-5 h-5 flex items-center justify-center">-</button>
                    <span className="text-sm font-bold w-6 text-center text-gray-800 dark:text-white">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(campaign.ticketLimit - campaign.ticketsSold, quantity + 1))} className="text-sm font-bold text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 w-5 h-5 flex items-center justify-center">+</button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Unit Price:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">${campaign.productPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Tickets Earned:</span>
                    <span className="font-bold text-[#8b6f47] dark:text-[#c9a96b]">{quantity} ticket(s)</span>
                  </div>
                  <hr className="border-gray-100 dark:border-gray-800" />
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-800 dark:text-white">Total:</span>
                    <span className="font-black text-[#8b6f47] dark:text-[#c9a96b]">${(campaign.productPrice * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckoutClick}
                  className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  Purchase & Get Entry Tickets <ArrowRight className="w-4 h-4" />
                </Button>

                <p className="text-[9px] text-gray-400 text-center leading-relaxed">
                  Max {campaign.maxTicketsPerUser} tickets per user • {campaign.ticketLimit - campaign.ticketsSold} tickets remaining
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center rounded-2xl border dark:border-gray-800">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {campaign.status === 'sold-out' ? '⛔ Sold Out — Awaiting Draw' : campaign.status === 'completed' ? '🏆 Completed — Draw Finished' : `Status: ${campaign.status}`}
                </span>
              </div>
            )}
          </div>

          {/* Security Badge */}
          <div className="p-4 bg-green-500/5 dark:bg-green-950/10 rounded-2xl border border-green-200/40 dark:border-green-800/30 flex gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-green-700 dark:text-green-400">Verified Lottery Assurance</h4>
              <p className="text-[10px] text-green-600/80 dark:text-green-400/70 mt-0.5 leading-relaxed">
                All draw processes are server-generated using cryptographic randomness. Every participant has equal odds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              {payStep !== 'success' && (
                <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 text-gray-400 hover:text-gray-700 rounded-full z-10">✕</button>
              )}

              {payStep !== 'success' && (
                <div className="bg-gradient-to-r from-[#8b6f47]/10 to-[#c9a96b]/10 p-5 border-b border-gray-100 dark:border-gray-800 text-center space-y-1">
                  <Gift className="w-8 h-8 text-[#8b6f47] mx-auto" />
                  <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">Simulated Payment Gateway</h3>
                  <p className="text-[10px] text-gray-400">Complete mock transaction of ${(campaign.productPrice * quantity).toFixed(2)} to secure ticket entries</p>
                </div>
              )}

              {/* Details Step */}
              {payStep === 'details' && (
                <form onSubmit={handleDetailsSubmit} className="p-6 space-y-5">
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-950 p-1.5 rounded-xl border dark:border-gray-800">
                    {([['bkash', 'bKash', 'bg-pink-600'], ['nagad', 'Nagad', 'bg-orange-600'], ['card', 'Card', 'bg-zinc-800']] as const).map(([method, label, bg]) => (
                      <button key={method} type="button" onClick={() => { setPaymentMethod(method); setFormErrors({}); }}
                        className={`text-xs py-1.5 font-bold rounded-lg transition-all ${paymentMethod === method ? `${bg} text-white shadow-sm` : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >{label}</button>
                    ))}
                  </div>

                  {(paymentMethod === 'bkash' || paymentMethod === 'nagad') ? (
                    <div className="space-y-3.5">
                      <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-[#8b6f47]" />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Simulating {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Mobile Wallet</span>
                      </div>
                      <Input label="Account Mobile Number" placeholder="e.g. 01712345678" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} error={formErrors.mobileNumber} required className="text-xs" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input label="Cardholder Name" placeholder="Master Admin" value={cardName} onChange={(e) => setCardName(e.target.value)} error={formErrors.cardName} required className="text-xs" />
                      <Input label="Card Number" placeholder="4242 4242 4242 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} error={formErrors.cardNumber} required className="text-xs" />
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Expiry Date" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} error={formErrors.cardExpiry} required className="text-xs" />
                        <Input label="CVV" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} error={formErrors.cardCvv} required className="text-xs" />
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full text-xs font-bold py-2.5 rounded-full mt-4">Proceed to Verification</Button>
                </form>
              )}

              {/* OTP Step */}
              {payStep === 'otp' && (
                <form onSubmit={handleOtpVerify} className="p-6 space-y-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 text-[10px] rounded-xl border border-yellow-200 dark:border-yellow-800/30">
                    <strong>Payment Security OTP</strong>: A simulated 6-digit passcode has been generated. Use the mock code <strong>1234</strong> to proceed.
                  </div>
                  <Input label="Verification OTP Code" placeholder="Enter 1234" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} error={formErrors.otpCode} required className="text-xs text-center tracking-widest font-mono font-bold" />
                  <Button type="submit" disabled={isPaying} className="w-full text-xs font-bold py-2.5 rounded-full mt-2 flex items-center justify-center gap-1.5">
                    {isPaying ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Authorizing Payment...</>) : 'Confirm & Purchase'}
                  </Button>
                </form>
              )}

              {/* Success Step */}
              {payStep === 'success' && (
                <div className="p-8 text-center space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto text-green-500">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-extrabold text-gray-900 dark:text-white">Transaction Success!</h3>
                    <p className="text-xs text-gray-400">You purchased {quantity} {campaign.productTitle} item(s) and earned {quantity} draw entries.</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-[20px] border dark:border-gray-800 space-y-2 max-h-[160px] overflow-y-auto">
                    <span className="block text-[8px] text-gray-400 font-black uppercase tracking-wider text-left border-b pb-1 mb-2 dark:border-gray-800">Your Lucky Draw Tickets</span>
                    {createdTickets.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Entry #{idx + 1}</span>
                        <span className="font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b] bg-white dark:bg-gray-900 px-2 py-0.5 rounded border dark:border-gray-800">{t.ticketNumber}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link href="/campaigns/my-tickets" className="flex-1">
                      <Button className="w-full text-xs font-bold py-2.5 rounded-full bg-[#8b6f47] text-white border-0">View My Tickets</Button>
                    </Link>
                    <button onClick={() => { setIsPaymentModalOpen(false); setQuantity(1); }} className="flex-1 text-xs font-bold py-2.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
