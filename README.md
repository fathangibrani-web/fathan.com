# Fuad's Finance Dashboard

A comprehensive personal finance portfolio dashboard built with React, TypeScript, and Recharts.

## Features

### 📊 Dashboard
- **Real-time Portfolio Metrics**: Total market value, invested amount, net gain/loss
- **Asset Allocation Visualization**: Interactive pie chart showing asset class distribution
- **Historical Growth Tracking**: Time-series chart showing portfolio value growth over the last 30 days
- **Dynamic Projections**: Bear/Base/Bull scenario modeling with adjustable time horizon (1-30 years)
- **Blended CAGR Calculation**: Weighted average return rates based on current asset allocation

### 💰 Asset Management
- **Granular Asset Tracking**: Detailed table with units, average price, current price, P&L%, and allocation weights
- **Weight Monitoring**: Visual indicators for allocation drift (alerts if >5% off target)
- **Performance Analysis**: Individual asset P&L tracking

### 🔄 Rebalancing Tools
- **Rebalancing Calculator**: Suggests exact trades (buy/sell quantities) to reach target allocation
- **Action-based Recommendations**: Clear BUY/SELL/HOLD signals for each asset

### 💾 Data Management
- **Auto-save to LocalStorage**: Automatic persistence of portfolio data
- **JSON Export/Import**: Full backup and restore capability
- **CSV Export**: Asset data export for spreadsheet analysis
- **Deposit History**: Complete transaction log with edit/delete functionality

### 🔄 Live Price Updates
- **CoinGecko Integration**: Free live cryptocurrency price fetching
- **Manual Price Updates**: Easy form to update any asset price
- **API-Ready**: Foundation for stock/ETF prices (requires API key)

### ✅ Input Validation
- Comprehensive validation for amounts, prices, dates, and asset data
- User-friendly error messages
- Toast notifications for all actions

### 📋 Investment Rules
- Customizable investment guidelines
- Auto-saved with portfolio data

## Supported Asset Classes
- **Crypto**: Bitcoin, Ethereum, Cardano, Solana (via CoinGecko)
- **ETFs**: S&P 500, etc.
- **Sukuk**: Islamic bonds
- **Stocks**: Individual equities

## Technologies
- **React 18** with TypeScript
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **CoinGecko API** for live prices

## Installation

```bash
npm install
```

## Usage

```tsx
import PortfolioApp from './components/PortfolioApp';

function App() {
  return <PortfolioApp />;
}
```

## CAGR Settings

Default CAGR assumptions (easily customizable):

```
Crypto:  Bear: -15%  |  Base: +20%  |  Bull: +40%
ETF:     Bear: +2%   |  Base: +8%   |  Bull: +12%
Sukuk:   Bear: +5%   |  Base: +6%   |  Bull: +7%
Stocks:  Bear: -5%   |  Base: +10%  |  Bull: +18%
```

## File Structure

```
.
├── components/
│   └── PortfolioApp.tsx          # Main component
├── hooks/
│   └── usePortfolioCalculations.ts # Calculation logic
├── services/
│   └── priceApi.ts               # Price fetching
├── utils/
│   ├── validation.ts             # Input validators
│   └── export.ts                 # Export/import functions
├── package.json
└── README.md
```

## Future Enhancements

- [ ] Real-time stock/ETF price fetching (requires API key)
- [ ] Dividend tracking and tax reporting
- [ ] Advanced portfolio analytics (Sharpe ratio, correlation analysis)
- [ ] Automated rebalancing alerts
- [ ] Mobile app version
- [ ] Multi-user support with cloud sync
- [ ] Monthly/yearly performance reports

## License

MIT
