/**
 * Financial Calculation Helpers
 */

// Monthly EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
export function calculateEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePercent === 0) return principal / tenureMonths;

  const monthlyRate = annualRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

// Present Value calculation (reverse loan calculator)
// Given an affordable EMI, what principal does it support?
export function calculatePv(emi: number, annualRatePercent: number, tenureMonths: number): number {
  if (emi <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRatePercent / 12 / 100;
  if (monthlyRate === 0) return emi * tenureMonths;

  const factor = Math.pow(1 + monthlyRate, -tenureMonths);
  const pv = (emi * (1 - factor)) / monthlyRate;
  return Math.round(pv);
}

// RBI-style honest APR estimation
// Incorporates upfront processing fee + GST amortized over the tenure
export function estimateAllInApr(
  nominalRatePercent: number,
  processingFeePercent: number,
  tenureYears: number
): number {
  const feeWithGst = processingFeePercent * 1.18; // 18% GST on processing fees in India
  const annualizedFeeDrag = feeWithGst / Math.max(tenureYears, 1);
  return Number((nominalRatePercent + annualizedFeeDrag).toFixed(2));
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}