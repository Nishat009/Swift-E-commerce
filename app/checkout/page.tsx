'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Address, Order } from '@/types';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/ui/Loading';

import apiClient from '@/lib/apiClient';
import { useOrderQuote, DeliveryZone } from '@/hooks/useOrderQuote';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { validateAddress as checkAddress } from '@/lib/addressValidation';
import { SITE } from '@/lib/siteConfig';
import { refreshNotifications } from '@/utils/notifications';

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
        if (!m) return;
        const next = { cod: m.cod !== false, bkash: Boolean(m.bkash), card: Boolean(m.card) };
        setEnabledMethods(next);
        // Cash on delivery can be switched off in the admin panel: start on a method that is offered
        if (!next.cod) setPaymentMethod((current) => (next[current as keyof typeof next] ? current : (next.card ? 'card' : 'bkash')));
      })
      .catch(() => {});
  }, []);

  const paymentOptions = [
    { id: 'card', label: 'Credit / Debit Card', hint: 'Pay securely with Stripe', enabled: enabledMethods.card },
    { id: 'bkash', label: 'bKash', hint: 'Pay with your bKash wallet', enabled: enabledMethods.bkash },
    { id: 'cod', label: 'Cash on Delivery', hint: 'Pay when your order arrives', enabled: enabledMethods.cod },
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('applied_coupon');
      if (stored) {
        setCouponCode(stored);
        validateAndApplyCoupon(stored);
      }
    }
  }, []);

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
          refreshNotifications();
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
      <div className="mx-auto max-w-[1440px] px-4 py-24 text-center sm:px-6 lg:px-10">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Your bag is empty</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-stone-500 dark:text-stone-400">
          Your cart is empty. Please add items before checkout.
        </p>
        <Button variant="outline" size="lg" className="mt-8" onClick={() => router.push('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  const fieldClass = 'h-11 rounded-md bg-transparent px-3.5 py-0 focus:border-ink focus:ring-0';
  const sectionTitle = 'font-serif text-2xl font-medium tracking-tight text-ink';
  const textLink = 'cursor-pointer text-xs text-stone-500 underline underline-offset-4 transition-colors hover:text-ink';
  const radioClass = 'size-4 accent-[#171513] dark:accent-[#f5f1eb]';
  const optionClass = (selected: boolean) =>
    `flex items-center gap-3 rounded-lg border p-4 transition-colors ${selected ? 'border-ink' : 'border-line hover:border-stone-400 dark:hover:border-stone-600'}`;
  const stepItems: { id: Step; label: string }[] = [
    { id: 'address', label: 'Address' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmation', label: 'Confirmation' },
  ];
  const stepIndex = stepItems.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <div className="mb-10 border-b border-line pb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Secure checkout</p>
        <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">Checkout</h1>
        <ol className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" aria-label="Checkout steps">
          {stepItems.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3" aria-current={i === stepIndex ? 'step' : undefined}>
              <span className={i === stepIndex ? 'font-medium text-ink' : i < stepIndex ? 'text-stone-600 dark:text-stone-300' : 'text-stone-400'}>
                {i + 1}. {s.label}
              </span>
              {i < stepItems.length - 1 && <span className="h-px w-6 bg-line" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </div>

      {step === 'confirmation' ? (
        <div className="mx-auto max-w-xl py-10 text-center">
          <CheckCircle className="mx-auto mb-6 size-9 text-[#8b6f47] dark:text-[#c9a96b]" strokeWidth={1.25} />
          <h2 className="font-serif text-4xl font-medium tracking-tight text-ink">Order confirmed</h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Thank you for your purchase. Your order has been placed successfully and is currently being processed.
          </p>
          {placedOrderNumber && (
            <p className="mt-5 text-sm font-medium tabular-nums text-ink">Order #{placedOrderNumber}</p>
          )}
          <p className="mt-5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            A confirmation email is on its way to <span className="font-medium text-ink">{user.email}</span>. We will notify you here (the bell at the top) and by email at every step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.push('/products')} size="lg">
              Continue Shopping
            </Button>
            <Button onClick={() => router.push('/orders')} variant="outline" size="lg">
              View Orders
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Main form */}
          <div className="lg:col-span-2">
            {step === 'address' && (
              <form onSubmit={handleAddressSubmit} className="space-y-10">
                <section className="space-y-3">
                  <h2 className={sectionTitle}>Contact</h2>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    <span className="text-ink">{user.email}</span>
                  </p>
                </section>

                <section className="space-y-5 border-t border-line pt-10">
                  <h2 className={sectionTitle}>Shipping address</h2>
                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300">
                        Use a saved address
                      </label>
                      <select
                        value={selectedSavedId}
                        onChange={(e) => {
                          const found = savedAddresses.find((a) => String(a._id || a.id) === e.target.value);
                          if (found) applySavedAddress(found);
                          else startNewAddress();
                        }}
                        className="h-11 w-full rounded-md border border-line bg-transparent px-3 text-sm text-ink focus:border-ink focus:outline-none"
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
                    className={fieldClass}
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    error={errors.street}
                    required
                  />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input
                      label="City"
                      className={fieldClass}
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      error={errors.city}
                      required
                    />
                    <Input
                      label="State / Division"
                      className={fieldClass}
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      error={errors.state}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input
                      label="Postal Code"
                      className={fieldClass}
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      error={errors.zipCode}
                      required
                    />
                    <Input
                      label="Country"
                      className={fieldClass}
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      error={errors.country}
                      required
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-3">
                    <Button type="submit" size="lg" className="h-12 flex-1 sm:flex-none sm:px-10">
                      Continue to Payment
                    </Button>
                    <button type="button" onClick={() => router.push('/cart')} className={textLink}>
                      Back to Cart
                    </button>
                  </div>
                </section>
              </form>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-10">
                {errors.form && (
                  <div role="alert" className="rounded-md border border-red-500/40 px-3.5 py-3 text-sm text-red-600 dark:text-red-400">
                    {errors.form}
                  </div>
                )}

                <section className="flex items-start justify-between gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Ship to</p>
                    <p className="text-ink">{address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}</p>
                    <p className="text-stone-500 dark:text-stone-400">{user.email}</p>
                  </div>
                  <button type="button" onClick={() => setStep('address')} className={`${textLink} shrink-0`}>
                    Change
                  </button>
                </section>

                <section className="space-y-4 border-t border-line pt-10">
                  <h2 className={sectionTitle}>Payment method</h2>
                  <div className="space-y-3">
                    {paymentOptions.map((o) => (
                      <label key={o.id} className={`${optionClass(paymentMethod === o.id)} cursor-pointer`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={o.id}
                          checked={paymentMethod === o.id}
                          onChange={() => setPaymentMethod(o.id)}
                          className={radioClass}
                        />
                        <span>
                          <span className="block text-sm font-medium text-ink">{o.label}</span>
                          <span className="block text-xs text-stone-500 dark:text-stone-400">{o.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {paymentMethod !== 'cod' && (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      You will be redirected to a secure payment page to complete your payment.
                    </p>
                  )}
                </section>

                {isCod && (
                  <fieldset className="space-y-4 border-t border-line pt-10">
                    <legend className={`${sectionTitle} mb-1`}>Delivery</legend>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      Cash on delivery: the delivery charge depends on your location. Please choose one.
                    </p>
                    <div className="space-y-3">
                      {([['inside_dhaka', 'Inside Dhaka'], ['outside_dhaka', 'Outside Dhaka']] as [DeliveryZone, string][]).map(([zone, label]) => {
                        const option = deliveryOptions?.find((d) => d.zone === zone);
                        const disabled = zone === 'inside_dhaka' && !isDhakaAddress;
                        return (
                          <label
                            key={zone}
                            className={`${optionClass(deliveryZone === zone && !disabled)} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            <input
                              type="radio"
                              name="deliveryZone"
                              value={zone}
                              checked={deliveryZone === zone}
                              disabled={disabled}
                              onChange={() => setDeliveryZone(zone)}
                              className={radioClass}
                            />
                            <span className="flex-1 text-sm font-medium text-ink">
                              {label}
                              {disabled && <span className="block text-[11px] font-normal text-stone-500">Only for addresses in Dhaka</span>}
                            </span>
                            {option && (
                              <span className="text-sm font-medium tabular-nums text-ink">
                                {option.charge === 0 ? 'Free' : formatPrice(option.charge)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <div className="flex flex-wrap items-center gap-4 border-t border-line pt-10">
                  <Button type="submit" size="lg" loading={submitting || quoteLoading} disabled={!quote || !!quoteError} className="h-12 flex-1 sm:flex-none sm:px-10">
                    {paymentMethod === 'cod' ? 'Place Order' : 'Place Order & Pay'}
                  </Button>
                  <button type="button" onClick={() => setStep('address')} className={textLink}>
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-line p-6 lg:sticky lg:top-24">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Order summary</h2>
              <ul className="mt-5 divide-y divide-line">
                {items.map((item) => (
                  <li key={`${item.product.id}-${item.selectedVariant?.id || ''}`} className="flex gap-3 py-3 first:pt-0">
                    <div className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
                      <img src={item.product.thumbnail} alt="" className="h-full w-full object-cover object-top" />
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between gap-3 text-sm">
                      <span className="text-stone-600 dark:text-stone-400">
                        <span className="block text-ink">{item.product.title}</span>
                        <span className="text-xs">Qty {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-ink">
                        {formatPrice((item.product.price * (1 - (item.product.discountPercentage || 0) / 100)) * item.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-2 space-y-3 border-t border-line pt-5">
                {quoteError && <p className="text-xs text-red-600 dark:text-red-400">{quoteError}</p>}

                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Promo or coupon code"
                      placeholder="Promo / Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-md border border-line bg-transparent px-3.5 text-sm uppercase text-ink placeholder:normal-case placeholder:text-stone-400 focus:border-ink focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={() => validateAndApplyCoupon(couponCode)}
                      className="h-10"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </Button>
                  </div>
                  {couponMessage && (
                    <p className={`mt-1.5 text-xs ${appliedCoupon ? 'text-stone-600 dark:text-stone-300' : 'text-red-600 dark:text-red-400'}`}>
                      {couponMessage}
                    </p>
                  )}
                </div>

                <dl className="space-y-2.5 pt-2 text-sm text-stone-600 dark:text-stone-400">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums text-ink">{formatPrice(subtotal)}</dd>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <dt>Discount ({appliedCoupon?.code})</dt>
                      <dd className="tabular-nums text-ink">-{formatPrice(discountAmount)}</dd>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between">
                      <dt>Promotion ($300+)</dt>
                      <dd className="tabular-nums text-ink">-{formatPrice(promoDiscount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Tax (10%)</dt>
                    <dd className="tabular-nums text-ink">{formatPrice(tax)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{isCod && deliveryZone ? `Delivery (${zoneLabel(deliveryZone)})` : 'Shipping'}</dt>
                    <dd className="tabular-nums text-ink">{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-4 text-base font-medium text-ink">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{quoteLoading ? 'Checking…' : formatPrice(total)}</dd>
                  </div>
                </dl>
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
          <dl className="space-y-2 text-left text-xs">
            <div className="flex justify-between gap-4"><dt className="text-stone-500">Total</dt><dd className="font-medium tabular-nums text-ink">{formatPrice(total)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-stone-500">Payment</dt><dd className="text-right font-medium text-ink">{paymentOptions.find((o) => o.id === paymentMethod)?.label}</dd></div>
            {isCod && (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Delivery</dt>
                <dd className="text-right font-medium text-ink">{zoneLabel(deliveryZone)}: {shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Deliver to</dt>
              <dd className="text-right font-medium text-ink">{address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}</dd>
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
