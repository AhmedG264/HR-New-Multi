/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared employment option catalogues (salary currency, work arrangement and
 * contract/engagement type) used by the employee registry, the exported
 * reports and any module that has to render a salary figure.
 */

export interface CurrencyOption {
  code: string;   // ISO 4217 code persisted on the employee record
  symbol: string; // Short symbol rendered next to amounts
  label: string;  // Human readable label for dropdowns
}

/** Currencies supported for employee salary packages. */
export const CURRENCIES: CurrencyOption[] = [
  { code: 'SAR', symbol: 'ر.س', label: 'ريال سعودي (SAR)' },
  { code: 'EGP', symbol: 'ج.م', label: 'جنيه مصري (EGP)' },
  { code: 'AED', symbol: 'د.إ', label: 'درهم إماراتي (AED)' },
  { code: 'KWD', symbol: 'د.ك', label: 'دينار كويتي (KWD)' },
  { code: 'QAR', symbol: 'ر.ق', label: 'ريال قطري (QAR)' },
  { code: 'BHD', symbol: 'د.ب', label: 'دينار بحريني (BHD)' },
  { code: 'OMR', symbol: 'ر.ع', label: 'ريال عماني (OMR)' },
  { code: 'JOD', symbol: 'د.أ', label: 'دينار أردني (JOD)' },
  { code: 'USD', symbol: '$', label: 'دولار أمريكي (USD)' },
  { code: 'GBP', symbol: '£', label: 'جنيه استرليني (GBP)' },
  { code: 'EUR', symbol: '€', label: 'يورو (EUR)' },
];

/** System base currency, used to render amounts when the employee has none set. */
export const DEFAULT_CURRENCY = 'SAR';

/** Where the employee is expected to perform the work from. */
export const WORK_TYPES = [
  { value: 'من مقر الشركة', label: 'من مقر الشركة (حضوري)' },
  { value: 'عن بعد', label: 'عن بعد (ريموت كلياً)' },
  { value: 'هجين', label: 'هجين (أيام بالمقر وأيام ريموت)' },
] as const;

/** Engagement/contract type governing the working hours commitment. */
export const CONTRACT_TYPES = [
  { value: 'دوام كامل', label: 'دوام كامل (كامل الأوقات)' },
  { value: 'دوام جزئي', label: 'دوام جزئي (ساعات مقتطعة)' },
  { value: 'بالمهمة', label: 'بالمهمة / بالتاسك (عمل حر)' },
] as const;

export type WorkType = typeof WORK_TYPES[number]['value'];
export type ContractType = typeof CONTRACT_TYPES[number]['value'];

/** Pre-selected values of the employee form dropdowns (same style as the department field). */
export const DEFAULT_WORK_TYPE: WorkType = 'من مقر الشركة';
export const DEFAULT_CONTRACT_TYPE: ContractType = 'دوام كامل';

/** Shown in reports for legacy records saved before these fields existed. */
export const UNSPECIFIED_LABEL = 'غير محدد';

/** Resolves the display symbol of a currency code (falls back to the code itself). */
export const getCurrencySymbol = (code?: string): string => {
  const match = CURRENCIES.find(c => c.code === (code || DEFAULT_CURRENCY));
  return match ? match.symbol : (code || DEFAULT_CURRENCY);
};

/** Resolves the full Arabic label of a currency code. */
export const getCurrencyLabel = (code?: string): string => {
  const match = CURRENCIES.find(c => c.code === (code || DEFAULT_CURRENCY));
  return match ? match.label : (code || DEFAULT_CURRENCY);
};

/** Formats an amount with the thousands separator and the employee currency symbol. */
export const formatMoney = (amount: number, code?: string): string =>
  `${(amount || 0).toLocaleString()} ${getCurrencySymbol(code)}`;

/**
 * Groups amounts per currency so mixed-currency payrolls are never summed into
 * one misleading number. Returned entries are sorted by total, descending.
 */
export const sumByCurrency = <T,>(
  items: T[],
  amountOf: (item: T) => number,
  currencyOf: (item: T) => string | undefined
): Array<{ code: string; total: number }> => {
  const totals = new Map<string, number>();
  items.forEach(item => {
    const code = currencyOf(item) || DEFAULT_CURRENCY;
    totals.set(code, (totals.get(code) || 0) + amountOf(item));
  });
  return Array.from(totals, ([code, total]) => ({ code, total }))
    .sort((a, b) => b.total - a.total);
};

/** Renders a multi-currency total as "45,000 ر.س + 30,000 ج.م". */
export const formatCurrencyTotals = (totals: Array<{ code: string; total: number }>): string =>
  totals.length === 0
    ? formatMoney(0)
    : totals.map(t => formatMoney(t.total, t.code)).join(' + ');
