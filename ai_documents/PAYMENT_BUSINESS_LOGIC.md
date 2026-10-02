# Master Payment Business Logic Reference & Schema Dictionary

> **AI DOCUMENTS - AUTHORITATIVE FINANCIAL & SCHEMA SPECIFICATION**  
> *This document provides the complete, zero-assumption business rules, financial formulas, security constraints, role scopes, and real-world schema key mappings for the Payment Subsystem (`paymentModel`, `invoiceModel`, `monthlyFeeListModel`, `vehicleRouteFareModel`, `payOptionModel`).*  
> ⚠️ **CRITICAL NOTICE**: Financial accuracy is mandatory. Incorrect calculation directly impacts financial accounts. Self-assumptions are strictly prohibited.

---

## 1. Role Scope & Target Entity Isolation Rule

### Rule 1.1: Student-Only Payment Ledger Isolation
* **Mandatory Constraint**: Payment records, fee ledgers, outstanding dues, and financial transaction invoices belong **EXCLUSIVELY TO STUDENTS** (`userInfo.roleName === 'STUDENT'`).
* **Role Behavior**:
  - When logged in as `ADMIN`, `TOPADMIN`, or `ACCOUNTANT`, querying payment data MUST strictly scope filters to student accounts (`'userInfo.roleName': 'STUDENT'`).
  - Staff, teachers, accountants, and administrators do **NOT** have student payment ledgers or tuition fee dues.
* **Database Query Guard**:
  ```json
  {
    "userInfo.roleName": "STUDENT",
    "deleted": false
  }
  ```

---

## 2. Real-Time Clarification Protocol (No Self-Assumption Rule)

### Rule 2.1: Financial Precision & Ambiguity Guard
If an incoming natural language prompt or query contains ambiguous terms (e.g. *"Show total discount given this month"* without specifying whether it means database `deductionInfo` or manual frontend overrides, or *"Show dues"* without specifying academic session):
* The AI Assistant **MUST NOT** guess or self-assume the calculation method.
* The system MUST ask the user to clarify the specific rule/scope before computing and displaying final financial figures.

---

## 3. Exhaustive Real-World Schema Key Dictionary

### A. Payment Ledger Collection (`paymentModel`)
| Schema Key | Data Type | Real-World Business Meaning & Function |
| :--- | :---: | :--- |
| `userId` | `String` | Student Roll / Registration Number (links to `userModel.userInfo.userId`) |
| `session` | `String` | Academic Session Year (e.g. `"2026-27"`) |
| `class` | `String` | Class and Section of the student for that session (e.g. `"1 A"`) |
| `feeFree` | `Boolean` | `true` = Student is exempt from monthly tuition fee (tuition = ₹0; bus fee still applies if enrolled) |
| `busService` | `Boolean` | `true` = Student uses school transport service |
| `busRouteId` | `String` | Transport route ID (links to `vehicleRouteFareModel.busRouteId`) |
| `dueAmount` | `Number` | Current session unpaid fee balance carried over |
| `excessAmount` | `Number` | Advance payment credit balance (subtracted from total due) |
| `oldSessionDue` | `Number` | Outstanding debt carried forward from previous academic years |
| `totalFineAmount` | `Number` | Accrued late payment fine charges |
| `paymentLedgerPage` | `String` | Physical paper register/binder page number where offline payment record is kept |
| `deductionInfo.amt` | `Number` | Pre-approved monthly tuition concession/discount in INR |
| `deductionInfo.reason` | `String` | Justification for concession (e.g., `"Staff Child"`, `"Scholarship"`) |
| `deductionInfo.userId` | `String` | Administrator ID who approved the concession |
| `deductionInfo.date` | `Date` | Date concession was granted |
| `april` .. `march` | `Object` | Monthly fee state JSON `{ payEnable, paidDone, monthlyFee, busFee }` |
| `other` | `Object` | Array of non-tuition fee payments collected (Books, Uniforms, TC fees, ID Card fees) |
| `otherDue` | `Object` | Object of pending custom fees (e.g., `{ sportsFee: 200 }`) |
| `deleted` | `Boolean` | Soft delete flag (`false` = active record) |

---

### B. Invoice Collection (`invoiceModel`)
| Schema Key | Data Type | Real-World Business Meaning & Function |
| :--- | :---: | :--- |
| `invoiceId` | `String` | Unique Serial / Receipt Number generated for transaction (e.g. `"2603715"`) |
| `insertedId` | `String` | MongoDB `_id` of the corresponding `paymentModel` record created during payment |
| `userId` | `String` | Student Registration Number receiving the receipt |
| `amount` | `Number` | Total monetary amount collected in this transaction (in INR) |
| `invoiceType` | `String` | Invoice Category: `'MONTHLY'`, `'BOOKS'`, `'EXAM_FEE'`, `'OTHER_PAYMENT'` |
| `transactionType` | `String` | Transaction direction (`'credit'` = Fee collected by school). *Note: `'debit'` is currently not in use.* |
| `paymentMode` | `String` | Payment Channel (stored inside `invoiceInfo.paymentMode`): `'CASH'`, `'ONLINE'` |
| `paidStatus` | `Boolean` | Transaction validity status (`true` = confirmed paid receipt) |
| `session` | `String` | Academic Session Year (e.g. `"2026-27"`) |
| `invoiceInfo.submittedDate`| `Date` | Timestamp when payment was collected at counter or online |

