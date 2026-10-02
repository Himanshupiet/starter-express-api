const moment = require("moment-timezone");

function getCurrentSession() {
  const currentYear = Number(moment.tz(Date.now(), "Asia/Kolkata").format("YYYY"));
  const currentMonth = Number(moment.tz(Date.now(), "Asia/Kolkata").format("MM"));
  if (currentMonth >= 4) {
    return `${currentYear}-${(currentYear + 1).toString().substring(2)}`;
  } else {
    return `${currentYear - 1}-${currentYear.toString().substring(2)}`;
  }
}

const MONTHS = [
  "april", "may", "june", "july", "august", "september",
  "october", "november", "december", "january", "february", "march"
];

function buildClassRegex(classStr) {
  if (!classStr) return null;
  if (classStr.startsWith("^")) return classStr;
  const trimmed = classStr.trim();
  if (/^[0-9]{1,2}$/.test(trimmed)) {
    return `^${trimmed}\\b`;
  }
  const withSec = trimmed.match(/^([0-9]{1,2})\s*([a-zA-Z])$/);
  if (withSec) {
    return `^${withSec[1]}\\s*${withSec[2]}$`;
  }
  return "^" + trimmed.replace(/\s+/g, "\\s*") + "$";
}

/**
 * queryBusinessLogic.js
 * Centralized Domain Business Logic, Security Policies, Fallback Parsers, & Response Formatters.
 * Reused identically across all LLM providers (Gemini, OpenAI, Claude, Ollama, etc.).
 */
class QueryBusinessLogic {
  /**
   * Pre-flight Security, Permission, Read-Only & Greeting Checks.
   * Returns a structured decision object if the query should be handled/blocked immediately,
   * or null if the query should proceed to the LLM.
   */
  static checkSecurityAndIntent(prompt, context = {}) {
    const userRole = (context.userRole || "ADMIN").toUpperCase();
    const lowerPrompt = (prompt || "").toLowerCase();

    // 1. SECURITY CHECK: Block .env & server secret configuration queries
    if (
      lowerPrompt.includes(".env") ||
      lowerPrompt.includes("api_key") ||
      lowerPrompt.includes("apikey") ||
      lowerPrompt.includes("env variable") ||
      lowerPrompt.includes("environment variable") ||
      lowerPrompt.includes("secret key")
    ) {
      return {
        isRestrictedModule: true,
        restrictionMessage:
          "Environment variables, API keys, database connection strings, and server configuration files are protected under infrastructure security protocols and are not accessible in prompt reports."
      };
    }

    // 2. PASSWORD PERMISSION CHECK
    if (lowerPrompt.includes("password") || lowerPrompt.includes("credential")) {
      const isAdminOrAccountant = ["ADMIN", "TOPADMIN", "ACCOUNTANT"].includes(userRole);
      const isAskingForStaffPassword =
        lowerPrompt.includes("teacher") ||
        lowerPrompt.includes("admin") ||
        lowerPrompt.includes("staff") ||
        lowerPrompt.includes("accountant");

      if (isAdminOrAccountant && !isAskingForStaffPassword) {
        return {
          isDeflectionNeeded: false,
          isRestrictedModule: false,
          collection: "users",
          operation: "find",
          filter: { "userInfo.roleName": "STUDENT", deleted: false, isActive: true },
          projection: { password: 0 }
        };
      } else {
        return {
          isDeflectionNeeded: true,
          deflectionMessage:
            "User authentication credentials and staff password hashes are protected under enterprise encryption standards within the security subsystem and are not accessible in prompt reports. However, here are the profile details and registration status for the requested user(s):",
          collection: "users",
          operation: "find",
          filter: { "userInfo.roleName": "STUDENT", deleted: false, isActive: true },
          projection: { "userInfo.password": 0, password: 0 }
        };
      }
    }

    // 3. RESTRICTED EXAM MARKS CHECK
    if (lowerPrompt.includes("exam mark") || lowerPrompt.includes("report card") || lowerPrompt.includes("score")) {
      return {
        isRestrictedModule: true,
        restrictionMessage:
          "Academic examination marks and detailed student report cards are currently restricted from natural language prompt queries for security compliance. Please access student report cards directly through the official Exam Result Management module on the dashboard."
      };
    }

    // 4. RESTRICTED MESSAGING BROADCAST CHECK
    if (lowerPrompt.includes("send whatsapp") || lowerPrompt.includes("send sms") || lowerPrompt.includes("broadcast")) {
      return {
        isRestrictedModule: true,
        restrictionMessage:
          "Automated WhatsApp and SMS message broadcasting is restricted from direct natural language prompt execution to prevent unauthorized transmissions. Please use the dedicated Messaging & Communication Report section in the admin portal to send approved templates."
      };
    }

    // 5. READ-ONLY RESTRICTION & MUTATION CHECK
    const isExplicitReadQuery =
      lowerPrompt.includes("get") ||
      lowerPrompt.includes("list") ||
      lowerPrompt.includes("show") ||
      lowerPrompt.includes("who") ||
      lowerPrompt.includes("find") ||
      lowerPrompt.includes("search") ||
      lowerPrompt.includes("how many") ||
      lowerPrompt.includes("display") ||
      lowerPrompt.includes("view") ||
      lowerPrompt.includes("report") ||
      lowerPrompt.includes("which") ||
      lowerPrompt.includes("status") ||
      lowerPrompt.includes("count");

    const isWriteOrUpdateQuery =
      !isExplicitReadQuery &&
      (lowerPrompt.includes("allow payment update") ||
        lowerPrompt.includes("apply dedution") ||
        lowerPrompt.includes("apply deduction") ||
        lowerPrompt.includes("apply concession") ||
        lowerPrompt.includes("apply discount") ||
        lowerPrompt.includes("enter payment") ||
        lowerPrompt.includes("add payment") ||
        lowerPrompt.includes("insert payment") ||
        lowerPrompt.includes("set concession") ||
        lowerPrompt.includes("set deduction") ||
        lowerPrompt.includes("set fee") ||
        lowerPrompt.includes("enter deduction") ||
        lowerPrompt.includes("free now") ||
        lowerPrompt.includes("no fee apply") ||
        lowerPrompt.includes("make free") ||
        lowerPrompt.includes("set free") ||
        lowerPrompt.includes("mark free") ||
        lowerPrompt.includes("make fee free") ||
        lowerPrompt.includes("set fee free") ||
        lowerPrompt.includes("can you update") ||
        lowerPrompt.includes("can you edit") ||
        lowerPrompt.includes("can you delete") ||
        lowerPrompt.includes("can you modify") ||
        lowerPrompt.includes("can you create") ||
        lowerPrompt.includes("update payment") ||
        lowerPrompt.includes("edit payment") ||
        lowerPrompt.includes("modify payment") ||
        lowerPrompt.includes("delete payment") ||
        lowerPrompt.includes("delete student") ||
        lowerPrompt.includes("delete user") ||
        lowerPrompt.includes("change fee") ||
        lowerPrompt.includes("update fee") ||
        lowerPrompt.includes("edit fee") ||
        lowerPrompt.includes("how to update") ||
        lowerPrompt.includes("how to edit") ||
        lowerPrompt.includes("how to delete"));

    if (isWriteOrUpdateQuery) {
      return {
        isRestrictedModule: true,
        restrictionMessage:
          "Cannot apply or update any student data via prompt. The AI Query Assistant is a read-only reporting tool. To set a student as Fee-Free or update payments, please use the official Fee Management & Student Profile panel on the admin dashboard."
      };
    }

    // 6. GREETINGS & CASUAL CONVERSATION CHECK
    const cleanPrompt = lowerPrompt.trim();
    const isGreetingOrGeneral =
      // Exact greetings
      cleanPrompt === "hello" ||
      cleanPrompt === "hi" ||
      cleanPrompt === "hey" ||
      cleanPrompt === "help" ||
      // Starts with greeting words
      cleanPrompt.startsWith("hello") ||
      cleanPrompt.startsWith("hi ") ||
      cleanPrompt.startsWith("hey ") ||
      cleanPrompt.startsWith("good morning") ||
      cleanPrompt.startsWith("good afternoon") ||
      cleanPrompt.startsWith("good evening") ||
      // How are you variants
      lowerPrompt.includes("how are you") ||
      lowerPrompt.includes("how r you") ||
      lowerPrompt.includes("how r u") ||
      lowerPrompt.includes("how are u") ||
      lowerPrompt.includes("i am fine") ||
      lowerPrompt.includes("i'm fine") ||
      lowerPrompt.includes("i am good") ||
      lowerPrompt.includes("i'm good") ||
      // Identity, status & capability questions
      lowerPrompt.includes("llm work") ||
      lowerPrompt.includes("llm not work") ||
      lowerPrompt.includes("ai work") ||
      lowerPrompt.includes("ai not work") ||
      lowerPrompt.includes("working or not") ||
      lowerPrompt.includes("working not") ||
      lowerPrompt.includes("is working") ||
      lowerPrompt.includes("are you online") ||
      lowerPrompt.includes("are you active") ||
      lowerPrompt.includes("system status") ||
      lowerPrompt.includes("health check") ||
      cleanPrompt === "test" ||
      cleanPrompt === "testing" ||
      cleanPrompt === "ping" ||
      cleanPrompt === "status" ||
      lowerPrompt.includes("work for me") ||
      lowerPrompt.includes("working for me") ||
      lowerPrompt.includes("work for us") ||
      lowerPrompt.includes("working for us") ||
      lowerPrompt.includes("are you work") ||
      lowerPrompt.includes("are you working") ||
      lowerPrompt.includes("do you work") ||
      lowerPrompt.includes("who are you") ||
      lowerPrompt.includes("what are you") ||
      lowerPrompt.includes("what is your name") ||
      lowerPrompt.includes("what do you do") ||
      lowerPrompt.includes("what can you do") ||
      lowerPrompt.includes("how do you work") ||
      lowerPrompt.includes("tell me about yourself") ||
      lowerPrompt.includes("are you an ai") ||
      lowerPrompt.includes("are you ai") ||
      lowerPrompt.includes("who created you") ||
      lowerPrompt.includes("can you help me") ||
      lowerPrompt.includes("thank you") ||
      lowerPrompt.includes("thanks") ||
      lowerPrompt.includes("ok thanks") ||
      lowerPrompt.includes("okay") ||
      lowerPrompt.includes("great") ||
      lowerPrompt.includes("awesome") ||
      lowerPrompt.includes("nice") ||
      lowerPrompt.includes("good job");

    if (isGreetingOrGeneral) {
      return {
        isRestrictedModule: true,
        restrictionMessage:
          "Hello! Yes, I am fully online and operational. I am your AI Database Reporting Assistant for BMMS (Session 2026-27). You can ask me to search student profiles, calculate monthly fee dues, or generate payment & bank collection summaries. What would you like to search today?"
      };
    }

    return null; // Proceed to LLM
  }

