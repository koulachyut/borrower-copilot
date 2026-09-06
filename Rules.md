

| Rule ID | Category | Parameter / Threshold | Chosen Value | Why / Financial Rationale | Source / Standard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FOIR-01** | Affordability | Max Lender FOIR (Salaried >₹1L) | **60.0%** of Net Income | Tier-1 Indian private banks (HDFC, ICICI, Axis) allow up to 60-65% gross debt-servicing for prime salaried applicants. | Industry Underwriting Norms |
| **FOIR-02** | Affordability | Max Safe Borrower FOIR | **35.0%** of Net Income | Academic & practical personal finance: exceeding 35% leaves households vulnerable to zero-savings traps and medical emergencies. | Certified Financial Planner Standards |
| **FOIR-03** | Affordability | Informal Sector Lender FOIR | **35.0%** of Documented Income | Lenders haircut informal earnings heavily due to cash collection volatility and lack of Form 16 / tax audit trails. | RBI Priority Sector Guidelines |
| **SURP-01** | Affordability | Disposable Surplus Allocation | **70.0%** of true surplus | True Surplus = Income - Living - Existing EMIs - 15% Emergency buffer. Allocating >70% guarantees default if inflation or rent rises. | Lokta Safety Model (My Judgement) |
| **RATE-01** | Product Bands | Prime Salaried Unsecured | **10.75% – 12.25%** | Benchmark Repo Rate (6.50%) + 4.25% spread for CIBIL 750+ applicants working in Tier-1 MNCs. | Prevailing Retail Bank Cards (2026) |
| **RATE-02** | Product Bands | Loan Against Property (LAP) | **9.25% – 11.25%** | Asset-backed secured term loans carry substantially lower credit loss risk (LGD), giving borrowers near home-loan pricing. | SBI & HDFC SME LAP Rate Schedules |
| **RATE-03** | Product Bands | Subprime / Informal Personal Loan | **16.0% – 24.0%** | Unsecured retail loans with missing credit bureau history or sub-680 score carry high default risk provisions. | NBFC Risk-Based Pricing Directives |
| **RATE-04** | Product Bands | Hypothecated EV 2-Wheeler | **11.5% – 14.5%** | Vehicle acts as primary hypothecated collateral; platform riders qualify under priority green vehicle loans. | Green Mobility NBFC Schedules |
| **APR-01** | Transparency | Upfront Fee Drag & GST | **Nominal + (Fee × 1.18)/Tenure** | In India, all processing fees attract 18% GST. A 2% fee on a 2-year loan adds ~1.18% annual drag to the true APR. | RBI Key Fact Statement (KFS) Norms |
| **FEE-01** | Fee Cap | Processing Fee Cap | **1.0%** (Secured/Prime) to **1.5%** | Prevents lenders from quoting a teaser interest rate while charging 3% to 4% upfront in administrative fees. | Industry Best Practice |
| **PIVOT-01** | Product Routing | Collateral Pivot Trigger | **Collateral Value ≥ 1.5× Loan** | If an unencumbered property exists, routing the borrower away from 20%+ business loans to 10% LAP saves millions in interest. | MSME Banking Credit Architecture |
| **DEBT-01** | Verdict Engine | Predatory Debt Trap Flag | **App Debt > 0 AND Bounces > 0** | An active bounce combined with 30%+ instant app loans indicates distress. Granting fresh unsecured cash will cause complete insolvency. | RBI Fair Practices Code for NBFCs |
| **BUFF-01** | Liquidity | Mandatory Emergency Buffer | **15.0%** of Monthly Income | Every household must reserve 15% of cash flow before committing to optional debt repayment. | Conservative Cashflow Accounting |
| **CONF-01** | Uncertainty | Unknown Credit Score Spread | **± 2.5%** wider band | Silence widens ranges: without bureau verification, a lender spreads quotes to guard against adverse selection. | Evaluator Specification Rule |

---

### What This Model Does NOT Know (Honesty About Limits)
1. **Tax Implications:** Does not compute Section 24(b) or Section 80C tax deductions for property/business interest.
2. **City-Specific Living Cost Indices:** Rent and cost of living in Bengaluru differs from Hubballi; user inputs are taken as declared without external geo-validation.
3. **Bureau Score Nuances:** We treat credit score as a tier variable; actual bureau scores consider trade-line vintage, inquiry velocity, and unsecured-to-secured debt ratios.