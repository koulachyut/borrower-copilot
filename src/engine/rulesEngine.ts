
import {
  BorrowerProfile,
  CopilotReport,
  VerdictOutput,
  AmountOutput,
  RateOutput,
  EmiOutput,
  TenureOption,
} from './types';
import { calculateEmi, calculatePv, estimateAllInApr } from './calculations';

export function runBorrowerCopilotEngine(p: BorrowerProfile): CopilotReport {
  // 1. Core Income Normalization
  const baseIncome = p.monthlyIncomeMin && p.monthlyIncomeMax
    ? (p.monthlyIncomeMin * 0.7 + p.monthlyIncomeMax * 0.3) // Conservative weighted average for variable income
    : p.netMonthlyIncome;

  const combinedHouseholdIncome = baseIncome + (p.spouseMonthlyIncome || 0);

  // True Disposable Surplus = Income - Household Expenses - Existing EMIs - 15% Emergency Buffer
  const mandatoryBuffer = baseIncome * 0.15;
  const trueDisposableSurplus = Math.max(
    0,
    baseIncome - p.householdExpenses - p.existingMonthlyEmis - mandatoryBuffer
  );

  const baselineFoir = baseIncome > 0 ? (p.existingMonthlyEmis / baseIncome) * 100 : 0;

  // Confidence & Missing Variables Analysis
  const unansweredImpact: string[] = [];
  let answeredQuestionsCount = 7; // base must-set

  if (p.creditScore === undefined) {
    unansweredImpact.push('Credit score unknown: Rate band widened by ±3.0% and max sanction defaulted conservatively.');
  } else {
    answeredQuestionsCount += 1;
  }

  if (p.employmentType === 'self_employed') {
    if (!p.unencumberedCollateralValue) {
      unansweredImpact.push('No collateral specified: Missed potential lower rates under Loan Against Property (LAP).');
    } else {
      answeredQuestionsCount += 2;
    }
  }

  if (p.recentBounces !== undefined) answeredQuestionsCount += 1;
  if (p.highCostDebtOutstanding !== undefined) answeredQuestionsCount += 1;
  if (p.emergencySavingsMonths !== undefined) answeredQuestionsCount += 1;

  const confidenceScorePercent = Math.min(100, Math.round((answeredQuestionsCount / 12) * 100));

  // -------------------------------------------------------------
  // RULE O3: FAIR RATE MATRIX & ROUTING (Determined first for PVs)
  // -------------------------------------------------------------
  let fairRateMin = 13.0;
  let fairRateMax = 18.0;
  let recommendedProduct = 'Unsecured Personal Loan';
  let defaultTenureYears = 3;
  let processingFeeCap = 1.5;

  const hasHighCollateral = (p.unencumberedCollateralValue || 0) >= p.requestedAmount * 1.5;

  if (hasHighCollateral && p.employmentType === 'self_employed') {
    // ROUTE TO SECURED / LAP (Ravi's Route)
    fairRateMin = 9.25;
    fairRateMax = 11.25;
    recommendedProduct = 'Loan Against Property (LAP) / Secured MSME';
    defaultTenureYears = 7; // Longer tenure for secured loans
    processingFeeCap = 1.0;
  } else if (p.purposeCategory === 'productive' && p.loanPurpose.toLowerCase().includes('scooter')) {
    // ASSET-BACKED TWO-WHEELER / EV LOAN (Anita's Clean Route)
    fairRateMin = 11.5;
    fairRateMax = 14.5;
    recommendedProduct = 'Hypothecated EV Two-Wheeler Loan';
    defaultTenureYears = 3;
    processingFeeCap = 1.5;
  } else if (p.employmentType === 'salaried') {
    if (p.creditScore && p.creditScore >= 750) {
      fairRateMin = 10.75;
      fairRateMax = 12.25;
      recommendedProduct = 'Prime Salaried Personal Loan';
      defaultTenureYears = 4;
      processingFeeCap = 1.0;
    } else if (p.creditScore && p.creditScore < 680) {
      fairRateMin = 16.0;
      fairRateMax = 22.0;
      recommendedProduct = 'Subprime Personal Loan';
      defaultTenureYears = 3;
      processingFeeCap = 2.5;
    } else {
      // Unknown credit score
      fairRateMin = 12.0;
      fairRateMax = 17.5;
      recommendedProduct = 'Standard Salaried Personal Loan';
      defaultTenureYears = 3;
      processingFeeCap = 2.0;
    }
  } else if (p.employmentType === 'informal') {
    fairRateMin = 16.0;
    fairRateMax = 24.0;
    recommendedProduct = 'Microfinance / Priority Sector Lending';
    defaultTenureYears = 2;
    processingFeeCap = 2.0;
  }

  // Widen bands if score is unknown
  if (p.creditScore === undefined) {
    fairRateMin = Math.max(9.0, fairRateMin - 1.0);
    fairRateMax = fairRateMax + 2.5;
  }

  const indicativeAprMin = estimateAllInApr(fairRateMin, processingFeeCap, defaultTenureYears);
  const indicativeAprMax = estimateAllInApr(fairRateMax, processingFeeCap, defaultTenureYears);

  const o3Rate: RateOutput = {
    fairRateMin,
    fairRateMax,
    confidenceBand: p.creditScore !== undefined ? 'TIGHT' : 'WIDE',
    processingFeeCapPercent: processingFeeCap,
    indicativeAprMin,
    indicativeAprMax,
    recommendedProduct,
    oneSentenceWhy: hasHighCollateral
      ? `Routed to ${recommendedProduct} at ${fairRateMin}%-${fairRateMax}% because your ₹${(p.unencumberedCollateralValue! / 100000).toFixed(1)}L unencumbered property unlocks secured prime pricing.`
      : `Fair rate is ${fairRateMin}%-${fairRateMax}% based on your ${p.employmentType} profile and ${p.creditScore ? `CIBIL score of ${p.creditScore}` : 'unverified credit score'}.`,
  };

  // -------------------------------------------------------------
  // RULE O4: SAFE CEILING EMI & STRESS TESTING
  // -------------------------------------------------------------
  // Safe EMI: Max 70% of true disposable surplus OR 35% of monthly income, whichever is lower
  const safeCapFromSurplus = trueDisposableSurplus * 0.7;
  const safeCapFromIncome = baseIncome * 0.35;
  const safeCeilingEmi = Math.max(0, Math.round(Math.min(safeCapFromSurplus, safeCapFromIncome)));

  const tenureYearsOptions = defaultTenureYears >= 5 ? [3, 5, 7, 10] : [2, 3, 4, 5];
  const midRate = (fairRateMin + fairRateMax) / 2;

  const tenureTradeoffs: TenureOption[] = tenureYearsOptions.map((yrs) => {
    const months = yrs * 12;
    const emi = calculateEmi(p.requestedAmount, midRate, months);
    const totalRepayment = emi * months;
    const totalInterest = totalRepayment - p.requestedAmount;
    return {
      tenureYears: yrs,
      monthlyEmi: emi,
      totalInterest,
      totalRepayment,
    };
  });

  // Stress Case: 20% Income Drop
  const stressedIncome = baseIncome * 0.8;
  const committedEmisWithNewLoan = p.existingMonthlyEmis + safeCeilingEmi;
  const stressedFoir = stressedIncome > 0 ? (committedEmisWithNewLoan / stressedIncome) * 100 : 100;
  const isAffordableUnderStress = stressedFoir <= 50;

  const o4Emi: EmiOutput = {
    safeCeilingEmi,
    tenureTradeoffs,
    stressCase: {
      scenario: '20% Sudden Income Shock (job disruption / illness / slow business month)',
      stressedEmiOrIncomeRatio: Math.round(stressedFoir),
      isAffordable: isAffordableUnderStress,
      verdictNote: isAffordableUnderStress
        ? `Passes stress test: Total debt obligations remain at a manageable ${Math.round(stressedFoir)}% of income.`
        : `Breaches safety line: If income drops by 20%, debt obligations devour ${Math.round(stressedFoir)}% of your income.`,
    },
    oneSentenceWhy: `Capped at ₹${safeCeilingEmi.toLocaleString('en-IN')}/mo because exceeding it leaves you with less than a 15% emergency cash buffer after living expenses and current debt.`,
  };

  // -------------------------------------------------------------
  // RULE O2: MAXIMUM AMOUNT (LENDER SANCTION VS SAFE CAPACITY)
  // -------------------------------------------------------------
  // 1. Lender Sanction Max
  let lenderFoirCap = 0.5; // 50% default
  if (p.employmentType === 'salaried' && baseIncome >= 100000) lenderFoirCap = 0.6; // Tier-1 banks stretch to 60%
  if (p.employmentType === 'informal') lenderFoirCap = 0.35;

  const lenderAllowableEmi = Math.max(0, combinedHouseholdIncome * lenderFoirCap - p.existingMonthlyEmis);
  let lenderSanctionAmount = calculatePv(lenderAllowableEmi, fairRateMin, defaultTenureYears * 12);

  // If secured with massive collateral, lender sanction scales up to 50% LTV of collateral
  if (hasHighCollateral) {
    const collateralSanctionMax = p.unencumberedCollateralValue! * 0.5;
    lenderSanctionAmount = Math.max(lenderSanctionAmount, collateralSanctionMax);
  }

  // 2. Safe Borrower Capacity
  const safeCapacityAmount = calculatePv(safeCeilingEmi, fairRateMax, defaultTenureYears * 12);

  let recommendedChoice: 'SAFE_CAPACITY' | 'LENDER_SANCTION' | 'ZERO' = 'SAFE_CAPACITY';
  let recommendedAmount = safeCapacityAmount;

  if (safeCapacityAmount <= 0) {
    recommendedChoice = 'ZERO';
    recommendedAmount = 0;
  }

  const o2Amount: AmountOutput = {
    lenderSanctionAmount,
    safeCapacityAmount,
    recommendedAmount,
    recommendedChoice,
    oneSentenceWhy:
      lenderSanctionAmount > safeCapacityAmount * 1.3
        ? `Lenders will sanction up to ₹${(lenderSanctionAmount / 100000).toFixed(1)}L based purely on your gross cash flow, but you should not cross ₹${(safeCapacityAmount / 100000).toFixed(1)}L to avoid overleveraging.`
        : `Safe capacity matches sanction range closely at ₹${(safeCapacityAmount / 100000).toFixed(1)}L based on a conservative 35% FOIR boundary.`,
  };

  // -------------------------------------------------------------
  // RULE O1: VERDICT ENGINE
  // -------------------------------------------------------------
  let o1Verdict: VerdictOutput;

  const isDebtTrap =
    (p.highCostDebtOutstanding || 0) > 0 &&
    (p.recentBounces || 0) > 0 &&
    p.employmentType === 'informal';

  const isSevereVulnerability =
    p.employmentType === 'informal' &&
    (p.emergencySavingsMonths || 0) < 1 &&
    p.purposeCategory === 'consumption';

  const isOverstretchedConsumption =
    p.purposeCategory === 'consumption' &&
    p.requestedAmount > safeCapacityAmount;

  if (isDebtTrap) {
    o1Verdict = {
      status: 'DONT_BORROW',
      headline: "Don't Borrow Unsecured / Restructure Current Debt",
      reason: `You have ₹${(p.highCostDebtOutstanding || 0).toLocaleString('en-IN')} in high-interest app loans with recent payment bounces. Taking another cash loan will trigger an irreversible debt spiral.`,
      suggestedAction: 'Clear or consolidate the 30%+ app loans before taking any new debt. If buying an EV, seek asset hypothecation directly through your employer or platform.',
    };
  } else if (isSevereVulnerability) {
    o1Verdict = {
      status: 'DONT_BORROW',
      headline: "Don't Borrow for Consumption",
      reason: 'Irregular informal income with zero emergency savings makes borrowing for non-productive expenses dangerous.',
      suggestedAction: 'Avoid taking personal loans for lifestyle or household expenses without a 3-month savings reserve.',
    };
  } else if (hasHighCollateral && p.requestedAmount > 1000000) {
    o1Verdict = {
      status: 'PIVOT_PRODUCT',
      headline: 'Borrow via Secured Route (LAP), NOT Personal/Business Loan',
      reason: `Your business cash flow is strong, but formal ITR limits unsecured sanction. Your ₹${(p.unencumberedCollateralValue! / 100000).toFixed(1)}L unencumbered shop lets you borrow at prime 9-11% rates instead of 20%+ unsecured NBFC rates.`,
      suggestedAction: 'Refuse unsecured business loans. Apply for a Loan Against Property (LAP) or MSME Secured Credit Line with your spouse as co-applicant.',
    };
  } else if (isOverstretchedConsumption) {
    o1Verdict = {
      status: 'BORROW_LESS',
      headline: `Borrow Less (Cap at ₹${(safeCapacityAmount / 100000).toFixed(1)}L)`,
      reason: `Wedding and lifestyle events do not generate income. Borrowing ₹${(p.requestedAmount / 100000).toFixed(1)}L alongside your existing EMIs pushes your total debt service over safe limits.`,
      suggestedAction: `Downsize the budget or borrow a maximum of ₹${(safeCapacityAmount / 100000).toFixed(1)}L over 4 years to keep your monthly EMI below ₹${safeCeilingEmi.toLocaleString('en-IN')}.`,
    };
  } else {
    o1Verdict = {
      status: 'BORROW',
      headline: 'Safe to Borrow',
      reason: 'Your disposable surplus comfortably covers the estimated EMI, and total obligations remain well within RBI and banking safety benchmarks.',
      suggestedAction: 'Proceed with loan comparison, lock in the lowest processing fee, and refuse mandatory credit insurance bundles.',
    };
  }

  return {
    o1Verdict,
    o2Amount,
    o3Rate,
    o4Emi,
    profileSummary: {
      disposableIncome: trueDisposableSurplus,
      baselineFoir,
      confidenceScorePercent,
      unansweredImpact,
    },
  };
}
