export interface MarketSignal {
  stockChange30d: number | null;
  ibovChange30d: number | null;
  volatility30d: number | null;
  isProxy: boolean;
  source: string;
}

interface CachedSignal {
  signal: MarketSignal;
  cachedAt: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

const BANK_TICKERS: Record<string, string | null> = {
  nubank: 'nu',
  itau: 'itub4',
  bb: 'bbas3',
  bradesco: 'bbdc4',
  caixa: null,
  santander: 'sanb11',
  inter: 'inbr32',
  c6: null,
  btg: 'bpac11',
  pagbank: 'pags',
  safra: null,
  original: null,
  next: null,
  neon: null,
};

const FALLBACK_MARKET: Record<string, Omit<MarketSignal, 'source'>> = {
  nubank: { stockChange30d: -4.2, ibovChange30d: -1.3, volatility30d: 49, isProxy: false },
  itau: { stockChange30d: -1.2, ibovChange30d: -1.3, volatility30d: 28, isProxy: false },
  bb: { stockChange30d: 0.9, ibovChange30d: -1.3, volatility30d: 25, isProxy: false },
  bradesco: { stockChange30d: -2.5, ibovChange30d: -1.3, volatility30d: 30, isProxy: false },
  caixa: { stockChange30d: -1.8, ibovChange30d: -1.3, volatility30d: 32, isProxy: true },
  santander: { stockChange30d: -2.0, ibovChange30d: -1.3, volatility30d: 29, isProxy: false },
  inter: { stockChange30d: -5.4, ibovChange30d: -1.3, volatility30d: 55, isProxy: false },
  c6: { stockChange30d: -3.6, ibovChange30d: -1.3, volatility30d: 45, isProxy: true },
  btg: { stockChange30d: 1.2, ibovChange30d: -1.3, volatility30d: 27, isProxy: false },
  pagbank: { stockChange30d: -3.9, ibovChange30d: -1.3, volatility30d: 42, isProxy: false },
  safra: { stockChange30d: -0.8, ibovChange30d: -1.3, volatility30d: 26, isProxy: true },
  original: { stockChange30d: -2.4, ibovChange30d: -1.3, volatility30d: 40, isProxy: true },
  next: { stockChange30d: -2.5, ibovChange30d: -1.3, volatility30d: 35, isProxy: true },
  neon: { stockChange30d: -4.1, ibovChange30d: -1.3, volatility30d: 46, isProxy: true },
};

export class MarketStressService {
  private cache = new Map<string, CachedSignal>();

  async getMarketSignal(bankSlug: string, bankType: 'digital' | 'traditional'): Promise<MarketSignal> {
    const cacheKey = `${bankSlug}:${bankType}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.signal;
    }

    const ticker = BANK_TICKERS[bankSlug] ?? null;

    if (!ticker) {
      const proxy = this.getProxySignal(bankSlug, bankType);
      this.cache.set(cacheKey, { signal: proxy, cachedAt: Date.now() });
      return proxy;
    }

    try {
      const [stock, ibov] = await Promise.all([
        this.fetchFromStooq(ticker),
        this.fetchFromStooq('bova11'),
      ]);

      if (!stock || !ibov) {
        throw new Error('Sem histórico suficiente no provedor');
      }

      const signal: MarketSignal = {
        stockChange30d: stock.change30d,
        ibovChange30d: ibov.change30d,
        volatility30d: stock.volatility30d,
        isProxy: false,
        source: 'stooq',
      };

      this.cache.set(cacheKey, { signal, cachedAt: Date.now() });
      return signal;
    } catch {
      const fallback = this.getFallbackSignal(bankSlug, bankType);
      this.cache.set(cacheKey, { signal: fallback, cachedAt: Date.now() });
      return fallback;
    }
  }

  private getProxySignal(bankSlug: string, bankType: 'digital' | 'traditional'): MarketSignal {
    const base = FALLBACK_MARKET[bankSlug] ?? {
      stockChange30d: bankType === 'digital' ? -3.2 : -1.1,
      ibovChange30d: -1.3,
      volatility30d: bankType === 'digital' ? 44 : 28,
      isProxy: true,
    };

    return {
      ...base,
      isProxy: true,
      source: 'proxy-peers',
    };
  }

  private getFallbackSignal(bankSlug: string, bankType: 'digital' | 'traditional'): MarketSignal {
    const base = FALLBACK_MARKET[bankSlug] ?? this.getProxySignal(bankSlug, bankType);

    return {
      ...base,
      source: 'fallback-model',
    };
  }

  private async fetchFromStooq(symbol: string): Promise<{ change30d: number; volatility30d: number } | null> {
    const normalized = symbol.toLowerCase();
    const url = `https://stooq.com/q/d/l/?s=${normalized}.bv&i=d`;

    const response = await fetch(url, {
      headers: {
        Accept: 'text/csv',
      },
      next: { revalidate: 60 * 60 * 6 },
    });

    if (!response.ok) {
      return null;
    }

    const csv = await response.text();
    const lines = csv.trim().split('\n');

    if (lines.length < 40) {
      return null;
    }

    const closes: number[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const close = Number(cols[4]);
      if (!Number.isNaN(close) && close > 0) {
        closes.push(close);
      }
    }

    if (closes.length < 35) {
      return null;
    }

    const recent = closes.slice(-31);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const change30d = ((last - first) / first) * 100;

    const returns: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      returns.push((recent[i] - recent[i - 1]) / recent[i - 1]);
    }

    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
    const dailyStd = Math.sqrt(variance);
    const volatility30d = dailyStd * Math.sqrt(252) * 100;

    return {
      change30d,
      volatility30d,
    };
  }
}

export const marketStressService = new MarketStressService();