  /**
   * Constructs the unified System Prompt containing schema documentation,
   * business logic, and few-shot guidance.
   */
  static buildSystemPrompt(currentSession, prompt, history = []) {
    const systemPrompt = `You are an AI Database Query & Reporting Assistant for a School Management System (BMMS).
Your ONLY job is to translate the user's natural language prompt into a valid MongoDB query JSON object.
Always return ONLY a single JSON object. No explanation, no markdown, no extra text.

═══════════════════════════════════════════════════
CURRENT SESSION: "${currentSession}"
═══════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLECTION 1: "users"  (Students, Teachers, Admins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL FIELDS — use these EXACT MongoDB dotted paths:
  userInfo.userId            String   — Student roll/registration number e.g. "710609"
  userInfo.fullName          String   — Student full legal name
  userInfo.fatherName        String   — Father's name
  userInfo.motherName        String   — Mother's name
  userInfo.email             String   — Email address
  userInfo.class             String   — Class & section e.g. "1 A", "7 B", "UKG", "LKG", "Nursery", "Pre-Nursery"
  userInfo.roleName          String   — "STUDENT" | "TEACHER" | "ADMIN" (ALWAYS use "STUDENT" for students)
  userInfo.session           String   — Academic year e.g. "${currentSession}"
  userInfo.gender            String   — "Male" or "Female" (stored exactly, case-insensitive match safe)
  userInfo.dob               Date     — Date of birth
  userInfo.phoneNumber1      String   — Primary parent/guardian phone number
  userInfo.phoneNumber2      String   — Alternate contact phone number
  userInfo.aadharNumber      String   — Student Aadhaar number
  userInfo.fatherAadharNumber String  — Father's Aadhaar number
  userInfo.motherAadharNumber String  — Mother's Aadhaar number
  userInfo.category          String   — Caste/social category: "General", "OBC", "SC", "ST", "EWS" (case-insensitive)
  userInfo.address           String   — Home address line 1
  userInfo.address2          String   — Home address line 2 / village / area
  userInfo.bloodGroup        String   — Blood group e.g. "B+", "O+", "A+"
  userInfo.isBelowPoverty    Boolean  — true = BPL (Below Poverty Line) family
  userInfo.admissionDate     String   — Date of admission to school
  userInfo.busService        Boolean  — true = enrolled in school bus/transport service
  userInfo.busRouteId        String   — Bus route identifier
  userInfo.feeFree           Boolean  — true = student is fee-exempt at user level
  userInfo.reasonForFreeFee  String   — Reason for fee exemption
  userInfo.penNumber         String   — PEN (Permanent Education Number) government ID
  userInfo.apaarId           String   — APAAR ID (Academic Bank of Credits)
  userInfo.paymentLedgerPage String   — Physical register page reference
  rollNumber                 Number   — Class roll number
  isActive                   Boolean  — true = active/enrolled, false = left/TC/inactive
  isApproved                 Boolean  — true = registration approved by admin
  deleted                    Boolean  — ALWAYS filter { deleted: false }

USERS QUERY RULES:
- ALWAYS include: { "userInfo.roleName": "STUDENT", "deleted": false }
- ALWAYS include: { "userInfo.session": "${currentSession}" } unless a different session is mentioned
- For female/girls only: { "userInfo.gender": { "$regex": "female", "$options": "i" } }
- For male/boys only:    { "userInfo.gender": { "$regex": "^male$", "$options": "i" } }
- For BOTH genders or total student count: DO NOT add any gender filter at all
- For OBC students:     { "userInfo.category": { "$regex": "^obc$", "$options": "i" } }
- For SC students:      { "userInfo.category": { "$regex": "^sc$", "$options": "i" } }
- For ST students:      { "userInfo.category": { "$regex": "^st$", "$options": "i" } }
- For General category: { "userInfo.category": { "$regex": "^general$", "$options": "i" } }
- For EWS students:     { "userInfo.category": { "$regex": "^ews$", "$options": "i" } }
- For BPL/below poverty: { "userInfo.isBelowPoverty": true }
- For class range 1–5:  { "userInfo.class": { "$regex": "^(1|2|3|4|5)\\b", "$options": "i" } }
- For class range 6–8:  { "userInfo.class": { "$regex": "^(6|7|8)\\b", "$options": "i" } }
- For class range 9–10: { "userInfo.class": { "$regex": "^(9|10)\\b", "$options": "i" } }
- For specific class "7 A": { "userInfo.class": { "$regex": "^7\\s*A$", "$options": "i" } }
- For junior classes (nursery/lkg/ukg): { "userInfo.class": { "$regex": "^(pre.?nursery|nursery|lkg|ukg|kg)", "$options": "i" } }
- For inactive/left students: { "isActive": false }
- For bus/transport students: { "userInfo.busService": true }
- For fee-free students (user level): { "userInfo.feeFree": true }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLECTION 2: "payments"  (Fee Ledger per Student per Session)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL FIELDS:
  userId           String   — Student roll number (links to userInfo.userId)
  session          String   — Academic year e.g. "${currentSession}"
  class            String   — Class e.g. "1 A"
  feeFree          Boolean  — true = student is fee-exempt (no tuition; bus fee still applies)
  busService       Boolean  — true = student uses school bus
  dueAmount        Number   — Unpaid current session balance
  excessAmount     Number   — Advance/overpaid credit balance
  oldSessionDue    Number   — Dues from previous academic years
  totalFineAmount  Number   — Late payment penalty charges
  deductionInfo.amt     Number  — Monthly concession/discount in INR
  deductionInfo.reason  String  — Reason for concession e.g. "Staff Child", "Scholarship"
  deleted          Boolean  — ALWAYS filter { deleted: false }

  MONTHLY PAYMENT OBJECTS (april, may, june, july, august, september, october, november, december, january, february, march):
    [month].paidStatus  Boolean — true = monthly fee paid
    [month].paidAmount  Number  — Amount paid for that month
    [month].amount      Number  — Fee amount for that month
    [month].payEnable   Boolean — true = fee is enabled for that month

  EXAM FEE (inside "other" array):
    other.name   String  — e.g. "HALF YEARLY EXAM FEE", "ANNUAL EXAM FEE"
    other.amount Number  — Amount paid for exam fee

PAYMENTS QUERY RULES:
- ALWAYS include: { "session": "${currentSession}", "deleted": false }
- For unpaid monthly dues:  { "[month].paidStatus": { "$ne": true } }
- For paid monthly dues:    { "[month].paidStatus": true }
- For half-yearly exam paid: { "other.name": { "$regex": "HALF.*YEARLY", "$options": "i" } }
- For half-yearly exam NOT paid: { "other": { "$not": { "$elemMatch": { "name": { "$regex": "HALF.*YEARLY", "$options": "i" } } } } }
- For annual exam paid:     { "other.name": { "$regex": "ANNUAL", "$options": "i" } }
- For fee-free students:    { "feeFree": true }
- For students with dues:   { "dueAmount": { "$gt": 0 } }
- For most/highest dues:    sort by { "dueAmount": -1 }, limit 20
- For bus/transport:        { "busService": true }
- For concession/deduction: { "deductionInfo.amt": { "$gt": 0 } }
- For old session dues:     { "oldSessionDue": { "$gt": 0 } }
- For fine/late fee:        { "totalFineAmount": { "$gt": 0 } }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLECTION 3: "invoices"  (Transaction Receipts & Payment Collections)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL FIELDS:
  invoiceId                String  — Receipt serial number e.g. "2603715"
  userId                   String  — Student roll number
  session                  String  — Academic year e.g. "${currentSession}"
  amount                   Number  — Transaction amount collected in INR
  invoiceType              String  — "MONTHLY", "BOOKS", "EXAM_FEE", "OTHER_PAYMENT"
  transactionType          String  — "credit" (fee collected). Use this always.
  paidStatus               Boolean — true = valid confirmed receipt
  invoiceInfo.paymentMode  String  — "CASH" or "ONLINE"
  invoiceInfo.payment      Array   — Array of { payModeId: "Cash" | "<Bank/UPI Name>", amount: Number }
  invoiceInfo.feeList      Array   — Array of { month: "September", monthlyFee: Number } for monthly payments
  invoiceInfo.submittedDate Date   — Timestamp of payment collection
  deleted                  Boolean — ALWAYS filter { deleted: false }

INVOICES QUERY RULES:
- ALWAYS select "collection": "invoices" whenever user asks for:
  - Total collected / payment collection / revenue / receipts
  - Cash vs Online breakdown / totals
  - Bank or UPI breakdown (e.g. Canara Bank, PhonePe, Paytm, GPay)
  - Daily, weekly, or monthly collection reports
- ALWAYS include: { "paidStatus": true, "transactionType": "credit", "deleted": false, "session": "${currentSession}" }
- For a specific month's collection (e.g. September):
  { "$or": [{ "invoiceInfo.feeList.month": { "$regex": "^september$", "$options": "i" } }, { "invoiceInfo.month": { "$regex": "^september$", "$options": "i" } }] }
- For cash only payments:   { "$or": [{ "invoiceInfo.paymentMode": { "$regex": "^cash$", "$options": "i" } }, { "invoiceInfo.payment.payModeId": { "$regex": "^cash$", "$options": "i" } }] }
- For online only payments: { "$or": [{ "invoiceInfo.paymentMode": "ONLINE" }, { "invoiceInfo.payment.payModeId": { "$ne": "Cash" } }] }
- For both Cash & Online or breakdowns: DO NOT filter payment mode (retrieve all records for the period so breakdown is complete)
- For today's collection: filter invoiceInfo.submittedDate >= start of today AND <= end of today
- For yesterday's collection: filter invoiceInfo.submittedDate >= start of yesterday AND <= end of yesterday

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY RULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NEVER include "userInfo.password" or "password" in any filter or projection
- If user asks for passwords: return { "isRestrictedModule": true, "restrictionMessage": "Passwords are encrypted and cannot be retrieved." }
- If user asks to update/delete/modify data: return { "isRestrictedModule": true, "restrictionMessage": "This is a read-only reporting tool." }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT ID LOOKUP RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If user provides a specific numeric ID (4-6 digits), use:
{ "$or": [{ "userId": "ID" }, { "userInfo.userId": "ID" }] }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPERATION SELECTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use "operation": "count" when the user asks for:
  - Just a number/total: "how many", "total count", "count only", "only number", "just the total", "kitne"
  - No list needed: "no list", "don't show list", "only total", "just tell me count"
Use "operation": "find" when the user asks for:
  - A list: "show me", "list", "give me students", "who are", "which students"
  - Details: any query where showing names/records makes sense

SPECIAL CASE — Gender Breakdown (girls AND boys together):
  When user asks "how many girls and boys", "male and female count", "gender wise count":
  - Set "operation": "count"
  - Set "genderBreakdown": true
  - Do NOT add any gender filter in "filter" (leave gender filter out)
  - The system will automatically count males and females separately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (return ONLY this JSON, nothing else)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "collection": "users" | "payments" | "invoices",
  "operation": "find" | "count",
  "genderBreakdown": true | false,
  "filter": { ...exact MongoDB filter using field names above... },
  "sort": { ...optional, only for find... },
  "limit": 500,
  "includeInactive": false
}

USER PROMPT: "${prompt}"`;

    const sanitizedHistory = (history || [])
      .filter(h => h && h.role === "user" && h.text)
      .slice(-2)
      .map(h => ({ role: "user", text: h.text.substring(0, 150) }));

    let fullPrompt = systemPrompt;
    if (sanitizedHistory.length > 0) {
      fullPrompt += `\nRECENT USER CHAT HISTORY:\n${JSON.stringify(sanitizedHistory)}`;
    }

    return fullPrompt;
  }

