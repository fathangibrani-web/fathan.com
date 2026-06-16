interface PortfolioData {
  settings: any;
  deposits: Array<{ id: number; date: string; amount: number }>;
  assets: Array<{
    id: string;
    name: string;
    class: string;
    units: number;
    avg_price: number;
    current_price: number;
    target_weight: number;
  }>;
  rules: string;
  snapshots?: Array<{
    timestamp: number;
    totalValue: number;
    totalDeposits: number;
  }>;
}

// Export portfolio data as JSON
export const exportPortfolioJSON = (data: PortfolioData, filename = 'portfolio.json') => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Import portfolio data from JSON
export const importPortfolioJSON = (file: File): Promise<PortfolioData | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const data = JSON.parse(result);
          resolve(data);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('Error importing portfolio:', error);
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
};

// Export as CSV for spreadsheet import
export const exportPortfolioCSV = (assets: any[], filename = 'portfolio.csv') => {
  const headers = ['ID', 'Name', 'Class', 'Units', 'Avg Price', 'Current Price', 'Target Weight', 'Value', 'P&L %'];
  const rows = assets.map((a) => {
    const value = a.units * a.current_price;
    const pl = ((a.current_price - a.avg_price) / a.avg_price) * 100;
    return [
      a.id,
      a.name,
      a.class,
      a.units,
      a.avg_price,
      a.current_price,
      a.target_weight,
      value,
      pl.toFixed(2),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
