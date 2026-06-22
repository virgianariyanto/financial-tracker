let cachedRates: Record<string, number> | null = null;
let lastFetched: number = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  IDR: 16400.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 158.0,
  SGD: 1.35,
};

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && (now - lastFetched < CACHE_DURATION)) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      throw new Error(`Frankfurter API returned status ${res.status}`);
    }
    const data = await res.json();
    if (data && data.rates) {
      const rates = {
        USD: 1.0,
        ...data.rates
      };
      cachedRates = rates;
      lastFetched = now;
      return rates;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallback:', error);
  }

  return cachedRates || FALLBACK_RATES;
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to) return amount;
  
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  
  const fromRate = rates[fromCode];
  const toRate = rates[toCode];
  
  if (fromRate === undefined || toRate === undefined) {
    return amount;
  }
  
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}
