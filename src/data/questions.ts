import { BorrowerProfile } from '../engine/types';

export interface QuestionDefinition {
  id: keyof BorrowerProfile | string;
  tier: 1 | 2;
  title: string;
  subtitle: string;
  type: 'number' | 'select' | 'text';
  options?: { label: string; value: any }[];
  placeholder?: string;
  unit?: string;
  field: keyof BorrowerProfile;
  showIf?: (p: Partial<BorrowerProfile>) => boolean;
}

export const QUESTIONS_GRAPH: QuestionDefinition[] = [
  // --- TIER 1: MUST QUESTIONS (Minimum set) ---
  {
    id: 'loanPurpose',
    tier: 1,
    title: 'What will this loan be used for?',
    subtitle: 'Lenders price productive assets differently than personal expenses.',
    type: 'select',
    field: 'purposeCategory',
    options: [
      { label: 'Consumption (Wedding, Travel, Medical, Home Renovation)', value: 'consumption' },
      { label: 'Productive Asset (Vehicle, Shop Inventory, Machinery)', value: 'productive' },
      { label: 'Debt Consolidation (Paying off other loans/cards)', value: 'debt_consolidation' },
    ],
  },
  {
    id: 'requestedAmount',
    tier: 1,
    title: 'How much money do you want to borrow?',
    subtitle: 'We will evaluate whether this matches what you can safely carry.',
    type: 'number',
    field: 'requestedAmount',
    placeholder: 'e.g. 500000',
    unit: '₹',
  },
  {
    id: 'employmentType',
    tier: 1,
    title: 'How do you earn your primary income?',
    subtitle: 'This determines which lending regulations and underwriting formulas apply.',
    type: 'select',
    field: 'employmentType',
    options: [
      { label: 'Salaried (Monthly direct bank deposit with payslips)', value: 'salaried' },
      { label: 'Self-Employed (Business owner, Kirana, Trader, Professional)', value: 'self_employed' },
      { label: 'Informal / Gig (Platform rider, daily wage, cash earnings)', value: 'informal' },
    ],
  },
  {
    id: 'netMonthlyIncome',
    tier: 1,
    title: 'What is your net monthly take-home income?',
    subtitle: 'If self-employed or informal, provide your typical monthly cash in hand.',
    type: 'number',
    field: 'netMonthlyIncome',
    placeholder: 'e.g. 65000',
    unit: '₹',
  },
  {
    id: 'existingMonthlyEmis',
    tier: 1,
    title: 'What do you currently pay each month for existing EMIs?',
    subtitle: 'Include car loans, personal loans, credit card balances, and two-wheeler EMIs.',
    type: 'number',
    field: 'existingMonthlyEmis',
    placeholder: 'e.g. 14000',
    unit: '₹',
  },
  {
    id: 'householdExpenses',
    tier: 1,
    title: 'Total monthly household expenses (Rent + Living)?',
    subtitle: 'Be honest. Lenders ignore this, but it determines your true default risk.',
    type: 'number',
    field: 'householdExpenses',
    placeholder: 'e.g. 35000',
    unit: '₹',
  },
  {
    id: 'creditScore',
    tier: 1,
    title: 'What is your CIBIL / Credit Bureau score (if known)?',
    subtitle: 'If you have never taken a loan or do not know, feel free to skip.',
    type: 'select',
    field: 'creditScore',
    options: [
      { label: '750 or higher (Excellent / Prime)', value: 780 },
      { label: '680 to 749 (Good / Average)', value: 710 },
      { label: 'Below 680 (Low / Poor)', value: 620 },
      { label: "I don't know / Never had a loan", value: undefined },
    ],
  },

  // --- TIER 2: ADAPTIVE QUESTIONS (Each tightens a specific variable) ---
  {
    id: 'unencumberedCollateralValue',
    tier: 2,
    title: 'Do you own commercial or residential property with clear titles?',
    subtitle: 'Can unlock Loan Against Property (LAP) at half the interest rate of business loans.',
    type: 'number',
    field: 'unencumberedCollateralValue',
    placeholder: 'Estimated market value in ₹ (e.g. 4500000)',
    unit: '₹',
    showIf: (p) => p.employmentType === 'self_employed',
  },
  {
    id: 'spouseMonthlyIncome',
    tier: 2,
    title: 'Does your spouse earn an income?',
    subtitle: 'Adding a co-borrower pools household income and satisfies bank FOIR thresholds.',
    type: 'number',
    field: 'spouseMonthlyIncome',
    placeholder: 'Spouse monthly earnings (e.g. 18000)',
    unit: '₹',
    showIf: (p) => p.employmentType === 'self_employed' || p.employmentType === 'informal',
  },
  {
    id: 'highCostDebtOutstanding',
    tier: 2,
    title: 'Do you currently owe money to instant mobile loan apps?',
    subtitle: 'Instant digital loans often charge 30% to 50% APR and create immediate debt traps.',
    type: 'number',
    field: 'highCostDebtOutstanding',
    placeholder: 'Total outstanding on instant apps (e.g. 35000)',
    unit: '₹',
    showIf: (p) => p.employmentType === 'informal' || p.purposeCategory === 'debt_consolidation',
  },
  {
    id: 'recentBounces',
    tier: 2,
    title: 'Have you had an EMI bounce or late payment in the last 6 months?',
    subtitle: 'Even a single bounce severely alters lender approval odds and rate bands.',
    type: 'select',
    field: 'recentBounces',
    options: [
      { label: '0 bounces (Clean record)', value: 0 },
      { label: '1 bounce within past 90 days', value: 1 },
      { label: '2 or more bounces', value: 2 },
    ],
    showIf: (p) => p.employmentType === 'informal' || p.creditScore !== undefined,
  },
];