import { useMemo } from 'react';

interface Asset {
  id: string;
  name: string;
  class: string;
  units: number;
  avg_price: number;
  current_price: number;
  target_weight: number;
}

interface CAGR {
  bear: number;
  base: number;
  bull: number;
}

export const usePortfolioCalculations = (
  assets: Asset[],
  deposits: Array<{ amount: number; date: string }>,
  cagr: { [key: string]: CAGR }
) => {
  // Total deposits
  const totalDeposits = useMemo(
    () => deposits.reduce((sum, d) => sum + d.amount, 0),
    [deposits]
  );

  // Total current market value
  const totalValue = useMemo(
    () => assets.reduce((sum, a) => sum + a.units * a.current_price, 0),
    [assets]
  );

  // Net gain/loss
  const netGain = useMemo(() => totalValue - totalDeposits, [totalValue, totalDeposits]);
  const netGainPct = useMemo(
    () => (totalDeposits > 0 ? (netGain / totalDeposits) * 100 : 0),
    [netGain, totalDeposits]
  );

  // Monthly deposit (average of last 3)
  const monthlyDeposit = useMemo(() => {
    if (deposits.length === 0) return 0;
    const last3 = deposits.slice(-3);
    return last3.reduce((sum, d) => sum + d.amount, 0) / last3.length;
  }, [deposits]);

  const annualPMT = monthlyDeposit * 12;

  // Asset allocation with weights
  const allocation = useMemo(() => {
    return assets.map((a) => {
      const value = a.units * a.current_price;
      return {
        ...a,
        value,
        actual_weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
      };
    });
  }, [assets, totalValue]);

  // Class allocation
  const classAllocation = useMemo(() => {
    return allocation.reduce(
      (acc, curr) => {
        acc[curr.class] = (acc[curr.class] || 0) + curr.value;
        return acc;
      },
      {} as { [key: string]: number }
    );
  }, [allocation]);

  // Blended CAGR
  const blendedCAGR = useMemo(() => {
    let bear = 0,
      base = 0,
      bull = 0;
    allocation.forEach((a) => {
      const weight = a.actual_weight / 100;
      const rates = cagr[a.class];
      if (rates) {
        bear += weight * rates.bear;
        base += weight * rates.base;
        bull += weight * rates.bull;
      }
    });
    return { bear, base, bull };
  }, [allocation, cagr]);

  // Future Value calculation
  const calculateFV = (rate: number, years: number) => {
    if (rate === 0) return totalValue + annualPMT * years;
    const compound = Math.pow(1 + rate, years);
    return totalValue * compound + (annualPMT * (compound - 1)) / rate;
  };

  // Rebalancing calculator
  const rebalancingTrades = useMemo(() => {
    return allocation.map((asset) => {
      const targetValue = (asset.target_weight / 100) * totalValue;
      const currentValue = asset.value;
      const diff = targetValue - currentValue;
      const unitsToTrade = diff / asset.current_price;

      return {
        id: asset.id,
        name: asset.name,
        currentValue,
        targetValue,
        diff,
        unitsToTrade,
        action: unitsToTrade > 0 ? 'BUY' : unitsToTrade < 0 ? 'SELL' : 'HOLD',
      };
    });
  }, [allocation, totalValue]);

  return {
    totalDeposits,
    totalValue,
    netGain,
    netGainPct,
    monthlyDeposit,
    annualPMT,
    allocation,
    classAllocation,
    blendedCAGR,
    calculateFV,
    rebalancingTrades,
  };
};
