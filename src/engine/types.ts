export type EmploymentType = 'salaried' | 'self_employed' | 'informal';
export type LoanPurposeCategory = 'consumption' | 'productive' | 'debt_consolidation';

export interface BorrowerProfile {
  // Tier 1: Must Questions
  loanPurpose: string;
  purposeCategory: LoanPurposeCategory;
  requestedAmount: number;
  employmentType: EmploymentType;
  netMonthlyIncome: number;
  existingMonthlyEmis: number;
  householdExpenses: number;
  age: number;
  creditScore?: number; // undefined if unknown

  // Tier 2: Adaptive Context
  incomeStability?: 'stable' | 'variable' | 'seasonal';
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  unencumberedCollateralValue?: number; // e.g. Ravi's shop
  spouseMonthlyIncome?: number;
  recentBounces?: number; // e.g. Anita's bounced EMI
  highCostDebtOutstanding?: number; // Predatory app loans >30%
  highCostDebtRate?: number;
  expectedMonthlyEarningsBoost?: number; // For productive loans
  emergencySavingsMonths?: number;
}

export type VerdictStatus = 'BORROW' | 'BORROW_LESS' | 'DONT_BORROW' | 'PIVOT_PRODUCT';

export interface VerdictOutput {
  status: VerdictStatus;
  headline: string;
  reason: string;
  suggestedAction: string;
}

export interface AmountOutput {
  lenderSanctionAmount: number;
  safeCapacityAmount: number;
  recommendedAmount: number;
  recommendedChoice: 'SAFE_CAPACITY' | 'LENDER_SANCTION' | 'ZERO';
  oneSentenceWhy: string;
}

export interface RateOutput {
  fairRateMin: number;
  fairRateMax: number;
  confidenceBand: 'TIGHT' | 'MODERATE' | 'WIDE';
  processingFeeCapPercent: number;
  indicativeAprMin: number;
  indicativeAprMax: number;
  recommendedProduct: string;
  oneSentenceWhy: string;
}

export interface TenureOption {
  tenureYears: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
}

export interface StressCase {
  scenario: string;
  stressedEmiOrIncomeRatio: number;
  isAffordable: boolean;
  verdictNote: string;
}

export interface EmiOutput {
  safeCeilingEmi: number;
  tenureTradeoffs: TenureOption[];
  stressCase: StressCase;
  oneSentenceWhy: string;
}

export interface CopilotReport {
  o1Verdict: VerdictOutput;
  o2Amount: AmountOutput;
  o3Rate: RateOutput;
  o4Emi: EmiOutput;
  profileSummary: {
    disposableIncome: number;
    baselineFoir: number;
    confidenceScorePercent: number;
    unansweredImpact: string[];
  };
}