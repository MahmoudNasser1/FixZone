/**
 * Format number without trailing zeros
 * @param {number|string} num - Number to format
 * @returns {string} Formatted number string without trailing zeros
 */
export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '';
  const n = Number(num);
  if (isNaN(n)) return '';
  // Convert to number and back to string to remove trailing zeros
  return parseFloat(n.toString()).toString();
}

/**
 * Format currency amount without trailing zeros
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency symbol (default: 'ج.م')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'ج.م') {
  if (amount === null || amount === undefined || amount === '') return `0 ${currency}`;
  const num = Number(amount);
  if (isNaN(num)) return `0 ${currency}`;
  const formatted = formatNumber(num);
  return `${formatted} ${currency}`;
}

