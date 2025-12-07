'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Address, Order } from '@/types';
import { CreditCard, MapPin, CheckCircle } from 'lucide-react';

type Step = 'address' | 'payment' | 'confirmation';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

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

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePayment()) {
      // Simulate order creation
      const order: Order = {
        id: `ORD-${Date.now()}`,
        items,
        total,
        address,
        paymentMethod,
        createdAt: new Date().toISOString(),
      };

      // In a real app, you would save this to a backend
      console.log('Order created:', order);

      clearCart();
      setStep('confirmation');
    }
  };

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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 'address' || step === 'payment' || step === 'confirmation'
                  ? 'bg-blue-600 text-white'
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
                  ? 'bg-blue-600 w-full'
                  : 'bg-gray-200 dark:bg-gray-700 w-0'
              }`}
            />
          </div>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 'payment' || step === 'confirmation'
                  ? 'bg-blue-600 text-white'
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
                step === 'confirmation' ? 'bg-blue-600 w-full' : 'bg-gray-200 dark:bg-gray-700 w-0'
              }`}
            />
          </div>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 'confirmation'
                  ? 'bg-blue-600 text-white'
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {step === 'address' && (
            <form onSubmit={handleAddressSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
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
                <div className="flex gap-4">
                  <Button type="submit" size="lg" className="flex-1">
                    Continue to Payment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/cart')}
                    size="lg"
                  >
                    Back to Cart
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
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

                <div className="flex gap-4">
                  <Button type="submit" size="lg" className="flex-1">
                    Place Order
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('address')}
                    size="lg"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === 'confirmation' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Order Confirmed!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/products')} size="lg">
                  Continue Shopping
                </Button>
                <Button onClick={() => router.push('/orders')} variant="outline" size="lg">
                  View Orders
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        {step !== 'confirmation' && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.product.title} × {item.quantity}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      ${(item.product.price * (1 - item.product.discountPercentage / 100) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

