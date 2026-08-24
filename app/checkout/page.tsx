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

type Step = 'address' | 'payment' | 'confirmation';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
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
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.1;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  const validateAddress = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!address.street.trim()) newErrors.street = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!address.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!cardDetails.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
      if (!cardDetails.cvv.trim()) newErrors.cvv = 'CVV is required';
      if (!cardDetails.cardName.trim()) newErrors.cardName = 'Cardholder name is required';
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

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePayment()) {
      try {
        const response = await apiClient.post('/orders', {
          products: items.map((item) => ({
            product: item.product.id,
            quantity: item.quantity,
          })),
          shippingAddress: address,
          paymentMethod,
        });

        if (response.data?.success) {
          await clearCart();
          setStep('confirmation');
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        setErrors({ form: err.response?.data?.message || 'Failed to place order. Please try again.' });
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

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 'address' || step === 'payment' || step === 'confirmation'
                  ? 'bg-[#8b6f47] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step === 'confirmation' ? <CheckCircle className="w-6 h-6" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Address
            </span>
          </div>
          <div className="w-24 h-1 mx-4 bg-gray-200 dark:bg-gray-700">
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
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 'payment' || step === 'confirmation'
                  ? 'bg-[#8b6f47] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step === 'confirmation' ? <CheckCircle className="w-6 h-6" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment
            </span>
          </div>
          <div className="w-24 h-1 mx-4 bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all ${
                step === 'confirmation' ? 'bg-[#8b6f47] w-full' : 'bg-gray-200 dark:bg-gray-700 w-0'
              }`}
            />
          </div>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 'confirmation'
                  ? 'bg-[#8b6f47] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step === 'confirmation' ? <CheckCircle className="w-6 h-6" /> : '3'}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      label="State"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      error={errors.state}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Zip Code"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="card">Credit/Debit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="cod">Cash on Delivery</option>
                    </select>
                  </div>

                  {paymentMethod === 'card' && (
                    <>
                      <Input
                        label="Cardholder Name"
                        value={cardDetails.cardName}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                        error={errors.cardName}
                        required
                      />
                      <Input
                        label="Card Number"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                        error={errors.cardNumber}
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry Date"
                          value={cardDetails.expiryDate}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                          error={errors.expiryDate}
                          placeholder="MM/YY"
                          required
                        />
                        <Input
                          label="CVV"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          error={errors.cvv}
                          placeholder="123"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-4 pt-2">
                    <Button type="submit" size="lg" className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full">
                      Place Order
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
                      {formatPrice((item.product.price * (1 - item.product.discountPercentage / 100)) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <span>Tax (10%)</span>
                  <span className="font-mono font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <span>Shipping</span>
                  <span className="font-mono font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

