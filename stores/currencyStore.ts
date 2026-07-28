import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/apiClient';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

interface CurrencyState {
  code: string;
  symbol: string;
  rate: number;
  availableCurrencies: CurrencyInfo[];
  setCurrency: (code: string) => void;
  loadCurrencies: () => Promise<void>;
  format: (amount: number) => string;
}

const defaultCurrencies: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', rate: 1.0 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.78 },
  { code: 'BDT', symbol: '৳', rate: 118.0 },
];

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      code: 'USD',
      symbol: '$',
      rate: 1.0,
      availableCurrencies: defaultCurrencies,
      setCurrency: (code: string) => {
        const { availableCurrencies } = get();
        const details = availableCurrencies.find((c) => c.code === code);
        if (details) {
          set({ code, symbol: details.symbol, rate: details.rate });
        }
      },
      loadCurrencies: async () => {
        try {
          const response = await apiClient.get('/currencies');
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const list = response.data.data;
            set({ availableCurrencies: list });
            
            // Check if active code is still available
            const currentCode = get().code;
            const active = list.find((c: any) => c.code === currentCode);
            if (!active) {
              const usd = list.find((c: any) => c.code === 'USD') || list[0];
              if (usd) {
                set({ code: usd.code, symbol: usd.symbol, rate: usd.rate });
              }
            } else {
              // Update symbol/rate to match fresh backend data
              set({ symbol: active.symbol, rate: active.rate });
            }
          }
        } catch (error) {
          console.error('Failed to load dynamic currencies, using defaults:', error);
          set({ availableCurrencies: defaultCurrencies });
        }
      },
      format: (amount: number) => {
        const { symbol, rate } = get();
        const converted = amount * rate;
        
        // For BDT, format without decimal places since Taka transactions are usually integers
        if (get().code === 'BDT') {
          return `${symbol}${Math.round(converted).toLocaleString()}`;
        }
        return `${symbol}${converted.toFixed(2)}`;
      },
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({
        code: state.code,
        symbol: state.symbol,
        rate: state.rate,
        availableCurrencies: state.availableCurrencies,
      }),
    }
  )
);
