import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  LayoutDashboard,
  PieChart as PieIcon,
  PlusSquare,
  TrendingUp,
  AlertCircle,
  Trash2,
  Edit2,
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { usePortfolioCalculations } from '../hooks/usePortfolioCalculations';
import { exportPortfolioJSON, importPortfolioJSON, exportPortfolioCSV } from '../utils/export';
import { fetchAllPrices } from '../services/priceApi';
import {
  validateAmount,
  validatePrice,
  validateUnits,
  validateDate,
  validateAssetName,
  validateCAGR,
} from '../utils/validation';

const defaultData = {
  settings: {
    cagr: {
      crypto: { bear: -0.15, base: 0.2, bull: 0.4 },
      etf: { bear: 0.02, base: 0.08, bull: 0.12 },
      sukuk: { bear: 0.05, base: 0.06, bull: 0.07 },
      stocks: { bear: -0.05, base: 0.1, bull: 0.18 },
    },
  },
  deposits: [
    { id: 1, date: '2025-01-01', amount: 1000 },
    { id: 2, date: '2025-02-01', amount: 1000 },
    { id: 3, date: '2025-03-01', amount: 1000 },
  ],
  assets: [
    { id: 'btc', name: 'Bitcoin', class: 'crypto', units: 0.1, avg_price: 45000, current_price: 65000, target_weight: 30 },
    { id: 'voo', name: 'S&P 500 ETF', class: 'etf', units: 10, avg_price: 400, current_price: 520, target_weight: 40 },
    { id: 'sr019', name: 'Sukuk Ritel', class: 'sukuk', units: 50, avg_price: 100, current_price: 102, target_weight: 20 },
    { id: 'aapl', name: 'Apple Inc', class: 'stocks', units: 5, avg_price: 150, current_price: 175, target_weight: 10 },
  ],
  rules: '1. Maintain 60/40 risk ratio.\n2. Do not panic sell crypto during 20% drawdowns.\n3. Rebalance quarterly.',
  snapshots: [] as Array<{ timestamp: number; totalValue: number; totalDeposits: number }>,
};

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

