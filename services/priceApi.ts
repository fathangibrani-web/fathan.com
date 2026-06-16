import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface PriceData {
  [key: string]: number;
}

const CRYPTO_IDS: { [key: string]: string } = {
  btc: 'bitcoin',
  eth: 'ethereum',
  ada: 'cardano',
  sol: 'solana',
};

// Fetch crypto prices from CoinGecko (free, no auth needed)
export const fetchCryptoPrices = async (
  symbols: string[]
): Promise<{ [key: string]: number } | null> => {
  try {
    const ids = symbols
      .map((s) => CRYPTO_IDS[s.toLowerCase()])
      .filter(Boolean)
      .join(',');

    if (!ids) return null;

    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids,
        vs_currencies: 'usd',
      },
    });

    const result: PriceData = {};
    Object.entries(CRYPTO_IDS).forEach(([symbol, id]) => {
      if (response.data[id]) {
        result[symbol] = response.data[id].usd;
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return null;
  }
};

// Placeholder for stock/ETF prices (requires paid API like Alpha Vantage, Polygon, etc.)
export const fetchStockPrices = async (
  symbols: string[]
): Promise<{ [key: string]: number } | null> => {
  try {
    // This would require API key from Alpha Vantage, Polygon.io, or similar
    // For now, returning null to indicate manual update needed
    console.log('Stock price fetching requires paid API key. Manual update needed.');
    return null;
  } catch (error) {
    console.error('Error fetching stock prices:', error);
    return null;
  }
};

// Combined fetch for all asset types
export const fetchAllPrices = async (
  assets: Array<{ id: string; class: string }>
): Promise<{ [key: string]: number } | null> => {
  const cryptoSymbols = assets
    .filter((a) => a.class === 'crypto')
    .map((a) => a.id);

  const stockSymbols = assets
    .filter((a) => ['stocks', 'etf'].includes(a.class))
    .map((a) => a.id);

  const [cryptoPrices, stockPrices] = await Promise.all([
    cryptoSymbols.length > 0 ? fetchCryptoPrices(cryptoSymbols) : Promise.resolve(null),
    stockSymbols.length > 0 ? fetchStockPrices(stockSymbols) : Promise.resolve(null),
  ]);

  return { ...(cryptoPrices || {}), ...(stockPrices || {}) };
};
