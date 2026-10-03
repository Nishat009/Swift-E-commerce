'use client';

import { useEffect, useState } from 'react';
import { CartItem } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export type OrderQuote = {
  subtotal: number; discount: number; promoDiscount: number; tax: number; shipping: number; total: number; coupon: string;
};

export function useOrderQuote(items: CartItem[], couponCode?: string) {
  const { user } = useAuth();
  const [quoteState, setQuoteState] = useState<{ key: string; quote: OrderQuote } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fingerprint = JSON.stringify(items.map((item) => ({
    product: item.product.id, quantity: item.quantity, variant: item.selectedVariant,
  })));
  const key = `${user?.id || ''}:${couponCode || ''}:${fingerprint}`;
  const quote = quoteState?.key === key ? quoteState.quote : null;

  useEffect(() => {
    if (!items.length || !user) {
      setQuoteState(null);
      return;
    }
    let active = true;
    setQuoteState(null);
    setLoading(true);
    setError('');
    apiClient.post('/orders/quote', { products: JSON.parse(fingerprint), couponCode })
      .then((response) => { if (active) setQuoteState({ key, quote: response.data.data }); })
      .catch((err) => {
        if (active) {
          setQuoteState(null);
          setError(err.response?.data?.message || 'Could not confirm the current price.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fingerprint, couponCode, items.length, user?.id]);

  return { quote, error, loading };
}
