import React, { useState, useMemo } from 'react';
import {
  Printer,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { BorrowerProfile, CopilotReport } from './engine/types';
import { runBorrowerCopilotEngine } from './engine/rulesEngine';
import { formatINR } from './engine/calculations';
import { QUESTIONS_GRAPH } from './data/questions';
import { TEST_PERSONAS } from './data/personas';

export default function App() {
  const [profile, setProfile] = useState<Partial<BorrowerProfile>>({
    age: 30,
    existingMonthlyEmis: 0,
    householdExpenses: 0,
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const activeQuestions = useMemo(() => {
    return QUESTIONS_GRAPH.filter((q) => (!q.showIf ? true : q.showIf(profile)));
  }, [profile]);

  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  const report: CopilotReport | null = useMemo(() => {
    if (!profile.requestedAmount || !profile.netMonthlyIncome || !profile.employmentType) {
      return null;
    }
    return runBorrowerCopilotEngine({
      loanPurpose: profile.loanPurpose || 'Personal',
      purposeCategory: profile.purposeCategory || 'consumption',
      requestedAmount: Number(profile.requestedAmount) || 0,
      employmentType: profile.employmentType || 'salaried',
      netMonthlyIncome: Number(profile.netMonthlyIncome) || 0,
      existingMonthlyEmis: Number(profile.existingMonthlyEmis) || 0,
      householdExpenses: Number(profile.householdExpenses) || 0,
      age: Number(profile.age) || 30,
      creditScore: profile.creditScore,
      unencumberedCollateralValue: profile.unencumberedCollateralValue,
      spouseMonthlyIncome: profile.spouseMonthlyIncome,
      highCostDebtOutstanding: profile.highCostDebtOutstanding,
      recentBounces: profile.recentBounces,
      monthlyIncomeMin: profile.monthlyIncomeMin,
      monthlyIncomeMax: profile.monthlyIncomeMax,
    });
  }, [profile]);

  const handleSelectPersona = (key: string) => {
    const selected = TEST_PERSONAS[key].profile;
    setProfile(selected);
    setShowResults(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const resetAll = () => {
    setProfile({ age: 30, existingMonthlyEmis: 0, householdExpenses: 0 });
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-black selection:text-white">
      {/* HEADER: Minimalist, editorial style */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-bold text-sm tracking-widest">
            LK
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 tracking-tight">Borrower Copilot</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 hidden md:inline mr-2">
            Test Data
          </span>
          {Object.entries(TEST_PERSONAS).map(([key]) => (
            <button
              key={key}
              onClick={() => handleSelectPersona(key)}
              className="text-xs font-medium px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 transition-colors rounded-none"
            >
              {key}
            </button>
          ))}
          {showResults && (
            <button
              onClick={resetAll}
              className="text-xs text-zinc-500 hover:text-black flex items-center gap-1 ml-4"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 lg:p-12">
        {!showResults ? (
          /* --- ADAPTIVE WIZARD --- */
          <div className="max-w-xl mx-auto mt-8">
            <div className="mb-12">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">
                  Question {currentQuestionIndex + 1} of {activeQuestions.length}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Confidence widens with silence
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-[2px]">
                <div
                  className="bg-black h-full transition-all duration-300 ease-out"
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-medium text-zinc-900 mb-3 tracking-tight">{currentQ.title}</h2>
              <p className="text-sm text-zinc-500">{currentQ.subtitle}</p>
            </div>

            <div className="space-y-4 mb-12">
              {currentQ.type === 'select' ? (
                <div className="grid gap-3">
                  {currentQ.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfile((prev) => ({ ...prev, [currentQ.field]: opt.value }));
                        // Optional auto-advance for a smoother feel
                        setTimeout(handleNext, 200);
                      }}
                      className={`text-left p-4 border text-sm transition-all duration-200 ${
                        profile[currentQ.field] === opt.value
                          ? 'border-black bg-zinc-50 font-semibold'
                          : 'border-zinc-200 hover:border-zinc-400 bg-white text-zinc-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative group">
                  {currentQ.unit && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-light text-zinc-400">
                      {currentQ.unit}
                    </span>
                  )}
                  <input
                    type="number"
                    value={profile[currentQ.field] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      setProfile((prev) => ({ ...prev, [currentQ.field]: val }));
                    }}
                    placeholder={currentQ.placeholder}
                    className={`w-full text-3xl font-light py-4 bg-transparent border-b-2 border-zinc-200 focus:border-black focus:outline-none transition-colors ${
                      currentQ.unit ? 'pl-8' : ''
                    }`}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                className="text-sm text-zinc-400 hover:text-black disabled:opacity-0 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs text-zinc-400 hover:text-black transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  {currentQuestionIndex === activeQuestions.length - 1 ? 'Analyze' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : report ? (
          /* --- RESULTS DASHBOARD --- */
          <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            
            {/* Confidence Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1">Engine Confidence</h3>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-light">{report.profileSummary.confidenceScorePercent}%</div>
                  <div className="text-xs text-zinc-400 max-w-xs leading-tight">
                    {report.profileSummary.confidenceScorePercent > 80
                      ? 'High precision. Computed with full verified variables.'
                      : 'Moderate. Widened rate bands due to skipped inputs.'}
                  </div>
                </div>
              </div>
              {report.profileSummary.unansweredImpact.length > 0 && (
                <div className="bg-zinc-100 text-zinc-600 text-[11px] p-3 max-w-sm border-l-2 border-zinc-300">
                  {report.profileSummary.unansweredImpact[0]}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* O1: VERDICT */}
              <div className="col-span-1 md:col-span-2 border border-zinc-200 bg-white p-8">
                <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-4">
                  01 // Verdict
                </div>
                <div className="flex items-start gap-4 mb-4">
                  {report.o1Verdict.status === 'DONT_BORROW' ? (
                    <X className="w-8 h-8 text-red-600 shrink-0" />
                  ) : report.o1Verdict.status === 'BORROW_LESS' ? (
                    <AlertCircle className="w-8 h-8 text-yellow-600 shrink-0" />
                  ) : (
                    <Check className="w-8 h-8 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <h2 className="text-2xl font-medium text-zinc-900 mb-2">{report.o1Verdict.headline}</h2>
                    <p className="text-zinc-600 mb-6 leading-relaxed">{report.o1Verdict.reason}</p>
                    <div className="bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-800">
                      <span className="font-semibold">Directive:</span> {report.o1Verdict.suggestedAction}
                    </div>
                  </div>
                </div>
              </div>

              {/* O2: MAXIMUM AMOUNT */}
              <div className="border border-zinc-200 bg-white p-8 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-6">
                    02 // Capacity
                  </div>
                  <div className="space-y-6 mb-8">
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Lender Will Sanction</div>
                      <div className="text-xl text-zinc-400 line-through decoration-zinc-300">
                        {formatINR(report.o2Amount.lenderSanctionAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 mb-1">Safe Borrowing Limit</div>
                      <div className="text-3xl font-medium text-black">
                        {formatINR(report.o2Amount.safeCapacityAmount)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-100 text-[11px] leading-relaxed text-zinc-500">
                  <strong className="text-zinc-900">Rationale:</strong> {report.o2Amount.oneSentenceWhy}
                </div>
              </div>

              {/* O3: FAIR RATE */}
              <div className="border border-zinc-200 bg-white p-8 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-6">
                    03 // Fair Rate
                  </div>
                  <div className="mb-6">
                    <div className="text-3xl font-medium text-black mb-1">
                      {report.o3Rate.fairRateMin}% – {report.o3Rate.fairRateMax}%
                    </div>
                    <div className="text-xs text-zinc-500">
                      Recommended: <span className="font-medium text-zinc-900">{report.o3Rate.recommendedProduct}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm border-l-2 border-zinc-200 pl-4 mb-8">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Max Processing Fee</span>
                      <span className="font-medium text-zinc-900">{report.o3Rate.processingFeeCapPercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Honest APR</span>
                      <span className="font-medium text-zinc-900">{report.o3Rate.indicativeAprMin}% – {report.o3Rate.indicativeAprMax}%</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-100 text-[11px] leading-relaxed text-zinc-500">
                  <strong className="text-zinc-900">Rationale:</strong> {report.o3Rate.oneSentenceWhy}
                </div>
              </div>
            </div>

            {/* O4: EMI CEILING & TRADE-OFFS */}
            <div className="border border-zinc-200 bg-white p-8">
              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/3 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-6">
                      04 // Monthly Ceiling
                    </div>
                    <div className="mb-2">
                      <div className="text-4xl font-medium text-black">
                        {formatINR(report.o4Emi.safeCeilingEmi)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-2">Absolute maximum monthly outflow.</div>
                    </div>
                    <div className="mt-8 mb-8 border border-zinc-200 p-4">
                      <div className="text-xs font-semibold text-zinc-900 mb-1 uppercase">Stress Test</div>
                      <div className="text-[11px] text-zinc-600 mb-2">{report.o4Emi.stressCase.scenario}</div>
                      <div className={`text-xs font-medium ${report.o4Emi.stressCase.isAffordable ? 'text-emerald-600' : 'text-red-600'}`}>
                        {report.o4Emi.stressCase.verdictNote}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] leading-relaxed text-zinc-500">
                    <strong className="text-zinc-900">Rationale:</strong> {report.o4Emi.oneSentenceWhy}
                  </div>
                </div>

                <div className="md:w-2/3">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-400 text-xs">
                        <th className="font-medium py-3">Tenure</th>
                        <th className="font-medium py-3">Monthly EMI</th>
                        <th className="font-medium py-3">Interest Cost</th>
                        <th className="font-medium py-3">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {report.o4Emi.tenureTradeoffs.map((item, idx) => (
                        <tr key={idx} className={item.monthlyEmi <= report.o4Emi.safeCeilingEmi ? 'text-black' : 'text-zinc-400'}>
                          <td className="py-4 font-mono">{item.tenureYears} YRS</td>
                          <td className="py-4">{formatINR(item.monthlyEmi)}</td>
                          <td className="py-4">+{formatINR(item.totalInterest)}</td>
                          <td className="py-4">
                            {item.monthlyEmi <= report.o4Emi.safeCeilingEmi ? (
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">Safe</span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-red-400">Unsafe</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* --- NEGOTIATION TICKET --- */}
            <div className="mt-16">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-black">Branch Negotiation Ticket</h3>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 text-xs font-medium px-4 py-2 bg-black text-white hover:bg-zinc-800 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Ticket
                </button>
              </div>

              {/* Physical "Ticket" Styling */}
              <div id="negotiation-card" className="bg-black text-white p-8 md:p-12 border-4 border-black relative">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-800 pb-6 mb-8">
                  <div>
                    <h4 className="text-2xl font-light tracking-tight mb-1">Verified Borrower Stance</h4>
                    <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
                      Segment: {profile.employmentType} // Code: LKT-001
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-mono block mb-1">DATE ISSUED</span>
                    <span className="text-xs font-medium">SEPT 2026</span>
                  </div>
                </div>

                {/* Key Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-b border-zinc-800 pb-8 mb-8">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 block mb-2 uppercase tracking-widest">Target Rate</span>
                    <span className="text-3xl font-light">
                      {report.o3Rate.fairRateMin}%<span className="text-zinc-600 text-2xl">-{report.o3Rate.fairRateMax}%</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 block mb-2 uppercase tracking-widest">Max EMI</span>
                    <span className="text-3xl font-light">
                      {formatINR(report.o4Emi.safeCeilingEmi)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 block mb-2 uppercase tracking-widest">Sanction Limit</span>
                    <span className="text-3xl font-light text-zinc-300">
                      {formatINR(report.o2Amount.recommendedAmount)}
                    </span>
                  </div>
                </div>

                {/* Tactics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm font-light leading-relaxed">
                  <div>
                    <span className="font-mono text-[10px] text-zinc-500 block mb-3 uppercase tracking-widest border-b border-zinc-800 pb-2">
                      Lender Probable Action
                    </span>
                    <ul className="space-y-2 text-zinc-300">
                      <li>• Attempt to sanction {formatINR(report.o2Amount.lenderSanctionAmount)}.</li>
                      <li>• Bundle single-premium credit life insurance.</li>
                      <li>• Quote upfront processing fee above {report.o3Rate.processingFeeCapPercent}%.</li>
                    </ul>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] text-zinc-500 block mb-3 uppercase tracking-widest border-b border-zinc-800 pb-2">
                      Counter Protocol
                    </span>
                    <ul className="space-y-2 text-white">
                      <li>• "My profile qualifies for <span className="font-medium">{report.o3Rate.fairRateMin}%</span>. Match it."</li>
                      <li>• "I cap processing fees at <span className="font-medium">{report.o3Rate.processingFeeCapPercent}%</span>."</li>
                      <li>• "Remove all bundled insurance products. Issue pure pricing only."</li>
                    </ul>
                  </div>
                </div>

                {/* Footer Barcode visual */}
                <div className="mt-12 pt-6 border-t border-zinc-800 flex justify-between items-center opacity-50">
                  <div className="font-mono text-xs tracking-[0.5em]">|||| || ||| | || ||| ||</div>
                  <div className="font-mono text-[9px] uppercase">Lokta Copilot Engine</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}