  /**
   * Universal Fallback Rule Parser.

   * Typo-tolerant slot & entity rule parser executed when live LLM connection is offline,
   * times out, or returns a 503 error.
   */
  static parseRuleFallback(prompt, targetSession = "2026-27", history = []) {
    if (typeof targetSession === "object" && targetSession !== null) {
      history = targetSession.history || history || [];
      targetSession = targetSession.session || targetSession.targetSession || "2026-27";
    }
    const lowerPrompt = (prompt || "").toLowerCase();
    let collection = "users";
    let filter = { deleted: false };

    // ── Count Intent Detection ─────────────────────────────────────────────
    // Detects when user only wants a number/total, not a full list
    // IMPORTANT: "total" alone is ambiguous — exclude financial sum contexts
    const isFinancialTotalContext =
      /\btotal\s+(online|cash|amount|due|fine|fee|collection|revenue|payment|sum|rupee|rs\.?|inr|income|balance|canara|phonepe|upi|bank|deduction|concession|deposit|credit|debit)\b/i.test(lowerPrompt) ||
      /\b(online|cash|amount|revenue|collection|income)\s+total\b/i.test(lowerPrompt) ||
      /\bdivide\b/i.test(lowerPrompt) ||  // "divide by Canara bank" = breakdown, not count
      /\bbreakdown\b/i.test(lowerPrompt) ||
      /\bsplit\b/i.test(lowerPrompt) ||
      lowerPrompt.includes("canara") ||
      lowerPrompt.includes("phonepe") ||
      lowerPrompt.includes("phone pay") ||
      lowerPrompt.includes("gpay") ||
      lowerPrompt.includes("paytm") ||
      lowerPrompt.includes("upi") ||
      lowerPrompt.includes("neft") ||
      lowerPrompt.includes("imps");

    const isCountIntent =
      !isFinancialTotalContext && (
        /\bhow many\b/i.test(lowerPrompt) ||
        /\btotal (number|count|student|girl|boy|male|female)\b/i.test(lowerPrompt) ||
        /\bcount only\b/i.test(lowerPrompt) ||
        /\bonly (count|number|total)\b/i.test(lowerPrompt) ||
        /\bjust (the )?(count|number|total)\b/i.test(lowerPrompt) ||
        /\bno (list|detail|record)\b/i.test(lowerPrompt) ||
        /\bkitne\b/i.test(lowerPrompt) ||
        (/\btotal\b/i.test(lowerPrompt) && !/\btotal (due|amount|fine|fee|collection|online|cash|payment|revenue|sum|rupee|inr|rs\.?)\b/i.test(lowerPrompt))
      );

    // Gender breakdown: user asks for BOTH girls and boys count together
    const isGenderBreakdown =
      (/\bgirl/i.test(lowerPrompt) && /\bboy/i.test(lowerPrompt)) ||
      (/\bfemale/i.test(lowerPrompt) && /\bmale/i.test(lowerPrompt)) ||
      /\bgender[\s-]?wise\b/i.test(lowerPrompt) ||
      /\bgender breakdown\b/i.test(lowerPrompt);

    const finalOperation = isCountIntent ? "count" : "find";
    // ──────────────────────────────────────────────────────────────────────
    const timeZone = "Asia/Kolkata";

    // A. Student ID / Roll Number Lookup (ignore session years like 2026-27)
    const cleanPromptForId = prompt.replace(/\b(19|20)\d{2}\s*[-/]\s*\d{2,4}\b/g, "");
    const rollMatch = cleanPromptForId.match(/\b\d{4,6}\b/);
    if (rollMatch) {
      const studentId = rollMatch[0];
      const isInvoiceLookup = lowerPrompt.includes("invoice") || lowerPrompt.includes("receipt") || lowerPrompt.includes("transaction");
      const isPaymentLookup = lowerPrompt.includes("payment") || lowerPrompt.includes("due") || lowerPrompt.includes("fee") || lowerPrompt.includes("concession");

      if (isInvoiceLookup) {
        return {
          isDeflectionNeeded: false,
          isRestrictedModule: false,
          collection: "invoices",
          operation: "find",
          filter: {
            $or: [{ userId: studentId }, { "invoiceInfo.userId": studentId }, { invoiceId: studentId }],
            deleted: false
          },
          limit: 50
        };
      } else if (isPaymentLookup) {
        return {
          isDeflectionNeeded: false,
          isRestrictedModule: false,
          collection: "payments",
          operation: "find",
          filter: {
            userId: studentId,
            session: targetSession,
            deleted: false
          },
          limit: 10
        };
      } else {
        return {
          isDeflectionNeeded: false,
          isRestrictedModule: false,
          collection: "users",
          operation: "find",
          filter: {
            $or: [{ "userInfo.userId": studentId }, { userId: studentId }],
            deleted: false
          },
          limit: 5
        };
      }
    }

    // B. Class Extraction & Normalization

    // B0. Word-to-number map for spoken class names
    const wordToNum = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      eleven: 11, twelve: 12,
      first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
      sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
      "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5,
      "6th": 6, "7th": 7, "8th": 8, "9th": 9, "10th": 10,
      "11th": 11, "12th": 12
    };
    const wordNumPattern = Object.keys(wordToNum).join("|");

