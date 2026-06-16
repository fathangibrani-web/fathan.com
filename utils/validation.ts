// Input validation utilities

export const validateAmount = (amount: string | number): { valid: boolean; error?: string } => {
  const num = Number(amount);
  if (isNaN(num)) return { valid: false, error: 'Amount must be a number' };
  if (num <= 0) return { valid: false, error: 'Amount must be greater than 0' };
  if (num > 10000000) return { valid: false, error: 'Amount exceeds maximum limit ($10M)' };
  return { valid: true };
};

export const validatePrice = (price: string | number): { valid: boolean; error?: string } => {
  const num = Number(price);
  if (isNaN(num)) return { valid: false, error: 'Price must be a number' };
  if (num < 0) return { valid: false, error: 'Price cannot be negative' };
  if (num > 1000000) return { valid: false, error: 'Price exceeds maximum limit' };
  return { valid: true };
};

export const validateUnits = (units: string | number): { valid: boolean; error?: string } => {
  const num = Number(units);
  if (isNaN(num)) return { valid: false, error: 'Units must be a number' };
  if (num <= 0) return { valid: false, error: 'Units must be greater than 0' };
  if (!Number.isFinite(num)) return { valid: false, error: 'Units must be a valid number' };
  return { valid: true };
};

export const validateDate = (date: string): { valid: boolean; error?: string } => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return { valid: false, error: 'Invalid date format' };
  if (d > new Date()) return { valid: false, error: 'Date cannot be in the future' };
  return { valid: true };
};

export const validateAssetName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) return { valid: false, error: 'Asset name is required' };
  if (name.length > 50) return { valid: false, error: 'Asset name must be 50 characters or less' };
  return { valid: true };
};

export const validateCAGR = (cagr: string | number): { valid: boolean; error?: string } => {
  const num = Number(cagr);
  if (isNaN(num)) return { valid: false, error: 'CAGR must be a number' };
  if (num < -1 || num > 2) return { valid: false, error: 'CAGR must be between -100% and 200%' };
  return { valid: true };
};