---

### C. Monthly Fee Structure Collection (`monthlyFeeListModel`)
| Schema Key | Data Type | Real-World Business Meaning & Function |
| :--- | :---: | :--- |
| `className` | `String` | Targeted Class Name (e.g. `"1 A"`) |
| `monthlyFee` | `Number` | Base monthly tuition fee charged to students in this class |
| `halfExamFee` | `Number` | Half-Yearly Exam Fee billed in September |
| `annualExamFee` | `Number` | Annual Exam Fee billed in February |
| `session` | `String` | Academic Session Year |

---

### D. Vehicle Route Fare Collection (`vehicleRouteFareModel`)
| Schema Key | Data Type | Real-World Business Meaning & Function |
| :--- | :---: | :--- |
| `busRouteId` | `String` | Unique Transport Route Identifier |
| `route` | `String` | Name of bus route (e.g. `"Route 4 - Sector 62"`) |
| `fare` | `Number` | Monthly transport fare charged to enrolled students |
| `session` | `String` | Academic Session Year |

---

## 4. Financial Year & Month Schedule

The academic session runs from **April** to **March** across 12 billing months:

| Month Name | Financial Month Index | Special Billing Events |
| :--- | :---: | :--- |
| `april` | 1 | Academic session starts |
| `may` | 2 | Standard monthly tuition & transport fare |
| `june` | 3 | Standard monthly tuition & transport fare |
| `july` | 4 | Standard monthly tuition & transport fare |
| `august` | 5 | Standard monthly tuition & transport fare |
| `september` | 6 | **Half-Yearly Exam Fee** billed (`halfExamFee`) |
| `october` | 7 | Standard monthly tuition & transport fare |
| `november` | 8 | Standard monthly tuition & transport fare |
| `december` | 9 | Standard monthly tuition & transport fare |
| `january` | 10 | Standard monthly tuition & transport fare |
| `february` | 11 | **Annual Exam Fee** billed (`annualExamFee`) |
| `march` | 12 | Session closing & dues carryover month |

---

## 5. Verified Operational Business Rules

### Rule 5.1: Monthly Payment Completion Rule
* Monthly fees are paid **in full** when marked `paidStatus: true`. Partial monthly payments are not stored inside month objects—instead, partial payments adjust `dueAmount` or `excessAmount`.

### Rule 5.2: Non-Tuition Item Categorization (`other`)
* The `other` array inside `paymentModel` tracks non-tuition item payments including:
  - Books and Notebook Sets (`'BOOKS'`)
  - School Uniforms
  - Transfer Certificates (`'TC'`)
  - Identity Cards & Certificates

### Rule 5.3: Transaction Type Constraint (`transactionType`)
* Invoice transaction totals count `'credit'` type receipts (income collected).
* Note: `'debit'` transaction type is **not currently used** in the live system.

### Rule 5.4: Natural Language Month-Specific Unpaid Query Intent Rule
* When natural language prompts query unpaid dues for a specific month (e.g., `"Show students with unpaid dues in Class 1 A april month"`), the database query MUST filter `{ '[month].paidStatus': { $ne: true } }` on the `payments` collection to exclude students who have already completed payment for that month.

---

## 6. Concession & Discount Modes

### Mode 1: Default / No Concession
* If `deductionInfo` is null/undefined or `amt === 0`, concession is `₹0`.

### Mode 2: Pre-configured Database Concession (`deductionInfo.amt`)
* Applied **monthly-wise** to unpaid tuition months:
  $$\text{Net Monthly Tuition} = \max\left(0, \text{Base Monthly Tuition} - \text{deductionInfo.amt}\right)$$
* Concessions reduce monthly tuition fees only and do **not** reduce transport bus fares or exam fees.

### Mode 3: Manual Admin Concession Entry (Frontend Modal Override)
* When an administrator manually enters/updates a concession value in the payment modal during a transaction (`isDeductionAmtUpdated = true`):
  - Applied as a **one-time flat discount** directly on the **total transaction amount**.
  - It is **NOT** multiplied monthly-wise:
    $$\text{Net Payment Payable} = \text{Total Selected Fees} + \text{Late Fine} - \text{Flat Manual Concession}$$

---

## 7. Master Calculation Formulas

### Monthly Bill for Month $m$ (Ledger Calculation):
$$\text{Net Monthly Bill}(m) = \begin{cases} 
0 & \text{if Month Unpaid/Disabled by Admission Date} \\
\max(0, \text{Tuition Fee} - \text{Ledger Concession}) + \text{Bus Fare} & \text{if Fee Active}
\end{cases}$$

### Total Outstanding Net Dues Formula:
$$\text{Total Net Due} = \text{oldSessionDue} + \sum_{m \in \text{Unpaid Months}} \text{Net Monthly Bill}(m) + \text{Unpaid Exam Fees} + \text{totalFineAmount} - \text{excessAmount}$$

### Transaction Payment Amount (Manual Frontend Entry):
$$\text{Transaction Amount Payable} = \sum_{\text{Selected Months}} \text{Monthly Fees} + \text{Selected Exam Fees} + \text{Late Fine} - \text{Flat Manual Concession}$$
