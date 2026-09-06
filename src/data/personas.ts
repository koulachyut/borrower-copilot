import { BorrowerProfile } from '../engine/types';

export const TEST_PERSONAS: Record<string, { label: string; profile: BorrowerProfile }> = {
  priya: {
    label: 'Priya, 29 (Bengaluru · Salaried Tech MNC)',
    profile: {
      loanPurpose: 'Wedding Expenses',
      purposeCategory: 'consumption',
      requestedAmount: 800000,
      employmentType: 'salaried',
      netMonthlyIncome: 110000,
      existingMonthlyEmis: 14000,
      householdExpenses: 58000, // 28k rent + 30k living
      age: 29,
      creditScore: 780,
      incomeStability: 'stable',
      emergencySavingsMonths: 4,
    },
  },
  ravi: {
    label: 'Ravi, 42 (Mysuru · Self-Employed Kirana)',
    profile: {
      loanPurpose: 'Second stock line and delivery vehicle',
      purposeCategory: 'productive',
      requestedAmount: 1500000,
      employmentType: 'self_employed',
      netMonthlyIncome: 60000, // Average of 40k-80k
      monthlyIncomeMin: 40000,
      monthlyIncomeMax: 80000,
      existingMonthlyEmis: 0,
      householdExpenses: 32000,
      age: 42,
      creditScore: undefined, // No credit score
      unencumberedCollateralValue: 4500000, // Owns shop premises
      spouseMonthlyIncome: 18000, // Wife teaches
    },
  },
  anita: {
    label: 'Anita, 35 (Hubballi · Informal Gig Delivery)',
    profile: {
      loanPurpose: 'Electric scooter to double delivery runs',
      purposeCategory: 'productive',
      requestedAmount: 150000,
      employmentType: 'informal',
      netMonthlyIncome: 28000, // 26k-30k average
      monthlyIncomeMin: 26000,
      monthlyIncomeMax: 30000,
      existingMonthlyEmis: 3500, // High cost app loans
      householdExpenses: 20000, // 2 children, unemployed husband
      age: 35,
      creditScore: undefined,
      highCostDebtOutstanding: 35000,
      highCostDebtRate: 36,
      recentBounces: 1, // 1 EMI bounced last month
      expectedMonthlyEarningsBoost: 12000,
    },
  },
};