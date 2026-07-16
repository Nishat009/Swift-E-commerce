'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Ticket, ChevronLeft, CreditCard, RefreshCw, CheckCircle, Smartphone, Shield, ArrowRight, Clock } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
}

type PaymentMethod = 'bkash' | 'nagad' | 'card';

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Purchase state
  const [quantity, setQuantity] = useState(1);

  // Live ticking countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 35, seconds: 50 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
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

  // Success state
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
    if (campaignId) {
      fetchCampaign();
    }
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
      <div className="max-w-md mx-auto my-12 text-center p-6 bg-white border border-red-200 rounded-3xl shadow-lg">
        <AlertIcon />
        <h2 className="text-lg font-bold text-gray-800 mt-3">Error Loading Campaign</h2>
        <p className="text-xs text-gray-400 mt-1">{error || 'Campaign not found'}</p>
        <Link href="/campaigns" className="block mt-6">
          <Button className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full">Back to Draws</Button>
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

    // Go to OTP validation screen for simulation
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
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await apiClient.post(`/campaigns/${campaignId}/buy`, {
        quantity,
        paymentMethod
      });

      if (res.data?.success) {
        setCreatedTickets(res.data.data.tickets || []);
        setCampaign(res.data.data.campaign);
        setPayStep('success');
      } else {
        alert(res.data?.message || 'Payment simulation failed.');
      }
    } catch (err: any) {
      console.error('Purchase ticket error:', err);
      alert(err.response?.data?.message || 'Unauthorized: Please log in to join lucky draws!');
      setIsPaymentModalOpen(false);
    } finally {
      setIsPaying(false);
    }
  };

  const percentSold = Math.min(100, Math.round((campaign.ticketsSold / campaign.ticketLimit) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header breadcrumb */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/campaigns" className="p-2 bg-white dark:bg-gray-900 border rounded-full hover:bg-gray-55 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lucky Draw Center</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#f5f1eb]">{campaign.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Prize Reward */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-850 rounded-[32px] border border-gray-150/40 dark:border-gray-900 shadow-md p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-yellow-200">
              🏆 The Grand Reward to Win
            </span>
            <h2 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-white pt-2">{campaign.prizeName}</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{campaign.prizeDescription}</p>

            <div className="relative h-96 w-full rounded-[24px] overflow-hidden bg-gray-50 border">
              <Image
                src={campaign.prizeImage}
                alt={campaign.prizeName}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Progress bar and Countdown timer */}
          <div className="space-y-4 pt-4 border-t dark:border-gray-900">
            <div className="space-y-2.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Lottery Entry Levels: {percentSold}%</span>
                <span>{campaign.ticketsSold} / {campaign.ticketLimit} Purchased</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-900 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full transition-all duration-500"
                  style={{ width: `${percentSold}%` }}
                />
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-3 bg-gray-55 dark:bg-gray-900/60 p-4 rounded-2xl border dark:border-gray-800 shadow-inner">
              <Clock className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b] animate-pulse" />
              <div className="text-left flex-1">
                <span className="block text-[9px] text-gray-400 uppercase font-black tracking-wider">Lottery Countdown:</span>
                <span className="block text-sm font-mono font-extrabold text-gray-800 dark:text-gray-250">
                  {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
                </span>
              </div>
              <span className="text-[9px] text-yellow-600 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-250/20 uppercase tracking-wider">
                Live Draw
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Product Details & Purchase */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-gray-850 rounded-[32px] border border-gray-150/40 dark:border-gray-900 shadow-md p-6 space-y-6">
            <span className="bg-[#8b6f47]/10 text-[#8b6f47] text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-[#8b6f47]/20">
              📦 Product to Buy
            </span>

            <div className="relative h-60 w-full rounded-[24px] overflow-hidden bg-gray-50 border">
              <Image
                src={campaign.productImage}
                alt={campaign.productTitle}
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-serif font-extrabold text-gray-900 dark:text-white leading-tight">{campaign.productTitle}</h3>
                <span className="text-xl font-serif font-black text-[#8b6f47] dark:text-[#c9a96b]">${campaign.productPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{campaign.productDescription}</p>
            </div>

            {campaign.status === 'active' ? (
              <div className="space-y-4 pt-4 border-t dark:border-gray-900">
                {/* Quantity selector */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-550">Select Quantity:</span>
                  <div className="flex items-center border border-gray-250 rounded-full py-1 px-3 gap-3 bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-sm font-bold text-gray-400 hover:text-gray-800 w-5 h-5 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-gray-800">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(campaign.ticketLimit - campaign.ticketsSold, quantity + 1))}
                      className="text-sm font-bold text-gray-400 hover:text-gray-800 w-5 h-5 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs py-2 bg-gray-55 dark:bg-gray-900 px-4 rounded-xl">
                  <span className="text-gray-400">Total Purchase:</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">${(campaign.productPrice * quantity).toFixed(2)}</span>
                </div>

                <Button
                  onClick={handleCheckoutClick}
                  className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md mt-4"
                >
                  Purchase & Get Entry Tickets <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center rounded-2xl border dark:border-gray-800">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  This campaign is {campaign.status === 'sold-out' ? 'Sold Out' : 'Completed / Drawn'}
                </span>
              </div>
            )}
          </div>

          {/* Secure Assurance Banner */}
          <div className="p-4 bg-green-500/5 rounded-2xl border border-green-200/50 flex gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-green-700">Verified Lottery Assurance</h4>
              <p className="text-[10px] text-green-600/90 mt-0.5 leading-relaxed">
                Lottery draw processes are programmatically managed. All participants have equal odds, and ticket codes are secured on the Mongoose backend directory.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT AND SUCCESS SIMULATION MODAL */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              
              {payStep !== 'success' && (
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 text-gray-400 hover:text-gray-700 rounded-full z-10"
                >
                  ✕
                </button>
              )}

              {/* Step 1 & 2 Headers */}
              {payStep !== 'success' && (
                <div className="bg-[#8b6f47]/5 p-5 border-b text-center space-y-1">
                  <Gift className="w-8 h-8 text-[#8b6f47] mx-auto" />
                  <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">Simulated Payment Gateway</h3>
                  <p className="text-[10px] text-gray-400">Complete mock transaction of ${(campaign.productPrice * quantity).toFixed(2)} to secure ticket entries</p>
                </div>
              )}

              {/* --- DETAILS INPUT SCREEN --- */}
              {payStep === 'details' && (
                <form onSubmit={handleDetailsSubmit} className="p-6 space-y-5">
                  {/* Payment Tabs Selector */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-55 dark:bg-gray-950 p-1.5 rounded-xl border dark:border-gray-900">
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('bkash'); setFormErrors({}); }}
                      className={`text-xs py-1.5 font-bold rounded-lg transition-all ${
                        paymentMethod === 'bkash'
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-gray-550 hover:bg-gray-105'
                      }`}
                    >
                      bKash
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('nagad'); setFormErrors({}); }}
                      className={`text-xs py-1.5 font-bold rounded-lg transition-all ${
                        paymentMethod === 'nagad'
                          ? 'bg-orange-555 text-white bg-orange-600 shadow-sm'
                          : 'text-gray-550 hover:bg-gray-105'
                      }`}
                    >
                      Nagad
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('card'); setFormErrors({}); }}
                      className={`text-xs py-1.5 font-bold rounded-lg transition-all ${
                        paymentMethod === 'card'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-gray-550 hover:bg-gray-105'
                      }`}
                    >
                      Card
                    </button>
                  </div>

                  {/* Tab forms */}
                  {(paymentMethod === 'bkash' || paymentMethod === 'nagad') ? (
                    <div className="space-y-3.5">
                      <div className="p-3 bg-blue-50/40 rounded-xl border flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-[#8b6f47]" />
                        <span className="text-[10px] text-gray-500 font-bold">Simulating {paymentMethod === 'bkash' ? 'bKash Mobile Wallet' : 'Nagad Mobile Wallet'}</span>
                      </div>
                      <Input
                        label="Account Mobile Number"
                        placeholder="e.g. 01712345678"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        error={formErrors.mobileNumber}
                        required
                        className="text-xs"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        label="Cardholder Name"
                        placeholder="Master Admin"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        error={formErrors.cardName}
                        required
                        className="text-xs"
                      />
                      <Input
                        label="Card Number"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        error={formErrors.cardNumber}
                        required
                        className="text-xs"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Expiry Date"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          error={formErrors.cardExpiry}
                          required
                          className="text-xs"
                        />
                        <Input
                          label="CVV"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          error={formErrors.cardCvv}
                          required
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full text-xs font-bold py-2.5 rounded-full mt-4">
                    Proceed to Verification
                  </Button>
                </form>
              )}

              {/* --- OTP STEP SCREEN --- */}
              {payStep === 'otp' && (
                <form onSubmit={handleOtpVerify} className="p-6 space-y-4">
                  <div className="p-3 bg-yellow-50 text-yellow-800 text-[10px] rounded-xl border border-yellow-200">
                    <strong>Payment Security OTP</strong>: A simulated 6-digit passcode has been generated. Use the mock code <strong>1234</strong> to proceed.
                  </div>
                  <Input
                    label="Verification OTP Code"
                    placeholder="Enter 1234"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    error={formErrors.otpCode}
                    required
                    className="text-xs text-center tracking-widest font-mono font-bold"
                  />

                  <Button
                    type="submit"
                    disabled={isPaying}
                    className="w-full text-xs font-bold py-2.5 rounded-full mt-2 flex items-center justify-center gap-1.5"
                  >
                    {isPaying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing Payment...
                      </>
                    ) : (
                      'Confirm & Purchase'
                    )}
                  </Button>
                </form>
              )}

              {/* --- SUCCESS CONFIRMATION SCREEN --- */}
              {payStep === 'success' && (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-500">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-extrabold text-gray-900 dark:text-white">Transaction Success!</h3>
                    <p className="text-xs text-gray-400">Your mock payment was approved. You purchased {quantity} {campaign.productTitle} items and earned {quantity} draw entries.</p>
                  </div>

                  <div className="p-4 bg-gray-55 dark:bg-gray-950 rounded-[20px] border dark:border-gray-900 space-y-2 max-h-[160px] overflow-y-auto">
                    <span className="block text-[8px] text-gray-400 font-black uppercase tracking-wider text-left border-b pb-1 mb-2">My Lucky Draw Tickets</span>
                    {createdTickets.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Entry #{idx + 1}</span>
                        <span className="font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b] bg-white dark:bg-gray-900 px-2 py-0.5 rounded border">{t.ticketNumber}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link href="/campaigns/my-tickets" className="flex-1">
                      <Button className="w-full text-xs font-bold py-2.5 rounded-full bg-[#8b6f47] text-white border-0">
                        View My Tickets
                      </Button>
                    </Link>
                    <button
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        setQuantity(1);
                      }}
                      className="flex-1 text-xs font-bold py-2.5 rounded-full border border-gray-250 hover:bg-gray-55"
                    >
                      Close Window
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

function AlertIcon() {
  return (
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
      ✕
    </div>
  );
}