    // Normalise prompt: convert "class ten" → "class 10", "ten to one" → "10 to 1"
    let normPrompt = lowerPrompt
      .replace(
        new RegExp(`class\\s+(${wordNumPattern})`, "gi"),
        (_, w) => `class ${wordToNum[w.toLowerCase()]}`
      )
      .replace(
        new RegExp(`(${wordNumPattern})\\s*(to|-)\\s*(${wordNumPattern})`, "gi"),
        (_, a, sep, b) => `${wordToNum[a.toLowerCase()]} ${sep} ${wordToNum[b.toLowerCase()]}`
      );

    let extractedClass = null;

    // B1. Junior class group keywords → Pre-Nursery / Nursery / LKG / UKG
    const isJuniorIntent =
      /\b(junior|pre[\s-]?nursery|pre[\s-]?nur|nursery|nur\b|lkg|ukg|kg\b|kindergarten|playgroup|play[\s-]?group|pp1|pp2|pre[\s-]?primary|prep\b)\b/i.test(lowerPrompt);

    // B2. Class group keywords (checked before numeric range)
    const isUpperPrimaryIntent =
      /\b(upper[\s-]?primary|middle\s+(?:class|school)|class\s+6\s+to\s+8|class\s+six\s+to\s+eight)\b/i.test(normPrompt);
    const isPrimaryIntent =
      /\b(primary\s+(?:class|student|school)|class\s+1\s+to\s+5)\b/i.test(normPrompt) && !isUpperPrimaryIntent;
    const isSecondaryIntent =
      /\b(secondary|high\s+school|class\s+9\s+to\s+10|class\s+nine\s+to\s+ten|matriculation|matric)\b/i.test(normPrompt) && !isUpperPrimaryIntent;
    const isSeniorSecondaryIntent =
      /\b(senior\s+secondary|higher\s+secondary|class\s+11\s+to\s+12|intermediate|inter\b)\b/i.test(normPrompt);

    if (isJuniorIntent) {
      extractedClass = "^(pre[- ]?nursery|pre[- ]?nur|nursery|nur|lkg|ukg|kg)";
    } else if (isSeniorSecondaryIntent) {
      extractedClass = "^(11|12)\\b";
    } else if (isSecondaryIntent) {
      extractedClass = "^(9|10)\\b";
    } else if (isUpperPrimaryIntent) {
      extractedClass = "^(6|7|8)\\b";
    } else if (isPrimaryIntent) {
      extractedClass = "^(1|2|3|4|5)\\b";
    }

