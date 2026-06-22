'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { convertCurrency } from '@/lib/currencies';

interface CurrencyContextType {
  defaultCurrency: string;
  updateDefaultCurrency: (code: string) => void;
  rates: Record<string, number>;
  loading: boolean;
  convert: (amount: number, from: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [defaultCurrency, setDefaultCurrency] = useState('IDR');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('fintrack_default_currency');
    if (stored) {
      setDefaultCurrency(stored);
    }

    async function fetchRates() {
      try {
        const res = await fetch('/api/rates');
        const data = await res.json();
        if (data && data.rates) {
          setRates(data.rates);
        }
      } catch (err) {
        console.error('Failed to load rates in context:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRates();
  }, []);

  const updateDefaultCurrency = (code: string) => {
    setDefaultCurrency(code);
    localStorage.setItem('fintrack_default_currency', code);
    
    // Trigger custom event so any other windows or storage event hooks can sync if needed
    window.dispatchEvent(new Event('storage'));
  };

  const convert = (amount: number, from: string) => {
    return convertCurrency(amount, from, defaultCurrency, rates);
  };

  return (
    <CurrencyContext.Provider
      value={{
        defaultCurrency,
        updateDefaultCurrency,
        rates,
        loading,
        convert,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