export default function PortfolioApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(defaultData);
  const [projectionYears, setProjectionYears] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<number | null>(null);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([
  ]);

  const calculations = usePortfolioCalculations(
    data.assets,
    data.deposits,
    data.settings.cagr
  );

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('fuad_portfolio_data');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading portfolio:', e);
        showNotification('Error loading portfolio data', 'error');
      }
    } else {
      localStorage.setItem('fuad_portfolio_data', JSON.stringify(defaultData));
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('fuad_portfolio_data', JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // Take daily snapshot for historical tracking
  useEffect(() => {
    if (!isLoaded) return;
    const today = new Date().toDateString();
    const lastSnapshot = data.snapshots?.[data.snapshots.length - 1];
    const lastSnapshotDate = lastSnapshot
      ? new Date(lastSnapshot.timestamp).toDateString()
      : null;

    if (lastSnapshotDate !== today) {
      setData((prev) => ({
        ...prev,
        snapshots: [
          ...(prev.snapshots || []),
          {
            timestamp: Date.now(),
            totalValue: calculations.totalValue,
            totalDeposits: calculations.totalDeposits,
          },
        ],
      }));
    }
  }, [isLoaded, calculations.totalValue, calculations.totalDeposits]);

  const fetchLivePrices = async () => {
    setPricesLoading(true);
    try {
      const prices = await fetchAllPrices(data.assets);
      if (prices && Object.keys(prices).length > 0) {
        const updatedAssets = data.assets.map((asset) => ({
          ...asset,
          current_price: prices[asset.id] || asset.current_price,
        }));
        setData({ ...data, assets: updatedAssets });
        showNotification('Live prices updated successfully');
      } else {
        showNotification('No live prices available (stocks require API key)', 'error');
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      showNotification('Error fetching prices', 'error');
    } finally {
      setPricesLoading(false);
    }
  };

  const handleAddDeposit = (formData: FormData) => {
    const amount = Number(formData.get('amount'));
    const date = formData.get('date') as string;

    const amountValidation = validateAmount(amount);
    const dateValidation = validateDate(date);

    if (!amountValidation.valid) {
      showNotification(amountValidation.error || 'Invalid amount', 'error');
      return;
    }
    if (!dateValidation.valid) {
      showNotification(dateValidation.error || 'Invalid date', 'error');
      return;
    }

    setData({
      ...data,
      deposits: [
        ...data.deposits,
        { id: Date.now(), date, amount },
      ],
    });
    showNotification('Deposit added successfully');
  };

  const handleDeleteDeposit = (id: number) => {
    if (confirm('Are you sure you want to delete this deposit?')) {
      setData({
        ...data,
        deposits: data.deposits.filter((d) => d.id !== id),
      });
      showNotification('Deposit deleted');
    }
  };

  const handleUpdateDeposit = (id: number, amount: number, date: string) => {
    const amountValidation = validateAmount(amount);
    const dateValidation = validateDate(date);

    if (!amountValidation.valid || !dateValidation.valid) {
      showNotification('Invalid deposit data', 'error');
      return;
    }

    setData({
      ...data,
      deposits: data.deposits.map((d) => (d.id === id ? { ...d, amount, date } : d)),
    });
    setEditingDeposit(null);
    showNotification('Deposit updated');
  };

  const handleUpdateAssetPrice = (index: number, price: number) => {
    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) {
      showNotification(priceValidation.error || 'Invalid price', 'error');
      return;
    }

    const newAssets = [...data.assets];
    newAssets[index].current_price = price;
    setData({ ...data, assets: newAssets });
  };

  const pieData = Object.keys(calculations.classAllocation).map((key) => ({
    name: key.toUpperCase(),
    value: calculations.classAllocation[key],
  }));

  const projBear = calculations.calculateFV(
    calculations.blendedCAGR.bear,
    projectionYears
  );
  const projBase = calculations.calculateFV(
    calculations.blendedCAGR.base,
    projectionYears
  );
  const projBull = calculations.calculateFV(
    calculations.blendedCAGR.bull,
    projectionYears
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  // Prepare snapshot chart data
  const snapshotChartData = (data.snapshots || [])
    .slice(-30)
    .map((snap) => ({
      date: new Date(snap.timestamp).toLocaleDateString(),
      value: snap.totalValue,
      deposits: snap.totalDeposits,
      gain: snap.totalValue - snap.totalDeposits,
    }));

  if (!isLoaded)
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* NOTIFICATIONS */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg shadow-lg text-white ${
              notif.type === 'success'
                ? 'bg-emerald-600'
                : 'bg-red-600'
            }`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* HEADER & NAV */}
      <header className="border-b border-slate-800 bg-[#1e293b] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Fuad's Finance Dashboard</h1>
          <nav className="flex space-x-1">
            <NavButton
              icon={LayoutDashboard}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <NavButton
              icon={PieIcon}
              label="Allocation"
              active={activeTab === 'allocation'}
              onClick={() => setActiveTab('allocation')}
            />
            <NavButton
              icon={PlusSquare}
              label="Input"
              active={activeTab === 'input'}
              onClick={() => setActiveTab('input')}
            />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                title="Total Market Value"
                value={formatCurrency(calculations.totalValue)}
                highlight
              />
              <Card title="Total Invested" value={formatCurrency(calculations.totalDeposits)} />
              <Card
                title="Net Gain / Loss"
                value={formatCurrency(calculations.netGain)}
                subtitle={`${calculations.netGain >= 0 ? '+' : ''}${
                  calculations.netGainPct.toFixed(2)
                }%`}
                color={
                  calculations.netGain >= 0 ? 'text-emerald-400' : 'text-red-400'
                }
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Allocation Pie */}
              <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                  Asset Allocation
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center text-xs">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Chart */}
              <div className="lg:col-span-2 bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                  Portfolio Growth (Last 30 Days)
                </h3>
                {snapshotChartData.length > 1 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={snapshotChartData}>
                        <defs>
                          <linearGradient
                            id="colorValue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                          }}
                          formatter={(value) => formatCurrency(value as number)}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#0ea5e9"
                          fillOpacity={1}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <p>Need more data. Check back tomorrow for growth chart.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Projection */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Expected Return Projection
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Assuming ${calculations.annualPMT.toLocaleString()}/year
                    continuous deposits
                  </p>
                </div>
                <div className="text-right text-cyan-400 font-mono text-xl">
                  {projectionYears} Years
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                value={projectionYears}
                onChange={(e) => setProjectionYears(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-8"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">
                    🐻 Bear ({(calculations.blendedCAGR.bear * 100).toFixed(1)}%)
                  </div>
                  <div className="text-lg text-slate-300 font-mono">
                    {formatCurrency(projBear)}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-800/30">
                  <div className="text-xs text-cyan-500 mb-1">
                    🎯 Base ({(calculations.blendedCAGR.base * 100).toFixed(1)}%)
                  </div>
                  <div className="text-2xl text-white font-mono">
                    {formatCurrency(projBase)}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
                  <div className="text-xs text-emerald-500 mb-1">
                    🚀 Bull ({(calculations.blendedCAGR.bull * 100).toFixed(1)}%)
                  </div>
                  <div className="text-lg text-emerald-400 font-mono">
                    {formatCurrency(projBull)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ALLOCATION TAB --- */}
        {activeTab === 'allocation' && (
          <div className="space-y-6">
            {/* Asset Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-800 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Asset Granularity
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4 text-right">Units</th>
                      <th className="px-6 py-4 text-right">Avg Price</th>
                      <th className="px-6 py-4 text-right">Current Price</th>
                      <th className="px-6 py-4 text-right">P&L (%)</th>
                      <th className="px-6 py-4 text-center">Weight Target vs Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {calculations.allocation.map((asset) => {
                      const pl =
                        ((asset.current_price - asset.avg_price) /
                          asset.avg_price) *
                        100;
                      const weightDiff =
                        asset.actual_weight - asset.target_weight;
                      return (
                        <tr
                          key={asset.id}
                          className="hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">
                              {asset.name}{' '}
                              <span className="text-xs text-slate-500 ml-2 uppercase">
                                {asset.class}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {asset.id.toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono">
                            {asset.units}
                          </td>
                          <td className="px-6 py-4 text-right font-mono">
                            {formatCurrency(asset.avg_price)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono">
                            {formatCurrency(asset.current_price)}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-mono ${
                              pl >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {pl > 0 ? '+' : ''}{pl.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <span className="text-xs text-slate-400 w-8 text-right">
                                {asset.target_weight}%
                              </span>
                              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                                <div
                                  className="h-full bg-cyan-500"
                                  style={{
                                    width: `${asset.actual_weight}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={`text-xs w-10 text-left font-mono ${
                                  Math.abs(weightDiff) > 5
                                    ? 'text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              >
                                {asset.actual_weight.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rebalancing Suggestions */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-800 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <RefreshCw size={18} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Rebalancing Calculator
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4 text-right">Current Value</th>
                      <th className="px-6 py-4 text-right">Target Value</th>
                      <th className="px-6 py-4 text-right">Difference</th>
                      <th className="px-6 py-4 text-right">Units to Trade</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {calculations.rebalancingTrades.map((trade) => (
                      <tr
                        key={trade.id}
                        className="hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{trade.name}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {formatCurrency(trade.currentValue)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {formatCurrency(trade.targetValue)}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-mono ${
                            trade.diff > 0
                              ? 'text-emerald-400'
                              : trade.diff < 0
                                ? 'text-red-400'
                                : 'text-slate-300'
                          }`}
                        >
                          {trade.diff > 0 ? '+' : ''}{formatCurrency(trade.diff)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {trade.unitsToTrade > 0
                            ? '+'
                            : ''}{trade.unitsToTrade.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              trade.action === 'BUY'
                                ? 'bg-emerald-900/30 text-emerald-400'
                                : trade.action === 'SELL'
                                  ? 'bg-red-900/30 text-red-400'
                                  : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {trade.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- INPUT TAB --- */}
        {activeTab === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Update Prices */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Monthly Market Update
                </h3>
                <button
                  onClick={fetchLivePrices}
                  disabled={pricesLoading}
                  className="flex items-center space-x-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs rounded font-medium transition-colors"
                >
                  <RefreshCw size={14} />
                  {pricesLoading ? 'Fetching...' : 'Live Prices'}
                </button>
              </div>
              {data.assets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50"
                >
                  <div className="font-medium text-white">
                    {asset.name}{' '}
                    <span className="text-xs text-slate-500 block">
                      {asset.units} units
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      value={asset.current_price}
                      onChange={(e) =>
                        handleUpdateAssetPrice(index, Number(e.target.value))
                      }
                      className="bg-[#0f172a] text-white px-3 py-1 rounded border border-slate-700 w-28 text-right font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* Add Deposit */}
              <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Log New Deposit
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddDeposit(new FormData(e.currentTarget));
                    e.currentTarget.reset();
                  }}
                  className="flex flex-col space-y-3"
                >
                  <input
                    type="date"
                    name="date"
                    required
                    className="bg-[#0f172a] text-white px-4 py-2 rounded border border-slate-700 focus:border-cyan-500 outline-none"
                  />
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount (e.g. 500)"
                    required
                    className="bg-[#0f172a] text-white px-4 py-2 rounded border border-slate-700 focus:border-cyan-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 rounded transition-colors"
                  >
                    Save Deposit
                  </button>
                </form>
              </div>

              {/* Deposit History */}
              <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Deposit History
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.deposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50"
                    >
                      {editingDeposit === deposit.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="date"
                            defaultValue={deposit.date}
                            onBlur={(e) => {
                              handleUpdateDeposit(
                                deposit.id,
                                deposit.amount,
                                e.target.value
                              );
                            }}
                            className="bg-[#0f172a] text-white px-2 py-1 rounded border border-slate-700 text-sm"
                          />
                          <input
                            type="number"
                            defaultValue={deposit.amount}
                            onBlur={(e) => {
                              handleUpdateDeposit(
                                deposit.id,
                                Number(e.target.value),
                                deposit.date
                              );
                            }}
                            className="bg-[#0f172a] text-white px-2 py-1 rounded border border-slate-700 text-sm w-20"
                          />
                          <button
                            onClick={() => setEditingDeposit(null)}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="text-sm text-white">{deposit.date}</div>
                            <div className="text-xs text-slate-500">
                              {formatCurrency(deposit.amount)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingDeposit(deposit.id)}
                              className="text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteDeposit(deposit.id)}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export/Import */}
            <div className="lg:col-span-2 bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Data Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => exportPortfolioJSON(data)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-colors"
                >
                  <Download size={18} />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => exportPortfolioCSV(data.assets)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
                >
                  <Download size={18} />
                  <span>Export CSV</span>
                </button>
                <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors cursor-pointer">
                  <Upload size={18} />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const imported = await importPortfolioJSON(file);
                        if (imported) {
                          setData(imported);
                          showNotification('Portfolio imported successfully');
                        } else {
                          showNotification(
                            'Error importing portfolio',
                            'error'
                          );
                        }
                      }
                    }}
                    hidden
                  />
                </label>
              </div>
            </div>

            {/* Investment Rules */}
            <div className="lg:col-span-2 bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle size={18} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Investment Rules
                </h3>
              </div>
              <textarea
                value={data.rules}
                onChange={(e) => setData({ ...data, rules: e.target.value })}
                className="w-full bg-slate-800/50 text-slate-300 p-4 rounded-lg border border-slate-700/50 min-h-[120px] focus:border-cyan-500 outline-none"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub Components
function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<any>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-800 text-cyan-400'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Card({
  title,
  value,
  subtitle,
  color = 'text-white',
  highlight = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-xl border shadow-lg ${
        highlight
          ? 'bg-cyan-950/30 border-cyan-800/50'
          : 'bg-[#1e293b] border-slate-800'
      }`}
    >
      <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
      <div className={`text-3xl font-bold font-mono tracking-tight ${color}`}>
        {value}
      </div>
      {subtitle && (
        <div className={`text-sm mt-2 font-medium ${color}`}>{subtitle}</div>
      )}
    </div>
  );
}