    // B3. Explicit numeric range: "class 10 to 1", "class 1 to 5"
    if (!extractedClass) {
      const rangeMatch =
        normPrompt.match(/class\s*(\d{1,2})\s*(?:to|-)\s*(\d{1,2})/i) ||
        normPrompt.match(/(\d{1,2})\s*(?:to|-)\s*(\d{1,2})\s*(?:class|std)/i);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        // Clamp to 1–12 (numeric classes only, excluding nursery/KG)
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(12, Math.max(start, end));
        const classes = [];
        for (let c = min; c <= max; c++) classes.push(c);
        extractedClass = `^(${classes.join("|")})\\b`;
      }
    }

    // B4. Class with section: "class 7 A", "7B"
    if (!extractedClass) {
      const classSecMatch =
        normPrompt.match(/class\s*([0-9]{1,2})\s*([a-zA-Z])\b/i) ||
        normPrompt.match(/\b([0-9]{1,2})\s*([a-zA-Z])\b/i);
      if (classSecMatch) {
        extractedClass = `${classSecMatch[1]} ${classSecMatch[2].toUpperCase()}`;
      } else {
        // B5. Single class number: "class 7", "std 5"
        const classNumMatch =
          normPrompt.match(/class\s*([0-9]{1,2})\b/i) ||
          normPrompt.match(/\bstd\s*([0-9]{1,2})\b/i);
        if (classNumMatch) {
          extractedClass = classNumMatch[1];
        }
      }
    }


    // C. Month Extraction
    let foundMonth = null;
    for (const m of MONTHS) {
      if (lowerPrompt.includes(m)) {
        foundMonth = m;
        break;
      }
    }

    // Follow-up context extraction
    let priorClass = null;
    let priorMonth = null;
    let priorDeductionIntent = false;
    let priorUnpaidIntent = false;
    let priorPaidOnlyIntent = false;
    let priorBusIntent = false;

    if (history && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const hText = (history[i].text || "").toLowerCase();
        if (!priorClass) {
          const m = hText.match(/class\s*([0-9]{1,2}\s*[a-zA-Z]?)/i);
          if (m) priorClass = m[1].trim();
        }
        if (!priorMonth) {
          for (const m of MONTHS) {
            if (hText.includes(m)) {
              priorMonth = m;
              break;
            }
          }
        }
        if (hText.includes("deduction") || hText.includes("concession") || hText.includes("fee free") || hText.includes("scholarship")) priorDeductionIntent = true;
        if (hText.includes("unpaid") || hText.includes("due") || hText.includes("not paid") || hText.includes("pending")) priorUnpaidIntent = true;
        if (hText.includes("paid") || hText.includes("cleared")) priorPaidOnlyIntent = true;
        if (hText.includes("bus") || hText.includes("transport")) priorBusIntent = true;
      }
    }

    const isFollowUpPrompt =
      lowerPrompt.includes("them") ||
      lowerPrompt.includes("those") ||
      lowerPrompt.includes("their") ||
      lowerPrompt.includes("thier") ||
      lowerPrompt.includes("these") ||
      lowerPrompt.includes("same") ||
      lowerPrompt.includes("also") ||
      lowerPrompt.includes("phone") ||
      lowerPrompt.includes("mobile") ||
      lowerPrompt.includes("number") ||
      lowerPrompt.includes("contact") ||
      lowerPrompt.includes("detail") ||
      lowerPrompt.includes("info") ||
      (!extractedClass && priorClass && (lowerPrompt.includes("who") || lowerPrompt.includes("show") || lowerPrompt.includes("list")));

    if (isFollowUpPrompt) {
      if (!extractedClass && priorClass) extractedClass = priorClass;
      if (!foundMonth && priorMonth) foundMonth = priorMonth;
    }

    // D. Intent Classification
    let isDeductionIntent =
      lowerPrompt.includes("deduction") ||
      lowerPrompt.includes("deduct") ||
      lowerPrompt.includes("concession") ||
      lowerPrompt.includes("discount") ||
      lowerPrompt.includes("fee free") ||
      lowerPrompt.includes("feefree") ||
      lowerPrompt.includes("free fee") ||
      lowerPrompt.includes("scholarship") ||
      lowerPrompt.includes("waiver") ||
      lowerPrompt.includes("waived");

    if (isFollowUpPrompt && !isDeductionIntent && priorDeductionIntent) {
      isDeductionIntent = true;
    }

    // Robust typo-tolerant detection for Half-Yearly & Annual Exams
    const hasHalfTerm = lowerPrompt.includes("half") || lowerPrompt.includes("hy ") || lowerPrompt.startsWith("hy");
    const hasExamOrPaidTerm = lowerPrompt.includes("exam") || lowerPrompt.includes("paid") || lowerPrompt.includes("fee") || lowerPrompt.includes("status") || lowerPrompt.includes("due");
    const hasYearlyFuzzy = /year|yreal|yeal|yerl|yar/.test(lowerPrompt);

    const isHalfYearlyExamIntent = (hasHalfTerm && (hasExamOrPaidTerm || hasYearlyFuzzy)) || lowerPrompt.includes("halfyearly") || lowerPrompt.includes("half-yearly");
    const isAnnualExamIntent = (lowerPrompt.includes("annual") || lowerPrompt.includes("anual") || lowerPrompt.includes("annul")) && (hasExamOrPaidTerm || lowerPrompt.includes("exam") || lowerPrompt.includes("fee") || lowerPrompt.includes("paid"));

    const isInvoiceIntent =
      !isHalfYearlyExamIntent &&
      !isAnnualExamIntent &&
      (lowerPrompt.includes("invoice") ||
        lowerPrompt.includes("collection") ||
        lowerPrompt.includes("revenue") ||
        lowerPrompt.includes("receipt") ||
        lowerPrompt.includes("exam fee") ||
        lowerPrompt.includes("admission fee") ||
        lowerPrompt.includes("other fee") ||
        lowerPrompt.includes("entry") ||
        lowerPrompt.includes("transaction") ||
        lowerPrompt.includes("total online") ||
        lowerPrompt.includes("total cash") ||
        lowerPrompt.includes("canara") ||
        lowerPrompt.includes("phonepe") ||
        lowerPrompt.includes("phone pay") ||
        lowerPrompt.includes("gpay") ||
        lowerPrompt.includes("paytm") ||
        lowerPrompt.includes("bank") ||
        lowerPrompt.includes("upi") ||
        lowerPrompt.includes("divide") ||
        lowerPrompt.includes("breakdown") ||
        (lowerPrompt.includes("payment") &&
          (lowerPrompt.includes("yesterday") ||
            lowerPrompt.includes("today") ||
            lowerPrompt.includes("daily") ||
            lowerPrompt.includes("history") ||
            lowerPrompt.includes("received") ||
            lowerPrompt.includes("collected") ||
            lowerPrompt.includes("total") ||
            lowerPrompt.includes("online") ||
            lowerPrompt.includes("cash") ||
            !!foundMonth)));

    const isPaymentIntent =
      !isInvoiceIntent &&
      (isHalfYearlyExamIntent ||
        isAnnualExamIntent ||
        lowerPrompt.includes("payment") ||
        lowerPrompt.includes("paid") ||
        lowerPrompt.includes("due") ||
        lowerPrompt.includes("fee") ||
        lowerPrompt.includes("fine") ||
        lowerPrompt.includes("excess") ||
        lowerPrompt.includes("advance") ||
        lowerPrompt.includes("old session") ||
        lowerPrompt.includes("bus") ||
        lowerPrompt.includes("transport") ||
        !!foundMonth ||
        isDeductionIntent ||
        (isFollowUpPrompt && (priorDeductionIntent || priorUnpaidIntent || priorPaidOnlyIntent || priorBusIntent)));

    const isMostDuesIntent =
      lowerPrompt.includes("most due") ||
      lowerPrompt.includes("highest due") ||
      lowerPrompt.includes("most dues") ||
      lowerPrompt.includes("highest dues") ||
      lowerPrompt.includes("top due") ||
      lowerPrompt.includes("maximum due") ||
      lowerPrompt.includes("max due");

    let sortIntent = null;

    if (isPaymentIntent) {
      collection = "payments";
      filter.session = targetSession;

      if (extractedClass) {
        filter.class = { $regex: buildClassRegex(extractedClass), $options: "i" };
      }

      const isUnpaidIntent =
        lowerPrompt.includes("unpaid") ||
        lowerPrompt.includes("due") ||
        lowerPrompt.includes("pending") ||
        lowerPrompt.includes("not paid") ||
        lowerPrompt.includes("remaining") ||
        lowerPrompt.includes("balance");
      const isPaidOnlyIntent = (lowerPrompt.includes("paid") || lowerPrompt.includes("cleared")) && !isUnpaidIntent;

      if (isMostDuesIntent) {
        sortIntent = { dueAmount: -1 };
      } else if (isHalfYearlyExamIntent) {
        if (isUnpaidIntent) {
          filter.other = { $not: { $elemMatch: { name: { $regex: "HALF.*YEARLY", $options: "i" } } } };
        } else {
          filter["other.name"] = { $regex: "HALF.*YEARLY", $options: "i" };
        }
      } else if (isAnnualExamIntent) {
        if (isUnpaidIntent) {
          filter.other = { $not: { $elemMatch: { name: { $regex: "ANNUAL", $options: "i" } } } };
        } else {
          filter["other.name"] = { $regex: "ANNUAL", $options: "i" };
        }
      } else if (foundMonth) {
        if (isUnpaidIntent) {
          filter[`${foundMonth}.paidStatus`] = { $ne: true };
          filter.$or = [{ feeFree: { $ne: true } }, { busService: true }];
        } else if (isPaidOnlyIntent) {
          filter.$or = [
            { [`${foundMonth}.paidStatus`]: true },
            { [`${foundMonth}.amount`]: { $gt: 0 } },
            { [`${foundMonth}.paidAmount`]: { $gt: 0 } }
          ];
        }
      } else if (isUnpaidIntent) {
        filter.dueAmount = { $gt: 0 };
      }

      // Old Session Dues
      if (lowerPrompt.includes("old session") || lowerPrompt.includes("previous year") || lowerPrompt.includes("past due")) {
        filter.oldSessionDue = { $gt: 0 };
      }

      // Excess / Advance Amount
      if (lowerPrompt.includes("excess") || lowerPrompt.includes("advance") || lowerPrompt.includes("overpaid")) {
        filter.excessAmount = { $gt: 0 };
      }

      // Late Fee Fine
      if (lowerPrompt.includes("fine") || lowerPrompt.includes("late fee")) {
        filter.totalFineAmount = { $gt: 0 };
      }

      // Fee Free / Concession / Deduction
      if (isDeductionIntent) {
        if (lowerPrompt.includes("fee free") || lowerPrompt.includes("feefree") || lowerPrompt.includes("free fee")) {
          filter.feeFree = true;
        } else {
          filter.$or = [
            { feeFree: true },
            { "deductionInfo.amt": { $gt: 0 } },
            { deductionInfo: { $exists: true, $ne: null } }
          ];
        }
      }

      // Bus Service
      if (lowerPrompt.includes("bus") || lowerPrompt.includes("transport") || lowerPrompt.includes("van")) {
        filter.busService = true;
      }

    } else if (isInvoiceIntent) {
      collection = "invoices";
      filter.paidStatus = true;
      filter.transactionType = "credit";
      filter.session = targetSession;

      if (extractedClass) {
        filter["invoiceInfo.class"] = { $regex: buildClassRegex(extractedClass), $options: "i" };
      }

      if (lowerPrompt.includes("exam fee") || lowerPrompt.includes("exam collection")) {
        filter.invoiceType = "EXAM_FEE";
      }

      // Month Filter (e.g. September payment/collection)
      if (foundMonth) {
        const monthFilter = [
          { "invoiceInfo.feeList.month": { $regex: `^${foundMonth}$`, $options: "i" } },
          { "invoiceInfo.month": { $regex: `^${foundMonth}$`, $options: "i" } }
        ];
        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: filter.$or }, { $or: monthFilter });
          delete filter.$or;
        } else {
          filter.$or = monthFilter;
        }
      }

      // Date Range Filters (Yesterday vs Today vs This Month)
      if (lowerPrompt.includes("yesterday")) {
        const startOfYesterday = moment.tz(timeZone).subtract(1, "days").startOf("day").toDate();
        const endOfYesterday = moment.tz(timeZone).subtract(1, "days").endOf("day").toDate();
        const startOfYesterdayISO = startOfYesterday.toISOString();
        const endOfYesterdayISO = endOfYesterday.toISOString();

        const dateOr = [
          { "invoiceInfo.submittedDate": { $gte: startOfYesterday, $lte: endOfYesterday } },
          { "invoiceInfo.submittedDate": { $gte: startOfYesterdayISO, $lte: endOfYesterdayISO } },
          { created: { $gte: startOfYesterday, $lte: endOfYesterday } },
          { created: { $gte: startOfYesterdayISO, $lte: endOfYesterdayISO } }
        ];
        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: filter.$or }, { $or: dateOr });
          delete filter.$or;
        } else {
          filter.$or = dateOr;
        }
      } else if (lowerPrompt.includes("today")) {
        const startOfTodayDate = moment.tz(timeZone).startOf("day").toDate();
        const endOfTodayDate = moment.tz(timeZone).endOf("day").toDate();
        const startOfTodayISO = startOfTodayDate.toISOString();
        const endOfTodayISO = endOfTodayDate.toISOString();

        const dateOr = [
          { "invoiceInfo.submittedDate": { $gte: startOfTodayDate, $lte: endOfTodayDate } },
          { "invoiceInfo.submittedDate": { $gte: startOfTodayISO, $lte: endOfTodayISO } },
          { created: { $gte: startOfTodayDate, $lte: endOfTodayDate } },
          { created: { $gte: startOfTodayISO, $lte: endOfTodayISO } }
        ];
        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: filter.$or }, { $or: dateOr });
          delete filter.$or;
        } else {
          filter.$or = dateOr;
        }
      } else if (lowerPrompt.includes("this month") || lowerPrompt.includes("current month")) {
        const startOfMonthDate = moment.tz(timeZone).startOf("month").toDate();
        const endOfMonthDate = moment.tz(timeZone).endOf("month").toDate();
        const startOfMonthISO = startOfMonthDate.toISOString();
        const endOfMonthISO = endOfMonthDate.toISOString();

        const dateOr = [
          { "invoiceInfo.submittedDate": { $gte: startOfMonthDate, $lte: endOfMonthDate } },
          { "invoiceInfo.submittedDate": { $gte: startOfMonthISO, $lte: endOfMonthISO } },
          { created: { $gte: startOfMonthDate, $lte: endOfMonthDate } },
          { created: { $gte: startOfMonthISO, $lte: endOfMonthISO } }
        ];
        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: filter.$or }, { $or: dateOr });
          delete filter.$or;
        } else {
          filter.$or = dateOr;
        }
      } else if (/(?:last|past)\s*(\d{1,2})\s*months?/i.test(lowerPrompt)) {
        const nMonths = parseInt(lowerPrompt.match(/(?:last|past)\s*(\d{1,2})\s*months?/i)[1], 10);
        const startOfRange = moment.tz(timeZone).subtract(nMonths, "months").startOf("day").toDate();
        const endOfRange = moment.tz(timeZone).endOf("day").toDate();
        const startOfRangeISO = startOfRange.toISOString();
        const endOfRangeISO = endOfRange.toISOString();

        const dateOr = [
          { "invoiceInfo.submittedDate": { $gte: startOfRange, $lte: endOfRange } },
          { "invoiceInfo.submittedDate": { $gte: startOfRangeISO, $lte: endOfRangeISO } },
          { created: { $gte: startOfRange, $lte: endOfRange } },
          { created: { $gte: startOfRangeISO, $lte: endOfRangeISO } }
        ];
        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: filter.$or }, { $or: dateOr });
          delete filter.$or;
        } else {
          filter.$or = dateOr;
        }
      } else if (/(?:last|past)\s*(\d{1,3})\s*days?/i.test(lowerPrompt)) {
        const nDays = parseInt(lowerPrompt.match(/(?:last|past)\s*(\d{1,3})\s*days?/i)[1], 10);
        const startOfRange = moment.tz(timeZone).subtract(nDays, "days").startOf("day").toDate();
        const endOfRange = moment.tz(timeZone).endOf("day").toDate();
        const startOfRangeISO = startOfRange.toISOString();
        const endOfRangeISO = endOfRange.toISOString();

        const dateOr = [
          { "invoiceInfo.submittedDate": { $gte: startOfRange, $lte: endOfRange } },
          { "invoiceInfo.submittedDate": { $gte: startOfRangeISO, $lte: endOfRangeISO } },
          { created: { $gte: startOfRange, $lte: endOfRange } },
          { created: { $gte: startOfRangeISO, $lte: endOfRangeISO } }
        ];
        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: filter.$or }, { $or: dateOr });
          delete filter.$or;
        } else {
          filter.$or = dateOr;
        }
      }

      // Payment Mode Filters (strictly filter only if user asked for JUST cash or JUST online)
      const hasCash = lowerPrompt.includes("cash");
      const hasOnline = lowerPrompt.includes("online") || lowerPrompt.includes("upi") || lowerPrompt.includes("bank") || lowerPrompt.includes("cheque") || lowerPrompt.includes("canara") || lowerPrompt.includes("phonepe") || lowerPrompt.includes("phone pay") || lowerPrompt.includes("gpay") || lowerPrompt.includes("paytm");

      let modeOrFilter = null;
      if (hasCash && !hasOnline) {
        modeOrFilter = [
          { "invoiceInfo.payment.payModeId": { $regex: "^cash$", $options: "i" } },
          { "invoiceInfo.paymentMode": { $regex: "^cash$", $options: "i" } },
          { "invoiceInfo.paymentType": { $regex: "^cash$", $options: "i" } }
        ];
      } else if (hasOnline && !hasCash && !lowerPrompt.includes("divide") && !lowerPrompt.includes("breakdown") && !lowerPrompt.includes("both")) {
        modeOrFilter = [
          { "invoiceInfo.payment.payModeId": { $ne: "Cash" } },
          { "invoiceInfo.paymentMode": "ONLINE" },
          { "invoiceInfo.paymentType": "ONLINE" }
        ];
      }

      if (modeOrFilter) {
        if (filter.$or) {
          const prevOr = filter.$or;
          delete filter.$or;
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: prevOr }, { $or: modeOrFilter });
        } else {
          filter.$or = modeOrFilter;
        }
      }

    } else {
      // Check if prompt contains recognized student/user search criteria
      const isUserIntent =
        extractedUserId ||
        extractedClass ||
        nameQuery ||
        isFollowUpPrompt ||
        lowerPrompt.includes("student") ||
        lowerPrompt.includes("user") ||
        lowerPrompt.includes("profile") ||
        lowerPrompt.includes("child") ||
        lowerPrompt.includes("kid") ||
        lowerPrompt.includes("girl") ||
        lowerPrompt.includes("boy") ||
        lowerPrompt.includes("female") ||
        lowerPrompt.includes("male") ||
        lowerPrompt.includes("gender") ||
        lowerPrompt.includes("category") ||
        lowerPrompt.includes("caste") ||
        lowerPrompt.includes("obc") ||
        lowerPrompt.includes("sc") ||
        lowerPrompt.includes("st") ||
        lowerPrompt.includes("general") ||
        lowerPrompt.includes("ews") ||
        lowerPrompt.includes("bpl") ||
        lowerPrompt.includes("below poverty") ||
        lowerPrompt.includes("bus") ||
        lowerPrompt.includes("transport") ||
        lowerPrompt.includes("van") ||
        lowerPrompt.includes("active") ||
        lowerPrompt.includes("inactive") ||
        lowerPrompt.includes("left") ||
        lowerPrompt.includes("disabled") ||
        lowerPrompt.includes("father") ||
        lowerPrompt.includes("mother") ||
        lowerPrompt.includes("parent") ||
        lowerPrompt.includes("phone") ||
        lowerPrompt.includes("mobile") ||
        lowerPrompt.includes("contact") ||
        lowerPrompt.includes("aadhar") ||
        lowerPrompt.includes("apaar") ||
        lowerPrompt.includes("pen") ||
        lowerPrompt.includes("dob") ||
        lowerPrompt.includes("birthday") ||
        lowerPrompt.includes("birth") ||
        lowerPrompt.includes("admission") ||
        lowerPrompt.includes("address") ||
        lowerPrompt.includes("village") ||
        lowerPrompt.includes("city") ||
        lowerPrompt.includes("roll") ||
        lowerPrompt.includes("who is") ||
        lowerPrompt.includes("all student") ||
        lowerPrompt.includes("list student") ||
        lowerPrompt.includes("show student") ||
        lowerPrompt.includes("find student") ||
        lowerPrompt.includes("get student") ||
        lowerPrompt.includes("total student") ||
        lowerPrompt.includes("how many student") ||
        (isCountIntent && (lowerPrompt.includes("boy") || lowerPrompt.includes("girl") || lowerPrompt.includes("student") || lowerPrompt.includes("kid")));

      if (!isUserIntent) {
        return {
          isRestrictedModule: true,
          restrictionMessage: "I didn't understand your request. I am running in offline rule mode with minimal support. Please try asking clearly (e.g. search a student roll/name, class fee dues, or payment collection summaries).",
          usedLLM: false,
          usedModelName: "offline-rule"
        };
      }

      // Student / User Collection Intent
      collection = "users";
      filter["userInfo.roleName"] = "STUDENT";
      filter["userInfo.session"] = targetSession;

      if (extractedClass) {
        filter["userInfo.class"] = { $regex: buildClassRegex(extractedClass), $options: "i" };
      }

      if (lowerPrompt.includes("female") || lowerPrompt.includes("girl") || lowerPrompt.includes("women")) {
        filter["userInfo.gender"] = { $regex: "female", $options: "i" };
      } else if (lowerPrompt.includes("male") || lowerPrompt.includes("boy") || lowerPrompt.includes("men")) {
        filter["userInfo.gender"] = { $regex: "^male$", $options: "i" };
      }

      if (lowerPrompt.includes("inactive") || lowerPrompt.includes("left") || lowerPrompt.includes("disabled")) {
        filter.isActive = false;
      } else if (lowerPrompt.includes("active")) {
        filter.isActive = true;
      }

      // Category / Caste filter
      if (/\bobc\b/i.test(lowerPrompt)) {
        filter["userInfo.category"] = { $regex: "^obc$", $options: "i" };
      } else if (/\bsc\b/i.test(lowerPrompt)) {
        filter["userInfo.category"] = { $regex: "^sc$", $options: "i" };
      } else if (/\bst\b/i.test(lowerPrompt)) {
        filter["userInfo.category"] = { $regex: "^st$", $options: "i" };
      } else if (/\bgeneral\b/i.test(lowerPrompt)) {
        filter["userInfo.category"] = { $regex: "^general$", $options: "i" };
      } else if (/\bews\b/i.test(lowerPrompt)) {
        filter["userInfo.category"] = { $regex: "^ews$", $options: "i" };
      } else if (/\b(bpl|below poverty|poor)\b/i.test(lowerPrompt)) {
        filter["userInfo.isBelowPoverty"] = true;
      }

      if (lowerPrompt.includes("bus") || lowerPrompt.includes("transport") || lowerPrompt.includes("van")) {
        filter["userInfo.busService"] = true;
      }
    }

    const includeInactive = lowerPrompt.includes("inactive") || lowerPrompt.includes("left") || lowerPrompt.includes("disabled");
    const finalLimit = isMostDuesIntent ? 20 : 500;

    console.log(`[Rule Parser] Final query → collection: ${collection}, filter: ${JSON.stringify(filter)}, sort: ${JSON.stringify(sortIntent)}, limit: ${finalLimit}`);

    return {
      isDeflectionNeeded: false,
      isRestrictedModule: false,
      includeInactive,
      collection,
      operation: finalOperation,
      genderBreakdown: isGenderBreakdown,
      filter,
      sort: sortIntent,
      limit: finalOperation === "count" ? 0 : finalLimit
    };
  }

  /**
   * Universal Response Formatter.
   * Transforms raw MongoDB documents into clean markdown narrative, totals, and preview table items.
   */
  static formatResponse(prompt, dataResults = [], queryMeta = {}) {
    const totalCount = (dataResults || []).length;
    const offerExport = totalCount >= 1;
    const previewData = (dataResults || []).slice(0, 10);
    const lowerP = prompt ? prompt.toLowerCase() : "";

    // Typo-tolerant dynamic column resolution (must be before forEach usage)
    const hideFather = /\b(rem[o0]ve|w[i1]th[o0]ut|n[o0]|h[i1]de|del[eao]te|exc[l1]ude)\b.*\bfath/i.test(lowerP);
    const hideUserId = /\b(rem[o0]ve|w[i1]th[o0]ut|n[o0]|h[i1]de)\b.*\b(id|user\s*id)\b/i.test(lowerP);
    const hideClass = /\b(rem[o0]ve|w[i1]th[o0]ut|n[o0]|h[i1]de)\b.*\bclass\b/i.test(lowerP);
    const hideSession = /\b(rem[o0]ve|w[i1]th[o0]ut|n[o0]|h[i1]de)\b.*\bsession\b/i.test(lowerP);
    const showPhone =
      !/\b(rem[o0]ve|w[i1]th[o0]ut|n[o0]|h[i1]de)\b.*\b(ph|mob)/i.test(lowerP) &&
      /\b(ph[o0]?n[es]?|m[o0]b[il1]{1,2}e?|c[o0]nt[a@]ct|c[a@]ll|numbe?r?)\b/i.test(lowerP);
    const showMother = /\b(m[o0]th[eao]?r?|m[o0]m|mummy)\b/i.test(lowerP);
    const showAadhar = /\ba+d+h+a+r+|u[i1]d\b/i.test(lowerP);
    const showCategory = /\bc[a@]t[eao]?g[o0]?r[yi]?|c[a@]ste\b/i.test(lowerP);
    const showAddress = /\b(addr[eao]?ss|v[i1]ll[a@]ge|c[i1]ty|l[o0]c[a@]t[i1][o0]n)\b/i.test(lowerP);
    const showDob = /\b(d[o0]b|b[i1]rth|d[a@]te\s*[o0]f\s*b[i1]rth|[a@]ge)\b/i.test(lowerP);
    const showSign = /\b(admi[td]\s*c[a@]rd|admit\s*crd|s[i1]gn|t[i1]ck|bl[a@]nk\s*col|s[i1]gn[a@]ture)\b/i.test(lowerP);

    const detectedColumns = ["S.No", "Student Name"];
    if (!hideUserId) detectedColumns.push("User ID");
    if (!hideClass) detectedColumns.push("Class");
    if (!hideFather) detectedColumns.push("Father Name");
    if (showMother) detectedColumns.push("Mother Name");
    if (showPhone) detectedColumns.push("Phone Number");
    if (showDob) detectedColumns.push("Date of Birth");
    if (showAadhar) detectedColumns.push("Aadhaar Number");
    if (showCategory) detectedColumns.push("Category");
    if (showAddress) detectedColumns.push("Address");

    let totalAmountSum = 0;
    let cashSum = 0;
    let cashCount = 0;
    let onlineSum = 0;
    let onlineCount = 0;
    const methodBreakdown = {}; // e.g. { "Canara Bank": { amount: 50000, count: 20 }, "PhonePe": { amount: 30000, count: 15 } }

    (dataResults || []).forEach(item => {
      const invoiceAmt = Number(item.amount || item.invoiceInfo?.amount || item.invoiceInfo?.totalAmount || item.paidAmount || 0);
      totalAmountSum += invoiceAmt;

      // Handle invoiceInfo.payment array
      const payments = Array.isArray(item.invoiceInfo?.payment)
        ? item.invoiceInfo.payment
        : (item.invoiceInfo?.payment ? [item.invoiceInfo.payment] : []);

      if (payments.length > 0) {
        payments.forEach(p => {
          const pAmt = Number(p.amount || 0);
          const rawMode = String(p.resolvedMode || p.payModeName || p.payModeId || "").trim();
          const isCash = !rawMode || rawMode.toLowerCase() === "cash";

          if (isCash) {
            cashSum += pAmt;
            cashCount++;
          } else {
            onlineSum += pAmt;
            onlineCount++;
            const modeKey = rawMode || "Online / UPI";
            if (!methodBreakdown[modeKey]) {
              methodBreakdown[modeKey] = { amount: 0, count: 0 };
            }
            methodBreakdown[modeKey].amount += pAmt;
            methodBreakdown[modeKey].count++;
          }
        });
      } else {
        // Fallback to top-level paymentMode string if payment array not present
        const pMode = String(
          item.invoiceInfo?.paymentMode ||
          item.invoiceInfo?.paymentType ||
          item.paymentMode ||
          ""
        ).toLowerCase();

        if (pMode === "cash") {
          cashSum += invoiceAmt;
          cashCount++;
        } else if (pMode) {
          onlineSum += invoiceAmt;
          onlineCount++;
          const modeKey = item.invoiceInfo?.paymentMode || "Online";
          if (!methodBreakdown[modeKey]) {
            methodBreakdown[modeKey] = { amount: 0, count: 0 };
          }
          methodBreakdown[modeKey].amount += invoiceAmt;
          methodBreakdown[modeKey].count++;
        }
      }
    });

    let summary = "";

    if (totalCount > 0) {
      const isInvoiceQuery = queryMeta.collection === "invoices" || totalAmountSum > 0;

      if (isInvoiceQuery && totalAmountSum > 0) {
        summary += `💰 **Financial Collection Summary** (Found **${totalCount}** record(s))\n\n`;
        summary += `| Payment Channel | Total Amount (INR) | Receipts |\n`;
        summary += `|---|---|---|\n`;
        summary += `| 💵 **Cash** | **₹${cashSum.toLocaleString("en-IN")}** | ${cashCount} |\n`;
        summary += `| 💳 **Online Total** | **₹${onlineSum.toLocaleString("en-IN")}** | ${onlineCount} |\n`;
        summary += `| 📌 **Total Collection** | **₹${totalAmountSum.toLocaleString("en-IN")}** | **${totalCount}** |\n\n`;

        // 1. Dynamically include all active payment options configured in the database (payOptionModel)
        if (Array.isArray(queryMeta.configuredPayOptions)) {
          queryMeta.configuredPayOptions.forEach(optName => {
            if (optName && optName.toLowerCase() !== "cash") {
              const alreadyExists = Object.keys(methodBreakdown).some(
                k => k.toLowerCase() === optName.toLowerCase()
              );
              if (!alreadyExists && (lowerP.includes("divide") || lowerP.includes("breakdown") || lowerP.toLowerCase().includes(optName.toLowerCase()))) {
                methodBreakdown[optName] = { amount: 0, count: 0 };
              }
            }
          });
        }

        // 2. Check if specific bank / UPI gateways were explicitly mentioned in the user prompt
        const explicitGateways = [
          { regex: /can[a|r]*ra/i, name: "Canara Bank", icon: "🏛️" },
          { regex: /phone[\s-]?pe|phone[\s-]?pay/i, name: "PhonePe", icon: "📱" },
          { regex: /gpay|google[\s-]?pay/i, name: "Google Pay (GPay)", icon: "📱" },
          { regex: /paytm|pay[\s-]?tm/i, name: "Paytm", icon: "📱" },
          { regex: /\bsbi\b|state[\s-]?bank/i, name: "SBI Bank", icon: "🏛️" },
          { regex: /\bpnb\b|punjab[\s-]?national/i, name: "PNB Bank", icon: "🏛️" },
          { regex: /\bhdfc\b/i, name: "HDFC Bank", icon: "🏛️" },
          { regex: /\bicici\b/i, name: "ICICI Bank", icon: "🏛️" },
          { regex: /\baxis\b/i, name: "Axis Bank", icon: "🏛️" }
        ];

        explicitGateways.forEach(gw => {
          if (gw.regex.test(lowerP)) {
            const exists = Object.keys(methodBreakdown).some(k => gw.regex.test(k));
            if (!exists) {
              methodBreakdown[gw.name] = { amount: 0, count: 0 };
            }
          }
        });

        const breakdownEntries = Object.entries(methodBreakdown);
        if (breakdownEntries.length > 0) {
          summary += `#### 🏦 Online Channel Breakdown:\n`;
          breakdownEntries.forEach(([channelName, info]) => {
            const icon = channelName.toLowerCase().includes("bank") ? "🏛️" : "📱";
            summary += `- ${icon} **${channelName}**: **₹${info.amount.toLocaleString("en-IN")}** (${info.count} receipt${info.count !== 1 ? "s" : ""})\n`;
          });
          summary += `\n`;
        }
      } else {
        summary += `Found **${totalCount}** matching record(s).\n\n`;
      }

      summary += `### 📋 Matching Record Summary:\n`;
      previewData.slice(0, 5).forEach((item, idx) => {
        const name = item.studentName || item.userInfo?.fullName || item.fullName || "N/A";
        const id = item.userId || item.userInfo?.userId || "N/A";
        const cls = item.class || item.userInfo?.class || item.invoiceInfo?.class || "N/A";
        const father = item.fatherName || item.userInfo?.fatherName || "";
        const phone = item.phoneNumber || item.userInfo?.phoneNumber1 || "";
        const itemAmt = item.amount || item.invoiceInfo?.amount || 0;

        let pMode = "";
        if (Array.isArray(item.invoiceInfo?.payment) && item.invoiceInfo.payment.length > 0) {
          pMode = item.invoiceInfo.payment.map(p => p.resolvedMode || p.payModeId || "Cash").join(", ");
        } else {
          pMode = item.invoiceInfo?.paymentMode || "";
        }

        let extra = "";
        if (itemAmt > 0) extra += ` | Amount: ₹${itemAmt}`;
        if (pMode) extra += ` (${pMode})`;
        if (item.invoiceId) extra += ` | Receipt: \`${item.invoiceId}\``;
        if (item.dueAmount !== undefined && item.dueAmount > 0) extra += ` | Pending Dues: ₹${item.dueAmount}`;
        if (item.feeFree) extra += ` (Fee Free)`;

        const halfExam = (item.other || []).find(o => o.name && o.name.toUpperCase().includes("HALF"));
        const annualExam = (item.other || []).find(o => o.name && o.name.toUpperCase().includes("ANNUAL"));
        if (halfExam) extra += ` | Half Yearly Exam: ₹${halfExam.amount || "Paid"}`;
        if (annualExam) extra += ` | Annual Exam: ₹${annualExam.amount || "Paid"}`;

        summary += `\n${idx + 1}. **${name}** (ID: \`${id}\`, Class: \`${cls}\`)${father && !hideFather ? ` - Father: ${father}` : ""}${phone && showPhone ? ` | Phone: ${phone}` : ""}${extra}`;
      });

      if (totalCount > 5) {
        summary += `\n\n*...and ${totalCount - 5} more record(s).*`;
      }
    } else {
      summary = `Found **0** matching records. No records were found for the requested filter criteria.`;
    }

    if (offerExport) {
      summary += `\n\n📁 **Data Export Notice**: Found **${totalCount} record(s)**. You can download the **Excel spreadsheet (.CSV)** below.`;
    }

    const isLLMSuccess = !!queryMeta.usedLLM;
    const modelTag = queryMeta.usedModelName || queryMeta.modelName || "model";
    const statusSuffix = isLLMSuccess ? "-S" : "-F";
    const providerStr = `${queryMeta.providerName || "AI"} (${modelTag})${statusSuffix}`;


    if (queryMeta.collection === "invoices") {
      detectedColumns.push("Amount (INR)", "Payment Mode", "Receipt Number", "Transaction Type", "Submitted Date");
    } else if (queryMeta.collection === "payments") {
      if (lowerP.includes("half")) {
        detectedColumns.push("Half Yearly Exam Status", "Exam Paid Date");
      } else if (lowerP.includes("annu") || lowerP.includes("anua")) {
        detectedColumns.push("Annual Exam Status", "Exam Paid Date");
      } else if (lowerP.includes("fee free") || lowerP.includes("feefree") || lowerP.includes("concession")) {
        detectedColumns.push("Fee Free Status", "Bus Service", "Pending Due (INR)");
      } else {
        detectedColumns.push("Pending Due (INR)", "Fee Free Status", "Bus Service");
      }
    }
    if (showSign) detectedColumns.push("Admit Card Received (Sign / Tick)");
    if (!hideSession) detectedColumns.push("Session");

    return {
      success: true,
      summary,
      provider: providerStr,
      totalCount,
      offerExport,
      columns: detectedColumns,
      previewData
    };
  }
}

module.exports = {
  QueryBusinessLogic,
  MONTHS,
  buildClassRegex,
  getCurrentSession
};
