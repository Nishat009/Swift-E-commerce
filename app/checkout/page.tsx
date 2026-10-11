'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Address, Order } from '@/types';
import { CreditCard, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/ui/Loading';

import apiClient from '@/lib/apiClient';
import { useOrderQuote, DeliveryZone } from '@/hooks/useOrderQuote';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { validateAddress as checkAddress } from '@/lib/addressValidation';
import { SITE } from '@/lib/siteConfig';

type Step = 'address' | 'payment' | 'confirmation';

const EMPTY_ADDRESS: Address = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: SITE.defaultCountry,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { symbol: currencySymbol, rate: currencyRate } = useCurrencyStore();
  
  const formatPrice = (amount: number) => {
    const converted = amount * currencyRate;
    return `${currencySymbol}${converted.toFixed(2)}`;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [user, loading, router]);

  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [enabledMethods, setEnabledMethods] = useState<{ cod: boolean; bkash: boolean; card: boolean }>({ cod: true, bkash: false, card: false });

  useEffect(() => {
    apiClient
      .get('/payments/methods')
      .then((res) => {
        const m = res.data?.data?.methods;
        if (m) setEnabledMethods({ cod: true, bkash: Boolean(m.bkash), card: Boolean(m.card) });
      })
      .catch(() => {});
  }, []);

  const paymentOptions = [
    { id: 'card', label: 'Credit / Debit Card', hint: 'Pay securely with Stripe', enabled: enabledMethods.card },
    { id: 'bkash', label: 'bKash', hint: 'Pay with your bKash wallet', enabled: enabledMethods.bkash },
    { id: 'cod', label: 'Cash on Delivery', hint: 'Pay when your order arrives', enabled: true },
  ].filter((o) => o.enabled);
  // Cash on delivery: where the parcel goes decides the delivery charge (the server prices it)
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | ''>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');

  const savedAddresses = (user?.addresses || []) as (Address & { _id?: string; id?: string })[];

  const applySavedAddress = (addr: Address & { _id?: string; id?: string }) => {
    setSelectedSavedId(String(addr._id || addr.id || ''));
    setAddress({
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || SITE.defaultCountry,
    });
    setErrors({});
  };

  // "Enter a new address": start from a blank form instead of editing the saved one
  const startNewAddress = () => {
    setSelectedSavedId('');
    setAddress(EMPTY_ADDRESS);
    setErrors({});
  };

  // Prefill the shipping form with the user's default saved address
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedSavedId && !address.street) {
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      applySavedAddress(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; isFixed?: boolean } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('applied_coupon');
      if (stored) {
        setCouponCode(stored);
        validateAndApplyCoupon(stored);
      }
    }
  }, []);

  const validateAndApplyCoupon = async (codeToTest: string) => {
    const code = codeToTest.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponMessage('');
    try {
      const res = await apiClient.get(`/coupons/${code}`);
      if (res.data?.success && res.data.data) {
        const coupon = res.data.data;
        const discountVal = coupon.percentage ? coupon.percentage / 100 : (coupon.amount || 0);
        setAppliedCoupon({ code: coupon.code, discount: discountVal, isFixed: Boolean(coupon.amount) });
        setCouponMessage(`Coupon "${coupon.code}" applied!`);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('applied_coupon', coupon.code);
        }
      } else {
        setAppliedCoupon(null);
        setCouponMessage('Invalid coupon code');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('applied_coupon');
      }
      setCouponMessage(err.response?.data?.message || 'Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const isCod = paymentMethod === 'cod';
  const isDhakaAddress = /dhaka|ঢাকা/i.test(address.city);
  // Pre-select the zone from the address city; the customer can change it ("Inside Dhaka" only for Dhaka)
  useEffect(() => {
    if (!isCod) return;
    setDeliveryZone((zone) => (isDhakaAddress ? zone || 'inside_dhaka' : 'outside_dhaka'));
  }, [isCod, isDhakaAddress]);
  const { quote, error: quoteError, loading: quoteLoading } = useOrderQuote(items, appliedCoupon?.code, { paymentMethod, deliveryZone });
  // Keep the last delivery prices on screen while a new quote is loading
  const [deliveryOptions, setDeliveryOptions] = useState<NonNullable<typeof quote>['deliveryOptions']>([]);
  useEffect(() => {
    if (quote?.deliveryOptions) setDeliveryOptions(quote.deliveryOptions);
  }, [quote]);
  const zoneLabel = (zone: string) => (zone === 'inside_dhaka' ? 'Inside Dhaka' : zone === 'outside_dhaka' ? 'Outside Dhaka' : '');
  const subtotal = quote?.subtotal ?? 0;
  const discountAmount = quote?.discount ?? 0;
  const promoDiscount = quote?.promoDiscount ?? 0;
  const tax = quote?.tax ?? 0;
  const shipping = quote?.shipping ?? 0;
  const total = quote?.total ?? 0;

  const validateAddress = (): boolean => {
    const newErrors: Record<string, string> = { ...checkAddress(address) };

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!paymentOptions.some((o) => o.id === paymentMethod)) {
      newErrors.form = 'Please choose an available payment method';
    } else if (isCod && !deliveryZone) {
      newErrors.form = 'Please choose Inside Dhaka or Outside Dhaka for delivery';
    } else if (isCod && deliveryZone === 'inside_dhaka' && !isDhakaAddress) {
      newErrors.form = 'Inside Dhaka delivery is only for addresses in Dhaka. Choose Outside Dhaka.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddress()) {
      setStep('payment');
    }
  };

  // "Place order" first asks "Are you sure?"; only Confirm sends the order
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!quote || quoteLoading || quoteError) {
      setErrors({ form: quoteError || 'Please wait while we confirm your order total.' });
      return;
    }
    if (validatePayment()) setConfirmOpen(true);
  };

  const placeOrder = async () => {
    if (submitting) return;
    setConfirmOpen(false);
    if (quote && !quoteLoading && !quoteError && validatePayment()) {
      setSubmitting(true);
      try {
        const response = await apiClient.post('/orders', {
          products: items.map((item) => ({
            product: item.product.id,
            quantity: item.quantity,
            variant: item.selectedVariant,
          })),
          shippingAddress: address,
          paymentMethod,
          deliveryZone: isCod ? deliveryZone : undefined,
          couponCode: appliedCoupon?.code || undefined,
        });

        if (response.data?.success) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('applied_coupon');
          }
          const createdOrder = response.data.data;
          setPlacedOrderNumber(createdOrder?.orderNumber || '');
          await clearCart().catch(() => {});

          if (paymentMethod === 'bkash' || paymentMethod === 'card') {
            // Online payment: hand over to the gateway (verified server-side on return)
            try {
              const pay = await apiClient.post(`/payments/orders/${createdOrder.id}/initiate`, { method: paymentMethod });
              const url = pay.data?.data?.redirectUrl;
              if (pay.data?.success && url) {
                window.location.href = url;
                return;
              }
              throw new Error(pay.data?.message || 'Could not start payment');
            } catch (payErr: any) {
              // The order exists; the customer can retry from the orders page
              router.push('/orders?payment=failed&order=' + createdOrder.id);
              return;
            }
          }
          setStep('confirmation');
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        const details = err.response?.data?.errors;
        // Address problems the server caught: send the shopper back to fix the fields
        const addressErrors: Record<string, string> = {};
        if (details && typeof details === 'object') {
          Object.entries(details).forEach(([key, msg]) => {
            if (key.startsWith('shippingAddress.') && typeof msg === 'string') {
              addressErrors[key.slice('shippingAddress.'.length)] = msg;
            }
          });
        }
        if (Object.keys(addressErrors).length) {
          setErrors(addressErrors);
          setStep('address');
          return;
        }
        const detailMsg = details && typeof details === 'object'
          ? Object.values(details).filter((v) => typeof v === 'string').join(', ')
          : '';
        setErrors({ form: detailMsg || err.response?.data?.message || 'Failed to place order. Please try again.' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading || !user) {
    return <Loading />;
  }

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            Your cart is empty. Please add items before checkout.
          </p>
          <Button onClick={() => router.push('/products')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      {/* Progress Steps (Responsive for 320px to 1920px viewports) */}
      <div className="mb-8 px-2">
        <div className="flex items-center justify-center max-w-xl mx-auto">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm shrink-0 ${
                step === 'address' || step === 'payment' || step === 'confirmation'
                  ? 'bg-[#8b6f47] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step === 'confirmation' ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" /> : '1'}
            </div>
            <span className="hidden xs:inline sm:inline ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Address
            </span>
          </div>
          <div className="flex-1 max-w-[48px] sm:max-w-[80px] h-0.5 sm:h-1 mx-1.5 sm:mx-3 bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all ${
                step === 'payment' || step === 'confirmation'
                  ? 'bg-[#8b6f47] w-full'
                  : 'bg-gray-200 dark:bg-gray-700 w-0'
              }`}
            />
          </div>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm shrink-0 ${
                step === 'payment' || step === 'confirmation'
                  ? 'bg-[#8b6f47] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step === 'confirmation' ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" /> : '2'}
            </div>
            <span className="hidden xs:inline sm:inline ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment
            </span>
          </div>
          <div className="flex-1 max-w-[48px] sm:max-w-[80px] h-0.5 sm:h-1 mx-1.5 sm:mx-3 bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all ${
                step === 'confirmation' ? 'bg-[#8b6f47] w-full' : 'bg-gray-200 dark:bg-gray-700 w-0'
              }`}
            />
          </div>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm shrink-0 ${
                step === 'confirmation'
                  ? 'bg-[#8b6f47] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step === 'confirmation' ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" /> : '3'}
            </div>
            <span className="hidden xs:inline sm:inline ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmation
            </span>
          </div>
        </div>
      </div>

      {step === 'confirmation' ? (
        <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-gray-800 rounded-[32px] shadow-lg border border-gray-100 dark:border-gray-900 p-10 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce" />
          <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Order Confirmed!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Thank you for your purchase. Your order has been placed successfully and is currently being processed.
          </p>
          {placedOrderNumber && (
            <p className="text-sm font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b] mb-8">
              Order #{placedOrderNumber}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => router.push('/products')} 
              size="lg"
              className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 border-0 shadow-md"
            >
              Continue Shopping
            </Button>
            <Button 
              onClick={() => router.push('/orders')} 
              variant="outline" 
              size="lg"
              className="border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-full font-bold px-6"
            >
              View Orders
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {step === 'address' && (
              <form onSubmit={handleAddressSubmit} className="bg-white dark:bg-gray-850 rounded-[24px] border border-gray-100 dark:border-gray-900 shadow-md p-6">
                <div className="flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-[#8b6f47] dark:text-[#c9a96b] mr-2" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Address</h2>
                </div>
                <div className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Use a saved address
                      </label>
                      <select
                        value={selectedSavedId}
                        onChange={(e) => {
                          const found = savedAddresses.find((a) => String(a._id || a.id) === e.target.value);
                          if (found) applySavedAddress(found);
                          else startNewAddress();
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Enter a new address</option>
                        {savedAddresses.map((a) => (
                          <option key={String(a._id || a.id)} value={String(a._id || a.id)}>
                            {a.street}, {a.city}{a.isDefault ? ' (default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Input
                    label="Street Address"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    error={errors.street}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      error={errors.city}
                      required
                    />
                    <Input
                      label="State / Division"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      error={errors.state}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Postal Code"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      error={errors.zipCode}
                      required
                    />
                    <Input
                      label="Country"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      error={errors.country}
                      required
                    />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Button type="submit" size="lg" className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full">
                      Continue to Payment
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/cart')}
                      size="lg"
                      className="rounded-full"
                    >
                      Back to Cart
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="bg-white dark:bg-gray-855 rounded-[24px] border border-gray-100 dark:border-gray-900 shadow-md p-6">
                {errors.form && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded mb-4">{errors.form}</div>}
                <div className="flex items-center mb-6">
                  <CreditCard className="w-6 h-6 text-[#8b6f47] dark:text-[#c9a96b] mr-2" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Method</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    {paymentOptions.map((o) => (
                      <label
                        key={o.id}
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                          paymentMethod === o.id
                            ? 'border-[#8b6f47] bg-[#8b6f47]/5'
                            : 'border-gray-200 dark:border-gray-700 hover:border-[#8b6f47]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={o.id}
                          checked={paymentMethod === o.id}
                          onChange={() => setPaymentMethod(o.id)}
                          className="accent-[#8b6f47]"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">{o.label}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{o.hint}</span>
                        </span>
                      </label>
                    ))}
                    {isCod && (
                      <fieldset className="rounded-2xl border border-[#8b6f47]/30 bg-[#8b6f47]/5 p-4 space-y-3">
                        <legend className="px-1 text-sm font-bold text-gray-900 dark:text-white">Where should we deliver?</legend>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Cash on delivery: the delivery charge depends on your location. Please choose one.
                        </p>
                        {([['inside_dhaka', 'Inside Dhaka'], ['outside_dhaka', 'Outside Dhaka']] as [DeliveryZone, string][]).map(([zone, label]) => {
                          const option = deliveryOptions?.find((d) => d.zone === zone);
                          const disabled = zone === 'inside_dhaka' && !isDhakaAddress;
                          return (
                            <label
                              key={zone}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                disabled ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'cursor-pointer'
                              } ${deliveryZone === zone ? 'border-[#8b6f47] bg-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700'}`}
                            >
                              <input
                                type="radio"
                                name="deliveryZone"
                                value={zone}
                                checked={deliveryZone === zone}
                                disabled={disabled}
                                onChange={() => setDeliveryZone(zone)}
                                className="accent-[#8b6f47]"
                              />
                              <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                                {label}
                                {disabled && <span className="block text-[11px] font-normal text-gray-500">Only for addresses in Dhaka</span>}
                              </span>
                              {option && (
                                <span className="font-mono text-sm font-bold text-[#8b6f47] dark:text-[#c9a96b]">
                                  {option.charge === 0 ? 'Free' : formatPrice(option.charge)}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </fieldset>
                    )}
                    {paymentMethod !== 'cod' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        You will be redirected to a secure payment page to complete your payment.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button type="submit" size="lg" loading={submitting || quoteLoading} disabled={!quote || !!quoteError} className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full">
                      {paymentMethod === 'cod' ? 'Place Order' : 'Place Order & Pay'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('address')}
                      size="lg"
                      className="rounded-full"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-850 rounded-[24px] border border-gray-100 dark:border-gray-900 shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.product.title} × {item.quantity}
                    </span>
                    <span className="text-gray-900 dark:text-white font-mono font-medium">
                      {formatPrice((item.product.price * (1 - (item.product.discountPercentage || 0) / 100)) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                {quoteError && <p className="text-xs text-red-600">{quoteError}</p>}
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-mono">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <span>Promotion ($300+)</span>
                    <span className="font-mono">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <span>Tax (10%)</span>
                  <span className="font-mono font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <span>{isCod && deliveryZone ? `Delivery (${zoneLabel(deliveryZone)})` : 'Shipping'}</span>
                  <span className="font-mono font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                {/* Promo Code Input */}
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo / Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 uppercase font-mono"
                    />
                    <button
                      type="button"
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={() => validateAndApplyCoupon(couponCode)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={`text-[11px] mt-1 ${appliedCoupon ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {couponMessage}
                    </p>
                  )}
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b]">{quoteLoading ? 'Checking…' : formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={placeOrder}
        title="Are you sure you want to place this order?"
        message={
          <dl className="text-left space-y-2 text-xs">
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Total</dt><dd className="font-mono font-bold text-gray-900 dark:text-white">{formatPrice(total)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Payment</dt><dd className="font-semibold text-gray-900 dark:text-white text-right">{paymentOptions.find((o) => o.id === paymentMethod)?.label}</dd></div>
            {isCod && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Delivery</dt>
                <dd className="font-semibold text-gray-900 dark:text-white text-right">{zoneLabel(deliveryZone)}: {shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Deliver to</dt>
              <dd className="font-semibold text-gray-900 dark:text-white text-right">{address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}</dd>
            </div>
          </dl>
        }
        confirmText="Yes, place order"
        cancelText="Go back"
        variant="primary"
        isLoading={submitting}
      />
    </div>
  );
}

